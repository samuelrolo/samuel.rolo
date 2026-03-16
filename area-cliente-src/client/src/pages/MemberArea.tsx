/*
 * Design: Consultoria de Luxo Silenciosa
 * Área de Membro com ferramentas, conteúdos exclusivos e estado da subscrição
 * Fundo escuro, cards com border subtil, dourado contido
 */
import { useState, useEffect, useMemo } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, type MemberContent } from '@/lib/supabase';
import {
  FileText, BarChart3, Route, Linkedin, Bot, BookOpen,
  ExternalLink, Search, Clock, ArrowRight
} from 'lucide-react';

const toolLinks = [
  {
    key: 'cvMaker',
    icon: FileText,
    url: 'https://share2inspire.pt/cv-builder/',
    color: 'from-gold/20 to-gold/5',
  },
  {
    key: 'cvAnalyzer',
    icon: BarChart3,
    url: 'https://share2inspire.pt/cv-analyzer/',
    color: 'from-blue-500/15 to-blue-500/5',
  },
  {
    key: 'careerPath',
    icon: Route,
    url: 'https://share2inspire.pt/career-path/',
    color: 'from-emerald-500/15 to-emerald-500/5',
  },
  {
    key: 'linkedinRoster',
    icon: Linkedin,
    url: 'https://share2inspire.pt/linkedin-roster/',
    color: 'from-sky-500/15 to-sky-500/5',
  },
  {
    key: 'careerBot',
    icon: Bot,
    url: 'https://share2inspire.pt/career-bot/',
    color: 'from-purple-500/15 to-purple-500/5',
  },
];

const contentTypes = ['all', 'ebook', 'article', 'template', 'video'] as const;

export default function MemberArea() {
  const { t } = useI18n();
  const { profile, subscription } = useAuth();
  const [content, setContent] = useState<MemberContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase
        .from('member_content')
        .select('*')
        .order('created_at', { ascending: false });
      setContent(data || []);
      setLoading(false);
    }
    fetchContent();
  }, []);

  const filtered = useMemo(() => {
    let items = content;
    if (filter !== 'all') items = items.filter(c => c.type === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(c =>
        c.title.toLowerCase().includes(q) || c.description.toLowerCase().includes(q)
      );
    }
    return items;
  }, [content, filter, search]);

  const daysLeft = subscription
    ? Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const filterLabels: Record<string, string> = {
    all: t('member.allTypes'),
    ebook: t('member.ebooks'),
    article: t('member.articles'),
    template: t('member.templates'),
    video: t('member.videos'),
  };

  return (
    <div className="min-h-screen pt-24 pb-20">
      <div className="container max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
          <div>
            <p className="text-gold text-xs font-light tracking-[0.15em] uppercase mb-2">{t('member.title')}</p>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a]">
              {profile?.first_name ? `${t('member.welcome')}, ${profile.first_name}.` : t('member.welcome')}
            </h1>
          </div>
          {subscription && (
            <div className="flex items-center gap-3 text-xs text-[#999] font-light">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('member.planExpires')} {new Date(subscription.end_date).toLocaleDateString('pt-PT')}</span>
              <span className="px-2 py-0.5 bg-gold/10 border border-gold/20 rounded text-gold text-[10px] font-medium">
                {daysLeft} {t('member.daysLeft')}
              </span>
            </div>
          )}
        </div>

        {/* Tools */}
        <section className="mb-16">
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.tools')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">{t('member.toolsDesc')}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {toolLinks.map((tool) => (
              <a
                key={tool.key}
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-4 p-5 border border-[#e5e5e5] rounded hover:border-gold/20 transition-all duration-500"
              >
                <div className={`w-10 h-10 rounded flex items-center justify-center bg-gradient-to-br ${tool.color}`}>
                  <tool.icon className="w-4.5 h-4.5 text-[#333] group-hover:text-[#1a1a1a] transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors">
                    {t(`member.${tool.key}`)}
                  </h3>
                  <p className="text-[11px] text-[#999] font-light truncate">
                    {t(`member.${tool.key}Desc`)}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-[#ccc] group-hover:text-gold/50 transition-colors shrink-0" />
              </a>
            ))}
          </div>
        </section>

        {/* Content */}
        <section>
          <h2 className="text-sm font-medium text-[#1a1a1a] mb-1">{t('member.content')}</h2>
          <p className="text-xs text-[#999] font-light mb-6">{t('member.contentDesc')}</p>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              {contentTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-3 py-1.5 text-xs rounded transition-all duration-300 ${
                    filter === type
                      ? 'bg-gold/10 border border-gold/20 text-gold font-medium'
                      : 'border border-[#e5e5e5] text-[#888] hover:text-[#1a1a1a]/60 hover:border-[#ddd]'
                  }`}
                >
                  {filterLabels[type]}
                </button>
              ))}
            </div>
            <div className="relative sm:ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#aaa]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('member.search')}
                className="pl-8 pr-3 py-2 bg-[#f7f7f6] border border-[#e5e5e5] rounded text-xs text-[#1a1a1a] placeholder-[#aaa] focus:border-gold/30 focus:outline-none transition-colors w-56"
              />
            </div>
          </div>

          {/* Content Grid */}
          {loading ? (
            <div className="py-20 text-center">
              <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center">
              <BookOpen className="w-8 h-8 text-[#ccc] mx-auto mb-3" />
              <p className="text-sm text-[#999] font-light">{t('member.noContent')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((item) => (
                <a
                  key={item.id}
                  href={item.content_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group border border-[#e5e5e5] rounded overflow-hidden hover:border-gold/20 transition-all duration-500"
                >
                  {item.thumbnail_url && (
                    <div className="aspect-[16/9] bg-white/[0.02] overflow-hidden">
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-[#f5f5f4] border border-[#e5e5e5] rounded text-[10px] text-[#999] uppercase tracking-wider">
                        {item.type}
                      </span>
                    </div>
                    <h3 className="text-sm font-medium text-[#1a1a1a] group-hover:text-gold transition-colors mb-1">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-[#999] font-light line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                    <div className="mt-3 flex items-center gap-1 text-[11px] text-gold/50 group-hover:text-gold transition-colors">
                      <span>Aceder</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
