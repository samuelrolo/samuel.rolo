import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, Router as WouterRouter, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { I18nProvider } from "./contexts/I18nContext";
import { LoginModalProvider } from "./contexts/LoginModalContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";
import CareerBotWidget from "./components/CareerBotWidget";
import Plans from "./pages/Plans";
import MemberArea from "./pages/MemberArea";
import ProfilePage from "./pages/ProfilePage";

function Routes() {
  return (
    <Switch>
      {/* Root → perfil (ProtectedRoute will show login modal if not authenticated) */}
      <Route path="/">
        <Redirect to="/perfil" />
      </Route>
      {/* Keep /auth as redirect for bookmarks/existing links */}
      <Route path="/auth">
        <Redirect to="/perfil" />
      </Route>
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

// Detect base path: in production under /area-cliente/, in dev at root
const basePath = window.location.pathname.startsWith('/area-cliente') ? '/area-cliente' : '';

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <I18nProvider>
          <AuthProvider>
            <LoginModalProvider>
              <TooltipProvider>
                <WouterRouter base={basePath}>
                  <Toaster />
                  <Layout />
                </WouterRouter>
              </TooltipProvider>
            </LoginModalProvider>
          </AuthProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
