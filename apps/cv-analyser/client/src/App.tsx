import { Suspense, lazy, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initAffiliateTracking } from "./lib/affiliate";
import { checkMemberToken } from "./lib/memberAuth";

// ─── Lazy-loaded page components for code splitting ───
const Home = lazy(() => import("./pages/Home"));
const Results = lazy(() => import("./pages/Results"));
const TestData = lazy(() => import("./pages/TestData"));
const CareerPathHome = lazy(() => import("./pages/CareerPathHome"));
const CareerPathResults = lazy(() => import("./pages/CareerPathResults"));
const HomeEN = lazy(() => import("./pages/en/HomeEN"));
const CareerPathHomeEN = lazy(() => import("./pages/en/CareerPathHomeEN"));
const BundleHome = lazy(() => import("./pages/BundleHome"));
const BundleHomeEN = lazy(() => import("./pages/en/BundleHomeEN"));
const CareerIntelligenceHome = lazy(() => import("./pages/CareerIntelligenceHome"));
const CareerIntelligenceHomeEN = lazy(() => import("./pages/en/CareerIntelligenceHomeEN"));
const CareerIntelligenceResults = lazy(() => import("./pages/CareerIntelligenceResults"));
const StudentPackHome = lazy(() => import("./pages/StudentPackHome"));
const StudentPackHomeEN = lazy(() => import("./pages/en/StudentPackHomeEN"));
const StudentPackResults = lazy(() => import("./pages/StudentPackResults"));

// ─── Loading fallback ───
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">A carregar...</p>
      </div>
    </div>
  );
}

// ─── Dynamic page title based on route ───
function usePageTitle() {
  useEffect(() => {
    const pathname = window.location.pathname;
    const titles: Record<string, string> = {
      '/en/career-intelligence': 'Share2Inspire — Career Intelligence',
      '/en/career-path': 'Share2Inspire — Career Path',
      '/en/cv-analyser': 'Share2Inspire — CV Analyser (EN)',
      '/career-intelligence': 'Share2Inspire — Career Intelligence',
      '/career-path': 'Share2Inspire — Career Path',
      '/cv-analyser': 'Share2Inspire — CV Analyser',
    };

    // Match the most specific path first
    const matchedKey = Object.keys(titles)
      .sort((a, b) => b.length - a.length)
      .find(key => pathname.startsWith(key));

    document.title = matchedKey ? titles[matchedKey] : 'Share2Inspire';
  }, []);
}

// Determine which product to render based on the URL path
function AppRouter() {
  const pathname = window.location.pathname;
  usePageTitle();

  // ─── English International Routes ───

  // EN Student Pack: /en/student-pack
  if (pathname.startsWith('/en/student-pack')) {
    return (
      <Router base="/en/student-pack">
        <Switch>
          <Route path={"/"} component={StudentPackHomeEN} />
          <Route path={"/results"} component={StudentPackResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN Bundle: /en/bundle
  if (pathname.startsWith('/en/bundle')) {
    return (
      <Router base="/en/bundle">
        <Switch>
          <Route path={"/"} component={BundleHomeEN} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN Career Intelligence: /en/career-intelligence
  if (pathname.startsWith('/en/career-intelligence')) {
    return (
      <Router base="/en/career-intelligence">
        <Switch>
          <Route path={"/"} component={CareerIntelligenceHomeEN} />
          <Route path={"/results"} component={CareerIntelligenceResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN Career Path: /en/career-path and /en/career-path/results
  if (pathname.startsWith('/en/career-path')) {
    return (
      <Router base="/en/career-path">
        <Switch>
          <Route path={"/"} component={CareerPathHomeEN} />
          <Route path={"/results"} component={CareerPathResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN CV Analyser: /en/cv-analyser and /en/cv-analyser/results
  if (pathname.startsWith('/en/cv-analyser') || pathname.startsWith('/en')) {
    return (
      <Router base="/en/cv-analyser">
        <Switch>
          <Route path={"/"} component={HomeEN} />
          <Route path={"/results"} component={Results} />
          <Route path={"/test"} component={TestData} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ─── Portuguese Routes (unchanged) ───

  // Student Pack PT: /estudante
  if (pathname.startsWith('/estudante')) {
    return (
      <Router base="/estudante">
        <Switch>
          <Route path={"/"} component={StudentPackHome} />
          <Route path={"/results"} component={StudentPackResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Bundle PT: /bundle
  if (pathname.startsWith('/bundle')) {
    return (
      <Router base="/bundle">
        <Switch>
          <Route path={"/"} component={BundleHome} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Career Intelligence PT: /career-intelligence
  if (pathname.startsWith('/career-intelligence')) {
    return (
      <Router base="/career-intelligence">
        <Switch>
          <Route path={"/"} component={CareerIntelligenceHome} />
          <Route path={"/results"} component={CareerIntelligenceResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Career Path product: /career-path and /career-path/results
  if (pathname.startsWith('/career-path')) {
    return (
      <Router base="/career-path">
        <Switch>
          <Route path={"/"} component={CareerPathHome} />
          <Route path={"/results"} component={CareerPathResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // CV Analyser product: /cv-analyser (default)
  return (
    <Router base="/cv-analyser">
      <Switch>
        <Route path={"/"} component={Home} />
        <Route path={"/results"} component={Results} />
        <Route path={"/test"} component={TestData} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function App() {
  useEffect(() => {
    initAffiliateTracking();
    // Verificar token de membro na URL (subscritor do S2I Career Advisor)
    // Se válido, define isPaid e careerPathPaid no sessionStorage automaticamente
    const params = new URLSearchParams(window.location.search);
    if (params.get('member_token')) {
      checkMemberToken().catch(() => {/* silencioso — fluxo normal continua */});
    }
  }, []);
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<PageLoader />}>
            <AppRouter />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
