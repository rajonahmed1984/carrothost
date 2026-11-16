/** CarrotHost client portal (the billing panel). Override per environment with VITE_PANEL_URL. */
export const PORTAL_URL =
  (import.meta.env.VITE_PANEL_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://my.carrothost.com";

export const PORTAL_LOGIN_URL = `${PORTAL_URL}/login`;

/** Opens the portal's domain order page with the domain already filled in. */
export function orderDomainUrl(domain: string, action: "register" | "transfer" = "register") {
  return `${PORTAL_URL}/order-domain?${new URLSearchParams({ domain, action }).toString()}`;
}
