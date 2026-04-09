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
const LinkedInRoasterHome = lazy(() => import("./pages/LinkedInRoasterHome"));
const LinkedInRoasterHomeEN = lazy(() => import("./pages/en/LinkedInRoasterHomeEN"));
const LinkedInRoasterResults = lazy(() => import("./pages/LinkedInRoasterResults"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LandingPageEN = lazy(() => import("./pages/LandingPageEN"));
const ServicosPage = lazy(() => import("./pages/ServicosPage"));
const ServicesPageEN = lazy(() => import("./pages/ServicesPageEN"));
const KnowledgeHubPage = lazy(() => import("./pages/KnowledgeHubPage"));
const KnowledgeHubPageEN = lazy(() => import("./pages/en/KnowledgeHubPageEN"));

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
      '/es/career-intelligence': 'Share2Inspire — Career Intelligence (ES)',
      '/es/career-path': 'Share2Inspire — Career Path (ES)',
      '/es/cv-analyser': 'Share2Inspire — CV Analyser (ES)',
      '/es/linkedin-roaster': 'Share2Inspire — LinkedIn Roaster (ES)',
      '/es/student-pack': 'Share2Inspire — Student Pack (ES)',
      '/es/bundle': 'Share2Inspire — Bundle (ES)',
      '/es/pages/knowledge': 'Share2Inspire — Knowledge Hub (ES)',
      '/es/pages/services': 'Share2Inspire — Services (ES)',
      '/es': 'Share2Inspire (ES)',
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

  // EN LinkedIn Roaster: /en/linkedin-roaster
  if (pathname.startsWith('/en/linkedin-roaster')) {
    return (
      <Router base="/en/linkedin-roaster">
        <Switch>
          <Route path={"/"} component={LinkedInRoasterHomeEN} />
          <Route path={"/results"} component={LinkedInRoasterResults} />
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

  // EN Knowledge Hub: /en/pages/knowledge
  if (pathname.startsWith('/en/pages/knowledge')) {
    return (
      <Router base="/en/pages/knowledge">
        <Switch>
          <Route path="/" component={KnowledgeHubPageEN} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN Services Page: /en/pages/services
  if (pathname.startsWith('/en/pages/services')) {
    return (
      <Router base="/en/pages/services">
        <Switch>
          <Route path="/" component={ServicesPageEN} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // EN Landing Page: /en (exact match only)
  if (pathname === '/en' || pathname === '/en/') {
    return (
      <Router base="/en">
        <Switch>
          <Route path="/" component={LandingPageEN} />
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

  // ─── Spanish Routes (ES) ───
  // ES routes reuse PT Home components; getLang() detects /es/ in pathname
  // Results pages already use t() with ES translations

  // ES Student Pack: /es/student-pack
  if (pathname.startsWith('/es/student-pack')) {
    return (
      <Router base="/es/student-pack">
        <Switch>
          <Route path={"/"} component={StudentPackHome} />
          <Route path={"/results"} component={StudentPackResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES LinkedIn Roaster: /es/linkedin-roaster
  if (pathname.startsWith('/es/linkedin-roaster')) {
    return (
      <Router base="/es/linkedin-roaster">
        <Switch>
          <Route path={"/"} component={LinkedInRoasterHome} />
          <Route path={"/results"} component={LinkedInRoasterResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Bundle: /es/bundle
  if (pathname.startsWith('/es/bundle')) {
    return (
      <Router base="/es/bundle">
        <Switch>
          <Route path={"/"} component={BundleHome} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Career Intelligence: /es/career-intelligence
  if (pathname.startsWith('/es/career-intelligence')) {
    return (
      <Router base="/es/career-intelligence">
        <Switch>
          <Route path={"/"} component={CareerIntelligenceHome} />
          <Route path={"/results"} component={CareerIntelligenceResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Career Path: /es/career-path
  if (pathname.startsWith('/es/career-path')) {
    return (
      <Router base="/es/career-path">
        <Switch>
          <Route path={"/"} component={CareerPathHome} />
          <Route path={"/results"} component={CareerPathResults} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Knowledge Hub: /es/pages/knowledge
  if (pathname.startsWith('/es/pages/knowledge')) {
    return (
      <Router base="/es/pages/knowledge">
        <Switch>
          <Route path="/" component={KnowledgeHubPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Services: /es/pages/services
  if (pathname.startsWith('/es/pages/services')) {
    return (
      <Router base="/es/pages/services">
        <Switch>
          <Route path="/" component={ServicosPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES Landing Page: /es (exact match only)
  if (pathname === '/es' || pathname === '/es/') {
    return (
      <Router base="/es">
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ES CV Analyser: /es/cv-analyser
  if (pathname.startsWith('/es/cv-analyser') || pathname.startsWith('/es')) {
    return (
      <Router base="/es/cv-analyser">
        <Switch>
          <Route path={"/"} component={Home} />
          <Route path={"/results"} component={Results} />
          <Route path={"/test"} component={TestData} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // ─── Portuguese Routes ───

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

  // LinkedIn Roaster PT: /linkedin-roaster
  if (pathname.startsWith('/linkedin-roaster')) {
    return (
      <Router base="/linkedin-roaster">
        <Switch>
          <Route path={"/"} component={LinkedInRoasterHome} />
          <Route path={"/results"} component={LinkedInRoasterResults} />
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

  // Knowledge Hub PT: /conhecimento
  if (pathname.startsWith('/conhecimento')) {
    return (
      <Router base="/conhecimento">
        <Switch>
          <Route path="/" component={KnowledgeHubPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Servicos PT: /servicos
  if (pathname.startsWith('/servicos')) {
    return (
      <Router base="/servicos">
        <Switch>
          <Route path="/" component={ServicosPage} />
          <Route component={NotFound} />
        </Switch>
      </Router>
    );
  }

  // Landing Page PT: / (root)
  if (pathname === '/' || pathname === '') {
    return (
      <Router base="/">
        <Switch>
          <Route path="/" component={LandingPage} />
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
