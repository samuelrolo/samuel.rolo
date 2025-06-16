// Diagnóstico de Maturidade de RH - JavaScript Clean Version

// Dados do survey (mantidos iguais)
const surveyData = {
    dimensions: [
        {
            id: 1,
            title: "Alinhamento Estratégico & Planeamento da Força de Trabalho",
            questions: [
                "As iniciativas de RH estão claramente alinhadas com os objectivos estratégicos da organização?",
                "É feita uma análise simples das lacunas de competências para planear necessidades futuras de pessoal?",
                "As prioridades de RH são revistas em ciclos regulares (anual ou semestral)?",
                "Os resultados dessas revisões originam acções concretas e acompanhamento?"
            ],
            levels: [
                "Práticas reactivas, sem ligação explícita à estratégia.",
                "Algum alinhamento e análises pontuais de lacunas; uso limitado de dados.",
                "Alinhamento consistente; planeamento baseado em dados básicos e cenários anuais.",
                "RH lidera o planeamento estratégico de pessoas, usando dados avançados e projecções a médio prazo.",
                "Planeamento de força de trabalho em tempo real, preditivo, reconhecido como benchmark no sector."
            ]
        },
        {
            id: 2,
            title: "Tecnologia, Analytics & Experiência Digital",
            questions: [
                "Existem sistemas ou ferramentas digitais básicas para recolher dados de RH e medir indicadores-chave?",
                "As ferramentas são usadas para monitorizar métricas como rotação ou tempo de contratação?",
                "Existem dashboards simples partilhados com as chefias?",
                "Há um plano para evoluir as ferramentas à medida que a maturidade aumenta?"
            ],
            levels: [
                "Processos manuais; dados dispersos ou inexistentes.",
                "Ferramentas básicas e relatórios simples; partilha esporádica de métricas.",
                "Sistemas integrados; dashboards regulares para gestão.",
                "Analytics avançado, automação de processos e experiência digital omnicanal.",
                "IA e people-analytics preditivo; experiência digital contínua e personalizada."
            ]
        },
        {
            id: 3,
            title: "Aquisição de Talentos & Marca Empregadora",
            questions: [
                "A proposta de valor ao empregado (EVP) está definida e é comunicada?",
                "A marca empregadora é avaliada de forma básica (feedback de candidatos, plataformas de avaliação)?",
                "Os canais de recrutamento são revistos periodicamente quanto à eficácia?",
                "A experiência do candidato é ajustada com base em feedback?"
            ],
            levels: [
                "Recrutamento reactivo; EVP inexistente; sem monitorização da marca.",
                "EVP definido, comunicação limitada; métricas básicas do funil de recrutamento.",
                "EVP comunicado; experiência de candidato monitorizada e ajustada.",
                "Estratégia de talent-attraction multicanal; marca empregadora forte com métricas de conversão.",
                "Marca empregadora de referência; recrutamento data-driven altamente personalizado."
            ]
        },
        {
            id: 4,
            title: "Integração (Onboarding) & Experiência do Colaborador",
            questions: [
                "Existe um processo estruturado de integração que garante que os novos colaboradores compreendem funções e cultura?",
                "Há checkpoints nos primeiros meses para ajustar expectativas?",
                "O feedback sobre o onboarding é recolhido de forma estruturada?",
                "Existem mentores ou recursos de apoio para novos colaboradores?"
            ],
            levels: [
                "Onboarding ad-hoc ou inexistente.",
                "Processo documentado; checkpoints ocasionais; suporte básico.",
                "Onboarding estruturado; feedback regular; mentoria inicial.",
                "Experiência digitalizada; buddy program e mentoring estruturado.",
                "Onboarding contínuo e adaptativo com learning-paths individualizados e feedback 360º."
            ]
        },
        {
            id: 5,
            title: "Gestão de Desempenho & Desenvolvimento",
            questions: [
                "Metas de desempenho são definidas e comunicadas de forma clara?",
                "O feedback é recolhido de forma contínua (mesmo que informal)?",
                "Existem planos de desenvolvimento individual ou formações alinhadas a necessidades?",
                "As avaliações de desempenho geram planos de acção claros?"
            ],
            levels: [
                "Objectivos vagos ou inexistentes; feedback raro; formações pontuais.",
                "Ciclos anuais formais; feedback periódico; alguns planos de desenvolvimento.",
                "Feedback contínuo; planos de desenvolvimento alinhados a lacunas.",
                "Gestão de desempenho ágil (OKR), coaching e formações data-driven.",
                "Cultura de alto desempenho; feedback em tempo real; aprendizagem personalizada suportada por IA."
            ]
        },
        {
            id: 6,
            title: "Liderança & Sucessão",
            questions: [
                "Existem critérios formais para identificar potenciais líderes?",
                "Há planos de sucessão para posições-chave?",
                "O feedback sobre sucessores envolve vários stakeholders?",
                "Os planos de sucessão têm cronograma e recursos atribuídos?"
            ],
            levels: [
                "Identificação ad-hoc; ausência de planos formais.",
                "Processo inicial de sucessão para funções-chave.",
                "Pipeline de liderança documentado; recursos de desenvolvimento atribuídos.",
                "Programas de aceleração de liderança; sucessão baseada em métricas de potencial e performance.",
                "Gestão de sucessão dinâmica; reservas estratégicas de talento para vários cenários."
            ]
        },
        {
            id: 7,
            title: "Cultura, Envolvimento & Bem-Estar (inclui DEI)",
            questions: [
                "Realizam-se inquéritos ou check-ins regulares de envolvimento e bem-estar?",
                "Existem iniciativas de DEI, mesmo que básicas?",
                "Oferecem-se actividades ou recursos de bem-estar ajustados ao feedback?",
                "A cultura é reforçada através de comunicação e reconhecimento regulares?"
            ],
            levels: [
                "Inquéritos esporádicos; iniciativas pontuais de bem-estar/DEI.",
                "Check-ins frequentes; programas de bem-estar básicos.",
                "Programas estruturados; métricas regulares de envolvimento.",
                "Cultura gerida intencionalmente; estratégia DEI com metas; bem-estar integrado em políticas.",
                "Cultura premiada; DEI e bem-estar com impacto mensurável no negócio."
            ]
        },
        {
            id: 8,
            title: "Remuneração, Benefícios & Reconhecimento",
            questions: [
                "As políticas de remuneração e benefícios são revistas com dados de mercado?",
                "Existe reconhecimento regular (mesmo que informal) pelo desempenho?",
                "Há elementos de flexibilidade ou benefícios alternativos?",
                "Os colaboradores sabem como aceder a benefícios e propor melhorias?"
            ],
            levels: [
                "Estruturas salariais estáticas; benefícios limitados; reconhecimento informal.",
                "Revisões salariais periódicas; programas de reconhecimento estruturados.",
                "Benefícios competitivos; reconhecimento ligado a resultados.",
                "Remuneração flexível; benefícios personalizáveis; reconhecimento alinhado a valores.",
                "Pacotes holísticos; benefícios à carta; reconhecimento em tempo real suportado por tecnologia."
            ]
        },
        {
            id: 9,
            title: "Agilidade, Inovação & Resiliência",
            questions: [
                "Os processos de RH são revistos após mudanças organizacionais?",
                "Existem pilotos ou pequenas experiências antes de escalar novas práticas?",
                "Há planos de contingência para cenários de crise (ex.: teletrabalho)?",
                "Equipas multidisciplinares testam novas abordagens de RH?"
            ],
            levels: [
                "Processos rígidos; resposta lenta a mudanças; sem contingência.",
                "Melhorias pontuais; planos mínimos de contingência.",
                "Revisões pós-mudança; pilotos ocasionais.",
                "Métodos ágeis aplicados ao RH; aprendizagem rápida; planos de continuidade robustos.",
                "RH como hub de inovação; ciclos rápidos de experimentação; resiliência comprovada."
            ]
        },
        {
            id: 10,
            title: "Compliance, Ética & Governação (inclui ESG)",
            questions: [
                "Existem controlos básicos para garantir conformidade legal e ética?",
                "Há políticas de sustentabilidade e responsabilidade social ligadas a RH?",
                "Revê-em-se regularmente riscos ligados a pessoas (legais, reputacionais)?",
                "Realizam-se auditorias internas ou externas de conformidade?"
            ],
            levels: [
                "Conformidade apenas reactiva aos requisitos legais.",
                "Políticas estabelecidas; revisões periódicas; início de ESG.",
                "Auditorias regulares; componente ESG integrada nos processos.",
                "Governação proactiva; relatórios ESG estruturados; certificações externas.",
                "Referência de mercado em ética e ESG; transparência total; influência em standards sectoriais."
            ]
        }
    ]
};

// Dados dos surveys dummy (mantidos iguais)
const dummySurveys = {
    surveys: [
        {
            id: 1,
            name: "Survey 1",
            scores: [3.4, 2.1, 4.7, 3.0, 2.5, 1.8, 3.6, 4.0, 3.2, 2.9],
            average: 3.12,
            strengths: "Recrutamento (4,7) e Remuneração (4,0) já no patamar de excelência. Cultura razoavelmente sólida (3,6).",
            improvements: "Liderança & Sucessão (1,8) é o principal calcanhar de Aquiles. Tecnologia (2,1) e Desempenho (2,5) requerem sistemas e métricas.",
            diagnosis: "Maturidade N3: consistente, mas precisa profissionalizar liderança e analytics para dar o salto."
        },
        {
            id: 2,
            name: "Survey 2",
            scores: [4.2, 3.2, 5.0, 3.5, 3.0, 2.4, 4.1, 4.5, 3.7, 3.3],
            average: 3.69,
            strengths: "Marca empregadora (5,0) é referência. Estratégia (4,2), Cultura (4,1) e Benefícios (4,5) já em nível avançado.",
            improvements: "Liderança & Sucessão mantém-se abaixo da fasquia (2,4).",
            diagnosis: "Maturidade N4: RH avançado; priorizar sucessão e coaching executivo para chegar ao N5."
        },
        {
            id: 3,
            name: "Survey 3",
            scores: [2.8, 2.6, 3.9, 2.7, 2.0, 2.1, 3.0, 2.8, 2.9, 2.2],
            average: 2.70,
            strengths: "Aquisição de Talentos razoável (3,9) para o contexto. Cultura no limiar (3,0).",
            improvements: "Desempenho (2,0), Liderança (2,1) e Compliance (2,2) necessitam processos básicos. Tecnologia ainda embrionária (2,6).",
            diagnosis: "Maturidade N2: foco em construir fundações de processo, governance e feedback contínuo."
        },
        {
            id: 4,
            name: "Survey 4",
            scores: [3.9, 3.7, 4.6, 3.4, 3.1, 2.9, 3.8, 4.2, 3.5, 4.1],
            average: 3.72,
            strengths: "Talentos (4,6), Benefícios (4,2) e ESG (4,1) em nível elevado. Tecnologia (3,7) e Agilidade (3,5) já em consolidação.",
            improvements: "Liderança (2,9) continua intermédia; falta pipeline robusto.",
            diagnosis: "Maturidade N4: estrutura sólida; sucessão e gestão de performance impediram ainda o salto final ao N5."
        },
        {
            id: 5,
            name: "Survey 5",
            scores: [1.9, 1.8, 2.5, 2.2, 1.7, 1.5, 2.1, 2.6, 2.0, 1.8],
            average: 2.01,
            strengths: "Benefícios é o indicador \"menos baixo\" (2,6).",
            improvements: "Quase todas as áreas ≤ 2,0 – sobretudo Estratégia, Tecnologia e Liderança. Precisa de roadmap transversal e quick-wins de engagement.",
            diagnosis: "Maturidade N2-/N1: iniciar por estrutura mínima de planeamento, HRIS básico e programa-piloto de liderança."
        }
    ]
};

// Variáveis globais
let currentDimension = 0;
let userResponses = {};
let userScores = [];

// Inicialização com animações
document.addEventListener('DOMContentLoaded', function() {
    initializeSurvey();
    
    // Adicionar animações escalonadas
    const fadeElements = document.querySelectorAll('.fade-in');
    fadeElements.forEach((element, index) => {
        element.style.animationDelay = `${index * 0.2}s`;
    });
});

function initializeSurvey() {
    loadDimension(0);
}

function loadDimension(dimensionIndex) {
    const dimension = surveyData.dimensions[dimensionIndex];
    const surveyContent = document.getElementById('surveyContent');
    
    let html = `
        <div class="dimension-card slide-in">
            <div class="dimension-title">
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
                    <label for="${inputId}">${i}</label>
                </div>
            `;
        }
        
        html += `
                </div>
            </div>
        `;
    });
    
    html += `
            <div style="margin-top: 3rem; padding: 2rem; background: var(--gray-50); border-radius: 10px;">
                <h6 style="color: var(--dark-color); font-weight: 600; margin-bottom: 1.5rem;">Níveis de Maturidade:</h6>
                <div style="display: grid; gap: 1rem;">
    `;
    
    dimension.levels.forEach((level, index) => {
        html += `
            <div style="display: flex; align-items: flex-start; gap: 1rem;">
                <span style="background: var(--primary-color); color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; font-weight: 600; flex-shrink: 0;">${index + 1}</span>
                <span style="color: var(--text-light); font-size: 0.95rem; line-height: 1.5;">${level}</span>
            </div>
        `;
    });
    
    html += `
                </div>
            </div>
        </div>
    `;
    
    surveyContent.innerHTML = html;
    updateProgress();
    updateNavigationButtons();
    
    // Trigger animation
    setTimeout(() => {
        const slideElement = surveyContent.querySelector('.slide-in');
        if (slideElement) {
            slideElement.style.animationDelay = '0.1s';
        }
    }, 50);
}

function updateResponse(dimensionIndex, questionIndex, value) {
    userResponses[`${dimensionIndex}_${questionIndex}`] = value;
    
    // Adicionar feedback visual suave
    const label = document.querySelector(`#q${dimensionIndex}_${questionIndex}_${value} + label`);
    if (label) {
        label.style.transform = 'scale(1.05)';
        setTimeout(() => {
            label.style.transform = '';
        }, 200);
    }
}

function updateProgress() {
    const progress = ((currentDimension + 1) / surveyData.dimensions.length) * 100;
    const progressBar = document.getElementById('progressBar');
    progressBar.style.width = `${progress}%`;
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    prevBtn.disabled = currentDimension === 0;
    
    if (currentDimension === surveyData.dimensions.length - 1) {
        nextBtn.innerHTML = '<i class="fas fa-chart-line me-2"></i>Ver Resultados';
        nextBtn.onclick = finishSurvey;
    } else {
        nextBtn.innerHTML = 'Próxima <i class="fas fa-arrow-right ms-2"></i>';
        nextBtn.onclick = nextDimension;
    }
}

function previousDimension() {
    if (currentDimension > 0) {
        currentDimension--;
        loadDimension(currentDimension);
    }
}

function nextDimension() {
    if (currentDimension < surveyData.dimensions.length - 1) {
        currentDimension++;
        loadDimension(currentDimension);
    }
}

function finishSurvey() {
    calculateScores();
    
    const diagnosticModal = bootstrap.Modal.getInstance(document.getElementById('diagnosticModal'));
    diagnosticModal.hide();
    
    setTimeout(() => {
        showResults();
    }, 500);
}

function calculateScores() {
    userScores = [];
    
    for (let d = 0; d < surveyData.dimensions.length; d++) {
        let dimensionTotal = 0;
        let questionCount = 0;
        
        for (let q = 0; q < surveyData.dimensions[d].questions.length; q++) {
            const response = userResponses[`${d}_${q}`];
            if (response) {
                dimensionTotal += response;
                questionCount++;
            }
        }
        
        const dimensionScore = questionCount > 0 ? (dimensionTotal / questionCount) : 0;
        userScores.push(dimensionScore);
    }
}

function showResults() {
    const resultsContent = document.getElementById('resultsContent');
    const userAverage = userScores.reduce((a, b) => a + b, 0) / userScores.length;
    
    let html = `
        <div class="results-section">
            <div class="results-header fade-in">
                <h2 style="font-size: 2.5rem; font-weight: 700; color: var(--dark-color); margin-bottom: 1rem;">O Seu Diagnóstico</h2>
                <p style="font-size: 1.2rem; color: var(--text-light); max-width: 600px; margin: 0 auto;">Análise completa da maturidade de RH da sua organização</p>
            </div>
            
            <div class="score-card fade-in">
                <h3 style="font-size: 1.5rem; margin-bottom: 1rem; opacity: 0.9;">Pontuação Global</h3>
                <div class="score-value">${userAverage.toFixed(2)}</div>
                <div class="score-label">Nível de Maturidade: ${getMaturityLevel(userAverage)}</div>
            </div>
            
            <div class="row">
                <div class="col-lg-8">
                    <div class="chart-card fade-in">
                        <h4 style="color: var(--dark-color); font-weight: 600; margin-bottom: 2rem;">Pontuação por Dimensão</h4>
                        <canvas id="dimensionsChart" width="400" height="200"></canvas>
                    </div>
                </div>
                <div class="col-lg-4">
                    <div class="chart-card fade-in">
                        <h4 style="color: var(--dark-color); font-weight: 600; margin-bottom: 1.5rem;">Interpretação</h4>
                        <p style="color: var(--text-light); line-height: 1.6;">${getMaturityDescription(userAverage)}</p>
                    </div>
                </div>
            </div>
            
            <div class="comparison-table fade-in">
                <div style="padding: 2rem 2rem 0;">
                    <h4 style="color: var(--dark-color); font-weight: 600; margin-bottom: 0;">Comparação com Outros Surveys</h4>
                </div>
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th style="width: 35%;">Dimensão</th>
                            <th style="width: 13%;">Seu Score</th>
                            <th style="width: 13%;">Survey 1</th>
                            <th style="width: 13%;">Survey 2</th>
                            <th style="width: 13%;">Survey 3</th>
                            <th style="width: 13%;">Survey 4</th>
                            <th style="width: 13%;">Survey 5</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    surveyData.dimensions.forEach((dimension, index) => {
        html += `
            <tr>
                <td style="font-weight: 500; color: var(--dark-color);">${dimension.title}</td>
                <td class="text-center ${getScoreClass(userScores[index])}">${userScores[index].toFixed(1)}</td>
        `;
        
        dummySurveys.surveys.forEach(survey => {
            html += `<td class="text-center ${getScoreClass(survey.scores[index])}">${survey.scores[index].toFixed(1)}</td>`;
        });
        
        html += '</tr>';
    });
    
    html += `
                        <tr style="background: var(--gray-50); font-weight: 600;">
                            <td style="color: var(--dark-color);">Média Global</td>
                            <td class="text-center" style="color: var(--dark-color);">${userAverage.toFixed(2)}</td>
    `;
    
    dummySurveys.surveys.forEach(survey => {
        html += `<td class="text-center" style="color: var(--dark-color);">${survey.average.toFixed(2)}</td>`;
    });
    
    html += `
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="recommendations-card fade-in">
                <h4 style="color: var(--dark-color); font-weight: 600; margin-bottom: 2rem;">Recomendações Personalizadas</h4>
                ${generateRecommendations()}
            </div>
            
            <div class="cta-card fade-in">
                <h4 style="color: var(--dark-color); font-weight: 600; margin-bottom: 1.5rem;">Quer aprofundar estes resultados?</h4>
                <p style="color: var(--text-light); margin-bottom: 2rem;">Crie um plano de ação personalizado com a nossa consultoria especializada.</p>
                <a href="#" class="btn-consultation" onclick="redirectToConsultation()">
                    <i class="fas fa-handshake"></i>
                    Solicitar Consultoria
                </a>
            </div>
        </div>
    `;
    
    resultsContent.innerHTML = html;
    
    const resultsModal = new bootstrap.Modal(document.getElementById('resultsModal'));
    resultsModal.show();
    
    // Adicionar animações escalonadas
    setTimeout(() => {
        const fadeElements = resultsContent.querySelectorAll('.fade-in');
        fadeElements.forEach((element, index) => {
            element.style.animationDelay = `${index * 0.15}s`;
        });
        
        createDimensionsChart();
    }, 300);
}

function getMaturityLevel(score) {
    if (score >= 4.5) return "N5 - Excelência";
    if (score >= 3.5) return "N4 - Avançado";
    if (score >= 2.5) return "N3 - Consistente";
    if (score >= 1.5) return "N2 - Básico";
    return "N1 - Inicial";
}

function getMaturityDescription(score) {
    if (score >= 4.5) return "A sua organização demonstra excelência em RH, sendo uma referência no mercado com processos inovadores e resultados excepcionais.";
    if (score >= 3.5) return "A sua organização tem processos de RH avançados e bem estruturados, com algumas áreas que podem ser otimizadas para atingir a excelência.";
    if (score >= 2.5) return "A sua organização tem uma base sólida em RH, mas há oportunidades significativas de melhoria em várias dimensões.";
    if (score >= 1.5) return "A sua organização está numa fase inicial de desenvolvimento dos processos de RH, com necessidade de estruturação básica.";
    return "A sua organização precisa de uma transformação fundamental nos processos de RH para atingir padrões mínimos de eficácia.";
}

function getScoreClass(score) {
    if (score >= 3.5) return "score-high";
    if (score >= 2.5) return "score-medium";
    return "score-low";
}

function generateRecommendations() {
    let recommendations = "";
    const weakestAreas = [];
    
    userScores.forEach((score, index) => {
        weakestAreas.push({ index, score, title: surveyData.dimensions[index].title });
    });
    
    weakestAreas.sort((a, b) => a.score - b.score);
    
    const topWeakAreas = weakestAreas.slice(0, 3);
    
    topWeakAreas.forEach(area => {
        recommendations += `
            <div class="recommendation-item">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                    <strong style="color: var(--dark-color);">${area.title}</strong>
                    <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${area.score.toFixed(1)}/5.0</span>
                </div>
                <p style="color: var(--text-light); margin: 0; line-height: 1.5;">${getRecommendationText(area.index, area.score)}</p>
            </div>
        `;
    });
    
    return recommendations;
}

function getRecommendationText(dimensionIndex, score) {
    const recommendations = [
        [
            "Estabeleça reuniões regulares entre RH e liderança para alinhar prioridades estratégicas.",
            "Desenvolva um plano anual de RH baseado nos objetivos organizacionais.",
            "Implemente análises básicas de lacunas de competências e planeamento de sucessão."
        ],
        [
            "Invista num sistema HRIS básico para centralizar dados de colaboradores.",
            "Crie dashboards simples com métricas-chave como rotação e tempo de contratação.",
            "Estabeleça processos de recolha e análise regular de dados de RH."
        ],
        [
            "Defina e comunique claramente a proposta de valor ao empregado (EVP).",
            "Implemente um processo estruturado de feedback de candidatos.",
            "Diversifique os canais de recrutamento e meça a sua eficácia."
        ],
        [
            "Crie um programa estruturado de onboarding com checkpoints definidos.",
            "Implemente um sistema de mentoria para novos colaboradores.",
            "Recolha feedback sistemático sobre a experiência de integração."
        ],
        [
            "Estabeleça objetivos claros e mensuráveis para todos os colaboradores.",
            "Implemente ciclos regulares de feedback e avaliação de desempenho.",
            "Desenvolva planos de formação alinhados com lacunas identificadas."
        ],
        [
            "Identifique e documente posições-chave e potenciais sucessores.",
            "Crie programas de desenvolvimento de liderança estruturados.",
            "Implemente avaliações 360º para líderes atuais e potenciais."
        ],
        [
            "Realize inquéritos regulares de envolvimento e bem-estar dos colaboradores.",
            "Desenvolva iniciativas básicas de diversidade, equidade e inclusão.",
            "Implemente programas de reconhecimento e bem-estar no trabalho."
        ],
        [
            "Realize estudos salariais regulares para garantir competitividade.",
            "Implemente programas estruturados de reconhecimento e recompensas.",
            "Ofereça benefícios flexíveis adaptados às necessidades dos colaboradores."
        ],
        [
            "Desenvolva planos de contingência para cenários de crise.",
            "Implemente metodologias ágeis nos processos de RH.",
            "Crie equipas multidisciplinares para testar novas abordagens."
        ],
        [
            "Estabeleça controlos básicos de conformidade legal e ética.",
            "Desenvolva políticas de sustentabilidade e responsabilidade social.",
            "Implemente auditorias regulares dos processos de RH."
        ]
    ];
    
    const levelRecommendations = recommendations[dimensionIndex];
    if (score < 2) return levelRecommendations[0];
    if (score < 3) return levelRecommendations[1];
    return levelRecommendations[2];
}

function createDimensionsChart() {
    const ctx = document.getElementById('dimensionsChart').getContext('2d');
    
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: surveyData.dimensions.map(d => {
                const words = d.title.split(' ');
                return words.length > 2 ? words.slice(0, 2).join(' ') + '...' : d.title;
            }),
            datasets: [{
                label: 'Sua Organização',
                data: userScores,
                borderColor: '#bf9a33',
                backgroundColor: 'rgba(191, 154, 51, 0.1)',
                pointBackgroundColor: '#bf9a33',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#bf9a33',
                pointHoverRadius: 8,
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 5,
                    ticks: {
                        stepSize: 1,
                        color: '#6c757d',
                        font: {
                            size: 12
                        }
                    },
                    grid: {
                        color: '#e0e0e0'
                    },
                    angleLines: {
                        color: '#e0e0e0'
                    },
                    pointLabels: {
                        color: '#333333',
                        font: {
                            size: 11,
                            weight: '500'
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            },
            elements: {
                line: {
                    tension: 0.2
                }
            }
        }
    });
}

function redirectToConsultation() {
    const resultsModal = bootstrap.Modal.getInstance(document.getElementById('resultsModal'));
    resultsModal.hide();
    
    setTimeout(() => {
        window.location.href = 'pages/servicos.html#consultoria';
    }, 500);
}

