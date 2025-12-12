/**
 * Report Generator
 * Generates a professional HTML report based on CV analysis data.
 */

const ReportGenerator = {

    generateHTML: function (data) {
        // Current date for the report
        const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
        const reportDate = new Date().toLocaleDateString('pt-PT', dateOptions);

        // Prepare chart data script
        const chartScript = `
            const ctx = document.getElementById('skillsRadar').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: [
                        'Estratégia & Visão', 
                        'Gestão de Mudança', 
                        'HR Tech & IA', 
                        'Liderança', 
                        'Comunicação', 
                        'Análise de Dados', 
                        'Gestão de Stakeholders',
                        'Cultura & Pessoas'
                    ],
                    datasets: [{
                        label: 'Nível de Competência',
                        data: [${data.dimensionScores.join(', ')}],
                        backgroundColor: 'rgba(58, 110, 165, 0.35)',
                        borderColor: '#0A2540',
                        pointBackgroundColor: '#D4A857',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#D4A857',
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
                            suggestedMax: 5,
                            ticks: { display: false, stepSize: 1 }
                        }
                    },
                    plugins: { legend: { display: false } },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        `;

        // Build HTML content
        return `
<!DOCTYPE html>
<html lang="pt-PT">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Relatório de Análise Profissional - ${data.name}</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        :root {
            --color-deep-blue: #0A2540;
            --color-light-blue: #3A6EA5;
            --color-gold: #D4A857;
            --color-grey-bg: #F5F5F7;
            --color-text-dark: #1A1A1A;
            --color-text-muted: #555555;
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
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid var(--color-gold);
            padding-bottom: 30px;
            margin-bottom: 40px;
        }
        .header-profile { display: flex; gap: 20px; }
        .avatar-placeholder {
            width: 80px; height: 80px;
            background-color: var(--color-grey-bg);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            color: var(--color-deep-blue); font-size: 24px;
            border: 2px solid var(--color-gold);
        }
        .candidate-info h1 {
            font-family: 'Playfair Display', serif;
            font-size: 28px; color: var(--color-deep-blue);
            margin-bottom: 5px;
        }
        .candidate-info h2 {
            font-size: 14px; text-transform: uppercase;
            letter-spacing: 1px; color: var(--color-light-blue);
            font-weight: 600; margin-bottom: 5px;
        }
        .candidate-meta {
            font-size: 12px; color: var(--color-text-muted);
            display: flex; gap: 15px;
        }
        .logo-container { text-align: right; }
        .logo-text {
            font-weight: 700; font-size: 20px; color: var(--color-deep-blue);
        }
        .logo-text span { color: var(--color-gold); }
        .report-date { font-size: 12px; color: var(--color-text-muted); margin-top: 5px; }
        
        section { margin-bottom: 40px; }
        .section-header {
            display: flex; align-items: center; gap: 15px; margin-bottom: 20px;
        }
        .section-icon {
            width: 32px; height: 32px;
            background-color: var(--color-deep-blue); color: var(--color-gold);
            border-radius: 6px; display: flex; align-items: center;
            justify-content: center; font-size: 14px;
        }
        .section-title {
            font-size: 16px; font-weight: 700; text-transform: uppercase;
            color: var(--color-deep-blue); letter-spacing: 0.5px;
        }
        
        .exec-summary {
            background-color: var(--color-grey-bg); padding: 25px;
            border-left: 4px solid var(--color-gold);
            border-radius: 0 8px 8px 0; font-size: 14px; text-align: justify;
        }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
        
        .maturity-card {
            background: linear-gradient(135deg, var(--color-deep-blue), #1e3a5a);
            color: white; padding: 30px; border-radius: 12px;
            text-align: center; box-shadow: 0 10px 20px rgba(10, 37, 64, 0.1);
        }
        .score-large { font-size: 48px; font-weight: 700; color: var(--color-gold); line-height: 1; margin-bottom: 10px; }
        .score-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9; margin-bottom: 15px; }
        .score-context { font-size: 13px; opacity: 0.8; line-height: 1.5; }
        
        .content-list { list-style: none; }
        .content-list li {
            margin-bottom: 12px; padding-left: 20px;
            position: relative; font-size: 14px;
        }
        .content-list li::before {
            content: "•"; color: var(--color-gold); font-weight: bold;
            position: absolute; left: 0;
        }
        .content-list.strong-points li { margin-bottom: 16px; }
        
        .recommendation-box {
            border: 1px solid #e0e0e0; border-radius: 8px;
            padding: 20px; margin-top: 15px;
        }
        .plan-card {
            background-color: white; border: 1px solid #eee;
            border-top: 3px solid var(--color-light-blue);
            padding: 20px; border-radius: 6px;
        }
        
        footer {
            margin-top: 60px; border-top: 1px solid #eee;
            padding-top: 20px; display: flex; justify-content: space-between;
            font-size: 10px; color: #999;
        }
        .chart-container { position: relative; height: 300px; width: 100%; }
        
        @media print {
            body { background-color: white; }
            .container { width: 100%; max-width: none; padding: 15mm; }
        }
        
        /* Mobile Report View */
        @media screen and (max-width: 768px) {
            .container {
                width: 100%;
                padding: 20px;
                margin: 0;
            }
            .header-profile {
                flex-direction: column;
                text-align: center;
                align-items: center;
            }
            .grid-2 {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            header {
                flex-direction: column;
                gap: 20px;
                text-align: center;
            }
            .logo-container { text-align: center; }
            .candidate-meta { justify-content: center; }
        }
    </style>
</head>
<body>
<div class="container">
    <header>
        <div class="header-profile">
            <div class="avatar-placeholder"><i class="fas fa-user-tie"></i></div>
            <div class="candidate-info">
                <h1>${data.name}</h1>
                <h2>${data.role}</h2>
                <div class="candidate-meta">
                    <span><i class="fas fa-briefcase me-2"></i> ${data.years} Anos de Experiência</span>
                    <span><i class="fas fa-graduation-cap me-2"></i> ${data.education.length > 0 ? data.education[0] : 'N/A'}</span>
                </div>
            </div>
        </div>
        <div class="logo-container">
            <div class="logo-text">Share<span>2Inspire</span></div>
            <div class="report-date">Relatório Gerado em ${reportDate}</div>
        </div>
    </header>

    <section>
        <div class="section-header">
            <div class="section-icon"><i class="fas fa-align-left"></i></div>
            <div class="section-title">Resumo Executivo</div>
        </div>
        <div class="exec-summary">
            ${data.executiveSummary.map(para => `<p>${para}</p><br>`).join('')}
        </div>
    </section>

    <div class="grid-2">
        <section>
            <div class="section-header">
                <div class="section-icon"><i class="fas fa-chart-bar"></i></div>
                <div class="section-title">Nível de Maturidade</div>
            </div>
            <div class="maturity-card">
                <div class="score-large">${data.averageScore}/5.0</div>
                <div class="score-label">Avaliação Profissional</div>
                <div class="score-context">
                    Esta avaliação tem por base a contagem de anos de experiência, nível académico e dispersão de competências técnicas e comportamentais detetadas no CV.
                </div>
            </div>
        </section>

        <section>
            <div class="section-header">
                <div class="section-icon"><i class="fas fa-star"></i></div>
                <div class="section-title">Competências Detetadas</div>
            </div>
            <ul class="content-list">
                ${data.skills.slice(0, 8).map(skill => `<li>${skill.charAt(0).toUpperCase() + skill.slice(1)}</li>`).join('')}
            </ul>
        </section>
    </div>

    <section>
        <div class="section-header">
            <div class="section-icon"><i class="fas fa-thumbs-up"></i></div>
            <div class="section-title">Análise de Pontos Fortes</div>
        </div>
        <ul class="content-list strong-points">
            ${data.strengths.map(s => `
                <li>
                    <strong>${s.title || 'Ponto Forte'}</strong>
                    ${s.desc || ''}
                </li>
            `).join('')}
        </ul>
    </section>

    <section>
        <div class="section-header">
            <div class="section-icon"><i class="fas fa-bullseye"></i></div>
            <div class="section-title">Radar de Competências</div>
        </div>
        <div class="chart-container">
            <canvas id="skillsRadar"></canvas>
        </div>
    </section>

    <div class="grid-2">
        <section>
            <div class="section-header">
                <div class="section-icon"><i class="fas fa-arrow-up"></i></div>
                <div class="section-title">Sugestão de Evolução</div>
            </div>
            <div class="recommendation-box">
                <div class="rec-title">Próximos Passos Recomendados</div>
                <p style="font-size: 13px; color: #555;">${data.recommendation}</p>
            </div>
        </section>

        <section>
            <div class="section-header">
                <div class="section-icon"><i class="fas fa-tasks"></i></div>
                <div class="section-title">Plano de Ação a 90 Dias</div>
            </div>
            <div class="plan-card">
                <div style="display: flex; flex-direction: column; gap: 15px;">
                    <div style="border-left: 3px solid var(--color-gold); padding-left: 15px;">
                        <h4 style="margin: 0; font-size: 14px; color: var(--color-deep-blue);">Mês 1: Aprendizagem</h4>
                        <p style="font-size: 12px; margin-top: 5px;">${data.actionPlan.m1}</p>
                    </div>
                    <div style="border-left: 3px solid var(--color-light-blue); padding-left: 15px;">
                        <h4 style="margin: 0; font-size: 14px; color: var(--color-deep-blue);">Mês 2: Aplicação</h4>
                        <p style="font-size: 12px; margin-top: 5px;">${data.actionPlan.m2}</p>
                    </div>
                    <div style="border-left: 3px solid var(--color-deep-blue); padding-left: 15px;">
                        <h4 style="margin: 0; font-size: 14px; color: var(--color-deep-blue);">Mês 3: Consolidação</h4>
                        <p style="font-size: 12px; margin-top: 5px;">${data.actionPlan.m3}</p>
                    </div>
                </div>
            </div>
        </section>
    </div>

    <footer>
        <div class="footer-brand">
            <span style="color: var(--color-deep-blue); font-weight: bold;">Share</span><span style="color: var(--color-gold); font-weight: bold;">2Inspire</span>
        </div>
        <div>CONFIDENCIAL - Uso exclusivo do candidato</div>
        <div><i class="fas fa-envelope me-1"></i> srshare2inspire@gmail.com</div>
    </footer>
</div>
<script>
    ${chartScript}
</script>
</body>
</html>
        `;
    },

    openReport: function (data) {
        const html = this.generateHTML(data);
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    }
};
