/**
 * PDF Generator Modern - Share2Inspire
 * Generates professional PDF reports from CV analysis data
 */

window.PDF_GENERATOR = {
    // Brand colors
    colors: {
        gold: '#BF9A33',
        darkBg: '#1A1A1A',
        lightBg: '#F8F9FA',
        text: '#333333',
        muted: '#666666'
    },

    /**
     * Generate PDF report from CV Engine data
     * @param {Object} data - CV_ENGINE.data object
     * @returns {Blob} PDF file blob
     */
    generateReport(data) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = 210;
            const margin = 20;
            let y = 20;

            // Header
            doc.setFillColor(26, 26, 26);
            doc.rect(0, 0, pageWidth, 45, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('Relatório de Análise de CV', margin, 25);

            doc.setFontSize(12);
            doc.setTextColor(191, 154, 51);
            doc.text('Share2Inspire | Análise Profissional', margin, 35);

            y = 60;

            // Maturity Score Section
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Nível de Maturidade', margin, y);

            y += 10;
            doc.setFontSize(36);
            doc.setTextColor(191, 154, 51);
            doc.text(data.maturity.score.toFixed(1), margin, y + 10);

            doc.setFontSize(14);
            doc.setTextColor(102, 102, 102);
            doc.text(`/ 5.0 - ${data.maturity.label}`, margin + 25, y + 10);

            y += 30;

            // Competencies Section
            doc.setTextColor(51, 51, 51);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('Competências Principais', margin, y);

            y += 8;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            if (data.skills && data.skills.length > 0) {
                data.skills.forEach((skill, i) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.setFillColor(248, 249, 250);
                    doc.roundedRect(margin + (i % 3) * 55, y, 50, 6, 1, 1, 'F');
                    doc.setTextColor(51, 51, 51);
                    const skillText = skill.length > 18 ? skill.substring(0, 17) + '...' : skill;
                    doc.text(skillText, margin + (i % 3) * 55 + 2, y + 4);
                    if ((i + 1) % 3 === 0) y += 8;
                });
            }

            y += 20;

            // Strengths Section
            if (data.strengths && data.strengths.length > 0) {
                doc.setTextColor(51, 51, 51);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Pontos Fortes', margin, y);

                y += 8;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                data.strengths.forEach(strength => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.setTextColor(191, 154, 51);
                    doc.text('✓', margin, y);
                    doc.setTextColor(51, 51, 51);
                    const lines = doc.splitTextToSize(strength, pageWidth - margin * 2 - 10);
                    doc.text(lines, margin + 8, y);
                    y += lines.length * 5 + 3;
                });
            }

            y += 10;

            // Suggestions Section
            if (data.suggestions && data.suggestions.length > 0) {
                if (y > 240) {
                    doc.addPage();
                    y = 20;
                }

                doc.setTextColor(51, 51, 51);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('Sugestões de Evolução', margin, y);

                y += 8;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                data.suggestions.forEach((suggestion, i) => {
                    if (y > 270) {
                        doc.addPage();
                        y = 20;
                    }
                    doc.setTextColor(191, 154, 51);
                    doc.text(`${i + 1}.`, margin, y);
                    doc.setTextColor(51, 51, 51);
                    const lines = doc.splitTextToSize(suggestion, pageWidth - margin * 2 - 10);
                    doc.text(lines, margin + 8, y);
                    y += lines.length * 5 + 3;
                });
            }

            // Footer on last page
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFillColor(26, 26, 26);
                doc.rect(0, 287, pageWidth, 10, 'F');
                doc.setTextColor(102, 102, 102);
                doc.setFontSize(8);
                doc.text('© 2026 Share2Inspire | share2inspire.pt | Análise gerada automaticamente', pageWidth / 2, 293, { align: 'center' });
            }

            return doc.output('blob');

        } catch (error) {
            console.error('[PDF_GENERATOR] Error generating report:', error);
            return null;
        }
    }
};
