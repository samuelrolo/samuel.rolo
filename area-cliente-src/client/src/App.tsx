import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import CareerBotWidget from "./components/CareerBotWidget";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Plans from "./pages/Plans";
import MemberArea from "./pages/MemberArea";

function Routes() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/planos" component={Plans} />
      <Route path="/perfil">
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </Route>
      <Route path="/membros">
        {/* requireSubscription removido: MemberArea gere internamente o routing
            entre UpgradePage (sem subscrição) e dashboard completo (com subscrição) */}
        <ProtectedRoute>
          <MemberArea />
        </ProtectedRoute>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Layout() {
  const [location] = useLocation();
  const isAuthPage = location === '/auth';

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF9]">
      {!isAuthPage && <Header />}
      <main className="flex-1">
        <Routes />
      </main>
      {!isAuthPage && <Footer />}
      <CareerBotWidget />
    </div>
  );
}

// Detect base path: in production under /area-cliente/, in dev at root
const basePath = window.location.pathname.startsWith('/area-cliente') ? '/area-cliente' : '';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <I18nProvider>
          <AuthProvider>
            <TooltipProvider>
              <WouterRouter base={basePath}>
                <Toaster />
                <Layout />
              </WouterRouter>
            </TooltipProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
