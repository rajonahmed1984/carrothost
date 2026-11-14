import { CircleAlert } from 'lucide-react';
import { useState } from 'react';
import { Field, Input } from '../ui';

/** From /client/store/domains: the profile fields a registration needs that the client has not filled. */
export type RegistrantGaps = { registrant_missing?: Record<string, string> };

const hints: Record<string, string> = {
    phone: 'With the country code, e.g. +8801712345678',
    country: '2-letter code, e.g. BD',
};

/** What the client types for the missing fields; sent with the order as `contact`. */
export function useRegistrantForm() {
    const [values, setValues] = useState<Record<string, string>>({});

    return { values, set: (field: string, value: string) => setValues((v) => ({ ...v, [field]: value })) };
}

/**
 * Asks, at checkout, for the details a domain registration needs that the profile lacks, so the
 * order cannot reach the registrar with gaps. They are saved to the client's profile.
 */
export function RegistrantFields({ missing, form }: { missing?: Record<string, string>; form: ReturnType<typeof useRegistrantForm> }) {
    const fields = Object.entries(missing ?? {});
    if (!fields.length) return null;

    return (
        <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3">
            <p className="flex items-start gap-2 text-xs text-amber-900">
                <CircleAlert size={14} className="mt-0.5 shrink-0" />
                <span>The domain registry needs these details. They are saved to your profile.</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
                {fields.map(([field, label]) => (
                    <Field key={field} label={label} hint={hints[field]}>
                        <Input
                            required
                            maxLength={field === 'country' ? 2 : field === 'postcode' ? 16 : 64}
                            inputMode={field === 'phone' ? 'tel' : undefined}
                            value={form.values[field] ?? ''}
                            onChange={(e) => form.set(field, field === 'country' ? e.target.value.toUpperCase() : e.target.value)}
                        />
                    </Field>
                ))}
            </div>
        </div>
    );
}
