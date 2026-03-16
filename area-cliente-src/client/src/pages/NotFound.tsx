/*
 * Design: Consultoria de Luxo Silenciosa
 * Página 404 com estilo escuro e dourado
 */
import { useLocation } from 'wouter';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9]">
      <div className="text-center px-4">
        <p className="text-gold text-xs font-light tracking-[0.2em] uppercase mb-4">Erro</p>
        <h1 className="text-7xl md:text-8xl font-semibold text-[#1a1a1a] mb-4">404</h1>
        <p className="text-[#888] font-light mb-8 max-w-sm mx-auto">
          A página que procuras não existe ou foi movida.
        </p>
        <button
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-[#1a1a1a] text-sm font-medium rounded hover:bg-gold-light transition-all duration-300"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao início
        </button>
      </div>
    </div>
  );
}
