/**
 * Global Feedback Widget
 * Injects a floating feedback button and handles the modal logic.
 */

(function () {
    // 1. Inject Styles
    const style = document.createElement('style');
    style.innerHTML = `
        .feedback-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            background-color: #BF9A33; /* Golden */
            color: #fff;
            padding: 12px 24px;
            border-radius: 50px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            text-decoration: none;
            font-weight: 600;
            z-index: 9999;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            border: none;
            font-family: 'Poppins', sans-serif;
        }
        .feedback-btn:hover {
            background-color: #a57b0a;
            transform: translateY(-3px);
            color: #fff;
        }
        
        .star-rating {
            display: flex;
            flex-direction: row-reverse;
            justify-content: center;
            gap: 10px;
            font-size: 2rem;
        }
        
        .star-rating input {
            display: none;
        }
        
        .star-rating label {
            color: #ddd;
            cursor: pointer;
            transition: color 0.2s;
        }
        
        .star-rating input:checked ~ label,
        .star-rating label:hover,
        .star-rating label:hover ~ label {
            color: #BF9A33;
        }

        /* Modal specific overrides if needed */
        #feedbackWidgetModal .modal-content {
            border-radius: 16px;
            overflow: hidden;
            border: none;
            box-shadow: 0 1rem 3rem rgba(0,0,0,.175)!important;
        }
        #feedbackWidgetModal .modal-header {
            background-color: transparent;
            color: #212529;
            border-bottom: none;
            padding-bottom: 0;
        }
        #feedbackWidgetModal .modal-title {
            font-weight: 700;
            width: 100%;
            text-align: center;
        }
        #feedbackWidgetModal .btn-close {
            filter: none;
            position: absolute;
            right: 1.5rem;
            top: 1.5rem;
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML (Button + Modal)
    const container = document.createElement('div');
    container.innerHTML = `
        <!-- Floating Button -->
        <button id="openFeedbackBtn" class="feedback-btn">
            <i class="fas fa-comment-alt"></i> Feedback
        </button>

        <!-- Modal -->
        <div class="modal fade" id="feedbackWidgetModal" tabindex="-1" aria-hidden="true">
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Deixe o seu Feedback</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body text-center">
                        <p class="mb-3">Como avalia a sua experiência?</p>
                        
                        <div class="star-rating mb-4">
                            <input type="radio" id="star5" name="rating" value="5"><label for="star5" title="Excelente"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star4" name="rating" value="4"><label for="star4" title="Muito Bom"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star3" name="rating" value="3"><label for="star3" title="Bom"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star2" name="rating" value="2"><label for="star2" title="Razoável"><i class="fas fa-star"></i></label>
                            <input type="radio" id="star1" name="rating" value="1"><label for="star1" title="Mau"><i class="fas fa-star"></i></label>
                        </div>

                        <div class="text-start">
                            <label for="feedbackText" class="form-label">Comentários (Opcional)</label>
                            <textarea class="form-control" id="feedbackText" rows="3" placeholder="Partilhe a sua opinião..."></textarea>
                        </div>
                        
                        <div id="feedbackWidgetStatus" class="mt-3 d-none"></div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary fw-bold px-4 shadow-sm" id="submitFeedbackBtn" style="background-color: #BF9A33; border: none; border-radius: 8px;">Enviar Feedback</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(container);

    // 3. Logic
    const openBtn = document.getElementById('openFeedbackBtn');
    const submitBtn = document.getElementById('submitFeedbackBtn');
    let feedbackModal; // Bootstrap modal instance

    openBtn.addEventListener('click', () => {
        const modalEl = document.getElementById('feedbackWidgetModal');
        feedbackModal = new bootstrap.Modal(modalEl);
        feedbackModal.show();
    });

    submitBtn.addEventListener('click', async () => {
        const rating = document.querySelector('input[name="rating"]:checked');
        const text = document.getElementById('feedbackText').value;
        const statusDiv = document.getElementById('feedbackWidgetStatus');

        if (!rating) {
            statusDiv.innerHTML = '<div class="text-danger">Por favor, selecione uma classificação.</div>';
            statusDiv.classList.remove('d-none');
            return;
        }

        const ratingValue = rating.value;

        // Prepare Data
        // User didn't specify Name/Email fields for this modal, but the API might require it.
        // We will try to find "Visitor" or check if we can skip.
        // brevoIntegration.sendContactEmail uses {name, email, subject, message}
        // I will use "Anonymous Visitor" if not logged in (which they aren't).

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        statusDiv.classList.add('d-none');

        const data = {
            name: "Visitante (Feedback)",
            email: "feedback@share2inspire.pt", // Dummy email as it's anonymous feedback
            subject: `Feedback Website - ${ratingValue} Estrelas`,
            message: `Classificação: ${ratingValue}/5\n\nComentário:\n${text}`
        };

        try {
            if (window.brevoIntegration) {
                const result = await window.brevoIntegration.sendContactEmail(data);

                if (result.success) {
                    statusDiv.innerHTML = '<div class="text-success"><i class="fas fa-check-circle"></i> Obrigado pelo seu feedback!</div>';
                    statusDiv.classList.remove('d-none');

                    setTimeout(() => {
                        feedbackModal.hide();
                        // Reset form
                        document.querySelectorAll('input[name="rating"]').forEach(el => el.checked = false);
                        document.getElementById('feedbackText').value = '';
                        statusDiv.classList.add('d-none');
                    }, 2500);
                } else {
                    throw new Error(result.message);
                }
            } else {
                console.error("Brevo Integration not found");
                // Mock success for UI if API is missing (fallback)
                statusDiv.innerHTML = '<div class="text-danger">Erro: API indisponível.</div>';
                statusDiv.classList.remove('d-none');
            }
        } catch (error) {
            console.error(error);
            statusDiv.innerHTML = '<div class="text-danger">Erro ao enviar feedback.</div>';
            statusDiv.classList.remove('d-none');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Enviar Feedback';
        }
    });

})();
