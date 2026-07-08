import type { JSX } from "react";

export const SITE_URL = "https://carrothost.com";
export const SITE_NAME = "CarrotHost";
export const DEFAULT_OG_IMAGE = "/og-image.png";
export const DEFAULT_OG_IMAGE_ALT = "CarrotHost reliable domain and web hosting in Bangladesh";

type MetaTag = JSX.IntrinsicElements["meta"];
type LinkTag = JSX.IntrinsicElements["link"];
type ScriptTag = JSX.IntrinsicElements["script"];

export type SeoConfig = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  imageAlt?: string;
  type?: "website" | "article";
};

export type FaqItem = {
  question: string;
  answer: string;
};

const normalizePath = (path: string) => {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
};

export const absoluteUrl = (path: string) => {
  const normalized = normalizePath(path);
  return normalized === "/" ? `${SITE_URL}/` : `${SITE_URL}${normalized}`;
};

export const absoluteAssetUrl = (path: string) => {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
};

export function createSeoMeta({
  title,
  description,
  path,
  ogImage = DEFAULT_OG_IMAGE,
  imageAlt = DEFAULT_OG_IMAGE_ALT,
  type = "website",
}: SeoConfig): { meta: Array<MetaTag>; links: Array<LinkTag> } {
  const url = absoluteUrl(path);
  const image = absoluteAssetUrl(ogImage);

  return {
    meta: [
      { title },
      { name: "description", content: description },
      {
        name: "robots",
        content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
      },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: type },
      { property: "og:url", content: url },
      { property: "og:site_name", content: SITE_NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:image", content: image },
      { property: "og:image:secure_url", content: image },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: imageAlt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: image },
      { name: "twitter:image:alt", content: imageAlt },
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

export function jsonLdScript(id: string, data: unknown): ScriptTag {
  return {
    id,
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  logo: absoluteAssetUrl("/logo.png"),
  image: absoluteAssetUrl(DEFAULT_OG_IMAGE),
  description:
    "CarrotHost provides domain registration, Webuzo hosting, BDIX VPS, and Xeon Cloud VPS services for Bangladesh.",
  foundingDate: "2014",
  parentOrganization: {
    "@type": "Organization",
    name: "Apptimatic",
    url: "https://apptimatic.com/",
  },
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+8801787882277",
      contactType: "customer support",
      areaServed: "BD",
      availableLanguage: ["en", "bn"],
    },
  ],
  sameAs: ["https://www.facebook.com/carrothost", "https://youtube.com/@carrothost999"],
};

export const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  name: SITE_NAME,
  url: `${SITE_URL}/`,
  publisher: {
    "@id": `${SITE_URL}/#organization`,
  },
  inLanguage: "en",
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/whois?domain={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function webHostingServiceSchema({
  name,
  description,
  path,
  serviceType,
  priceFrom,
}: {
  name: string;
  description: string;
  path: string;
  serviceType: string;
  priceFrom: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "WebHostingService",
    "@id": `${absoluteUrl(path)}#service`,
    name,
    description,
    serviceType,
    url: absoluteUrl(path),
    image: absoluteAssetUrl(DEFAULT_OG_IMAGE),
    provider: {
      "@id": `${SITE_URL}/#organization`,
    },
    areaServed: {
      "@type": "Country",
      name: "Bangladesh",
    },
    offers: {
      "@type": "Offer",
      priceCurrency: "BDT",
      price: priceFrom,
      availability: "https://schema.org/InStock",
      url: absoluteUrl(path),
    },
  };
}

export function faqSchema(items: Array<FaqItem>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}
