import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WebuzoHosting from "./pages/WebuzoHosting";
import CpanelHosting from "./pages/CpanelHosting";
import XeonVps from "./pages/XeonVps";
import BdixVps from "./pages/BdixVps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const routerBasename = import.meta.env.DEV ? "/" : "/carrothost";

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename={routerBasename}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/webuzo-hosting" element={<WebuzoHosting />} />
          <Route path="/cpanel-hosting" element={<CpanelHosting />} />
          <Route path="/xeon-vps" element={<XeonVps />} />
          <Route path="/bdix-vps" element={<BdixVps />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
