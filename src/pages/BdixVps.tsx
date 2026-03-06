import SiteLayout from "@/components/SiteLayout";
import { Network } from "lucide-react";

const BdixVps = () => {
  return (
    <SiteLayout>
      <div className="section-spacing">
        <div className="container text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">BDIX VPS</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Blazing-fast BDIX-connected VPS servers in Bangladesh. Coming soon.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
};

export default BdixVps;
