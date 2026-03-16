/*
 * Design: Consultoria de Luxo Silenciosa
 * Footer minimalista com linha dourada, links e copyright
 */
export default function Footer() {
  return (
    <footer className="mt-auto">
      <div className="gold-line" />
      <div className="container py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs font-light text-[#999] tracking-wide">
          &copy; {new Date().getFullYear()} Share2Inspire. Todos os direitos reservados.
        </p>
        <div className="flex items-center gap-6">
          <a
            href="https://share2inspire.pt"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-light text-[#999] hover:text-[#1a1a1a]/60 transition-colors duration-300"
          >
            share2inspire.pt
          </a>
          <a
            href="https://share2inspire.pt/pages/politica-privacidade.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-light text-[#999] hover:text-[#1a1a1a]/60 transition-colors duration-300"
          >
            Privacidade
          </a>
          <a
            href="https://share2inspire.pt/pages/termos.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-light text-[#999] hover:text-[#1a1a1a]/60 transition-colors duration-300"
          >
            Termos
          </a>
        </div>
      </div>
    </footer>
  );
}
