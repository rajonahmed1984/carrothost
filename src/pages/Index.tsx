import SiteLayout from "@/components/SiteLayout";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";

const Index = () => {
  return (
    <SiteLayout>
      <Hero />
      <Features />
      <Pricing />
      <FAQ />
    </SiteLayout>
  );
};

export default Index;
