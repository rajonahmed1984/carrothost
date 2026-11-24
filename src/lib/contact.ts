export const WHATSAPP_NUMBER = "8801787882277";
export const PHONE_DISPLAY = "+880 1787-882277";
export const PHONE_TEL = "tel:+8801787882277";

export const waLink = (message = "Hello CarrotHost, I need help choosing a hosting plan.") =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
