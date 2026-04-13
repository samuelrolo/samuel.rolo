import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter, Redirect, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import CareerBotWidget from "./components/CareerBotWidget";
import Home from "./pages/Home";
import Plans from "./pages/Plans";
import MemberArea from "./pages/MemberArea";
import ProfilePage from "./pages/ProfilePage";
import ClientAreaLanding from "./pages/ClientAreaLanding";

function RootRoute() {
  const { user, loading, hasActiveSubscription } = useAuth();
  const [, navigate] = useLocation();
  const shouldRedirectToMembers = !loading && Boolean(user) && hasActiveSubscription();

  useEffect(() => {
    if (shouldRedirectToMembers) {
      navigate("/membros");
    }
  }, [navigate, shouldRedirectToMembers]);

  if (shouldRedirectToMembers) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-gold animate-spin" />
      </div>
    );
  }

  return <Home />;
}

function Routes() {
  return (
    <Switch>
      <Route path="" component={RootRoute} />
      <Route path="/" component={RootRoute} />
      <Route path="/sobre" component={ClientAreaLanding} />
      <Route path="/contactos" component={ClientAreaLanding} />
      <Route path="/planos" component={Plans} />
      <Route path="/perfil">
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      </Route>
      <Route path="/membros">
        <ProtectedRoute>
          <MemberArea />
        </ProtectedRoute>
      </Route>
      {/* Legacy redirects */}
      <Route path="/membro">
        <Redirect to="/membros" />
      </Route>
      <Route path="/dashboard">
        <Redirect to="/membros" />
      </Route>
      <Route path="/vagas">
        <Redirect to="/membros" />
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Layout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
      <Header />
      <main className="flex-1">
        <Routes />
      </main>
      <Footer />
      <CareerBotWidget />
    </div>
  );
}

const rawBasePath = (import.meta.env.BASE_URL || "/").replace(/\/$/, "");
const basePath = rawBasePath === "/" ? "" : rawBasePath;

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={basePath}>
                <LoginModalProvider>
                  <Toaster />
                  <Layout />
                </LoginModalProvider>
              </WouterRouter>
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
