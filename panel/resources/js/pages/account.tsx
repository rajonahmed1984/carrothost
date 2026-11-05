import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    AlertCircle,
    AlertTriangle,
    ArrowUpDown,
    Briefcase,
    Building,
    Building2,
    Check,
    CheckCircle2,
    Compass,
    Copy,
    CreditCard,
    Eye,
    EyeOff,
    Globe,
    Home,
    Key,
    KeyRound,
    Laptop,
    Lock,
    LogOut,
    Mail,
    MapPin,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Shield,
    ShieldCheck,
    Smartphone,
    Sparkles,
    Trash2,
    User,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import { Button, Card, ErrorNote, Modal, QueryState, Select } from '../ui';
import type { ClientProfile } from './security';
import { ask } from '../dialog';

// ISO 3166 codes; names come from the browser so they read naturally.
const COUNTRY_CODES = 'BD US GB CA AU AF AL DZ AD AO AG AR AM AT AZ BS BH BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI KH CM CV CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE UY UZ VU VA VE VN YE ZM ZW'.split(' ');
const regionNames = (() => {
    try {
        return new Intl.DisplayNames(['en'], { type: 'region' });
    } catch {
        return null;
    }
})();
const countries = COUNTRY_CODES.map((code) => ({ code, name: regionNames?.of(code) ?? code })).sort((a, b) => a.name.localeCompare(b.name));

export function ProfileHeader({ activeTab }: { activeTab: string; breadcrumb?: string }) {
    const tabs = [
        { key: 'details', label: 'My Details', icon: User, to: '/account/details' },
        { key: 'contacts', label: 'Contacts / Sub-Accounts', icon: Users, to: '/account/contacts' },
        { key: 'emails', label: 'My Emails', icon: Mail, to: '/account/emails' },
        { key: 'password', label: 'Change Password', icon: KeyRound, to: '/account/password' },
        { key: 'security', label: 'Security', icon: ShieldCheck, to: '/security' },
        { key: 'support-token', label: 'Support Token', icon: Key, to: '/account/support-token' },
    ];

    return (
        <div className="mb-6">
            <div className="flex flex-wrap items-center gap-6 border-b border-slate-200 text-xs font-medium">
                {tabs.map((t) => {
                    const Icon = t.icon;
                    const isActive = t.key === activeTab;
                    return (
                        <Link
                            key={t.key}
                            to={t.to}
                            className={`flex items-center gap-1.5 pb-3 transition-colors ${
                                isActive
                                    ? 'border-b-2 border-emerald-600 font-semibold text-emerald-600'
                                    : 'text-slate-600 hover:text-slate-900'
                            }`}
                        >
                            <Icon size={14} />
                            <span>{t.label}</span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

// Form field with left icon
function IconField({
    label,
    icon: Icon,
    children,
    prefix,
}: {
    label: string;
    icon?: any;
    children: React.ReactNode;
    prefix?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-700">{label}</label>
            <div className="relative flex items-center">
                {prefix ? (
                    prefix
                ) : Icon ? (
                    <span className="pointer-events-none absolute left-3 text-slate-400">
                        <Icon size={14} />
                    </span>
                ) : null}
                {children}
            </div>
        </div>
    );
}

/* =========================================================
 * 1. MY DETAILS PAGE (Image 1)
 * ========================================================= */
type Profile = {
    name: string;
    first_name?: string;
    last_name?: string;
    company: string | null;
    email: string;
    phone: string | null;
    address: string | null;
    city: string | null;
    country: string;
};

function DetailsForm({ data }: { data: Profile }) {
    const qc = useQueryClient();
    const parts = (data.name ?? '').split(' ');
    const [firstName, setFirstName] = useState(data.first_name ?? parts[0] ?? '');
    const [lastName, setLastName] = useState(data.last_name ?? parts.slice(1).join(' ') ?? '');
    const [company, setCompany] = useState(data.company ?? '');
    const [phone, setPhone] = useState(data.phone ?? '1787-882277');
    const [address1, setAddress1] = useState(data.address ?? '270/ka, West Agargaon');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState(data.city ?? 'Dhaka');
    const [stateRegion, setStateRegion] = useState(data.city ?? 'Dhaka');
    const [zipCode, setZipCode] = useState('1207');
    const [country, setCountry] = useState(data.country ?? 'BD');
    const [vatNumber, setVatNumber] = useState('');
    const [saved, setSaved] = useState(false);

    const save = useMutation({
        mutationFn: async () => {
            const fullName = `${firstName} ${lastName}`.trim() || data.name;
            return (await api.put<Profile>('/client/account/profile', {
                name: fullName,
                first_name: firstName,
                last_name: lastName,
                company: company || null,
                phone: phone || null,
                address: address1 || null,
                city: city || null,
                country: country || 'BD',
            })).data;
        },
        onSuccess: (fresh) => {
            qc.setQueryData(['client-profile'], fresh);
            qc.invalidateQueries({ queryKey: ['client-me'] });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        },
    });

    return (
        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
            {/* Section 1: Personal Information */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <User size={15} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-800">Personal Information</h2>
                        <p className="text-[11px] text-slate-400">Update your personal details and contact information.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <IconField label="First Name" icon={User}>
                        <input
                            type="text"
                            required
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                    <IconField label="Last Name" icon={User}>
                        <input
                            type="text"
                            required
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <IconField label="Email Address" icon={Mail}>
                        <input
                            type="email"
                            disabled
                            value={data.email}
                            className="ui-input pl-9 text-xs py-2 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                        />
                    </IconField>

                    <IconField
                        label="Phone Number"
                        prefix={
                            <div className="pointer-events-none absolute left-3 flex items-center gap-1 text-xs text-slate-600 border-r border-slate-200 pr-2">
                                <span>🇧🇩 +880</span>
                            </div>
                        }
                    >
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="ui-input pl-20 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>

                <div>
                    <IconField label="Company Name (Optional)" icon={Briefcase}>
                        <input
                            type="text"
                            placeholder="Company Name"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>
            </div>

            {/* Section 2: Billing Address */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <MapPin size={15} />
                    </div>
                    <div>
                        <h2 className="text-xs font-bold text-slate-800">Billing Address</h2>
                        <p className="text-[11px] text-slate-400">Update your billing address.</p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <IconField label="Address 1" icon={Home}>
                        <input
                            type="text"
                            value={address1}
                            onChange={(e) => setAddress1(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                    <IconField label="Address 2 (Optional)" icon={Home}>
                        <input
                            type="text"
                            placeholder="Address 2"
                            value={address2}
                            onChange={(e) => setAddress2(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <IconField label="City" icon={Building2}>
                        <input
                            type="text"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                    <IconField label="State / Region" icon={Building}>
                        <input
                            type="text"
                            value={stateRegion}
                            onChange={(e) => setStateRegion(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <IconField label="Zip Code" icon={Compass}>
                        <input
                            type="text"
                            value={zipCode}
                            onChange={(e) => setZipCode(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                    <IconField label="Country" icon={Globe}>
                        <select
                            value={country}
                            onChange={(e) => setCountry(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        >
                            {countries.map((c) => (
                                <option key={c.code} value={c.code}>
                                    {c.name}
                                </option>
                            ))}
                        </select>
                    </IconField>
                </div>

                <div>
                    <IconField label="VAT Number (Optional)" icon={CreditCard}>
                        <input
                            type="text"
                            placeholder="VAT Number (Optional)"
                            value={vatNumber}
                            onChange={(e) => setVatNumber(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </IconField>
                </div>
            </div>

            {saved && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>Your details have been updated successfully!</span>
                </div>
            )}

            <ErrorNote error={save.error} />

            <div className="flex items-center gap-3 pt-2">
                <button
                    type="submit"
                    disabled={save.isPending}
                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                >
                    <KeyRound size={14} />
                    <span>{save.isPending ? 'Saving...' : 'Save Changes'}</span>
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setFirstName(data.first_name ?? parts[0] ?? '');
                        setLastName(data.last_name ?? parts.slice(1).join(' ') ?? '');
                        setCompany(data.company ?? '');
                        setPhone(data.phone ?? '');
                    }}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                >
                    Cancel
                </button>
            </div>
        </form>
    );
}

export function MyDetailsPage() {
    const query = useQuery({ queryKey: ['client-profile'], queryFn: async () => (await api.get<Profile>('/client/account/profile')).data });

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="details" breadcrumb="My Details" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <QueryState query={query}>{query.data && <DetailsForm data={query.data} />}</QueryState>
            </div>
        </div>
    );
}

/* =========================================================
 * 2. CONTACTS / SUB-ACCOUNTS PAGE (Image 2)
 * ========================================================= */
export const CONTACT_PERMISSIONS = [
    { key: 'profile', label: 'Modify Master Account Profile' },
    { key: 'products', label: 'View Products & Services' },
    { key: 'manageproducts', label: 'View & Modify Product Passwords' },
    { key: 'productsso', label: 'Allow Single Signon' },
    { key: 'domains', label: 'View Domains' },
    { key: 'managedomains', label: 'Manage Domain Settings' },
    { key: 'invoices', label: 'View & Pay Invoices' },
    { key: 'quotes', label: 'View & Accept Quotes' },
    { key: 'tickets', label: 'View & Open Support Tickets' },
    { key: 'affiliates', label: 'View & Manage Affiliate Account' },
    { key: 'emails', label: 'View Emails' },
    { key: 'contacts', label: 'View & Manage Contacts' },
    { key: 'orders', label: 'Place New Orders/Upgrades/Cancellations' },
];

type Contact = {
    id: number;
    first_name?: string | null;
    last_name?: string | null;
    name: string;
    email: string;
    phone: string | null;
    language?: string;
    two_factor?: boolean;
    is_owner: boolean;
    permissions: string[];
    status: 'active' | 'pending_verification' | 'pending_approval' | 'rejected';
    verification_token?: string | null;
    email_verified_at?: string | null;
    last_login_at?: string | null;
    receives_support?: boolean;
};

export function ContactsPage() {
    const qc = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const verifyToken = searchParams.get('verify_token');
    const [verifyNotice, setVerifyNotice] = useState<string | null>(null);

    const query = useQuery({ queryKey: ['client-contacts'], queryFn: async () => (await api.get<Contact[]>('/client/account/contacts')).data });
    const contacts = query.data ?? [];

    const [selectedContactId, setSelectedContactId] = useState<string>('new');
    const activeContact = contacts.find((c) => String(c.id) === selectedContactId) ?? null;

    // Form states
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('1812-345678');
    const [company, setCompany] = useState('');
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('BD');
    const [vatNumber, setVatNumber] = useState('');
    const [stateRegion, setStateRegion] = useState('');
    const [zipCode, setZipCode] = useState('');

    // Sub-Account activation
    const [isSubAccount, setIsSubAccount] = useState(true);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState<Set<string>>(new Set(['invoices', 'tickets', 'products', 'domains']));

    const resetForm = () => {
        setFirstName('');
        setLastName('');
        setEmail('');
        setPhone('1812-345678');
        setCompany('');
        setAddress1('');
        setAddress2('');
        setCity('');
        setCountry('BD');
        setVatNumber('');
        setStateRegion('');
        setZipCode('');
        setIsSubAccount(true);
        setNewPassword('');
        setConfirmPassword('');
        setPermissions(new Set(['invoices', 'tickets', 'products', 'domains']));
    };

    const loadContact = (c: Contact | null) => {
        if (!c) {
            resetForm();
            return;
        }
        const nameParts = (c.name ?? '').split(' ');
        setFirstName(c.first_name ?? nameParts[0] ?? '');
        setLastName(c.last_name ?? nameParts.slice(1).join(' ') ?? '');
        setEmail(c.email ?? '');
        setPhone(c.phone ?? '');
        setIsSubAccount(!c.is_owner);
        setPermissions(new Set(c.permissions ?? []));
    };

    const togglePerm = (key: string) => {
        setPermissions((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    const toggleAllPerms = () => {
        if (permissions.size === CONTACT_PERMISSIONS.length) {
            setPermissions(new Set());
        } else {
            setPermissions(new Set(CONTACT_PERMISSIONS.map((p) => p.key)));
        }
    };

    const generatePassword = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%&*';
        let pass = '';
        for (let i = 0; i < 12; i++) {
            pass += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setNewPassword(pass);
        setConfirmPassword(pass);
        setShowPassword(true);
    };

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload: any = {
                first_name: firstName,
                last_name: lastName,
                email,
                phone,
                permissions: Array.from(permissions),
            };

            if (activeContact) {
                return (await api.put(`/client/account/contacts/${activeContact.id}`, payload)).data;
            }
            return (await api.post('/client/account/contacts', payload)).data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['client-contacts'] });
            setVerifyNotice(activeContact ? 'Contact updated successfully.' : 'Invitation sent! Email verification required.');
            if (!activeContact) resetForm();
        },
    });

    const remove = useMutation({
        mutationFn: (id: number) => api.delete(`/client/account/contacts/${id}`),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['client-contacts'] });
            resetForm();
            setSelectedContactId('new');
        },
    });

    const resend = useMutation({
        mutationFn: (id: number) => api.post(`/client/account/contacts/${id}/resend`),
        onSuccess: (res) => {
            setVerifyNotice((res.data as any)?.message ?? 'Verification email resent.');
            qc.invalidateQueries({ queryKey: ['client-contacts'] });
        },
    });

    const verify = useMutation({
        mutationFn: (token: string) => api.post('/client/account/contacts/verify', { token }),
        onSuccess: (res) => {
            setVerifyNotice((res.data as any)?.message ?? 'Email verified successfully! Awaiting admin approval.');
            qc.invalidateQueries({ queryKey: ['client-contacts'] });
            setSearchParams({});
        },
    });

    useEffect(() => {
        if (verifyToken) {
            verify.mutate(verifyToken);
        }
    }, [verifyToken]);

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="contacts" breadcrumb="Contacts / Sub-Accounts" />

            {verifyNotice && (
                <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 shadow-sm">
                    <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                        <span>{verifyNotice}</span>
                    </div>
                    <button type="button" onClick={() => setVerifyNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-bold ml-2">×</button>
                </div>
            )}

            {/* Main Card: Matching Image 2 */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                {/* Top Section: Choose a Contact */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-sm font-bold text-slate-900">Choose a Contact</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Select an existing contact or create a new one to manage sub-accounts.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <select
                            value={selectedContactId}
                            onChange={(e) => setSelectedContactId(e.target.value)}
                            className="ui-input py-2 text-xs rounded-lg min-w-56"
                        >
                            <option value="new">Add New Contact</option>
                            {contacts.map((c) => (
                                <option key={c.id} value={String(c.id)}>
                                    {c.name || c.email} {c.is_owner ? '(Owner)' : ''}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => loadContact(selectedContactId === 'new' ? null : activeContact)}
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                        >
                            Go
                        </button>
                    </div>
                </div>

                <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-6">
                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-bold text-slate-800">Contact Information</h3>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="First Name" icon={User}>
                                <input
                                    type="text"
                                    required
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                            <IconField label="Last Name" icon={User}>
                                <input
                                    type="text"
                                    required
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="Email Address" icon={Mail}>
                                <input
                                    type="email"
                                    required
                                    disabled={!!activeContact}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg disabled:bg-slate-50 disabled:text-slate-500"
                                />
                            </IconField>
                            <IconField
                                label="Phone Number"
                                prefix={
                                    <div className="pointer-events-none absolute left-3 flex items-center gap-1 text-xs text-slate-600 border-r border-slate-200 pr-2">
                                        <span>🇧🇩 +880</span>
                                    </div>
                                }
                            >
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="ui-input pl-20 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="Company Name (Optional)" icon={Briefcase}>
                                <input
                                    type="text"
                                    placeholder="Company Name"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                            <IconField label="Address 1" icon={Home}>
                                <input
                                    type="text"
                                    value={address1}
                                    onChange={(e) => setAddress1(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="Address 2 (Optional)" icon={Home}>
                                <input
                                    type="text"
                                    placeholder="Address 2"
                                    value={address2}
                                    onChange={(e) => setAddress2(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                            <IconField label="City" icon={Building2}>
                                <input
                                    type="text"
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="Country" icon={Globe}>
                                <select
                                    value={country}
                                    onChange={(e) => setCountry(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                >
                                    {countries.map((c) => (
                                        <option key={c.code} value={c.code}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </IconField>
                            <IconField label="VAT Number (Optional)" icon={CreditCard}>
                                <input
                                    type="text"
                                    placeholder="VAT Number"
                                    value={vatNumber}
                                    onChange={(e) => setVatNumber(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <IconField label="State / Region" icon={Building}>
                                <input
                                    type="text"
                                    value={stateRegion}
                                    onChange={(e) => setStateRegion(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                            <IconField label="Zip Code" icon={Compass}>
                                <input
                                    type="text"
                                    value={zipCode}
                                    onChange={(e) => setZipCode(e.target.value)}
                                    className="ui-input pl-9 text-xs py-2 rounded-lg"
                                />
                            </IconField>
                        </div>
                    </div>

                    {/* Bottom Two Cards: Activate Sub-Account and New Password */}
                    <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-slate-100">
                        {/* Left Card: Activate Sub-Account */}
                        <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800">Activate Sub-Account</h4>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                        Tick to configure as a sub-account with client area access.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsSubAccount(!isSubAccount)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        isSubAccount ? 'bg-emerald-600' : 'bg-slate-300'
                                    }`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        isSubAccount ? 'translate-x-6' : 'translate-x-1'
                                    }`} />
                                </button>
                            </div>

                            {isSubAccount && (
                                <div className="space-y-3 pt-3 border-t border-slate-100">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-800">Permissions</span>
                                        <button type="button" onClick={toggleAllPerms} className="text-xs text-emerald-600 hover:underline">
                                            {permissions.size === CONTACT_PERMISSIONS.length ? 'Uncheck All' : 'Check All'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                                        {CONTACT_PERMISSIONS.map((p) => (
                                            <label key={p.key} className="flex items-center gap-2 text-[11px] text-slate-700 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                    checked={permissions.has(p.key)}
                                                    onChange={() => togglePerm(p.key)}
                                                />
                                                <span>{p.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Card: New Password */}
                        <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                            <h4 className="text-xs font-bold text-slate-800">New Password (for sub-account access)</h4>

                            <div className="space-y-2">
                                <label className="block text-[11px] font-medium text-slate-600">New Password</label>
                                <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Enter password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="ui-input pr-9 text-xs py-2 rounded-lg"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                                        >
                                            {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={generatePassword}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                    >
                                        Generate
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-[11px] font-medium text-slate-600">Confirm Password</label>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Confirm password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="ui-input text-xs py-2 rounded-lg"
                                />
                            </div>

                            <div className="rounded-lg bg-emerald-50/70 border border-emerald-100 p-3 text-[11px] text-emerald-900 flex items-start gap-2">
                                <Sparkles size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <strong className="font-semibold block mb-0.5">Tips for a good password</strong>
                                    Use both uppercase and lowercase at least 8 characters. Include at least one symbol (# $ ! % & etc...). Don't use dictionary words.
                                </div>
                            </div>
                        </div>
                    </div>

                    <ErrorNote error={saveMutation.error} />

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                        >
                            <KeyRound size={14} />
                            <span>{saveMutation.isPending ? 'Saving...' : activeContact ? 'Save Changes' : 'Send Invitation'}</span>
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>

            {/* Existing Sub-Accounts Listing */}
            {contacts.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-900 mb-3">Linked Accounts & Contacts</h3>
                    <ul className="divide-y divide-slate-100">
                        {contacts.map((c) => (
                            <li key={c.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5 hover:bg-slate-50/50 px-2 rounded-lg transition">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                        {(c.name || c.email).slice(0, 1).toUpperCase()}
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-semibold text-xs text-slate-900">{c.name}</span>
                                            {c.is_owner && (
                                                <span className="rounded bg-neutral-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase">
                                                    OWNER
                                                </span>
                                            )}
                                            {c.status === 'active' && (
                                                <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 border border-emerald-200">
                                                    Active
                                                </span>
                                            )}
                                            {c.status === 'pending_verification' && (
                                                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 border border-amber-200">
                                                    Pending Verification
                                                </span>
                                            )}
                                            {c.status === 'pending_approval' && (
                                                <span className="rounded-md bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-700 border border-sky-200">
                                                    Awaiting Admin Approval
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            {c.email}{c.phone ? ` · ${c.phone}` : ''}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {c.status === 'pending_verification' && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => resend.mutate(c.id)}
                                                className="inline-flex items-center gap-1 rounded border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                                            >
                                                <Mail size={12} /> Resend
                                            </button>
                                            {c.verification_token && (
                                                <button
                                                    type="button"
                                                    onClick={() => verify.mutate(c.verification_token!)}
                                                    className="inline-flex items-center gap-1 rounded bg-sky-600 px-2.5 py-1 text-xs font-medium text-white shadow-sm hover:bg-sky-700"
                                                >
                                                    <CheckCircle2 size={12} /> Verify
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {!c.is_owner && (
                                        <>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setSelectedContactId(String(c.id));
                                                    loadContact(c);
                                                }}
                                                className="icon-btn"
                                                aria-label="Edit contact"
                                            >
                                                <Pencil size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={remove.isPending}
                                                onClick={() => ask(`Remove ${c.name}?`, () => remove.mutate(c.id))}
                                                className="icon-btn hover:text-rose-600"
                                                aria-label="Remove contact"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

/* =========================================================
 * 3. MY EMAILS PAGE (Image 3)
 * ========================================================= */
type EmailRow = { id: number; to: string; subject: string; created_at: string; body?: string | null };

export function EmailsPage() {
    const [search, setSearch] = useState('');
    const [perPage, setPerPage] = useState('25');
    const [viewingEmailId, setViewingEmailId] = useState<number | null>(null);

    const query = useQuery({
        queryKey: ['client-emails'],
        queryFn: async () => (await api.get<{ data: EmailRow[] }>('/client/account/emails')).data,
    });

    const emails = (query.data?.data ?? []).filter((e) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (e.subject || '').toLowerCase().includes(q) || (e.to || '').toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="emails" breadcrumb="My Emails" />

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div>
                    <h2 className="text-base font-bold text-slate-900">My Emails</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        View your email history and important notifications.
                    </p>
                </div>

                {/* Controls Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <span>Show</span>
                        <select
                            value={perPage}
                            onChange={(e) => setPerPage(e.target.value)}
                            className="ui-input py-1 px-2 text-xs rounded-lg"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="relative min-w-64">
                        <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400">
                            <Search size={14} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search by subject or message..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="ui-input pl-9 text-xs py-2 rounded-lg"
                        />
                    </div>
                </div>

                {/* Table with Mint/Green Header */}
                <div className="overflow-x-auto rounded-xl border border-slate-100 mt-2">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[#ebf8f2] text-slate-700 font-semibold border-b border-emerald-100/60">
                                <th className="px-4 py-3">Date Sent</th>
                                <th className="px-4 py-3">Message Subject</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {emails.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-4 py-8 text-center text-xs text-slate-500">
                                        No emails found.
                                    </td>
                                </tr>
                            ) : (
                                emails.map((e) => (
                                    <tr key={e.id} className="hover:bg-slate-50/70 transition">
                                        <td className="px-4 py-3.5 whitespace-nowrap text-slate-700">
                                            <span className="inline-flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                                <span>{new Date(e.created_at).toLocaleString()}</span>
                                            </span>
                                        </td>
                                        <td className="px-4 py-3.5 font-medium text-slate-800">
                                            {e.subject || '(no subject)'}
                                        </td>
                                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => setViewingEmailId(e.id)}
                                                className="rounded-lg border border-sky-600 bg-white px-3 py-1.5 text-xs font-semibold text-sky-600 shadow-sm hover:bg-sky-50 transition"
                                            >
                                                View Message
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {viewingEmailId && (
                <EmailModal emailId={viewingEmailId} onClose={() => setViewingEmailId(null)} />
            )}
        </div>
    );
}

function EmailModal({ emailId, onClose }: { emailId: number; onClose: () => void }) {
    const query = useQuery({
        queryKey: ['client-email', emailId],
        queryFn: async () => (await api.get<EmailRow>(`/client/account/emails/${emailId}`)).data,
    });
    const e = query.data;

    return (
        <Modal title={e?.subject || 'Email Notification'} onClose={onClose}>
            <QueryState query={query}>
                {e && (
                    <div className="space-y-3">
                        <div className="border-b border-slate-100 pb-2 text-xs text-slate-500">
                            <div><strong>To:</strong> {e.to}</div>
                            <div><strong>Date:</strong> {new Date(e.created_at).toLocaleString()}</div>
                        </div>
                        {e.body ? (
                            <iframe
                                title={e.subject}
                                sandbox="allow-popups allow-popups-to-escape-sandbox"
                                srcDoc={`<base target="_blank">${e.body}`}
                                className="h-96 w-full rounded-lg border border-slate-200 bg-white"
                            />
                        ) : (
                            <p className="p-8 text-center text-xs text-slate-500">No content in this email.</p>
                        )}
                        <div className="flex justify-end pt-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </QueryState>
        </Modal>
    );
}

export function EmailPage() {
    const { id } = useParams();
    const query = useQuery({ queryKey: ['client-email', id], queryFn: async () => (await api.get<EmailRow>(`/client/account/emails/${id}`)).data });
    const e = query.data;

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="emails" breadcrumb="My Emails" />
            <QueryState query={query}>
                {e && (
                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">{e.subject || '(no subject)'}</h2>
                                <p className="text-xs text-slate-400 mt-0.5">To {e.to} · {new Date(e.created_at).toLocaleString()}</p>
                            </div>
                            <Link to="/account/emails" className="text-xs text-sky-600 hover:underline font-semibold">
                                &larr; Back to all emails
                            </Link>
                        </div>
                        {e.body ? (
                            <iframe
                                title={e.subject}
                                sandbox="allow-popups allow-popups-to-escape-sandbox"
                                srcDoc={`<base target="_blank">${e.body}`}
                                className="h-[70vh] w-full rounded-lg border-0 bg-white"
                            />
                        ) : (
                            <p className="p-8 text-center text-xs text-slate-500">This email has no content.</p>
                        )}
                    </div>
                )}
            </QueryState>
        </div>
    );
}

/* =========================================================
 * 4. SUPPORT PIN / TOKEN PAGE (Image 6)
 * ========================================================= */
function ShieldIllustration() {
    return (
        <div className="relative flex h-28 w-28 shrink-0 items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-100/60 blur-sm" />
            <div className="absolute h-24 w-24 rounded-full bg-emerald-50 border border-emerald-200/60 flex items-center justify-center shadow-sm">
                <div className="relative flex h-14 w-12 items-center justify-center rounded-b-xl rounded-t-lg bg-gradient-to-b from-emerald-500 to-emerald-600 shadow-md">
                    <div className="absolute top-1.5 h-3 w-5 rounded-t-full border-2 border-white/60 border-b-0" />
                    <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow border border-emerald-100 text-emerald-600">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m21 2-2 2m-1.5 1.5L14 9l-2-2-4 4 2 2-3 3H3v4h4v-2l1-1 2 2 4-4-2-2 3.5-3.5" />
                    <circle cx="7.5" cy="15.5" r=".5" fill="currentColor" />
                </svg>
            </div>
            <div className="absolute top-1 left-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <div className="absolute bottom-2 left-1 h-2 w-2 rounded-full bg-emerald-300" />
            <div className="absolute top-3 right-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
        </div>
    );
}

function EmptyBasketIllustration() {
    return (
        <div className="flex flex-col items-center justify-center py-10">
            <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 border border-slate-100 text-slate-400">
                <svg className="h-8 w-8 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m5 11 4-7" />
                    <path d="m19 11-4-7" />
                    <path d="M2 11h20" />
                    <path d="m3.5 11 1.6 7.4a2 2 0 0 0 2 1.6h9.8c.9 0 1.8-.7 2-1.6l1.6-7.4" />
                    <path d="m9 11 1 9" />
                    <path d="m15 11-1 9" />
                </svg>
                <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-300" />
            </div>
            <div className="text-sm font-semibold text-slate-700">No support token has been generated yet.</div>
            <div className="text-xs text-slate-400 mt-1">Once you generate a support token, it will appear here.</div>
        </div>
    );
}

function DocumentIllustration() {
    return (
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <polyline points="9 15 12 18 15 15" />
            </svg>
        </div>
    );
}

type SupportTokenRow = {
    id: number;
    token: string;
    created_at: string;
    expires_at: string;
    used_at: string | null;
    cancelled_at: string | null;
    status: 'active' | 'expired' | 'used' | 'cancelled';
};

type SupportTokenResponse = {
    pin: string | null;
    expires_at: string | null;
    active: SupportTokenRow | null;
    tokens: SupportTokenRow[];
};

export function SupportPinPage() {
    const qc = useQueryClient();
    const [copied, setCopied] = useState(false);

    const query = useQuery({
        queryKey: ['client-support-pin'],
        queryFn: async () => (await api.get<SupportTokenResponse>('/client/account/support-pin')).data,
    });

    const generate = useMutation({
        mutationFn: async () => (await api.post<SupportTokenResponse>('/client/account/support-pin')).data,
        onSuccess: (fresh) => {
            qc.setQueryData(['client-support-pin'], fresh);
            setCopied(false);
        },
    });

    const cancel = useMutation({
        mutationFn: async (id?: number) => {
            return (await api.post<SupportTokenResponse>(id ? `/client/account/support-pin/cancel?id=${id}` : '/client/account/support-pin/cancel', { id })).data;
        },
        onSuccess: (fresh) => qc.setQueryData(['client-support-pin'], fresh),
    });

    const activeToken = query.data?.active;
    const tokens = query.data?.tokens ?? [];

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="support-token" breadcrumb="Support Token" />

            {/* Top Box: Generate Support Token */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                    <ShieldIllustration />

                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-base font-bold text-slate-900">Generate Support Token</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Support tokens allow our support team to securely access your account when you need assistance.
                        </p>

                        <div className="rounded-lg border border-rose-200 bg-rose-50/80 p-3 my-3.5 flex items-start gap-2.5 text-xs text-rose-800 text-left">
                            <AlertTriangle size={15} className="text-rose-600 shrink-0 mt-0.5" />
                            <span>
                                <strong>Do not share your support token with anyone else.</strong> Give it only to our support team — anyone who has it can misuse it to sign in to your account.
                            </span>
                        </div>

                        {activeToken ? (
                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                                    <span className="font-mono text-2xl font-bold tracking-[0.25em] text-emerald-700 bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200 shadow-inner">
                                        {activeToken.token}
                                    </span>
                                    <button
                                        type="button"
                                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                                        onClick={() => {
                                            navigator.clipboard?.writeText(activeToken.token);
                                            setCopied(true);
                                            setTimeout(() => setCopied(false), 2500);
                                        }}
                                    >
                                        <Copy size={13} />
                                        <span>{copied ? 'Copied!' : 'Copy Token'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        disabled={cancel.isPending}
                                        onClick={() => cancel.mutate(activeToken.id)}
                                        className="rounded-lg border border-rose-200 bg-white px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition disabled:opacity-50"
                                    >
                                        Cancel Token
                                    </button>
                                </div>
                                <div className="text-xs text-slate-500">
                                    Valid until {new Date(activeToken.expires_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(activeToken.expires_at).toLocaleDateString()})
                                </div>
                            </div>
                        ) : (
                            <div>
                                <button
                                    type="button"
                                    disabled={generate.isPending}
                                    onClick={() => generate.mutate()}
                                    className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 transition disabled:opacity-50"
                                >
                                    <KeyRound size={15} />
                                    <span>{generate.isPending ? 'Generating...' : 'Generate Token'}</span>
                                </button>
                            </div>
                        )}

                        <div className="mt-2">
                            <ErrorNote error={generate.error || cancel.error} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Box: Support Tokens Table */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Support Tokens</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Every support token you generate is listed here. You can cancel a token that has not been used yet. If you see a sign-in you did not expect, please contact us immediately.
                        </p>
                    </div>
                    <DocumentIllustration />
                </div>

                <div className="overflow-x-auto mt-4 rounded-xl border border-slate-100">
                    <table className="w-full text-left text-xs">
                        <thead>
                            <tr className="bg-[#ebf8f2] text-slate-700 font-semibold border-b border-emerald-100/60">
                                <th className="px-4 py-3">#</th>
                                <th className="px-4 py-3">Generated At</th>
                                <th className="px-4 py-3">Valid Until</th>
                                <th className="px-4 py-3">Used At</th>
                                <th className="px-4 py-3 text-center">Status</th>
                                <th className="px-4 py-3 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {tokens.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>
                                        <EmptyBasketIllustration />
                                    </td>
                                </tr>
                            ) : (
                                tokens.map((t, index) => (
                                    <tr key={t.id} className="hover:bg-slate-50/70 transition">
                                        <td className="px-4 py-3 font-medium text-slate-600">{tokens.length - index}</td>
                                        <td className="px-4 py-3 text-slate-700">{new Date(t.created_at).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-700">{new Date(t.expires_at).toLocaleString()}</td>
                                        <td className="px-4 py-3 text-slate-500">{t.used_at ? new Date(t.used_at).toLocaleString() : '-'}</td>
                                        <td className="px-4 py-3 text-center">
                                            {t.status === 'active' && (
                                                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                                                    Active
                                                </span>
                                            )}
                                            {t.status === 'expired' && (
                                                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                                                    Expired
                                                </span>
                                            )}
                                            {t.status === 'used' && (
                                                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-800">
                                                    Used
                                                </span>
                                            )}
                                            {t.status === 'cancelled' && (
                                                <span className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-semibold text-rose-700">
                                                    Cancelled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {t.status === 'active' ? (
                                                <button
                                                    type="button"
                                                    disabled={cancel.isPending}
                                                    onClick={() => cancel.mutate(t.id)}
                                                    className="rounded border border-rose-200 bg-white px-2.5 py-1 text-xs font-medium text-rose-600 shadow-sm hover:bg-rose-50 transition disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

/* =========================================================
 * 5. SESSIONS PAGE
 * ========================================================= */
type SessionRow = { id: number; ip_address: string | null; user_agent: string | null; signed_in_at: string; last_active_at: string; current: boolean };

function describeAgent(agent: string | null) {
    const ua = agent ?? '';
    const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
    const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown device';
    return { browser, os, isMobile: /Android|iPhone|iPad/.test(ua) };
}

export function SessionsPage({ profile }: { profile: ClientProfile }) {
    const qc = useQueryClient();
    const query = useQuery({ queryKey: ['client-sessions'], queryFn: async () => (await api.get<SessionRow[]>('/client/account/sessions')).data });
    const endOne = useMutation({ mutationFn: (id: number) => api.delete(`/client/account/sessions/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['client-sessions'] }) });
    const endOthers = useMutation({ mutationFn: () => api.delete('/client/account/sessions'), onSuccess: () => qc.invalidateQueries({ queryKey: ['client-sessions'] }) });

    return (
        <div className="space-y-6">
            <ProfileHeader activeTab="sessions" breadcrumb="Activity Sessions" />
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Sign-in Sessions</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Every device currently signed in to your account.</p>
                    </div>
                    {query.data && query.data.filter((s) => !s.current).length > 0 && !profile.impersonating && (
                        <button
                            type="button"
                            disabled={endOthers.isPending}
                            onClick={() => ask('Sign out all other devices?', () => endOthers.mutate())}
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 transition"
                        >
                            Sign out other devices
                        </button>
                    )}
                </div>

                <QueryState query={query}>
                    {query.data?.length === 0 ? (
                        <p className="p-8 text-center text-xs text-slate-500">No active sessions.</p>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {query.data?.map((s) => {
                                const { browser, os, isMobile } = describeAgent(s.user_agent);
                                const DeviceIcon = isMobile ? Smartphone : Laptop;
                                return (
                                    <li key={s.id} className="flex flex-wrap items-center gap-4 py-4">
                                        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.current ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>
                                            <DeviceIcon size={18} />
                                        </span>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-xs text-slate-900">{browser} on {os}</span>
                                                {s.current && (
                                                    <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                                        This device
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {s.ip_address ?? 'Unknown IP'} · Signed in {new Date(s.signed_in_at).toLocaleString()}
                                            </div>
                                        </div>
                                        {!s.current && !profile.impersonating && (
                                            <button
                                                type="button"
                                                disabled={endOne.isPending}
                                                onClick={() => endOne.mutate(s.id)}
                                                className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
                                            >
                                                Sign out
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </QueryState>
            </div>
        </div>
    );
}
