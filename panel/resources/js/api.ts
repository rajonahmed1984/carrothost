import axios, { AxiosError } from 'axios';

// Empty at a domain root; the folder path when served from a subfolder.
export const basePath = document.querySelector<HTMLMetaElement>('meta[name="base-path"]')?.content ?? '';

// Laravel sets the XSRF-TOKEN cookie; axios echoes it back as a header.
export const api = axios.create({
    baseURL: `${basePath}/api`,
    headers: { Accept: 'application/json' },
    withCredentials: true,
    withXSRFToken: true,
});

// A tab left open can hold a token its session has since retired. Fetch a live one and retry once.
api.interceptors.response.use(undefined, async (error: AxiosError) => {
    const config = error.config as (NonNullable<AxiosError['config']> & { csrfRetried?: boolean }) | undefined;

    if (error.response?.status !== 419 || !config || config.csrfRetried) throw error;

    config.csrfRetried = true;
    await api.get('/auth/config');

    return api(config);
});

export function errorMessage(error: unknown): string {
    const data = (error as AxiosError<{ message?: string; errors?: Record<string, string[]> }>).response?.data;
    const first = data?.errors && Object.values(data.errors)[0]?.[0];

    return first ?? data?.message ?? 'Something went wrong. Please try again.';
}

export type Page<T> = { data: T[]; current_page: number; last_page: number; total: number; from?: number | null; to?: number | null };

// The billing currency from Admin > Settings, set once the app has loaded its config.
let defaultCurrency = 'BDT';
export const setDefaultCurrency = (currency: string) => { defaultCurrency = currency; };

export const money = (value: string | number, currency = defaultCurrency) =>
    `${currency} ${Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
