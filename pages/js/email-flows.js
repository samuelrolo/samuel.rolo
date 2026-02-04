/**
 * Email Flows for Share2Inspire Services
 * Handles email confirmations via Brevo API
 * 
 * Services:
 * - CV Review (25€): Sends confirmation email with CV attachment + payment link
 * - Kickstart Pro (35€): Sends confirmation email with calendar link + payment link
 */

const EMAIL_CONFIG = {
    // Brevo API endpoint (via backend proxy for security)
    API_ENDPOINT: 'https://europe-west1-share2inspire-beckend.cloudfunctions.net/sendServiceEmail',

    // Sender details
    SENDER_NAME: 'Samuel Rolo | Share2Inspire',
    SENDER_EMAIL: 'srshare2inspire@gmail.com',

    // Payment links (MB WAY reference generation)
    MB_WAY_CV_REVIEW: 'https://share2inspire.pt/pages/pagamento.html?service=cv-review&amount=25',
    MB_WAY_KICKSTART: 'https://share2inspire.pt/pages/pagamento.html?service=kickstart-pro&amount=35',

    // Calendar booking link
    CALENDAR_LINK: 'https://calendar.google.com/calendar/appointments/schedules/AcZssZ0Y2G3Gg6N94SBG-W1C-JnJKV2'
};

/**
 * Convert file to base64 for email attachment
 * @param {File} file - The file to convert
 * @returns {Promise<{content: string, name: string, type: string}>}
 */
async function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = reader.result.split(',')[1]; // Remove data:...;base64, prefix
            resolve({
                content: base64,
                name: file.name,
                type: file.type || 'application/octet-stream'
            });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Send CV Review confirmation email
 * @param {string} email - Recipient email
 * @param {File} cvFile - The uploaded CV file (PDF/DOCX)
 * @param {string} name - Optional: User's name
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendCVReviewConfirmation(email, cvFile, name = '', instructions = '', photoFile = null) {
    try {
        // Convert file to base64
        const fileData = await fileToBase64(cvFile);

        // Prepare email payload
        const payload = {
            service: 'cv-review',
            to: {
                email: email,
                name: name || email.split('@')[0]
            },
            subject: 'Confirmação - Revisão Profissional de CV | Share2Inspire',
            templateData: {
                userName: name || 'Candidato',
                serviceName: 'Revisão Profissional de CV',
                price: '25€',
                paymentLink: EMAIL_CONFIG.MB_WAY_CV_REVIEW,
                deliveryTime: '5 dias úteis',
                description: 'Elaboração e reescrita do seu CV por um especialista sénior com mais de 14 anos de experiência em recrutamento e transformação de RH.',
                instructions: instructions || 'N/A'
            },
            attachment: fileData
        };

        // If photo provided, add it as second attachment (handled by backend or merged)
        // For now, let's assume backend can handle multiple attachments or we ignore it for V1.
        // Actually, let's treat photo as a separate attachment if backend supports it.
        if (photoFile) {
            const photoData = await fileToBase64(photoFile);
            payload.photoAttachment = photoData;
        }

        // Send via backend proxy
        const response = await fetch(EMAIL_CONFIG.API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to send email');
        }

        return {
            success: true,
            message: `Email de confirmação enviado para ${email}. Verifique a sua caixa de entrada para prosseguir com o pagamento.`
        };

    } catch (error) {
        console.error('CV Review email error:', error);
        return {
            success: false,
            message: `Erro ao enviar email: ${error.message}. Por favor, tente novamente ou contacte-nos diretamente.`
        };
    }
}

/**
 * Send Kickstart Pro confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - User's name
 * @param {Object} sessionData - Optional session booking data
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function sendKickstartConfirmation(email, name, sessionData = {}) {
    try {
        const payload = {
            name: name,
            email: email,
            phone: sessionData.phone,
            objectives: sessionData.objectives,
            date: sessionData.date // Optional
        };

        // Call NEW backend endpoint - MUST BE ABSOLUTE URL
        const BACKEND_URL = 'https://share2inspire-backend-1n.r.appspot.com';
        const response = await fetch(`${BACKEND_URL}/api/services/kickstart-confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to request Kickstart');
        }

        const data = await response.json();

        return {
            success: true,
            message: data.message || `Pedido recebido. Verifique o seu telemóvel e email.`
        };

    } catch (error) {
        console.error('Kickstart Pro error:', error);
        return {
            success: false,
            message: `Erro: ${error.message}. Tente novamente.`
        };
    }
}

/**
 * Validate email format
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate file type (PDF or DOCX)
 * @param {File} file
 * @returns {boolean}
 */
function isValidCVFile(file) {
    const allowedTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/msword'
    ];
    const allowedExtensions = ['.pdf', '.docx', '.doc'];

    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some(ext =>
        file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension;
}

// Export functions for use in servicos.html
if (typeof window !== 'undefined') {
    window.EmailFlows = {
        sendCVReviewConfirmation,
        sendKickstartConfirmation,
        isValidEmail,
        isValidCVFile,
        EMAIL_CONFIG
    };
}
