import { ReactNode } from "react";
import SiteNavbar from "@/components/SiteNavbar";
import SiteFooter from "@/components/SiteFooter";
import WhatsAppButton from "@/components/WhatsAppButton";
import BackToTopButton from "@/components/BackToTopButton";

interface SiteLayoutProps {
  children: ReactNode;
}

const SiteLayout = ({ children }: SiteLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteNavbar />
      <main className="flex-1 pt-16 lg:pt-[4.5rem]">{children}</main>
      <SiteFooter />
      <BackToTopButton />
      <WhatsAppButton />
    </div>
  );
};

export default SiteLayout;
