/*
 * Design: Consultoria de Luxo Silenciosa
 * Home page com hero, benefícios e CTA para planos
 * Fundo escuro, dourado contido, tipografia Poppins Light/SemiBold
 */
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'wouter';
import { ArrowRight, FileText, BarChart3, Route, Linkedin, Bot, BookOpen, Target, DollarSign, ScanSearch, PenTool } from 'lucide-react';
import { motion } from 'framer-motion';

const HERO_BG = 'https://d2xsxph8kpxj0f.cloudfront.net/105354394/92yTmUfG3DeUMDKSZxzXKb/s2i-hero-bg-KXgoYAkGU9qo3SW9GMJ5qr.webp';

const tools = [
  { icon: FileText, key: 'cvMaker' },
  { icon: BarChart3, key: 'cvAnalyzer' },
  { icon: Route, key: 'careerPath' },
  { icon: Linkedin, key: 'linkedinRoster' },
  { icon: Bot, key: 'careerBot' },
  { icon: BookOpen, key: 'ebooks', label: 'E-books' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6 },
  }),
};

export default function Home() {
  const { t, lang } = useI18n();
  const { user, hasActiveSubscription, profile } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${HERO_BG})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FAFAF9]/70 via-[#FAFAF9]/50 to-[#FAFAF9]" />

        <div className="relative container text-center max-w-3xl mx-auto px-4">
          {user && hasActiveSubscription() ? (
            <motion.div initial="hidden" animate="visible" className="space-y-6">
              <motion.p variants={fadeUp} custom={0} className="text-gold text-sm font-light tracking-[0.2em] uppercase">
                {t('member.welcome')}
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-5xl font-semibold text-[#1a1a1a] leading-tight">
                {profile?.first_name ? t('home.heroGreeting').replace('{name}', profile.first_name) : t('member.welcome')}
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-[#666] font-light text-lg max-w-lg mx-auto">
                {t('home.heroWelcomeDesc')}
              </motion.p>
              <motion.div variants={fadeUp} custom={3}>
                <Link
                  href="/membros"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold text-[#1a1a1a] font-medium rounded hover:bg-gold-light transition-all duration-300"
                >
                  {t('nav.member')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div initial="hidden" animate="visible" className="space-y-6">
              <motion.p variants={fadeUp} custom={0} className="text-gold text-sm font-light tracking-[0.2em] uppercase">
                {t('home.clientArea')}
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="text-4xl md:text-6xl font-semibold text-[#1a1a1a] leading-tight">
                {t('home.heroTitle1')}<br />
                <span className="text-gold">{t('home.heroTitle2')}</span> {t('home.heroTitle3')}
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="text-[#666] font-light text-lg max-w-lg mx-auto">
                {t('home.heroDesc')}
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/planos"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold text-[#1a1a1a] font-medium rounded hover:bg-gold-light transition-all duration-300"
                >
                  {t('home.heroCta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {!user && (
                  <Link
                    href="/auth"
                    className="inline-flex items-center gap-2 px-8 py-3.5 border border-[#bbb] text-[#333] font-light rounded hover:border-white/40 hover:text-[#1a1a1a] transition-all duration-300"
                  >
                    {t('nav.login')}
                  </Link>
                )}
              </motion.div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Tools Grid */}
      <section className="py-24 bg-[#FAFAF9]">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-gold text-sm font-light tracking-[0.2em] uppercase mb-4">
              {t('home.toolsLabel')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-semibold text-[#1a1a1a]">
              {t('home.toolsTitle')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {tools.map((tool, i) => (
              <motion.div
                key={tool.key}
                variants={fadeUp}
                custom={i}
                className="group p-6 md:p-8 border border-[#e5e5e5] rounded hover:border-gold/20 hover:bg-white/[0.02] transition-all duration-500"
              >
                <tool.icon className="w-6 h-6 text-gold/60 group-hover:text-gold transition-colors duration-300 mb-4" />
                <h3 className="text-[#1a1a1a] font-medium text-sm mb-1">
                  {tool.label || t(`member.${tool.key}`)}
                </h3>
                <p className="text-[#999] font-light text-xs leading-relaxed">
                  {t(`member.${tool.key}Desc`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-24 bg-[#F5F5F4]">
        <div className="container max-w-5xl mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="text-center mb-16"
          >
            <motion.p variants={fadeUp} custom={0} className="text-gold text-sm font-light tracking-[0.2em] uppercase mb-4">
              {t('home.diffTitle')}
            </motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl md:text-4xl font-semibold text-[#1a1a1a]">
              {t('home.diffSubtitle')}
            </motion.h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-50px' }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
          >
            {[
              { icon: Target, titleKey: 'home.diff1Title', descKey: 'home.diff1Desc', accent: 'from-[#BF9A33]/20 to-[#BF9A33]/5' },
              { icon: DollarSign, titleKey: 'home.diff2Title', descKey: 'home.diff2Desc', accent: 'from-[#0a5c2e]/15 to-[#0a5c2e]/5' },
              { icon: ScanSearch, titleKey: 'home.diff3Title', descKey: 'home.diff3Desc', accent: 'from-[#003d8f]/15 to-[#003d8f]/5' },
              { icon: PenTool, titleKey: 'home.diff4Title', descKey: 'home.diff4Desc', accent: 'from-[#7c3aed]/15 to-[#7c3aed]/5' },
            ].map((diff, i) => (
              <motion.div
                key={diff.titleKey}
                variants={fadeUp}
                custom={i}
                className="p-8 border border-[#e5e5e5] rounded bg-white hover:border-gold/25 transition-all duration-500"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${diff.accent} flex items-center justify-center mb-5`}>
                  <diff.icon className="w-5 h-5 text-gold/80" />
                </div>
                <h3 className="text-[#1a1a1a] font-semibold text-base mb-2">
                  {t(diff.titleKey)}
                </h3>
                <p className="text-[#777] font-light text-sm leading-relaxed">
                  {t(diff.descKey)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {!user || !hasActiveSubscription() ? (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center"
            >
              <motion.div variants={fadeUp} custom={0}>
                <Link
                  href="/planos"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold text-[#1a1a1a] font-medium rounded hover:bg-gold-light transition-all duration-300"
                >
                  {t('home.diffCta')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </motion.div>
          ) : null}
        </div>
      </section>

      {/* CTA */}
      {!user || !hasActiveSubscription() ? (
        <section className="py-20 bg-[#F5F5F4]">
          <div className="container max-w-2xl mx-auto px-4 text-center">
            <div className="gold-line mb-12" />
            <p className="text-gold text-sm font-light tracking-[0.2em] uppercase mb-4">
              {t('home.ctaLabel')}
            </p>
            <h2 className="text-2xl md:text-3xl font-semibold text-[#1a1a1a] mb-4">
              {t('home.ctaTitle')}
            </h2>
            <p className="text-[#888] font-light mb-8">
              {t('home.ctaDesc')}
            </p>
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gold text-[#1a1a1a] font-medium rounded hover:bg-gold-light transition-all duration-300"
            >
              {t('sub.subscribe')}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="gold-line mt-12" />
          </div>
        </section>
      ) : null}
    </div>
  );
}
