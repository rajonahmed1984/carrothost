import HomePage from "@/components/HomePage";
import SiteLayout from "@/components/SiteLayout";
import { useEffect } from "react";

const Index = () => {
  useEffect(() => {
    document.title = "Fast Web Hosting in Bangladesh | NVMe SSD cPanel, Webuzo & VPS Hosting - Carrothost";

    const setMeta = (selector: string, content: string) => {
      const element = document.querySelector<HTMLMetaElement>(selector);
      if (element) {
        element.content = content;
      }
    };

    setMeta(
      'meta[name="description"]',
      "Carrothost provides fast, secure and reliable web hosting in Bangladesh with NVMe SSD storage, cPanel hosting, Webuzo hosting, Xeon VPS and BDIX VPS. Launch your website with confidence.",
    );
    setMeta('meta[property="og:title"]', "Fast Web Hosting in Bangladesh | NVMe SSD cPanel, Webuzo & VPS Hosting - Carrothost");
    setMeta(
      'meta[property="og:description"]',
      "Carrothost provides fast, secure and reliable web hosting in Bangladesh with NVMe SSD storage, cPanel hosting, Webuzo hosting, Xeon VPS and BDIX VPS.",
    );
    setMeta('meta[name="twitter:title"]', "Fast Web Hosting in Bangladesh | NVMe SSD cPanel, Webuzo & VPS Hosting - Carrothost");
    setMeta(
      'meta[name="twitter:description"]',
      "Fast, secure and reliable web hosting in Bangladesh with NVMe SSD, cPanel, Webuzo, Xeon VPS and BDIX VPS from Carrothost.",
    );
  }, []);

  return (
    <SiteLayout>
      <HomePage />
    </SiteLayout>
  );
};

export default Index;
