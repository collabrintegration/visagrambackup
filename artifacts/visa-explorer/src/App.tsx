import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";

import Layout from "@/components/layout";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import CountryDetail from "@/pages/country";
import PassportPower from "@/pages/passport";
import VisaDetail from "@/pages/visa";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,       // data is fresh for 2 minutes
      refetchOnWindowFocus: true,      // re-validate when user returns to tab
      refetchOnReconnect: true,        // re-validate after a network drop
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/explore" component={Explore} />
        <Route path="/country/:code" component={CountryDetail} />
        <Route path="/passport" component={PassportPower} />
        <Route path="/visa/:id" component={VisaDetail} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
