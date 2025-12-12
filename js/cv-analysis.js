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
        strengths: generateStrengths(matchedSkills, estimatedYears),
        recommendation: generateRecommendation(averageScore, matchedSkills)
    };
}

// Helpers
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function detectName(text) {
    // Very naive name detection (first line usually)
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length > 0) return lines[0].substring(0, 30); // Cap at 30 chars
    return null;
}

function detectRole(text) {
    if (text.toLowerCase().includes('diretor')) return "Diretor de Recursos Humanos";
    if (text.toLowerCase().includes('manager')) return "HR Manager";
    if (text.toLowerCase().includes('técnico')) return "Técnico de RH";
    if (text.toLowerCase().includes('consultor')) return "Consultor de RH";
    return "Profissional de RH";
}

function generateStrengths(skills, years) {
    let strengths = [];
    if (years > 5) strengths.push("Sólida experiência profissional");
    if (skills.length > 5) strengths.push("Perfil multifacetado com várias competências");
    if (skills.includes('liderança')) strengths.push("Aptidão para gestão de equipas");
    if (skills.includes('people analytics')) strengths.push("Orientação para dados (Data-driven)");
    if (strengths.length === 0) strengths.push("Potencial de crescimento identificado");
    return strengths;
}

function generateRecommendation(score, skills) {
    if (score >= 4) return "Perfil de excelência! Considere focar em mentoria estratégica e inovação disruptiva.";
    if (score >= 3) return "Perfil sólido. Sugerimos aprofundar competências em 'People Analytics' e digitalização de processos.";
    return "Recomendamos investir em formação base de RH e desenvolver soft skills de comunicação.";
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
