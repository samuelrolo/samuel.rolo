// Internationalisation strings for Results pages
// Used by both Results.tsx and CareerPathResults.tsx

export type Lang = 'pt' | 'en';

export function getLang(): Lang {
  // Check both CV Analyser and Career Path lang keys
  const lang = sessionStorage.getItem('analysisLang') || sessionStorage.getItem('careerPathLang') || 'pt';
  return lang === 'en' ? 'en' : 'pt';
}

export function getCountry(): string {
  return sessionStorage.getItem('analysisCountry') || sessionStorage.getItem('careerPathCountry') || '';
}

export function getRegion(): string {
  return sessionStorage.getItem('analysisRegion') || sessionStorage.getItem('careerPathRegion') || '';
}

type TranslationKey = string;
type Translations = Record<TranslationKey, { pt: string; en: string }>;

const translations: Translations = {
  // ─── Results.tsx (CV Analyser) ───
  'salary_estimate': { pt: 'ESTIMATIVA SALARIAL', en: 'SALARY ESTIMATE' },
  'salary_based_on': { pt: 'Com base no perfil ({seniority}) e mercado português', en: 'Based on profile ({seniority}) and {country} market' },
  'unlock_to_see': { pt: 'Desbloqueia para ver o valor exacto', en: 'Unlock to see exact values' },
  'available_full_report': { pt: 'Disponível no relatório completo', en: 'Available in the full report' },
  'percentile_25': { pt: 'Percentil 25', en: 'Percentile 25' },
  'median': { pt: 'Mediana', en: 'Median' },
  'percentile_75': { pt: 'Percentil 75', en: 'Percentile 75' },
  'top_profiles': { pt: 'Top (Perfis de Topo)', en: 'Top (Senior Profiles)' },
  'per_month_gross': { pt: '/mês (bruto)', en: '/month (gross)' },
  'typical_benefits': { pt: 'Benefícios típicos para {seniority} na indústria:', en: 'Typical benefits for {seniority} in the industry:' },
  'source': { pt: 'Fonte', en: 'Source' },
  'values_reference': { pt: 'Valores de referência para o mercado português. Podem variar consoante a empresa, região e experiência.', en: 'Reference values for the {country} market. May vary by company, region and experience.' },

  // Automation Risk
  'automation_risk': { pt: 'RISCO DE AUTOMAÇÃO', en: 'AUTOMATION RISK' },
  'automation_risk_desc': { pt: 'Probabilidade do teu perfil ser impactado por IA/automação nos próximos 5 anos', en: 'Probability of your profile being impacted by AI/automation in the next 5 years' },
  'risk_level': { pt: 'Nível de Risco', en: 'Risk Level' },
  'recommendations': { pt: 'Recomendações para reduzir o risco:', en: 'Recommendations to reduce risk:' },

  // ATS
  'ats_rejection': { pt: 'TAXA DE REJEIÇÃO ATS', en: 'ATS REJECTION RATE' },
  'ats_desc': { pt: 'Probabilidade de rejeição automática por sistemas ATS', en: 'Probability of automatic rejection by ATS systems' },
  'ats_main_factor': { pt: 'Factor principal:', en: 'Main factor:' },
  'ats_systems': { pt: 'Sistemas ATS testados:', en: 'ATS systems tested:' },
  'quick_fixes': { pt: 'Correcções rápidas:', en: 'Quick fixes:' },

  // Quadrants
  'structure': { pt: 'Estrutura', en: 'Structure' },
  'content': { pt: 'Conteúdo', en: 'Content' },
  'education': { pt: 'Formação', en: 'Education' },
  'experience': { pt: 'Experiência', en: 'Experience' },
  'benchmark': { pt: 'Benchmark', en: 'Benchmark' },
  'strengths': { pt: 'Pontos Fortes', en: 'Strengths' },
  'weaknesses': { pt: 'Pontos a Melhorar', en: 'Areas to Improve' },

  // Normal Curve
  'normal_curve': { pt: 'CURVA NORMAL', en: 'NORMAL CURVE' },
  'your_position': { pt: 'A tua posição', en: 'Your position' },
  'average': { pt: 'Média', en: 'Average' },

  // Recruiter
  'recruiter_perception': { pt: 'PERCEPÇÃO DO RECRUTADOR', en: 'RECRUITER PERCEPTION' },
  'recruiter_desc': { pt: 'Como os recrutadores percecionam o teu perfil nos primeiros 5 segundos', en: 'How recruiters perceive your profile in the first 5 seconds' },
  'attention_map': { pt: 'Mapa de Atenção', en: 'Attention Map' },
  'friction_points': { pt: 'Pontos de Fricção', en: 'Friction Points' },
  'positive_signals': { pt: 'Sinais Positivos', en: 'Positive Signals' },
  'reading_flow': { pt: 'Fluxo de Leitura', en: 'Reading Flow' },

  // Action Plan
  'action_plan': { pt: 'PLANO DE ACÇÃO 30 DIAS', en: '30-DAY ACTION PLAN' },
  'priority': { pt: 'Prioridade', en: 'Priority' },
  'action': { pt: 'Acção', en: 'Action' },
  'impact': { pt: 'Impacto', en: 'Impact' },
  'effort': { pt: 'Esforço', en: 'Effort' },

  // Payment
  'unlock_full_report': { pt: 'Desbloquear Relatório Completo', en: 'Unlock Full Report' },
  'pay_with_mbway': { pt: 'Pagar com MB WAY', en: 'Pay with MB WAY' },
  'pay_with_paypal': { pt: 'Pagar com PayPal', en: 'Pay with PayPal' },
  'pay_with_stripe': { pt: 'Pagar com Cartão', en: 'Pay with Card' },
  'or_use_voucher': { pt: 'Ou usar voucher', en: 'Or use voucher' },
  'voucher_code': { pt: 'Código do voucher', en: 'Voucher code' },
  'apply_voucher': { pt: 'Aplicar', en: 'Apply' },
  'send_email': { pt: 'Enviar por email', en: 'Send by email' },
  'your_email': { pt: 'O teu email', en: 'Your email' },
  'download_pdf': { pt: 'Descarregar PDF', en: 'Download PDF' },

  // Career Path Results
  'career_path_title': { pt: 'CAREER PATH', en: 'CAREER PATH' },
  'generating_career_path': { pt: 'A gerar o teu Career Path...', en: 'Generating your Career Path...' },
  'current_profile': { pt: 'PERFIL ACTUAL', en: 'CURRENT PROFILE' },
  'cv_linkedin_analysis': { pt: 'ANÁLISE CV vs LINKEDIN', en: 'CV vs LINKEDIN ANALYSIS' },
  'next_roles': { pt: 'PRÓXIMOS CARGOS RECOMENDADOS', en: 'RECOMMENDED NEXT ROLES' },
  'development_plan': { pt: 'PLANO DE DESENVOLVIMENTO', en: 'DEVELOPMENT PLAN' },
  'formations': { pt: 'Formações', en: 'Training' },
  'certifications': { pt: 'Certificações', en: 'Certifications' },
  'visibility_exercises': { pt: 'Exercícios de Visibilidade', en: 'Visibility Exercises' },
  'networking_strategy': { pt: 'Estratégia de Networking', en: 'Networking Strategy' },
  'immediate_actions': { pt: 'ACÇÕES IMEDIATAS', en: 'IMMEDIATE ACTIONS' },
  'long_term_vision': { pt: 'VISÃO A 5 ANOS', en: '5-YEAR VISION' },
  'timeline': { pt: 'Timeline', en: 'Timeline' },
  'fit_percentage': { pt: 'Fit', en: 'Fit' },
  'salary_range': { pt: 'Faixa Salarial', en: 'Salary Range' },
  'what_you_have': { pt: 'O que já tens', en: 'What you have' },
  'what_you_need': { pt: 'O que precisas', en: 'What you need' },
  'typical_companies': { pt: 'Empresas típicas', en: 'Typical companies' },

  // General
  'free_analysis': { pt: 'Análise Gratuita', en: 'Free Analysis' },
  'full_report': { pt: 'Relatório Completo', en: 'Full Report' },
  'loading': { pt: 'A carregar...', en: 'Loading...' },
  'error': { pt: 'Erro', en: 'Error' },
  'back': { pt: 'Voltar', en: 'Back' },
  'new_analysis': { pt: 'Nova Análise', en: 'New Analysis' },
  'overall_score': { pt: 'Score Global', en: 'Overall Score' },
  'keywords': { pt: 'Palavras-chave detectadas', en: 'Detected keywords' },
  'perceived_role': { pt: 'Cargo Percepcionado', en: 'Perceived Role' },
  'perceived_seniority': { pt: 'Senioridade', en: 'Seniority' },
};

export function t(key: string, lang?: Lang, replacements?: Record<string, string>): string {
  const l = lang || getLang();
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[l] || entry['pt'] || key;
  if (replacements) {
    for (const [k, v] of Object.entries(replacements)) {
      text = text.replace(`{${k}}`, v);
    }
  }
  return text;
}
