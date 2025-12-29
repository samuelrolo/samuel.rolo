/**
 * PDF Generator - Share2Inspire
 * Gera relatórios profissionais baseados nos dados processados pelo CV Engine.
 */

window.PDF_GENERATOR = {
    generateReport(data) {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
            orientation: 'p',
            unit: 'mm',
            format: 'a4'
        });

        // Cores da Marca
        const gold = [191, 154, 51]; // #BF9A33
        const dark = [26, 26, 26];   // #1A1A1A
        const gray = [100, 100, 100];

        // --- PÁGINA 1 ---

        // Cabeçalho Fundo Escuro
        doc.setFillColor(...dark);
        doc.rect(0, 0, 210, 40, 'F');

        // Logo / Título
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.text('SHARE2INSPIRE', 20, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('RELATÓRIO DE ANÁLISE DE CARREIRA (IA)', 20, 28);

        // Info do Candidato (Pode ser genérico se não detetar nome)
        const name = data.personalInfo.name || "Candidato";
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(name.toUpperCase(), 190, 20, { align: 'right' });

        // Bloco de Score Principal
        doc.setTextColor(...dark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('MATURIDADE PROFISSIONAL', 20, 55);

        // Caixa do Score
        doc.setDrawColor(...gold);
        doc.setLineWidth(1);
        doc.roundedRect(20, 60, 40, 40, 5, 5, 'D');

        // Valor do Score
        doc.setFontSize(32);
        doc.setTextColor(...gold);
        doc.text(`${data.maturity.score}`, 40, 85, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(...gray);
        doc.text('/ 10', 48, 85);

        // Label (Especialista, Intermédio...)
        doc.setTextColor(...dark);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text(data.maturity.label.toUpperCase(), 70, 75);

        // Descrição
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...gray);
        const description = "Esta pontuação reflete a robustez do seu perfil com base na análise semântica de impacto, estrutura e competências detetadas.";
        doc.text(description, 70, 85, { maxWidth: 110 });

        // --- Gráfico de Barras (Simulação do Radar) ---
        doc.setTextColor(...dark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('DETALHE DE COMPETÊNCIAS (0-100)', 20, 115);

        let yPos = 125;
        // Mapear os dados do cv-engine para o PDF
        const comps = [
            { label: 'Otimização ATS (Legibilidade)', value: data.competencies.ats },
            { label: 'Impacto & Resultados', value: data.competencies.impact },
            { label: 'Estrutura Visual', value: data.competencies.structure },
            { label: 'Potencial de Mercado', value: data.competencies.market },
            { label: 'Posicionamento Estratégico', value: data.competencies.positioning }
        ];

        comps.forEach(c => {
            doc.setFontSize(9);
            doc.setTextColor(...dark);
            doc.text(c.label, 20, yPos);

            // Fundo da Barra
            doc.setFillColor(240, 240, 240);
            doc.rect(80, yPos - 3, 100, 4, 'F');

            // Preenchimento (Dourado)
            doc.setFillColor(...gold);
            doc.rect(80, yPos - 3, c.value, 4, 'F');

            doc.text(`${c.value}%`, 185, yPos);
            yPos += 10;
        });

        // --- Pontos Fortes ---
        doc.setTextColor(...dark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('PONTOS FORTES DETETADOS', 20, 185);

        yPos = 195;
        if (data.strengths.length > 0) {
            data.strengths.slice(0, 4).forEach(s => {
                doc.setFillColor(...gold);
                doc.circle(22, yPos - 1, 1, 'F');

                doc.setFontSize(10);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(...dark);
                doc.text(s.title, 26, yPos);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(...gray);
                // Quebrar texto longo
                const splitDetail = doc.splitTextToSize(s.detail, 160);
                doc.text(splitDetail, 26, yPos + 5);

                yPos += 15 + (splitDetail.length * 2);
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(...gray);
            doc.text("Não foram detetados pontos fortes específicos suficientes para listar.", 26, yPos);
        }

        // --- Sugestões de Evolução ---
        // Se houver espaço, continua, senão cria nova página
        if (yPos > 250) {
            doc.addPage();
            yPos = 30;
        } else {
            yPos += 10;
        }

        doc.setTextColor(...dark);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SUGESTÕES ESTRATÉGICAS', 20, yPos);
        yPos += 10;

        if (data.suggestions.length > 0) {
            data.suggestions.forEach(s => {
                doc.setFontSize(10);
                doc.setTextColor(...gold); // Título a dourado
                doc.setFont('helvetica', 'bold');
                doc.text(`> ${s.title}`, 20, yPos);

                doc.setFontSize(9);
                doc.setTextColor(...gray);
                doc.setFont('helvetica', 'normal');

                const splitContext = doc.splitTextToSize(s.context, 170);
                doc.text(splitContext, 20, yPos + 5);

                yPos += 10 + (splitContext.length * 4);
            });
        } else {
            doc.setFontSize(10);
            doc.setTextColor(...gray);
            doc.text("O perfil está equilibrado. Recomendamos uma revisão humana para detalhes finos.", 20, yPos);
        }

        // Rodapé
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        const pageHeight = doc.internal.pageSize.height;
        doc.text('Gerado por Share2Inspire AI Engine | www.share2inspire.pt', 105, pageHeight - 10, { align: 'center' });

        // Download
        const safeName = name.replace(/[^a-zA-Z0-9]/g, '_');
        doc.save(`Relatorio_CV_${safeName}.pdf`);
    }
};
