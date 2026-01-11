/**
 * PDF Generator - Share2Inspire (Versão Profissional)
 * Usa jsPDF para criar relatórios profissionais de análise de CV
 * Integrado com cv-engine.js híbrido
 */

window.PDF_GENERATOR = {
    /**
     * Gera e descarrega o relatório PDF profissional
     * @param {Object} data - Dados de análise do CV_ENGINE
     */
    generateReport(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // Cores da Marca
        const GOLD = [191, 154, 51]; // #BF9A33
        const DARK = [26, 26, 26];   // #1A1A1A
        const GRAY = [100, 100, 100];
        const LIGHT_GRAY = [240, 240, 240];

        // Margens e Posições
        const MARGIN_X = 20;
        let currentY = 0;
        const LINE_HEIGHT = 5;
        const MAX_WIDTH = 170; // 210 - 2*20

        // Função auxiliar para adicionar texto com quebra de linha
        const addText = (text, x, y, size, style = 'normal', color = DARK, align = 'left') => {
            doc.setFont('helvetica', style);
            doc.setFontSize(size);
            doc.setTextColor(...color);
            const splitText = doc.splitTextToSize(text, MAX_WIDTH);
            doc.text(splitText, x, y, { align: align });
            return y + (splitText.length * LINE_HEIGHT);
        };

        const name = data.personalInfo?.name || 'Candidato';
        const role = data.personalInfo?.role || 'Profissional';

        // --- HEADER (Fundo Escuro) ---
        doc.setFillColor(...DARK);
        doc.rect(0, 0, 210, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(18);
        doc.text('SHARE2INSPIRE', MARGIN_X, 15);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('RELATÓRIO DE ANÁLISE DE CARREIRA POR IA', MARGIN_X, 22);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(name.toUpperCase(), 190, 15, { align: 'right' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(role, 190, 22, { align: 'right' });

        currentY = 40;

        // --- SECÇÃO 1: SCORE DE MATURIDADE ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        currentY = addText('PONTUAÇÃO DE MATURIDADE PROFISSIONAL', MARGIN_X, currentY, 14, 'bold');
        currentY += 5;

        // Caixa do Score
        doc.setDrawColor(...GOLD);
        doc.setLineWidth(0.5);
        doc.roundedRect(MARGIN_X, currentY, 30, 30, 3, 3, 'S');

        doc.setFontSize(28);
        doc.setTextColor(...GOLD);
        doc.text(`${data.maturity.score}`, MARGIN_X + 15, currentY + 18, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(...GRAY);
        doc.text('/ 10', MARGIN_X + 25, currentY + 18);

        // Label e Descrição
        doc.setTextColor(...DARK);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(data.maturity.label.toUpperCase(), MARGIN_X + 40, currentY + 10);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...GRAY);
        const description = `Esta pontuação reflete o nível de prontidão e impacto do seu perfil no mercado atual, baseado na avaliação das suas principais destaques.`;
        doc.text(doc.splitTextToSize(description, 120), MARGIN_X + 40, currentY + 15);

        currentY += 40;

        // --- SECÇÃO 2: ANÁLISE DE COMPETÊNCIAS (Barras) ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        currentY = addText('ANÁLISE DE COMPETÊNCIAS (0-100)', MARGIN_X, currentY, 14, 'bold');
        currentY += 5;

        const comps = [
            { label: 'Otimização ATS', value: data.competencies.ats },
            { label: 'Impacto do Conteúdo', value: data.competencies.impact },
            { label: 'Estrutura Visual', value: data.competencies.structure },
            { label: 'Alinhamento com Mercado', value: data.competencies.market },
            { label: 'Posicionamento Estratégico', value: data.competencies.positioning }
        ];

        comps.forEach(c => {
            if (currentY > 260) {
                doc.addPage();
                currentY = 30;
            }

            doc.setFontSize(9);
            doc.setTextColor(...DARK);
            doc.text(c.label, MARGIN_X, currentY);

            // Progress Bar Background
            doc.setFillColor(...LIGHT_GRAY);
            doc.rect(MARGIN_X + 60, currentY - 3, 100, 4, 'F');

            // Progress Bar Fill
            const barWidth = Math.min(c.value, 100);
            doc.setFillColor(...GOLD);
            doc.rect(MARGIN_X + 60, currentY - 3, barWidth, 4, 'F');

            doc.text(`${c.value}%`, MARGIN_X + 165, currentY);
            currentY += 8;
        });

        currentY += 10;

        // --- SECÇÃO 3: PONTOS FORTES ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        currentY = addText('PONTOS FORTES IDENTIFICADOS', MARGIN_X, currentY, 14, 'bold');
        currentY += 5;

        (data.strengths || []).forEach(s => {
            if (currentY > 260) {
                doc.addPage();
                currentY = 30;
            }

            doc.setFillColor(...GOLD);
            doc.circle(MARGIN_X + 1, currentY - 1, 1, 'F');

            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...DARK);
            doc.text(s.title, MARGIN_X + 5, currentY);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);
            currentY = addText(s.detail, MARGIN_X + 5, currentY + 4, 9, 'normal', GRAY);
            currentY += 3;
        });

        // --- SECÇÃO 4: ANÁLISE PROFUNDA (Nova Página) ---
        doc.addPage();
        currentY = 30;

        doc.setFillColor(...DARK);
        doc.rect(0, 0, 210, 20, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('ANÁLISE PROFUNDA DO PERFIL', MARGIN_X, 13);

        currentY = 40;

        // Sub-secção: Dados Chave
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...GOLD);
        currentY = addText('PRINCIPAIS DESTAQUES DA TRAJETÓRIA', MARGIN_X, currentY, 12, 'bold', GOLD);
        currentY += 2;

        const profile = data.personalInfo || {};
        const keyData = [
            { label: 'Empresas de Destaque', value: (profile.top_companies || []).join(', ') || 'N/A' },
            { label: 'Anos de Experiência', value: profile.total_years_exp ? `${profile.total_years_exp} anos` : 'N/A' },
            { label: 'Última Formação/Certificação', value: profile.last_training_date || 'N/A' },
        ];

        keyData.forEach(item => {
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...DARK);
            doc.text(`${item.label}:`, MARGIN_X, currentY);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(...GRAY);
            doc.text(item.value, MARGIN_X + 50, currentY);
            currentY += 5;
        });

        currentY += 5;

        // Sub-secção: Análise Crítica (Gap de Formação)
        if (profile.critical_analysis) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...GOLD);
            currentY = addText('ANÁLISE CRÍTICA E RISCOS', MARGIN_X, currentY, 12, 'bold', GOLD);
            currentY += 2;

            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(...DARK);
            currentY = addText(profile.critical_analysis, MARGIN_X, currentY, 10, 'italic', DARK);
            currentY += 5;
        }

        // Sub-secção: Idiomas
        if (profile.languages && profile.languages.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...GOLD);
            currentY = addText('IDIOMAS', MARGIN_X, currentY, 12, 'bold', GOLD);
            currentY += 2;

            profile.languages.forEach(lang => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...DARK);
                doc.text(`${lang.name}:`, MARGIN_X, currentY);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...GRAY);
                doc.text(lang.level, MARGIN_X + 50, currentY);
                currentY += 5;
            });
            currentY += 5;
        }

        // Sub-secção: Tópicos Chave
        if (profile.main_key_topics && profile.main_key_topics.length > 0) {
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...GOLD);
            currentY = addText('PRINCIPAIS DESTAQUES PARA EVOLUÇÃO', MARGIN_X, currentY, 12, 'bold', GOLD);
            currentY += 2;

            profile.main_key_topics.forEach(topic => {
                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...DARK);
                doc.text(`• ${topic}`, MARGIN_X, currentY);
                currentY += 5;
            });
            currentY += 5;
        }

        // --- SECÇÃO 5: ROADMAP DE EVOLUÇÃO (Página 3 ou Continuação) ---
        if (currentY > 260) {
            doc.addPage();
            currentY = 30;
        }

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...DARK);
        currentY = addText('ROADMAP DE EVOLUÇÃO E SUGESTÕES', MARGIN_X, currentY, 14, 'bold');
        currentY += 5;

        (data.suggestions || []).forEach((s, index) => {
            if (currentY > 260) {
                doc.addPage();
                currentY = 30;
            }

            doc.setTextColor(...GOLD);
            doc.setFontSize(12);
            doc.text(`${index + 1}. ${s.title}`, MARGIN_X, currentY);

            doc.setTextColor(...DARK);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            currentY = addText(s.context, MARGIN_X, currentY + 5, 10, 'normal', DARK);
            currentY += 5;
        });

        // --- FOOTER (Em todas as páginas) ---
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
            doc.text('Relatório gerado por Share2Inspire AI | www.share2inspire.pt', MARGIN_X, 290);
        }

        // Save the PDF
        const fileName = `Relatorio_CV_${name.replace(/\s+/g, '_')}.pdf`;
        doc.save(fileName);
    }
};
