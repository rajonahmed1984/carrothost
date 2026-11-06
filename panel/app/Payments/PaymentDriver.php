<?php

namespace App\Payments;

use App\Models\Gateway;
use App\Models\PaymentAttempt;

interface PaymentDriver
{
    public function __construct(Gateway $gateway);

    /** The amount and currency to charge for a balance in the invoice's currency ($currency). */
    public function charge(string $balance, string $currency): array;

    /** Opens the payment at the gateway and returns where to send the customer. */
    public function start(PaymentAttempt $attempt): string;
}
