import SiteLayout from "@/components/SiteLayout";
import { Server } from "lucide-react";

const WebuzoHosting = () => {
  return (
    <SiteLayout>
      <div className="section-spacing">
        <div className="container text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-gradient mb-4">Webuzo Hosting</h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            One-click application installer hosting with premium performance. Coming soon.
          </p>
        </div>
      </div>
    </SiteLayout>
  );
};

export default WebuzoHosting;
