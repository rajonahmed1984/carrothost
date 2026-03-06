import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, HashRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import WebuzoHosting from "./pages/WebuzoHosting";
import CpanelHosting from "./pages/CpanelHosting";
import XeonVps from "./pages/XeonVps";
import BdixVps from "./pages/BdixVps";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const Router = import.meta.env.DEV ? BrowserRouter : HashRouter;

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/webuzo-hosting" element={<WebuzoHosting />} />
          <Route path="/cpanel-hosting" element={<CpanelHosting />} />
          <Route path="/xeon-vps" element={<XeonVps />} />
          <Route path="/bdix-vps" element={<BdixVps />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
