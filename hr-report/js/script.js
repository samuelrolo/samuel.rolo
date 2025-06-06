// Share2Inspire HR Report Form JavaScript (front-end) – envia dados ao backend

document.addEventListener('DOMContentLoaded', function() {
    initializeForm();
    addAnimations();
});

function initializeForm() {
    const form = document.getElementById('hrReportForm');
    const submitBtn = document.getElementById('submitBtn');

    // Regista handler para submissão
    form.addEventListener('submit', handleFormSubmission);

    // Resetar estados quando o modal de sucesso fechar
    $('#successModal').on('hidden.bs.modal', function () {
        form.reset();
        form.classList.remove('was-validated');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-download me-2"></i> ACEDER AO RECURSO';
    });
    // Resetar estados quando o modal de erro fechar
    $('#errorModal').on('hidden.bs.modal', function () {
        form.classList.remove('was-validated');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-download me-2"></i> ACEDER AO RECURSO';
    });
}

async function handleFormSubmission(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = document.getElementById('submitBtn');

    // Validação nativa do Bootstrap 5
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Mostrar modal de Loading
    showLoading();

    // Recolher dados do formulário
    const data = collectFormData(form);

    try {
        // 1) Enviar dados ao backend (nosso servidor)
        const response = await fetch('/api/submeter-hr', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        const json = await response.json();
        if (!json.success) {
            hideLoading();
            showError(json.message || 'Falha ao criar contacto. Tente novamente.');
            return;
        }

        // 2) Se backend devolveu sucesso, iniciar download
        hideLoading();
        const downloadUrl = 'hr-report/assets/Share2Inspire_HR_25_MidYear_Report.pdf';
        showSuccess(downloadUrl);
    } catch (error) {
        console.error('Erro ao submeter formulário:', error);
        hideLoading();
        showError('Erro de conexão. Por favor, tente novamente.');
    }
}

// Recolhe valores do formulário num objeto
function collectFormData(form) {
    const formData = new FormData(form);
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = value.trim();
    }
    return data;
}

function showLoading() {
    const loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'));
    loadingModal.show();

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> A PROCESSAR...';
}

function hideLoading() {
    const modalInstance = bootstrap.Modal.getInstance(document.getElementById('loadingModal'));
    if (modalInstance) {
        modalInstance.hide();
    }
}

function showSuccess(downloadUrl) {
    const successModal = new bootstrap.Modal(document.getElementById('successModal'));
    successModal.show();

    // Define link manual
    const manualDownload = document.getElementById('manualDownload');
    manualDownload.href = downloadUrl;

    // Auto-download após 1 segundo
    setTimeout(() => {
        downloadFile(downloadUrl);
    }, 1000);
}

function showError(message) {
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal'));
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.show();
}

// Cria <a> temporário para forçar download
function downloadFile(url) {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Share2Inspire_HR_25_MidYear_Report.pdf');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function addAnimations() {
    // Fade-in para secções principais
    const sections = document.querySelectorAll('.report-info-section, .form-section');
    sections.forEach(section => section.classList.add('fade-in'));

    // Slide-up para o contêiner do formulário
    setTimeout(() => {
        const formContainer = document.querySelector('.form-container');
        if (formContainer) {
            formContainer.classList.add('slide-up');
        }
    }, 400);
}

// Captura erros JS não tratados
window.addEventListener('error', function(event) {
    console.error('JavaScript error:', event.error);
});

// Verifica visibilidade da página
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.log('Page hidden');
    } else {
        console.log('Page visible');
    }
});
