// Diagnóstico de Maturidade de RH - JavaScript Professional Version

// Dados do survey com conteúdo profissionalizado
const surveyData = {
    dimensions: [
        {
            id: 1,
            title: "Alinhamento Estratégico & Planeamento",
            questions: [
                "As iniciativas de RH derivam diretamente dos objetivos estratégicos do negócio?",
                "Existe um planeamento da força de trabalho (Workforce Planning) baseado em dados para antecipar necessidades futuras?",
                "A estrutura organizacional é revista periodicamente para garantir agilidade e eficiência?",
                "O RH participa ativamente nas decisões estratégicas da administração?"
            ],
            levels: [
                "RH puramente administrativo e reativo.",
                "Alinhamento pontual; planeamento de curto prazo.",
                "Estratégia de RH definida e comunicada; planeamento anual.",
                "RH como parceiro estratégico; planeamento de médio/longo prazo.",
                "RH lidera a transformação do negócio; Workforce Planning preditivo e contínuo."
            ]
        },
        {
            id: 2,
            title: "Tecnologia & Analytics",
            questions: [
                "A organização utiliza um sistema integrado de gestão de RH (HRIS) que centraliza a informação?",
                "As decisões de pessoas são suportadas por dados e métricas (People Analytics)?",
                "Existem dashboards de gestão de pessoas acessíveis aos líderes em tempo real?",
                "A tecnologia é utilizada para automatizar processos administrativos e melhorar a experiência?"
            ],
            levels: [
                "Processos manuais e baseados em papel/Excel.",
                "Sistemas desconexos; relatórios básicos e manuais.",
                "HRIS implementado; reporting regular de KPIs operacionais.",
                "Ecossistema digital integrado; dashboards de gestão; analytics descritivo.",
                "People Analytics preditivo; IA aplicada a processos; experiência digital seamless."
            ]
        },
        {
            id: 3,
            title: "Atração & Aquisição de Talento",
            questions: [
                "A Marca Empregadora (Employer Brand) está definida e é comunicada consistentemente?",
                "O processo de recrutamento é ágil, digital e focado na experiência do candidato?",
                "Utilizam-se múltiplas fontes de atração e estratégias proativas de sourcing?",
                "A seleção é baseada em competências e fit cultural, minimizando enviesamentos?"
            ],
            levels: [
                "Recrutamento reativo e urgente; sem definição de marca.",
                "Processo estruturado mas lento; foco em job boards.",
                "EVP definido; processo eficiente; uso de LinkedIn e redes sociais.",
                "Estratégia de Talent Acquisition proativa; foco na experiência do candidato.",
                "Pipeline de talentos robusto; recrutamento data-driven; marca de referência."
            ]
        },
        {
            id: 4,
            title: "Onboarding & Experiência do Colaborador",
            questions: [
                "Existe um programa de Onboarding estruturado que acelera a integração e produtividade?",
                "A experiência do colaborador (EX) é desenhada e monitorizada ao longo de toda a jornada?",
                "Existem mecanismos regulares de escuta ativa (e.g., inquéritos de pulso)?",
                "A cultura de feedback é promovida desde o primeiro dia?"
            ],
            levels: [
                "Onboarding informal ou inexistente.",
                "Processo administrativo de acolhimento; check-ins pontuais.",
                "Programa de Onboarding estruturado (30-60-90 dias); inquéritos anuais.",
                "Jornada do colaborador mapeada; Onboarding digital e relacional.",
                "Experiência personalizada; Onboarding contínuo; cultura de feedback em tempo real."
            ]
        },
        {
            id: 5,
            title: "Gestão de Desempenho & Desenvolvimento",
            questions: [
                "O modelo de gestão de desempenho promove o desenvolvimento contínuo e não apenas a avaliação?",
                "Os objetivos individuais estão claramente alinhados com as metas da organização (OKRs/KPIs)?",
                "Existem planos de desenvolvimento individual (PDI) ativos para todos os colaboradores?",
                "O feedback é frequente, bidirecional e focado na melhoria?"
            ],
            levels: [
                "Avaliação inexistente ou subjetiva.",
                "Avaliação anual burocrática; foco no passado.",
                "Ciclo anual estruturado; objetivos definidos; feedback periódico.",
                "Gestão contínua de performance; foco no desenvolvimento e coaching.",
                "Cultura de alto desempenho; feedback contínuo; aprendizagem integrada no trabalho."
            ]
        },
        {
            id: 6,
            title: "Liderança & Sucessão",
            questions: [
                "Existe um modelo de competências de liderança definido e comunicado?",
                "Os líderes são avaliados e desenvolvidos na sua capacidade de gestão de pessoas?",
                "Existe um processo formal de identificação de talento e planeamento de sucessão?",
                "A organização investe na preparação da próxima geração de líderes?"
            ],
            levels: [
                "Liderança técnica; sem modelo de gestão de pessoas.",
                "Formação de liderança pontual; sucessão informal.",
                "Modelo de competências; avaliação de líderes; sucessão para C-level.",
                "Programas de desenvolvimento de liderança estruturados; pipeline de sucessão ativo.",
                "Liderança inspiradora em todos os níveis; cultura de mentoria; sucessão robusta."
            ]
        },
        {
            id: 7,
            title: "Cultura, Diversidade & Bem-Estar",
            questions: [
                "Os valores e a cultura organizacional são vividos e reconhecidos no dia-a-dia?",
                "Existe uma estratégia clara para promover a Diversidade, Equidade e Inclusão (DEI)?",
                "O bem-estar (físico, mental, financeiro) é uma prioridade com iniciativas concretas?",
                "O ambiente de trabalho promove a segurança psicológica e a colaboração?"
            ],
            levels: [
                "Cultura não definida; iniciativas isoladas.",
                "Valores comunicados; atividades de team building pontuais.",
                "Iniciativas de bem-estar e DEI estruturadas; medição de clima.",
                "Cultura forte e alinhada; estratégia de DEI e bem-estar integrada.",
                "Cultura como vantagem competitiva; ambiente inclusivo e psicologicamente seguro."
            ]
        },
        {
            id: 8,
            title: "Compensação & Benefícios",
            questions: [
                "A política salarial é transparente, equitativa e competitiva face ao mercado?",
                "O pacote de benefícios é flexível e adaptado às necessidades dos colaboradores?",
                "Existe uma ligação clara entre desempenho/contribuição e recompensa?",
                "A proposta de valor total (Total Rewards) é comunicada eficazmente?"
            ],
            levels: [
                "Salários definidos caso a caso; sem política clara.",
                "Estrutura salarial básica; benefícios padrão.",
                "Política salarial definida; benchmarking regular; bónus anual.",
                "Compensação variável estruturada; benefícios flexíveis.",
                "Estratégia de Total Rewards personalizada; equidade salarial garantida."
            ]
        }
    ]
};

// Dados comparativos para benchmark
const benchmarkData = {
    surveys: [
        {
            name: "Média do Mercado",
            scores: [3.2, 2.8, 3.5, 3.0, 2.9, 2.7, 3.3, 3.1],
            average: 3.06
        },
        {
            name: "Top Performers",
            scores: [4.5, 4.2, 4.6, 4.4, 4.3, 4.1, 4.5, 4.2],
            average: 4.35
        }
    ]
};

// Variáveis de estado
let currentDimension = 0;
let userResponses = {};
let userScores = [];

// Inicialização
document.addEventListener('DOMContentLoaded', function () {
    waitForBootstrapDiagnostic(() => {
        // Verificar se o modal existe antes de inicializar
        const modalElement = document.getElementById('diagnosticModalClean');
        if (modalElement) {
            modalElement.addEventListener('show.bs.modal', function () {
                initializeSurvey();
            });
        }
    });
});

function waitForBootstrapDiagnostic(callback) {
    if (typeof bootstrap !== 'undefined') {
        callback();
    } else {
        setTimeout(() => waitForBootstrapDiagnostic(callback), 100);
    }
}

function initializeSurvey() {
    currentDimension = 0;
    userResponses = {};
    userScores = [];
    loadDimension(0);
}

function loadDimension(dimensionIndex) {
    const dimension = surveyData.dimensions[dimensionIndex];
    const surveyContent = document.getElementById('surveyContentClean');

    if (!surveyContent) return;

    let html = `
        <div class="question-card">
            <div class="question-title">
                ${dimensionIndex + 1}. ${dimension.title}
            </div>
    `;

    dimension.questions.forEach((question, qIndex) => {
        html += `
            <div class="question-item">
                <div class="question-text">${question}</div>
                <div class="rating-container">
        `;

        for (let i = 1; i <= 5; i++) {
            const inputId = `q${dimensionIndex}_${qIndex}_${i}`;
            const isChecked = userResponses[`${dimensionIndex}_${qIndex}`] === i ? 'checked' : '';
            html += `
                <div class="rating-option">
                    <input type="radio" id="${inputId}" name="q${dimensionIndex}_${qIndex}" value="${i}" ${isChecked} 
                           onchange="updateResponse(${dimensionIndex}, ${qIndex}, ${i})">
                    <label for="${inputId}" class="rating-label">
                        <span>${i}</span>
                    </label>
                </div>
            `;
        }

        html += `
                </div>
            </div>
        `;
    });

    html += `</div>`;

    surveyContent.innerHTML = html;

    // Atualizar barra de progresso
    const progress = ((dimensionIndex + 1) / surveyData.dimensions.length) * 100;
    const progressBar = document.getElementById('progressBarClean');
    if (progressBar) progressBar.style.width = progress + '%';

    const currentQuestionEl = document.getElementById('currentQuestionClean');
    if (currentQuestionEl) currentQuestionEl.textContent = dimensionIndex + 1;

    const totalQuestionsEl = document.getElementById('totalQuestionsClean');
    if (totalQuestionsEl) totalQuestionsEl.textContent = surveyData.dimensions.length;

    // Atualizar botões de navegação
    const prevBtn = document.getElementById('prevBtnClean');
    if (prevBtn) prevBtn.disabled = dimensionIndex === 0;

    const nextBtn = document.getElementById('nextBtnClean');
    if (nextBtn) {
        if (dimensionIndex === surveyData.dimensions.length - 1) {
            nextBtn.innerHTML = 'Ver Resultados <i class="fas fa-chart-line"></i>';
            nextBtn.onclick = finishSurvey;
        } else {
            nextBtn.innerHTML = 'Próxima <i class="fas fa-arrow-right"></i>';
            nextBtn.onclick = nextDimension;
        }
    }
}

function updateResponse(dimensionIndex, questionIndex, value) {
    userResponses[`${dimensionIndex}_${questionIndex}`] = value;
}

function previousDimensionClean() {
    if (currentDimension > 0) {
        currentDimension--;
        loadDimension(currentDimension);
    }
}

function nextDimensionClean() {
    // Validar se todas as perguntas foram respondidas
    const currentQuestions = surveyData.dimensions[currentDimension].questions;
    let allAnswered = true;

    for (let i = 0; i < currentQuestions.length; i++) {
        if (!userResponses[`${currentDimension}_${i}`]) {
            allAnswered = false;
            break;
        }
    }

    if (!allAnswered) {
        alert("Por favor, responda a todas as questões antes de avançar.");
        return;
    }

    if (currentDimension < surveyData.dimensions.length - 1) {
        currentDimension++;
        loadDimension(currentDimension);
    }
}

// Alias functions for HTML onclick compatibility
window.previousDimensionClean = previousDimensionClean;
window.nextDimensionClean = nextDimensionClean;

function finishSurvey() {
    // Validar última dimensão
    const currentQuestions = surveyData.dimensions[currentDimension].questions;
    let allAnswered = true;

    for (let i = 0; i < currentQuestions.length; i++) {
        if (!userResponses[`${currentDimension}_${i}`]) {
            allAnswered = false;
            break;
        }
    }

    if (!allAnswered) {
        alert("Por favor, responda a todas as questões antes de finalizar.");
        return;
    }

    calculateScores();

    // Fechar modal de diagnóstico e abrir resultados
    const diagnosticModalEl = document.getElementById('diagnosticModalClean');
    const diagnosticModal = bootstrap.Modal.getInstance(diagnosticModalEl);
    diagnosticModal.hide();

    setTimeout(() => {
        showResults();
    }, 500);
}

function calculateScores() {
    userScores = [];

    for (let d = 0; d < surveyData.dimensions.length; d++) {
        let dimensionTotal = 0;
        let questionCount = surveyData.dimensions[d].questions.length;

        for (let q = 0; q < questionCount; q++) {
            const response = userResponses[`${d}_${q}`] || 0;
            dimensionTotal += response;
        }

        const dimensionScore = questionCount > 0 ? (dimensionTotal / questionCount) : 0;
        userScores.push(dimensionScore);
    }
}

function showResults() {
    const resultsContent = document.getElementById('resultsContentClean');
    if (!resultsContent) return;

    const userAverage = userScores.reduce((a, b) => a + b, 0) / userScores.length;
    const maturityLevel = getMaturityLevel(userAverage);

    let html = `
        <div class="results-section fade-in">
            <div class="text-center mb-5">
                <h2 style="color: #212529; font-weight: 700;">O Seu Diagnóstico de Maturidade</h2>
                <p class="text-muted">Análise detalhada do estado atual dos seus processos de RH</p>
            </div>
            
            <div class="row mb-5">
                <div class="col-md-4">
                    <div class="score-card h-100 d-flex flex-column justify-content-center align-items-center">
                        <h3 class="score-label mb-3">Índice Global de Maturidade</h3>
                        <div class="score-value mb-2">${userAverage.toFixed(1)}</div>
                        <div class="badge bg-dark text-warning p-2 px-3 rounded-pill">${maturityLevel.label}</div>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="chart-card">
                        <h4 class="mb-4" style="color: #212529; font-weight: 600;">Perfil de Maturidade por Dimensão</h4>
                        <canvas id="dimensionsChartClean"></canvas>
                    </div>
                </div>
            </div>
            
            <div class="comparison-table mb-5">
                <div class="p-4 border-bottom">
                    <h4 class="m-0" style="color: #212529; font-weight: 600;">Análise Detalhada & Benchmarking</h4>
                </div>
                <div class="table-responsive">
                    <table class="table table-hover mb-0">
                        <thead>
                            <tr>
                                <th style="width: 40%;">Dimensão Estratégica</th>
                                <th class="text-center" style="width: 20%;">A Sua Pontuação</th>
                                <th class="text-center" style="width: 20%;">Média de Mercado</th>
                                <th class="text-center" style="width: 20%;">Top Performers</th>
                            </tr>
                        </thead>
                        <tbody>
    `;

    surveyData.dimensions.forEach((dimension, index) => {
        const score = userScores[index];
        const benchmarkAvg = benchmarkData.surveys[0].scores[index];
        const benchmarkTop = benchmarkData.surveys[1].scores[index];

        html += `
            <tr>
                <td style="font-weight: 500; color: #495057;">${dimension.title}</td>
                <td class="text-center">
                    <span class="${getScoreClass(score)}">${score.toFixed(1)}</span>
                </td>
                <td class="text-center text-muted">${benchmarkAvg.toFixed(1)}</td>
                <td class="text-center text-muted">${benchmarkTop.toFixed(1)}</td>
            </tr>
        `;
    });

    html += `
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="recommendations-card mb-5">
                <h4 class="mb-4" style="color: #212529; font-weight: 600;">Recomendações Prioritárias</h4>
                <div class="row">
                    ${generateRecommendations()}
                </div>
            </div>
            
            <div class="cta-card">
                <h3 class="mb-3">Pronto para elevar o nível do seu RH?</h3>
                <p class="mb-4 opacity-75">Agende uma sessão estratégica gratuita para discutir estes resultados e desenhar um roteiro de transformação.</p>
                <a href="https://calendly.com/samuel-rolo/30min" target="_blank" class="btn-consultation">
                    <i class="fas fa-calendar-check me-2"></i>Agendar Sessão de Debriefing
                </a>
            </div>
        </div>
    `;

    resultsContent.innerHTML = html;

    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModalClean'));
    resultsModal.show();

    // Inicializar gráfico após o modal estar visível
    setTimeout(() => {
        createDimensionsChart();
    }, 300);
}

function getMaturityLevel(score) {
    if (score >= 4.5) return { label: "Nível 5 - Excelência", class: "success" };
    if (score >= 3.5) return { label: "Nível 4 - Avançado", class: "primary" };
    if (score >= 2.5) return { label: "Nível 3 - Definido", class: "info" };
    if (score >= 1.5) return { label: "Nível 2 - Em Desenvolvimento", class: "warning" };
    return { label: "Nível 1 - Inicial", class: "danger" };
}

function getScoreClass(score) {
    if (score >= 4.0) return "score-high";
    if (score >= 2.5) return "score-medium";
    return "score-low";
}

function generateRecommendations() {
    // Identificar as 3 áreas com menor pontuação
    const scoresWithIndex = userScores.map((score, index) => ({ score, index }));
    scoresWithIndex.sort((a, b) => a.score - b.score);
    const lowestDimensions = scoresWithIndex.slice(0, 3);

    let html = '';

    lowestDimensions.forEach(item => {
        const dimension = surveyData.dimensions[item.index];
        const levelIndex = Math.floor(item.score) - 1;
        const nextLevelText = dimension.levels[Math.min(levelIndex + 1, 4)];

        html += `
            <div class="col-md-12 mb-3">
                <div class="recommendation-item">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <h5 class="m-0" style="color: #212529; font-weight: 600;">${dimension.title}</h5>
                        <span class="badge bg-light text-dark border">Score: ${item.score.toFixed(1)}</span>
                    </div>
                    <p class="text-muted mb-2"><small>Próximo passo para evoluir:</small></p>
                    <p class="mb-0" style="color: #495057; font-weight: 500;">
                        <i class="fas fa-arrow-right text-warning me-2"></i>${nextLevelText}
                    </p>
                </div>
            </div>
        `;
    });

    return html;
}

function createDimensionsChart() {
    const ctx = document.getElementById('dimensionsChartClean');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: surveyData.dimensions.map(d => d.title),
            datasets: [{
                label: 'A Sua Organização',
                data: userScores,
                backgroundColor: 'rgba(191, 154, 51, 0.2)',
                borderColor: '#BF9A33',
                pointBackgroundColor: '#BF9A33',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#BF9A33',
                borderWidth: 2
            }, {
                label: 'Média de Mercado',
                data: benchmarkData.surveys[0].scores,
                backgroundColor: 'rgba(108, 117, 125, 0.1)',
                borderColor: '#6c757d',
                pointBackgroundColor: '#6c757d',
                pointBorderColor: '#fff',
                borderWidth: 1,
                borderDash: [5, 5]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    pointLabels: {
                        font: {
                            size: 11,
                            family: "'Poppins', sans-serif"
                        },
                        color: '#495057'
                    },
                    suggestedMin: 0,
                    suggestedMax: 5,
                    ticks: {
                        stepSize: 1,
                        backdropColor: 'transparent'
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        font: {
                            family: "'Poppins', sans-serif"
                        },
                        padding: 20
                    }
                }
            }
        }
    });
}
