/**
 * Report Generator
 * Generates a professional HTML report based on CV analysis data.
 */

const ReportGenerator = {

    generateHTML: function (report) {
        const profile = report.candidate_profile || {};
        const summary = report.executive_summary || {};
        const verdict = report.final_verdict || {};
        const improvements = report.improvement_areas || [];

        // Scores
        const ats = report.ats_compatibility?.score || 0;
        const impact = report.content_analysis?.impact_score || 0;
        const structure = report.structure_design?.score || 0;
        const market = summary.market_fit_score || 0;
        const readiness = verdict.readiness_score || 0;

        // Current date
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const reportDate = new Date().toLocaleDateString('pt-PT', dateOptions);

        // Chart Data (5-axis)
        const chartScript = `
            const ctx = document.getElementById('skillsRadar').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: [
                        'Compatibilidade ATS', 
                        'Impacto do Conteúdo', 
                        'Estrutura & Design', 
                        'Fit de Mercado', 
                        'Prontidão'
                    ],
                    datasets: [{
                        label: 'Pontuação',
                        data: [${ats}, ${impact}, ${structure}, ${market}, ${readiness}],
                        backgroundColor: 'rgba(191, 154, 51, 0.2)',
                        borderColor: '#BF9A33',
                        pointBackgroundColor: '#BF9A33',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#BF9A33',
                        borderWidth: 2,
                        pointRadius: 4
                    }]
                },
                options: {
                    scales: {
                        r: {
                            angleLines: { color: '#eee' },
                            grid: { color: '#eee' },
                            pointLabels: {
                                font: { size: 12, family: 'Montserrat', weight: '600' },
                                color: '#1A1A1A'
                            },
                            suggestedMin: 0,
                            suggestedMax: 100,
                            ticks: { display: false, stepSize: 20 }
                        }
                    },
                    plugins: { legend: { display: false } },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        `;

        // HTML Template
        return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise - ${profile.detected_name || 'Candidato'}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --color-deep-blue: #1A1A1A; /* Black/Dark Grey */
            --color-light-blue: #333333;
            --color-gold: #BF9A33;
            --color-grey-bg: #F9F9F9;
            --color-text-dark: #212529;
            --color-text-muted: #6c757d;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Montserrat', sans-serif;
            background-color: #fff;
            color: var(--color-text-dark);
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 40px;
            background: white;
        }
        header {
            border-bottom: 2px solid var(--color-gold);
            padding-bottom: 20px; margin-bottom: 40px;
            display: flex; justify-content: space-between; align-items: flex-end;
        }
        .candidate-info h1 {
            font-family: 'Playfair Display', serif;
            font-size: 26px; color: var(--color-deep-blue);
            margin-bottom: 5px;
        }
        .candidate-info h2 {
            font-size: 14px; text-transform: uppercase;
            letter-spacing: 1px; color: var(--color-gold);
            font-weight: 600; margin-bottom: 5px;
        }
        .meta-tags {
            font-size: 11px; color: var(--color-text-muted);
            display: flex; gap: 15px; text-transform: uppercase;
        }
        .logo-box { text-align: right; }
        .logo-text { font-weight: 800; font-size: 22px; color: var(--color-deep-blue); }
        .logo-text span { color: var(--color-gold); }
        .report-date { font-size: 10px; color: #999; margin-top: 5px; }

        section { margin-bottom: 35px; }
        .section-title {
            font-size: 15px; font-weight: 700; text-transform: uppercase;
            color: var(--color-deep-blue); letter-spacing: 0.5px;
            border-left: 4px solid var(--color-gold);
            padding-left: 10px; margin-bottom: 15px;
        }

        .exec-summary-box {
            background: var(--color-grey-bg); padding: 20px;
            border-radius: 6px; font-size: 13px; text-align: justify;
        }

        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; }

        .score-card {
            text-align: center; padding: 20px;
            border: 1px solid #eee; border-radius: 8px;
        }
        .big-score { font-size: 42px; font-weight: 700; color: var(--color-gold); line-height: 1; }
        .score-sub { font-size: 12px; text-transform: uppercase; color: #777; margin-top: 5px; }

        .skills-cloud { display: flex; flex-wrap: wrap; gap: 8px; }
        .skill-badge {
            font-size: 11px; background: #fff; border: 1px solid #ddd;
            padding: 4px 10px; border-radius: 20px; color: #444;
        }

        .strengths-list li {
            margin-bottom: 10px; font-size: 13px; padding-left: 20px; position: relative;
            list-style: none;
        }
        .strengths-list li::before {
            content: "✓"; position: absolute; left: 0; color: var(--color-gold); font-weight: bold;
        }

        .improvement-table {
            width: 100%; border-collapse: collapse; font-size: 12px;
        }
        .improvement-table th {
            text-align: left; background: #f0f0f0; padding: 8px; font-weight: 600;
        }
        .improvement-table td {
            border-bottom: 1px solid #eee; padding: 10px 8px; vertical-align: top;
        }
        .severity-badge {
            display: inline-block; padding: 2px 6px; border-radius: 4px; color: #fff; font-size: 10px; font-weight: bold;
        }
        .sev-Critical { background: #dc3545; }
        .sev-High { background: #fd7e14; }
        .sev-Medium { background: #ffc107; color: #000; }

        footer {
            margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px;
            font-size: 10px; color: #aaa; text-align: center;
        }

        @media print {
            body { -webkit-print-color-adjust: exact; }
            .container { width: 100%; max-width: none; padding: 15mm; }
        }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div class="candidate-info">
            <h1>${profile.detected_name || 'Candidato'}</h1>
            <h2>${profile.detected_role || 'Profissional'}</h2>
            <div class="meta-tags">
                <span><i class="fas fa-briefcase"></i> ${profile.detected_years_exp || 'N/D'} Exp.</span>
                <span><i class="fas fa-layer-group"></i> ${profile.seniority_level || 'N/D'}</span>
            </div>
        </div>
        <div class="logo-box">
            <div class="logo-text">Share<span>2Inspire</span></div>
            <div class="report-date">${reportDate}</div>
        </div>
    </header>

    <section>
        <div class="section-title">Visão Executiva</div>
        <div class="exec-summary-box">
            <p><strong>Posicionamento:</strong> ${summary.vision || 'Análise não disponível.'}</p>
            <br>
            <p><strong>Feedback Estratégico:</strong> ${summary.strategic_feedback || verdict.closing_comment || ''}</p>
        </div>
    </section>

    <div class="grid-2">
        <section>
            <div class="section-title">Índice de Prontidão</div>
            <div class="score-card">
                <div class="big-score">${(readiness / 20).toFixed(1)}</div>
                <div class="score-sub">Escala 0-5.0</div>
                <div style="margin-top: 15px; font-size: 13px;">
                    ${verdict.badge || 'Análise em curso'}
                </div>
            </div>
            
            <div class="section-title" style="margin-top: 30px;">Top Competências</div>
            <div class="skills-cloud">
                ${(report.skills_cloud || []).slice(0, 12).map(s => `<span class="skill-badge">${s}</span>`).join('')}
            </div>
        </section>

        <section>
            <div class="section-title">Radar de Performance</div>
            <div style="height: 250px;">
                <canvas id="skillsRadar"></canvas>
            </div>
        </section>
    </div>

    <section>
        <div class="section-title">Pontos Fortes Identificados</div>
        <ul class="strengths-list">
            ${(report.key_strengths || []).map(s => `<li>${s}</li>`).join('')}
        </ul>
    </section>

    <section>
        <div class="section-title">Plano de Melhoria Prioritário</div>
        <table class="improvement-table">
            <thead>
                <tr>
                    <th style="width: 25%;">Área</th>
                    <th style="width: 15%;">Impacto</th>
                    <th>Recomendação</th>
                </tr>
            </thead>
            <tbody>
                ${improvements.map(imp => `
                    <tr>
                        <td style="font-weight: 500;">${imp.area}</td>
                        <td><span class="severity-badge sev-${imp.severity}">${imp.severity}</span></td>
                        <td>${imp.suggestion}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </section>

    <footer>
        Relatório gerado automaticamente por Share2Inspire AI (Marlene Ruivo Persona).<br>
        O conteúdo deste relatório é confidencial e destinado exclusivamente ao candidato.
    </footer>
</div>
<script>
    ${chartScript}
</script>
</body>
</html>
        `;
    },

    openReport: function (report) {
        // Generate the HTML with the new schema logic
        const html = this.generateHTML(report);
        const win = window.open('', '_blank');
        if (win) {
            win.document.write(html);
            win.document.close();
            win.focus();
        } else {
            alert("Por favor, permita pop-ups para visualizar o relatório.");
        }
    },

    downloadReport: function (report) {
        const html = this.generateHTML(report);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');

        // Sanitize filename
        const candidateName = (report.candidate_profile && report.candidate_profile.detected_name)
            ? report.candidate_profile.detected_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()
            : 'candidato';

        a.href = url;
        a.download = `relatorio_cv_${candidateName}_share2inspire.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
};
