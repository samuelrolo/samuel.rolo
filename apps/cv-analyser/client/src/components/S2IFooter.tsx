/**
 * S2IFooter — Matches the Share2Inspire landing page footer exactly.
 * Desktop: 5-column row (logo 33% + 4x 16.67%)
 * Mobile (<768px): 2-column grid, logo full-width on top
 */
export default function S2IFooter() {
  const linkStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)',
    textDecoration: 'none', marginBottom: '10px', transition: 'color .3s',
  };
  const headingStyle: React.CSSProperties = {
    fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px',
    color: '#C9A961', fontWeight: 600, marginBottom: '20px',
  };

  return (
    <>
      <style>{`
        .s2i-footer-grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 767px) {
          .s2i-footer-grid {
            grid-template-columns: 1fr 1fr;
            gap: 32px 20px;
          }
          .s2i-footer-logo {
            grid-column: 1 / -1;
          }
        }
        @media (max-width: 400px) {
          .s2i-footer-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
      <footer style={{ background: '#1A1A1A', color: '#fff', padding: '60px 0 30px', marginTop: 0, width: '100%' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '0 24px', boxSizing: 'border-box' }}>
          <div className="s2i-footer-grid">
            {/* Logo */}
            <div className="s2i-footer-logo">
              <img loading="lazy" src="/images/logo-sem-fundo.png" alt="Share2Inspire"
                style={{ height: '200px', width: 'auto', marginBottom: '16px' }} />
            </div>
            {/* Navegação */}
            <div>
              <h5 style={headingStyle}>Navegação</h5>
              <a href="/" style={linkStyle}>Início</a>
              <a href="/sobre" style={linkStyle}>Sobre</a>
              <a href="/servicos" style={linkStyle}>Serviços</a>
              <a href="/conhecimento" style={{ ...linkStyle, marginBottom: 0 }}>Knowledge Hub</a>
            </div>
            {/* Ferramentas */}
            <div>
              <h5 style={headingStyle}>Ferramentas</h5>
              <a href="/cv-analyser" style={linkStyle}>CV Analyser</a>
              <a href="/linkedin-roaster" style={linkStyle}>LinkedIn Roaster</a>
              <a href="/career-path" style={linkStyle}>Career Path</a>
              <a href="/career-intelligence" style={{ ...linkStyle, marginBottom: 0 }}>Career Intelligence</a>
            </div>
            {/* Legal */}
            <div>
              <h5 style={headingStyle}>Legal</h5>
              <a href="/politica-privacidade" style={linkStyle}>Privacidade</a>
              <a href="/politica-cookies" style={linkStyle}>Cookies</a>
              <a href="/informacao-legal" style={linkStyle}>Informação Legal</a>
              <a href="/termos-condicoes" style={linkStyle}>Termos e Condições</a>
              <a href="/tratamento-dados" style={{ ...linkStyle, marginBottom: 0 }}>Tratamento de Dados</a>
            </div>
            {/* Contacto */}
            <div>
              <h5 style={headingStyle}>Contacto</h5>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', marginBottom: '15px', wordBreak: 'break-word' }}>
                <span style={{ color: '#C9A961', marginRight: '8px' }}>✉</span>geral@share2inspire.pt
              </p>
              <div style={{ display: 'flex', gap: '12px' }}>
                <a href="https://www.linkedin.com/company/107046213" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#C9A961', fontSize: '1.1rem', transition: 'color .3s' }} aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                </a>
                <a href="https://www.instagram.com/share2inspire_/" target="_blank" rel="noopener noreferrer"
                  style={{ color: '#C9A961', fontSize: '1.1rem', transition: 'color .3s' }} aria-label="Instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>
          {/* Copyright */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: '40px', paddingTop: '25px', textAlign: 'center' }}>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
              © 2026 Share2Inspire | Samuel Rolo. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
