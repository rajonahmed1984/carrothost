<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Domain;
use App\Models\Product;
use App\Models\ProductGroup;
use App\Models\ProductPrice;
use App\Models\Tld;
use App\Services\BillingService;
use App\Services\DomainLookup;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** What a customer can order: active products in visible groups only. */
class StoreController extends Controller
{
    /** Prices come in the signed-in client's currency. */
    public function index(Request $request)
    {
        $currency = $request->user('client')->currencyCode();

        return ProductGroup::where('is_visible', true)
            ->with(['products' => fn ($q) => $q->where('is_active', true)->orderBy('name')->with('prices')])
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get(['id', 'name', 'slug', 'headline'])
            ->map(fn (ProductGroup $group) => [
                ...$group->only('id', 'name', 'slug', 'headline'),
                'currency' => $currency,
                'products' => $group->products->map(fn (Product $product) => [
                    ...$product->only('id', 'name', 'type', 'description'),
                    // The OS choices a VPS product offers; empty means its default is installed.
                    'os_choices' => $product->vpsConfig()['images'],
                    'default_os' => $product->vpsConfig()['default_image'],
                    'prices' => $product->prices->map(fn (ProductPrice $p) => [
                        'cycle' => $p->cycle,
                        'price' => $p->priceIn($currency),
                        'setup_fee' => $p->setupFeeIn($currency),
                    ])->values(),
                ]),
            ]);
    }

    /** Which domain choices Admin > Settings > Domains allows, with prices for those that cost money. */
    public function domainOptions(Request $request, DomainLookup $lookup)
    {
        $options = config('billing.domains');
        $sells = $options['allow_register'] || $options['allow_transfer'];
        $currency = $request->user('client')->currencyCode();

        return [
            'currency' => $currency,
            'register' => (bool) $options['allow_register'],
            'transfer' => (bool) $options['allow_transfer'],
            'own' => (bool) $options['allow_own'],
            'nameservers' => Domain::defaultNameservers(),
            'lookup' => (bool) $lookup->provider(),
            'premium' => (bool) $options['premium_enabled'],
            'tlds' => $sells
                ? Tld::where('is_active', true)->orderBy('sort_order')->orderBy('tld')->get()
                    ->map(fn (Tld $t) => [
                        ...$t->only('tld', 'is_spotlight', 'epp_required'),
                        'register_price' => $t->priceIn('register', $currency),
                        'renew_price' => $t->priceIn('renew', $currency),
                        'transfer_price' => $t->priceIn('transfer', $currency),
                    ])
                : [],
        ];
    }

    public function lookup(Request $request, DomainLookup $lookup)
    {
        $data = $request->validate(['name' => ['required', 'regex:'.Domain::NAME_PATTERN]]);

        return $lookup->check($data['name']);
    }

    public function order(Request $request, BillingService $billing)
    {
        $data = $request->validate([
            'product_id' => 'required|integer',
            'cycle' => ['required', Rule::in(array_keys(config('billing.cycles')))],
            'domain' => ['nullable', 'regex:'.Domain::NAME_PATTERN],
            'domain_action' => 'nullable|in:register,transfer,own',
            'domain_years' => 'nullable|integer|between:1,10',
            'epp_code' => 'nullable|string|max:255',
            'vps_image' => 'nullable|string|max:120',
        ]);

        $product = Product::where('is_active', true)
            ->whereHas('group', fn ($q) => $q->where('is_visible', true))
            ->find($data['product_id']);

        if (! $product) {
            throw ValidationException::withMessages(['product_id' => 'This product is not available to order.']);
        }

        if ($product->type === 'shared_hosting' && empty($data['domain'])) {
            throw ValidationException::withMessages(['domain' => 'Enter the domain this hosting is for.']);
        }

        $domain = isset($data['domain']) ? strtolower($data['domain']) : null;
        $action = $data['domain_action'] ?? 'own';
        $domains = [];

        if ($domain) {
            $this->ensureAllowed($action, 'domain_action');

            if ($action !== 'own') {
                app(DomainLookup::class)->ensureOrderable($domain, $action, 'domain');
                $domains[] = ['name' => $domain, 'action' => $action, 'years' => $data['domain_years'] ?? 1, 'epp_code' => $this->eppCode($action, $domain, $data['epp_code'] ?? null)];
            }
        }

        // A VPS product may let the customer pick its operating system from the product's list.
        $image = $data['vps_image'] ?? null;
        if ($image !== null && ! in_array($image, $product->allowedImages(), true)) {
            throw ValidationException::withMessages(['vps_image' => 'Choose one of the operating systems listed.']);
        }

        $order = $billing->createOrder($request->user('client'), [
            ['product_id' => $product->id, 'cycle' => $data['cycle'], 'domain' => $domain, 'module_options' => $image ? ['image' => $image] : null],
        ], $domains);
        ActivityLog::record('order.created', $order, ['by' => 'client']);

        return response()->json(['invoice_id' => $order->invoices()->value('id')], 201);
    }

    /** A domain on its own, without hosting. */
    public function orderDomain(Request $request, BillingService $billing)
    {
        $data = $request->validate([
            'name' => ['required', 'regex:'.Domain::NAME_PATTERN],
            'action' => 'required|in:register,transfer',
            'years' => 'required|integer|between:1,10',
            'epp_code' => 'nullable|string|max:255',
        ]);

        $this->ensureAllowed($data['action'], 'action');
        app(DomainLookup::class)->ensureOrderable(strtolower($data['name']), $data['action'], 'name');
        $data['epp_code'] = $this->eppCode($data['action'], $data['name'], $data['epp_code'] ?? null);

        $order = $billing->createOrder($request->user('client'), [], [$data]);
        ActivityLog::record('order.created', $order, ['by' => 'client']);

        return response()->json(['invoice_id' => $order->invoices()->value('id')], 201);
    }

    /** A transfer needs the EPP code when its TLD says so; only transfers keep one. */
    private function eppCode(string $action, string $domain, ?string $code): ?string
    {
        if ($action !== 'transfer') {
            return null;
        }

        if (blank($code) && app(BillingService::class)->tldFor(strtolower($domain))->epp_required) {
            throw ValidationException::withMessages(['epp_code' => 'Enter the EPP (authorisation) code from your current registrar.']);
        }

        return blank($code) ? null : trim($code);
    }

    private function ensureAllowed(string $action, string $field): void
    {
        if (! config("billing.domains.allow_{$action}")) {
            $what = ['register' => 'Registering', 'transfer' => 'Transferring', 'own' => 'Using your own domain'][$action];

            throw ValidationException::withMessages([$field => "{$what} is not available right now."]);
        }
    }
}
