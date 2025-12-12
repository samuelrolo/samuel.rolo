/**
 * CV Analysis Controller
 * Handles UI interactions and the analysis logic.
 */

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('cvFile');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const fileNameDisplay = document.getElementById('fileName');
    const btnSpinner = document.getElementById('btnSpinner');
    const btnText = document.getElementById('btnText');

    let selectedFile = null;

    // File Selection Handler
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileNameDisplay.textContent = selectedFile.name;
            analyzeBtn.disabled = false;
        }
    });

    // Analyze Button Handler
    analyzeBtn.addEventListener('click', async () => {
        console.log("Analyze button clicked");
        if (!selectedFile) {
            console.log("No file selected2");
            return;
        }

        // UI Loading State
        setLoading(true);

        try {
            // 1. Extract Text
            console.log("Starting text extraction...");
            const text = await CVParser.parse(selectedFile);
            console.log("Text extracted, length:", text.length);

            // 2. Analyze Text (Rule-based for now)
            console.log("Starting analysis...");
            const analysis = analyzeText(text);

            // 3. Show Results
            console.log("Showing results...");
            populateResults(analysis);
            const resultsModal = new bootstrap.Modal(document.getElementById('cvResultsModal'));
            resultsModal.show();

        } catch (error) {
            console.error("Analysis Error:", error);
            alert('Erro ao analisar o CV: ' + error.message);
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        analyzeBtn.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'A analisar...';
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Analizar Perfil';
        }
    }
});

/**
 * Core Analysis Logic (Rule-based)
 */
function analyzeText(text) {
    const textLower = text.toLowerCase();

    // --- 1. Detect Education ---
    const educationKeywords = [
        'mestrado', 'master', 'mba', 'doutoramento', 'phd', 'pós-graduação',
        'licenciatura', 'bacharelato', 'licenciado', 'gestão de recursos humanos'
    ];
    const foundEducation = educationKeywords.filter(k => textLower.includes(k));
    const eduLevel = foundEducation.length > 0 ? capitalize(foundEducation[0]) : "Experiência Prática";

    // --- 2. Calculate Years of Experience (Approximate) ---
    // Simple regex to look for "X anos" patterns or subtract dates
    const yearMatches = text.match(/(\d{4})/g);
    let estimatedYears = 0;
    if (yearMatches && yearMatches.length > 1) {
        const years = yearMatches.map(Number).filter(y => y > 1980 && y <= new Date().getFullYear());
        if (years.length >= 2) {
            estimatedYears = Math.max(...years) - Math.min(...years);
        }
    }
    // Fallback based on keywords if no dates found
    if (estimatedYears === 0) {
        if (textLower.includes('senior') || textLower.includes('sénior')) estimatedYears = 7;
        else if (textLower.includes('manager')) estimatedYears = 5;
        else if (textLower.includes('junior') || textLower.includes('júnior')) estimatedYears = 1;
        else estimatedYears = 3;
    }

    // --- 3. Detect Skills ---
    const skillDictionary = [
        'liderança', 'gestão de equipas', 'people analytics', 'recrutamento',
        'formação', 'avaliação de desempenho', 'legislação laboral',
        'comunicação interna', 'employer branding', 'estratégia',
        'coaching', 'transformação digital', 'diversidade', 'onboarding'
    ];
    const matchedSkills = skillDictionary.filter(skill => textLower.includes(skill.toLowerCase()));

    // --- 4. Calculate Scores (Mock Dimensions) ---
    // We base scores on skill matches + experience + education boost
    let baseScore = Math.min(5, 1 + (estimatedYears * 0.4) + (matchedSkills.length * 0.2));
    if (foundEducation.length > 1) baseScore += 0.5;

    // Generate dimension scores with slight random variation to look natural around the baseScore
    const dimensionScores = Array(8).fill(0).map(() => {
        let s = baseScore + (Math.random() * 1.5 - 0.75);
        return Math.min(5, Math.max(1, s)).toFixed(1);
    });

    const averageScore = dimensionScores.reduce((a, b) => parseFloat(a) + parseFloat(b), 0) / 8;

    return {
        name: detectName(text) || "Candidato",
        role: detectRole(text) || "Profissional de RH",
        years: estimatedYears,
        skills: matchedSkills.slice(0, 8),
        education: educationKeywords.filter(k => textLower.includes(k)).slice(0, 3).map(capitalize),
        dimensionScores: dimensionScores,
        averageScore: averageScore.toFixed(1),
        strengths: generateStrengths(matchedSkills, estimatedYears, textLower),
        recommendation: generateRecommendation(averageScore, matchedSkills),
        executiveSummary: generateExecutiveSummary(detectName(text), estimatedYears, detectRole(text), matchedSkills, educationKeywords.filter(k => textLower.includes(k)).slice(0, 3).map(capitalize)),
        actionPlan: generate90DayPlan(matchedSkills, estimatedYears)
    };
}

// Helpers
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function detectName(text) {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) return lines[0].substring(0, 30);
    return "Candidato";
}

function detectRole(text) {
    if (text.toLowerCase().includes('diretor') || text.toLowerCase().includes('director')) return "Diretor de Recursos Humanos";
    if (text.toLowerCase().includes('manager') || text.toLowerCase().includes('gestor')) return "HR Manager";
    if (text.toLowerCase().includes('business partner')) return "HR Business Partner";
    if (text.toLowerCase().includes('técnico') || text.toLowerCase().includes('specialist')) return "Especialista de RH";
    if (text.toLowerCase().includes('consultor') || text.toLowerCase().includes('consultant')) return "Consultor de RH";
    return "Profissional de RH";
}

function generateExecutiveSummary(name, years, role, skills, education) {
    const skillText = skills.slice(0, 3).map(s => capitalize(s)).join(', ');
    const eduText = education.length > 0 ? `apoiado por uma formação em ${education.join(' e ')}` : "com um forte background prático";

    return [
        `O perfil de <strong>${name || 'Candidato'}</strong> revela um profissional com uma trajetória de <strong>${years} anos</strong>, demonstrando uma consistência notável na área de Gestão de Pessoas. A análise identifica um posicionamento alinhado com funções de <strong>${role}</strong>, destacando-se pela combinação de competências em ${skillText}.`,

        `A maturidade profissional evidenciada sugere uma capacidade de navegar entre desafios operacionais e estratégicos. O seu percurso, ${eduText}, indica um potencial elevado para impulsionar transformações organizacionais e acrescentar valor imediato, especialmente em contextos que valorizem a ${skills.includes('liderança') ? 'gestão de equipas e liderança' : 'execução técnica e otimização de processos'}.`
    ];
}

function generateStrengths(skills, years, text) {
    let strengths = [];

    // Experience Strength
    if (years > 10) {
        strengths.push({
            title: "Senioridade e Consistência",
            desc: "Trajetória profissional longa demonstrando resiliência e capacidade de adaptação a diferentes ciclos organizacionais."
        });
    } else if (years > 5) {
        strengths.push({
            title: "Sólida Experiência Operacional",
            desc: "Domínio comprovado das funções fundamentais de RH, com autonomia para gerir processos end-to-end."
        });
    } else {
        strengths.push({
            title: "Potencial de Crescimento Acelerado",
            desc: "Perfil dinâmico com vontade de aprender e rápida curva de evolução em novas funções."
        });
    }

    // Skills Strengths
    if (skills.includes('liderança') || skills.includes('gestão de equipas')) {
        strengths.push({
            title: "Liderança e Gestão de Pessoas",
            desc: "Competência para motivar, desenvolver e alinhar equipas com os objetivos estratégicos da organização."
        });
    }

    if (skills.includes('estratégia') || skills.includes('transformação digital')) {
        strengths.push({
            title: "Visão Estratégica e Transformação",
            desc: "Capacidade de desenhar e implementar mudanças estruturais, ligando o capital humano aos resultados de negócio."
        });
    }

    if (skills.includes('people analytics') || text.includes('dados') || text.includes('excel')) {
        strengths.push({
            title: "Orientação Analítica (Data-Driven)",
            desc: "Utilização de dados para fundamentar decisões, otimizar processos e medir o retorno do investimento em RH."
        });
    }

    if (skills.includes('recrutamento') || skills.includes('onboarding')) {
        strengths.push({
            title: "Talent Acquisition Excellence",
            desc: "Forte aptidão para identificar, atrair e integrar o melhor talento, fortalecendo o employer branding."
        });
    }

    // Default filler if not enough
    if (strengths.length < 3) {
        strengths.push({
            title: "Compromisso e Profissionalismo",
            desc: "Evidência de dedicação e alinhamento com boas práticas de gestão de recursos humanos."
        });
        strengths.push({
            title: "Foco em Resultados",
            desc: "Orientação pragmática para a concretização de objetivos e melhoria contínua."
        });
    }

    return strengths.slice(0, 5);
}

function generateRecommendation(score, skills) {
    if (score >= 4.5) return "Perfil de topo. O foco deve transitar da gestão para a influência estratégica (C-Level Advisor) e inovação disruptiva.";
    if (score >= 3.5) return "Perfil sénior muito sólido. Recomendamos aprofundar competências em Transformação Digital e Liderança de Mudança para chegar ao próximo nível.";
    return "Perfil em crescimento. Investir na consolidação de hard skills e começar a liderar pequenos projetos para ganhar visibilidade.";
}

function generate90DayPlan(skills, years) {
    if (years > 5) {
        return {
            m1: "Realizar um diagnóstico 360º das competências atuais e identificar lacunas em tecnologias emergentes (AI, Analytics).",
            m2: "Desenhar e liderar um projeto piloto de inovação ou melhoria de processos que tenha impacto visível no negócio.",
            m3: "Mentoria de perfis juniores e consolidação do posicionamento como Thought Leader interno ou no LinkedIn."
        };
    } else {
        return {
            m1: "Focar na aprendizagem intensiva das ferramentas core da função e alinhar expectativas com a liderança.",
            m2: "Assumir autonomia total em processos recorrentes e identificar uma área para especialização.",
            m3: "Solicitar feedback estruturado e apresentar um plano de melhoria contínua para a sua função."
        };
    }
}

/**
 * UI Population
 */
let chartInstance = null;

function populateResults(data) {
    document.getElementById('resultName').textContent = data.name;
    document.getElementById('resultRole').textContent = data.role;
    document.getElementById('resultExp').textContent = `Experiência Estimada: ${data.years} anos`;

    document.getElementById('maturityScore').textContent = data.averageScore;
    renderStars(data.averageScore);

    // Education
    const eduList = document.getElementById('educationList');
    eduList.innerHTML = data.education.length ? data.education.map(e => `<li><i class="fas fa-check text-success me-2"></i>${e}</li>`).join('') : '<li>Não especificada</li>';

    // Skills
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = data.skills.map(s => `<span class="skill-tag">${capitalize(s)}</span>`).join('');

    // Strengths
    const strengthsList = document.getElementById('strengthsList');
    strengthsList.innerHTML = data.strengths.map(s => `<li class="list-group-item bg-transparent"><i class="fas fa-check-circle text-primary me-2"></i>${s}</li>`).join('');

    // Recommendation
    document.getElementById('recommendationText').textContent = data.recommendation;

    // Chart
    renderChart(data.dimensionScores);

    // Setup Download Button
    const downloadBtn = document.querySelector('.modal-footer .btn-primary');
    // Remove previous event listeners to avoid duplicates (cloning node is a quick hack)
    const newBtn = downloadBtn.cloneNode(true);
    downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);

    newBtn.addEventListener('click', () => {
        ReportGenerator.openReport(data);
    });
}

function renderStars(score) {
    const starsContainer = document.getElementById('maturityStars');
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (score >= i) html += '<i class="fas fa-star"></i>';
        else if (score >= i - 0.5) html += '<i class="fas fa-star-half-alt"></i>';
        else html += '<i class="far fa-star"></i>';
    }
    starsContainer.innerHTML = html;
}

function renderChart(scores) {
    const ctx = document.getElementById('cvRadarChart').getContext('2d');

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: [
                'Estratégia', 'Tecnologia', 'Atração', 'Onboarding',
                'Performance', 'Liderança', 'Cultura', 'Compensação'
            ],
            datasets: [{
                label: 'O Seu Perfil',
                data: scores,
                backgroundColor: 'rgba(191, 154, 51, 0.2)',
                borderColor: '#BF9A33',
                pointBackgroundColor: '#BF9A33',
                borderWidth: 2
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: 'rgba(0,0,0,0.1)' },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    pointLabels: {
                        font: { size: 11, family: 'Poppins' },
                        color: '#666'
                    },
                    suggestedMin: 0,
                    suggestedMax: 5
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}
