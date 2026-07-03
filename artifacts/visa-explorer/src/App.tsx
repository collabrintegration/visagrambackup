import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";

import Layout from "@/components/layout";
import AIChatWidget from "@/components/ai-chat-widget";
import Home from "@/pages/home";
import Explore from "@/pages/explore";
import CountryDetail from "@/pages/country";
import PassportPower from "@/pages/passport";
import VisaDetail from "@/pages/visa";
import Community from "@/pages/community";
import ProfilePage from "@/pages/profile";
import SupportCasePage from "@/pages/support-case";
import QuestionDetailPage from "@/pages/question-detail";
import SignIn from "@/pages/sign-in";
import TermsPage from "@/pages/terms";
import PrivacyPage from "@/pages/privacy";
import GroupsPage from "@/pages/groups";
import GroupChatPage from "@/pages/group-chat";
import TrackerPage from "@/pages/tracker";
import MessagesPage from "@/pages/messages";
import FriendsPage from "@/pages/friends";
import UserPublicProfilePage from "@/pages/user-public-profile";
import NotificationsPage from "@/pages/notifications";

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

function PageTracker() {
  const [location] = useLocation();
  useEffect(() => {
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: location }),
    }).catch(() => {});
  }, [location]);
  return null;
}

function Router() {
  return (
    <Layout>
      <PageTracker />
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
        <Route path="/sign-in" component={SignIn} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/groups" component={GroupsPage} />
        <Route path="/groups/:id" component={GroupChatPage} />
        <Route path="/tracker" component={TrackerPage} />
        <Route path="/visa-guide" component={() => { window.location.replace("/tracker"); return null; }} />
        <Route path="/friends" component={FriendsPage} />
        <Route path="/user/:id" component={UserPublicProfilePage} />
        <Route path="/messages" component={MessagesPage} />
        <Route path="/messages/:userId" component={MessagesPage} />
        <Route path="/notifications" component={NotificationsPage} />
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
          <AIChatWidget />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
