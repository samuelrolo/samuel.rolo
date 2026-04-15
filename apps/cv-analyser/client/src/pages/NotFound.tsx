import { Button } from "@/components/ui/button";
import { usePageSEO } from "@/lib/seo";
import { pageSeo } from "@/lib/pageSeo";

export default function NotFound() {
  usePageSEO(pageSeo.notFound);

  const handleGoBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }

    window.location.href = "/";
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-4"
      style={{
        background:
          "radial-gradient(circle at top, rgba(201, 169, 97, 0.12), transparent 28%), linear-gradient(180deg, #1a1a2e 0%, #11111f 100%)",
      }}
    >
      <div
        className="w-full max-w-2xl rounded-[28px] border text-center shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.04)",
          borderColor: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow: "0 28px 80px rgba(0, 0, 0, 0.38)",
        }}
      >
        <div className="px-6 py-14 sm:px-10 sm:py-16">
          <div className="mb-5 text-6xl leading-none sm:text-7xl" aria-hidden="true">
            😕
          </div>

          <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white sm:text-5xl">
            Algo correu mal / Something went wrong
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-7 sm:text-base" style={{ color: "rgba(248, 248, 251, 0.8)" }}>
            The page you are trying to reach is not available right now. You can return to the previous page and continue browsing Share2Inspire.
          </p>

          <div className="mt-8 flex justify-center">
            <Button
              onClick={handleGoBack}
              className="rounded-full px-6 py-6 text-sm font-semibold transition-all duration-200"
              style={{
                background: "#c9a961",
                color: "#17141f",
                boxShadow: "0 16px 34px rgba(201, 169, 97, 0.18)",
              }}
            >
              Go back
            </Button>
          </div>

          <p className="mt-7 text-sm" style={{ color: "rgba(248, 248, 251, 0.58)" }}>
            Need help?{" "}
            <a
              href="mailto:hello@share2inspire.pt"
              className="transition-colors duration-200 hover:opacity-80"
              style={{ color: "rgba(248, 248, 251, 0.8)" }}
            >
              hello@share2inspire.pt
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
