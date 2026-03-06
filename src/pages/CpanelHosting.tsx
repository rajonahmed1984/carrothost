import SiteLayout from "@/components/SiteLayout";
import { HardDrive } from "lucide-react";

const CpanelHosting = () => {
  return (
    <SiteLayout>
      <div className="section-spacing">
        <div className="container text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <HardDrive className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">cPanel Hosting</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Industry-standard cPanel hosting with full control. Coming soon.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
};

export default CpanelHosting;
