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
import Community from "@/pages/community";
import ProfilePage from "@/pages/profile";
import SupportCasePage from "@/pages/support-case";
import QuestionDetailPage from "@/pages/question-detail";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
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
        <Route path="/community" component={Community} />
        <Route path="/profile" component={ProfilePage} />
        <Route path="/support/cases/:id" component={SupportCasePage} />
        <Route path="/questions/:id" component={QuestionDetailPage} />
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
