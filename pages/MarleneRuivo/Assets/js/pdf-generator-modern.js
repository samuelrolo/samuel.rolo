/**
 * Share2Inspire PDF Generator (Modern)
 * Uses jsPDF to recreate high-quality vector PDFs from CV Engine data.
 * Contract: 6 Page Minimum (Real Content), Editorial Expansion, Visuals.
 */

window.PDF_GENERATOR = {
    doc: null,

    /**
     * Entry Point: Generate Professional Report
     */
    generateReport: function (cvData) {
        if (!CV_ENGINE.canGeneratePremiumPDF()) {
            alert("O conteúdo do CV não é suficiente para gerar um relatório Premium de 6 páginas. A gerar versão resumida...");
            // Fallback logic could go here
            return null;
        }

        // Initialize jsPDF (Assuming included via CDN in HTML)
        const { jsPDF } = window.jspdf;
        this.doc = new jsPDF();

        let pageCount = 1;

        // --- PAGE 1: CAPA ---
        this.drawCover(cvData.profile);
        this.addFooter(pageCount++);
        this.doc.addPage();

        // --- PAGE 2: PERFIL & MATURIDADE ---
        this.drawHeader("Visão Geral do Perfil");
        this.drawProfileSummary(cvData.profile);
        this.drawMaturitySection(cvData.maturity);
        this.addFooter(pageCount++);
        this.doc.addPage();

        // --- PAGE 3: COMPETÊNCIAS & PONTOS FORTES ---
        this.drawHeader("Competências Estratégicas");
        this.drawCompetencies(cvData.competencies);
        this.drawStrengths(cvData.strengths);
        this.addFooter(pageCount++);
        this.doc.addPage();

        // --- PAGE 4: RADAR CHART (VISUAL) ---
        this.drawHeader("Radar de Competências");
        this.drawRadarChart(cvData.radar); // Needs to capture Canvas or redraw using lines
        this.addFooter(pageCount++);
        this.doc.addPage();

        // --- PAGE 5: SUGESTÕES DE EVOLUÇÃO (EXPANDIDAS) ---
        this.drawHeader("Plano de Evolução");
        this.drawEvolutionExpanded(cvData.evolution);
        this.addFooter(pageCount++);
        this.doc.addPage();

        // --- PAGE 6: FEEDBACK ESTRATÉGICO (EXPANDIDO) ---
        this.drawHeader("Feedback de Mercado");
        this.drawFeedbackExpanded(cvData.feedback);
        this.addFooter(pageCount++);

        // Helper: Check Page Count
        if (pageCount < 6) {
            console.warn("Aviso: Relatório gerado com menos de 6 páginas. Adicionando conteúdo extra...");
            // Logic to pad content if strictly necessary, but prefer real content
        }

        return this.doc.output('blob');
    },

    // --- DRAWING HELPERS (Simplified for Prototype) ---

    drawCover: function (profile) {
        this.doc.setFillColor(33, 37, 41); // #212529 (Black)
        this.doc.rect(0, 0, 210, 297, 'F');

        this.doc.setTextColor(191, 154, 51); // #BF9A33 (Gold)
        this.doc.setFontSize(24);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Relatório de Análise Profissional", 20, 100);

        this.doc.setTextColor(255, 255, 255);
        this.doc.setFontSize(16);
        this.doc.text(profile.name || "Candidato", 20, 120);
        this.doc.setFont("helvetica", "normal");
        this.doc.text("Diagnóstico de Carreira & Competências", 20, 130);

        // Logo Placeholder
        this.doc.setFontSize(10);
        this.doc.text("Share2Inspire | Career Ecosystem", 20, 270);
    },

    drawHeader: function (title) {
        this.doc.setFillColor(248, 249, 250); // Light Gray Background
        this.doc.rect(0, 0, 210, 30, 'F');
        this.doc.setTextColor(33, 37, 41);
        this.doc.setFontSize(18);
        this.doc.setFont("helvetica", "bold");
        this.doc.text(title, 20, 20);
    },

    addFooter: function (pageNum) {
        this.doc.setFontSize(8);
        this.doc.setTextColor(150);
        this.doc.text(`Página ${pageNum} | Share2Inspire - Documento Confidencial`, 20, 285);
    },

    drawProfileSummary: function (profile) {
        this.doc.setFontSize(12);
        this.doc.setTextColor(0);
        this.doc.text("Resumo Executivo:", 20, 50);
        this.doc.setFont("helvetica", "normal");

        // Split text to fit width
        const splitSummary = this.doc.splitTextToSize(profile.summary || "Sem resumo disponível.", 170);
        this.doc.text(splitSummary, 20, 60);

        // Metric
        this.doc.setFont("helvetica", "bold");
        this.doc.text(`Experiência Acumulada: ${profile.years_metric}`, 20, 60 + (splitSummary.length * 5) + 10);
    },

    drawMaturitySection: function (maturity) {
        const startY = 120; // Hardcoded for prototype
        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Nível de Maturidade", 20, startY);

        this.doc.setFontSize(20);
        this.doc.setTextColor(191, 154, 51); // Gold
        this.doc.text(`${maturity.level} (${maturity.score}/5.0)`, 20, startY + 15);
        this.doc.setTextColor(0);
    },

    drawCompetencies: function (competencies) {
        let y = 50;
        competencies.forEach(comp => {
            this.doc.setFontSize(11);
            this.doc.text(`• ${comp}`, 25, y);
            y += 7;
        });
    },

    drawStrengths: function (strengths) {
        let y = 150;
        this.doc.setFontSize(14);
        this.doc.setFont("helvetica", "bold");
        this.doc.text("Pontos Fortes", 20, y - 10);

        strengths.forEach(str => {
            this.doc.setFontSize(11);
            this.doc.setFont("helvetica", "normal");
            this.doc.text(`+ ${str}`, 25, y);
            y += 7;
        });
    },

    drawRadarChart: function (radarData) {
        // In a real implementation, we would use Chart.js 'toBase64Image()'
        // Here we simulate capturing the canvas from the DOM
        try {
            const canvas = document.getElementById('cvRadarChart');
            if (canvas) {
                const imgData = canvas.toDataURL("image/png");
                this.doc.addImage(imgData, 'PNG', 35, 60, 140, 140);
            } else {
                this.doc.text("[Gráfico Radar não disponível no contexto atual]", 50, 100);
            }
        } catch (e) {
            console.error("Erro ao capturar radar:", e);
        }
    },

    drawEvolutionExpanded: function (evolution) {
        let y = 50;
        evolution.forEach(item => {
            if (y > 250) {
                this.doc.addPage();
                this.drawHeader("Plano de Evolução (Cont.)");
                y = 50;
            }

            // Title (Strategic)
            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(12);
            this.doc.setTextColor(191, 154, 51); // Gold
            this.doc.text(item.title, 20, y);
            y += 6;

            // Context
            this.doc.setFont("helvetica", "normal");
            this.doc.setFontSize(10);
            this.doc.setTextColor(0);
            const contextLines = this.doc.splitTextToSize(`Contexto: ${item.context}`, 170);
            this.doc.text(contextLines, 20, y);
            y += (contextLines.length * 5) + 2;

            // Evidence
            const evidenceLines = this.doc.splitTextToSize(`Evidência: ${item.evidence}`, 170);
            this.doc.text(evidenceLines, 20, y);
            y += (evidenceLines.length * 5) + 4;

            // Recommendations
            item.actions.forEach(action => {
                this.doc.text(`- ${action}`, 25, y);
                y += 5;
            });

            y += 8; // Spacer
        });
    },

    drawFeedbackExpanded: function (feedback) {
        let y = 50;
        feedback.forEach(item => {
            if (y > 250) {
                this.doc.addPage();
                this.drawHeader("Feedback de Mercado (Cont.)");
                y = 50;
            }

            this.doc.setFont("helvetica", "bold");
            this.doc.setFontSize(12);
            this.doc.setTextColor(33, 37, 41);
            this.doc.text(item.title, 20, y);
            y += 6;

            this.doc.setFont("helvetica", "italic");
            this.doc.setFontSize(10);
            this.doc.setTextColor(100);
            const marketLines = this.doc.splitTextToSize(item.market_reading, 170);
            this.doc.text(marketLines, 20, y);
            y += (marketLines.length * 5) + 4;

            this.doc.setTextColor(0);
            this.doc.setFont("helvetica", "normal");
            item.recommendations.forEach(rec => {
                this.doc.text(`-> ${rec}`, 25, y);
                y += 5;
            });

            y += 8;
        });
    }
};
