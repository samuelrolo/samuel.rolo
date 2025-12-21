/**
 * CV Analysis Controller
 * Refined for Share2Inspire Editorial Guidelines.
 */

window.currentReportData = null;
window.currentCVFile = null;

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
        if (!selectedFile) return;

        // Store for later delivery
        window.currentCVFile = selectedFile;

        // UI Loading State
        setLoading(true);

        try {
            console.log("Preparing to upload:", selectedFile.name);

            // Prepare FormData
            const formData = new FormData();
            formData.append('cv_file', selectedFile);
            // Optionally send roles if user inputted (current UI doesn't have inputs for this yet, so relying on auto-detect)

            // Call Backend API
            console.log("Calling /api/services/analyze-cv...");
            const response = await fetch('/api/services/analyze-cv', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Falha na análise");
            }

            console.log("Analysis Result:", data.report);

            // Populate UI with AI Report
            window.currentReportData = data.report;
            populateResults(data.report);

            // Show Modal
            const resultsModal = new bootstrap.Modal(document.getElementById('cvResultsModal'));
            resultsModal.show();

        } catch (error) {
            console.error("Analysis Error:", error);
            alert('Erro ao analisar o CV: ' + (error.message || "Tente novamente."));
        } finally {
            setLoading(false);
        }
    });

    function setLoading(isLoading) {
        analyzeBtn.disabled = isLoading;
        if (isLoading) {
            btnSpinner.classList.remove('d-none');
            btnText.textContent = 'A analisar com AI...'; // Updated text
        } else {
            btnSpinner.classList.add('d-none');
            btnText.textContent = 'Analizar Perfil';
        }
    }
});

/**
 * Populates the results modal with the AI Report
 * Expects new JSON schema from Backend
 */
/**
 * Populates the results modal with the AI Report
 * Refined for Share2Inspire Editorial Guidelines
 */
function populateResults(report) {
    const profile = report.candidate_profile || {};
    const verdict = report.final_verdict || {};

    // 1. Header Info
    document.getElementById('resultName').textContent = profile.detected_name || "Candidato";
    document.getElementById('resultRole').textContent = profile.detected_role || "Profissional";
    document.getElementById('resultExp').textContent = `${profile.total_years_exp || 'N/D'} | ${profile.seniority || ''}`;

    // 2. Maturity Score (Convert 100 scale to 5.0)
    const score100 = verdict.score || 0;
    const score5 = (score100 / 20).toFixed(1);
    document.getElementById('maturityScore').textContent = score5;
    renderStars(score5);

    // Helper to create Strategic Bullets
    const createStrategicBullet = (item) => {
        const div = document.createElement('div');
        div.className = 'strategic-bullet';
        div.innerHTML = `
            <div class="sb-title">${item.title || ''}</div>
            <div class="sb-metric">${item.metric || ''}</div>
            <div class="sb-detail">${item.detail || ''}</div>
        `;
        return div;
    };

    // 3. Maturity & Skills
    const maturityContainer = document.getElementById('maturitySkillsContainer');
    maturityContainer.innerHTML = '';
    (report.maturity_and_skills || []).forEach(item => {
        maturityContainer.appendChild(createStrategicBullet(item));
    });

    // 4. Key Strengths
    const strengthsContainer = document.getElementById('strengthsContainer');
    strengthsContainer.innerHTML = '';
    (report.key_strengths || []).forEach(item => {
        strengthsContainer.appendChild(createStrategicBullet(item));
    });

    // 5. Evolution Roadmap
    const evolutionContainer = document.getElementById('evolutionContainer');
    evolutionContainer.innerHTML = '';
    const evolution = report.evolution_roadmap || {};
    (evolution.screen_summary || []).forEach(item => {
        evolutionContainer.appendChild(createStrategicBullet(item));
    });

    // 6. Strategic Feedback
    const strategyContainer = document.getElementById('strategicFeedbackScreen');
    const feedback = report.strategic_feedback || {};
    strategyContainer.innerHTML = feedback.screen_summary || "Análise executiva em curso...";

    // 7. Radar Chart
    updateRadarChart(report);

    // 8. Download Report Handler
    const downloadBtn = document.querySelector('.modal-footer .btn-primary');
    if (downloadBtn) {
        const newBtn = downloadBtn.cloneNode(true);
        downloadBtn.parentNode.replaceChild(newBtn, downloadBtn);
        newBtn.addEventListener('click', () => {
            if (window.ReportGenerator) {
                window.ReportGenerator.openReport(report);
            } else {
                alert("Gerador de relatórios a carregar...");
            }
        });
    }

    // 9. Payment / Human Review Handler
    setupPaymentHandler(profile.detected_name);

    // 10. Report Payment Handler
    setupReportPaymentHandler(profile.detected_name);
}

function setupPaymentHandler(candidateName) {
    const btnRequestReview = document.getElementById('btnRequestReview');
    if (btnRequestReview) {
        const newReviewBtn = btnRequestReview.cloneNode(true);
        btnRequestReview.parentNode.replaceChild(newReviewBtn, btnRequestReview);

        newReviewBtn.addEventListener('click', () => {
            bootstrap.Modal.getInstance(document.getElementById('cvResultsModal')).hide();
            new bootstrap.Modal(document.getElementById('humanReviewModal')).show();

            if (candidateName && candidateName !== "Candidato") {
                const nameInput = document.getElementById('reviewName');
                if (nameInput) nameInput.value = candidateName;
            }
        });
    }

    const btnConfirmPayment = document.getElementById('btnConfirmPayment');
    if (btnConfirmPayment) {
        const newPaymentBtn = btnConfirmPayment.cloneNode(true);
        btnConfirmPayment.parentNode.replaceChild(newPaymentBtn, btnConfirmPayment);

        newPaymentBtn.addEventListener('click', async () => {
            const name = document.getElementById('reviewName').value;
            const phone = document.getElementById('reviewPhone').value;
            const email = document.getElementById('reviewEmail').value;

            if (!name || !phone || !email) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            const statusDiv = document.getElementById('paymentStatus');
            statusDiv.classList.remove('d-none');
            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-spinner fa-spin me-2"></i>A processar pagamento MB WAY...</div>';
            newPaymentBtn.disabled = true;

            try {
                const paymentResult = await window.ifthenpayIntegration.processPayment('mbway', {
                    amount: '30.00',
                    mobileNumber: phone,
                    orderId: 'CVREV-' + Date.now(),
                    description: 'Revisão CV Profissional',
                    customerName: name,
                    customerEmail: email
                });

                if (paymentResult.success) {
                    statusDiv.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle me-2"></i>Pedido MB WAY enviado! Por favor aceite na sua app.</div>';

                    // Simple email notification call
                    if (window.brevoIntegration) {
                        await window.brevoIntegration.sendContactEmail({
                            name: name,
                            email: email,
                            subject: "Solicitação de Revisão de CV",
                            message: `Pagamento MB WAY iniciado (30€). Tel: ${phone}`
                        });
                    }

                    setTimeout(() => {
                        const modalEl = document.getElementById('humanReviewModal');
                        const modal = bootstrap.Modal.getInstance(modalEl);
                        if (modal) modal.hide();
                        alert("Obrigado! Verifique a sua app MB WAY.");
                    }, 4000);

                } else {
                    throw new Error(paymentResult.message || "Falha no pagamento");
                }

            } catch (err) {
                console.error(err);
                statusDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Erro: ${err.message}</div>`;
                newPaymentBtn.disabled = false;
            }
        });
    }
}

function renderStars(score) {
    const starsContainer = document.getElementById('maturityStars');
    if (!starsContainer) return;
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (score >= i) html += '<i class="fas fa-star text-warning"></i>';
        else if (score >= i - 0.5) html += '<i class="fas fa-star-half-alt text-warning"></i>';
        else html += '<i class="far fa-star text-warning"></i>';
    }
    starsContainer.innerHTML = html;
}

function updateRadarChart(report) {
    const ctx = document.getElementById('cvRadarChart');
    if (!ctx) return;

    if (window.myRadarChart instanceof Chart) {
        window.myRadarChart.destroy();
    }

    const radar = report.radar_data || {};
    const ats = radar.ats || 0;
    const impact = radar.impact || 0;
    const structure = radar.structure || 0;
    const market = radar.market_fit || 0;
    const readiness = radar.readiness || 0;

    window.myRadarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Compatibilidade ATS', 'Impacto do Conteúdo', 'Estrutura e Design', 'Fit de Mercado', 'Nível de Prontidão'],
            datasets: [{
                label: 'Pontuação da Análise',
                data: [ats, impact, structure, market, readiness],
                backgroundColor: 'rgba(191, 154, 51, 0.2)',
                borderColor: '#BF9A33',
                pointBackgroundColor: '#BF9A33',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: '#BF9A33'
            }]
        },
        options: {
            scales: {
                r: {
                    angleLines: { color: '#eee' },
                    grid: { color: '#eee' },
                    suggestedMin: 0,
                    suggestedMax: 100,
                    ticks: { display: false, stepSize: 20 }
                }
            },
            plugins: {
                legend: { display: false }
            },
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


// --- Contact Form Logic (Navbar) ---
document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contactForm');
    const msgInput = document.getElementById('contactMessage');
    const charCount = document.getElementById('charCount');

    if (msgInput) {
        msgInput.addEventListener('input', () => {
            if (charCount) charCount.textContent = msgInput.value.length;
        });
    }

    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';

            const statusDiv = document.getElementById('contactStatus');
            statusDiv.classList.add('d-none');
            // Reset content
            statusDiv.innerHTML = '';

            const data = {
                name: document.getElementById('contactName').value,
                email: document.getElementById('contactEmail').value,
                subject: document.getElementById('contactSubject').value,
                message: document.getElementById('contactMessage').value
            };

            try {
                if (window.brevoIntegration) {
                    const result = await window.brevoIntegration.sendContactEmail(data);

                    if (result.success) {
                        statusDiv.innerHTML = '<div class="alert alert-success mt-3"><i class="fas fa-check-circle me-2"></i>Mensagem enviada com sucesso!</div>';
                        statusDiv.classList.remove('d-none');
                        contactForm.reset();
                        if (charCount) charCount.textContent = '0';

                        setTimeout(() => {
                            try {
                                const modalEl = document.getElementById('contactModal');
                                const modal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                                modal.hide();
                            } catch (e) { }
                            statusDiv.classList.add('d-none');
                        }, 3000);
                    } else {
                        throw new Error(result.message || "Erro ao enviar.");
                    }
                } else {
                    throw new Error("Sistema de envio indisponível.");
                }
            } catch (error) {
                console.error(error);
                statusDiv.innerHTML = `<div class="alert alert-danger mt-3">Erro: ${error.message}</div>`;
                statusDiv.classList.remove('d-none');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }
});

// Report Payment Handler (1€)
function setupReportPaymentHandler(candidateName) {
    // Handler for Download Button (Redirect to Payment)
    const downloadBtns = document.querySelectorAll('.modal-footer .btn-primary');
    downloadBtns.forEach(btn => {
        if (btn.id !== 'btnConfirmPayment' && btn.id !== 'btnConfirmReportPay') {
            // This is the "Descarregar Relatório" button
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);

            newBtn.addEventListener('click', () => {
                // Close Results Modal
                try {
                    const resultsModal = bootstrap.Modal.getInstance(document.getElementById('cvResultsModal'));
                    if (resultsModal) resultsModal.hide();
                } catch (e) { }

                // Show Report Payment Modal
                const paymentModal = new bootstrap.Modal(document.getElementById('reportPaymentModal'));
                paymentModal.show();

                // Pre-fill name
                if (candidateName && candidateName !== "Candidato") {
                    const nameInput = document.getElementById('reportPayName');
                    if (nameInput) nameInput.value = candidateName;
                }
            });
        }
    });

    // Handle Payment Confirmation
    const btnConfirmReportPay = document.getElementById('btnConfirmReportPay');
    if (btnConfirmReportPay) {
        // Remove old listeners
        const newPaymentBtn = btnConfirmReportPay.cloneNode(true);
        btnConfirmReportPay.parentNode.replaceChild(newPaymentBtn, btnConfirmReportPay);

        newPaymentBtn.addEventListener('click', async () => {
            const name = document.getElementById('reportPayName').value;
            const phone = document.getElementById('reportPayPhone').value;
            const email = document.getElementById('reportPayEmail').value;

            if (!name || !phone || !email) {
                alert("Por favor, preencha todos os campos.");
                return;
            }

            const statusDiv = document.getElementById('reportPaymentStatus');
            statusDiv.classList.remove('d-none');
            statusDiv.innerHTML = '<div class="alert alert-warning"><i class="fas fa-spinner fa-spin me-2"></i>A processar pagamento MB WAY (1.00€)...</div>';
            newPaymentBtn.disabled = true;

            try {
                // Ensure integration exists
                if (!window.ifthenpayIntegration) {
                    throw new Error("Sistema de pagamentos não inicializado.");
                }

                const paymentResult = await window.ifthenpayIntegration.processPayment('mbway', {
                    amount: '1.00',
                    mobileNumber: phone,
                    orderId: 'CVREP-' + Date.now(),
                    description: 'Relatório CV Completo',
                    customerName: name,
                    customerEmail: email
                });

                if (paymentResult.success) {
                    statusDiv.innerHTML = `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            <strong>O teu pedido foi recebido.</strong> Assim que o pagamento for confirmado, receberás um email com os próximos passos.<br>
                            <small class="mt-2 d-block">O Relatório Completo de Análise de CV em PDF será enviado automaticamente por email.</small>
                        </div>
                    `;

                    // We no longer call deliver-report immediately here.
                    // The backend will handle it via the Ifthenpay callback or the user will receive it.

                    setTimeout(() => {
                        const modal = bootstrap.Modal.getInstance(document.getElementById('reportPaymentModal'));
                        if (modal) modal.hide();
                        // Reset button
                        newPaymentBtn.disabled = false;
                    }, 5000);
                } else {
                    throw new Error(paymentResult.message || "Falha no pagamento");
                }
            } catch (err) {
                console.error(err);
                statusDiv.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-circle me-2"></i>Erro: ${err.message}</div>`;
                newPaymentBtn.disabled = false;
            }
        });
    }
}


