import { Suspense, lazy, useEffect, type ComponentType } from "react";
import { pick } from "./i18n";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Router, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { initAffiliateTracking } from "./lib/affiliate";
import { checkMemberToken } from "./lib/memberAuth";
import { resolveRoute, type PageId } from "@/config/navigation";
import type { Lang } from "./i18n/translations";

const Home = lazy(() => import("./pages/Home"));
const Results = lazy(() => import("./pages/Results"));
const TestData = lazy(() => import("./pages/TestData"));
const CareerPathHome = lazy(() => import("./pages/CareerPathHome"));
const CareerPathResults = lazy(() => import("./pages/CareerPathResults"));
const CareerPathExample = lazy(() => import("./pages/CareerPathExample"));
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
const BlogPage = lazy(() => import("./pages/BlogPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const LegalPage = lazy(() => import("./pages/LegalPage"));

type SupportedLang = Lang;
type LocalizedComponents = Record<SupportedLang, ComponentType>;
type RoutedPageView = {
  component: LocalizedComponents;
  resultsComponent?: ComponentType;
  testComponent?: ComponentType;
  exampleComponent?: ComponentType;
  childComponent?: ComponentType;
  childPath?: string;
};

type RoutablePageId = Exclude<PageId, "area-cliente">;

const sharedAboutPages: LocalizedComponents = {
  pt: AboutPage,
  en: AboutPage,
  es: AboutPage,
};

const sharedContactPages: LocalizedComponents = {
  pt: ContactPage,
  en: ContactPage,
  es: ContactPage,
};

const sharedLegalPages: LocalizedComponents = {
  pt: LegalPage,
  en: LegalPage,
  es: LegalPage,
};

const pageViews: Record<RoutablePageId, RoutedPageView> = {
  home: {
    component: {
      pt: LandingPage,
      en: LandingPageEN,
      es: LandingPage,
    },
  },
  "cv-analyser": {
    component: {
      pt: Home,
      en: HomeEN,
      es: Home,
    },
    resultsComponent: Results,
    testComponent: TestData,
  },
  "career-path": {
    component: {
      pt: CareerPathHome,
      en: CareerPathHomeEN,
      es: CareerPathHome,
    },
    resultsComponent: CareerPathResults,
    exampleComponent: CareerPathExample,
  },
  "career-intelligence": {
    component: {
      pt: CareerIntelligenceHome,
      en: CareerIntelligenceHomeEN,
      es: CareerIntelligenceHome,
    },
    resultsComponent: CareerIntelligenceResults,
  },
  "linkedin-roaster": {
    component: {
      pt: LinkedInRoasterHome,
      en: LinkedInRoasterHomeEN,
      es: LinkedInRoasterHome,
    },
    resultsComponent: LinkedInRoasterResults,
  },
  bundle: {
    component: {
      pt: BundleHome,
      en: BundleHomeEN,
      es: BundleHome,
    },
  },
  estudante: {
    component: {
      pt: StudentPackHome,
      en: StudentPackHomeEN,
      es: StudentPackHome,
    },
    resultsComponent: StudentPackResults,
  },
  conhecimento: {
    component: {
      pt: KnowledgeHubPage,
      en: KnowledgeHubPageEN,
      es: KnowledgeHubPage,
    },
  },
  servicos: {
    component: {
      pt: ServicosPage,
      en: ServicesPageEN,
      es: ServicosPage,
    },
  },
  blog: {
    component: {
      pt: BlogPage,
      en: BlogPage,
      es: BlogPage,
    },
    childComponent: BlogPage,
    childPath: "/:slug",
  },
  sobre: {
    component: sharedAboutPages,
  },
  contactos: {
    component: sharedContactPages,
  },
  "politica-privacidade": {
    component: sharedLegalPages,
  },
  "politica-cookies": {
    component: sharedLegalPages,
  },
  "informacao-legal": {
    component: sharedLegalPages,
  },
  "termos-condicoes": {
    component: sharedLegalPages,
  },
  "tratamento-dados": {
    component: sharedLegalPages,
  },
};

function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500">{pick("A carregar...", "Loading...", "Cargando...")}</p>
      </div>
    </div>
  );
}

function RoutedSwitch({
  base,
  homeComponent,
  resultsComponent,
  testComponent,
  exampleComponent,
  childComponent,
  childPath,
}: {
  base: string;
  homeComponent: ComponentType;
  resultsComponent?: ComponentType;
  testComponent?: ComponentType;
  exampleComponent?: ComponentType;
  childComponent?: ComponentType;
  childPath?: string;
}) {
  return (
    <Router base={base}>
      <Switch>
        <Route path="/" component={homeComponent} />
        {resultsComponent ? <Route path="/results" component={resultsComponent} /> : null}
        {testComponent ? <Route path="/test" component={testComponent} /> : null}
        {exampleComponent ? <Route path="/example" component={exampleComponent} /> : null}
        {childComponent && childPath ? <Route path={childPath} component={childComponent} /> : null}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function NotFoundSwitch() {
  return (
    <Router base="/">
      <Switch>
        <Route path="/" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Router>
  );
}

function AppRouter() {
  const resolvedRoute = resolveRoute(window.location.pathname);

  if (!resolvedRoute) {
    return <NotFoundSwitch />;
  }

  if (resolvedRoute.pageId === "area-cliente") {
    return <NotFoundSwitch />;
  }

  const view = pageViews[resolvedRoute.pageId];

  if (!view) {
    return <NotFoundSwitch />;
  }

  const homeComponent = view.component[resolvedRoute.lang];

  return (
    <RoutedSwitch
      base={resolvedRoute.matchedPath}
      homeComponent={homeComponent}
      resultsComponent={view.resultsComponent}
      testComponent={view.testComponent}
      exampleComponent={view.exampleComponent}
      childComponent={view.childComponent}
      childPath={view.childPath}
    />
  );
}

function App() {
  useEffect(() => {
    initAffiliateTracking();

    const params = new URLSearchParams(window.location.search);
    if (params.get("member_token")) {
      checkMemberToken().catch(() => {
        // silencioso — fluxo normal continua
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
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
