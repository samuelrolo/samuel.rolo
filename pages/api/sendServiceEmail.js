/**
 * Cloud Function: sendServiceEmail
 * Handles email sending for CV Review and Kickstart Pro services via Brevo API
 * 
 * Deploy with: gcloud functions deploy sendServiceEmail --runtime nodejs18 --trigger-http --allow-unauthenticated
 */

const functions = require('@google-cloud/functions-framework');

// Brevo API configuration
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = 'geral@share2inspire.pt';
const SENDER_NAME = 'Samuel Rolo | Share2Inspire';

// Email templates
const getEmailHtml = (type, data) => {
    const baseStyles = `
        font-family: 'Helvetica Neue', Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
    `;

    const headerStyles = `
        background: linear-gradient(135deg, #1A1A1A 0%, #2D2D2D 100%);
        padding: 40px 30px;
        text-align: center;
    `;

    const goldAccent = '#BF9A33';

    if (type === 'cv-review') {
        return `
        <div style="${baseStyles}">
            <div style="${headerStyles}">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">Revisão Profissional de CV</h1>
                <p style="color: ${goldAccent}; margin: 10px 0 0;">Share2Inspire</p>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #333;">Olá <strong>${data.userName}</strong>,</p>
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    O seu pedido de revisão profissional de CV foi registado com sucesso!
                </p>
                <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">📋 Próximos Passos</h3>
                    <ol style="color: #555; line-height: 1.8; padding-left: 20px;">
                        <li>Efetue o pagamento de <strong style="color: ${goldAccent};">${data.price}</strong> através do link abaixo</li>
                        <li>O seu CV será analisado e reescrito em até ${data.deliveryTime}</li>
                        <li>Receberá o CV otimizado por email</li>
                    </ol>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.paymentLink}" style="display: inline-block; background: ${goldAccent}; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 16px;">
                        💳 Efetuar Pagamento (${data.price})
                    </a>
                </div>
                <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                    O seu CV foi recebido em anexo. Qualquer dúvida, responda diretamente a este email.
                </p>
            </div>
            <div style="background: #1A1A1A; padding: 25px 30px; text-align: center;">
                <p style="color: rgba(255,255,255,0.6); font-size: 13px; font-style: italic; margin: 0 0 10px;">Partilhar conhecimento, Inspirar Carreiras.</p>
                <p style="color: rgba(255,255,255,0.35); font-size: 11px; margin: 0;">
                    © 2026 Share2Inspire | Samuel Rolo<br>
                    <a href="https://share2inspire.pt" style="color: ${goldAccent};">share2inspire.pt</a>
                </p>
            </div>
        </div>`;
    }

    if (type === 'kickstart-pro') {
        return `
        <div style="${baseStyles}">
            <div style="${headerStyles}">
                <h1 style="color: #fff; margin: 0; font-size: 24px;">Kickstart Pro</h1>
                <p style="color: ${goldAccent}; margin: 10px 0 0;">Sessão Individual de Carreira</p>
            </div>
            <div style="padding: 40px 30px;">
                <p style="font-size: 16px; color: #333;">Olá <strong>${data.userName}</strong>,</p>
                <p style="font-size: 16px; color: #555; line-height: 1.6;">
                    O seu interesse no Kickstart Pro foi registado! Esta sessão individual de 60 minutos foi desenhada para profissionais em início de carreira que procuram orientação estratégica.
                </p>
                <div style="background: #f8f9fa; border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="margin: 0 0 15px; color: #333; font-size: 18px;">🎯 O que inclui</h3>
                    <ul style="color: #555; line-height: 1.8; padding-left: 20px;">
                        <li>Sessão individual de 60 minutos via Google Meet</li>
                        <li>Preparação para entrevista e posicionamento estratégico</li>
                        <li>CV Review Express (análise e feedback)</li>
                        <li>Plano de ação personalizado</li>
                    </ul>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.calendarLink}" style="display: inline-block; background: #333; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 16px; margin-bottom: 15px;">
                        📅 Agendar Sessão no Calendário
                    </a>
                </div>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${data.paymentLink}" style="display: inline-block; background: ${goldAccent}; color: #fff; text-decoration: none; padding: 16px 40px; border-radius: 30px; font-weight: 600; font-size: 16px;">
                        💳 Efetuar Pagamento (${data.price})
                    </a>
                </div>
                <p style="font-size: 14px; color: #888; border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
                    Após agendar e efetuar o pagamento, receberá a confirmação com o link para a videochamada.
                </p>
            </div>
            <div style="background: #1A1A1A; padding: 25px 30px; text-align: center;">
                <p style="color: rgba(255,255,255,0.6); font-size: 13px; font-style: italic; margin: 0 0 10px;">Partilhar conhecimento, Inspirar Carreiras.</p>
                <p style="color: rgba(255,255,255,0.35); font-size: 11px; margin: 0;">
                    © 2026 Share2Inspire | Samuel Rolo<br>
                    <a href="https://share2inspire.pt" style="color: ${goldAccent};">share2inspire.pt</a>
                </p>
            </div>
        </div>`;
    }

    return '';
};

// Main Cloud Function handler
functions.http('sendServiceEmail', async (req, res) => {
    // CORS headers
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(204).send('');
        return;
    }

    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    try {
        const { service, to, subject, templateData, attachment } = req.body;

        if (!service || !to || !to.email) {
            res.status(400).json({ error: 'Missing required fields: service, to.email' });
            return;
        }

        // Build email payload for Brevo
        const emailPayload = {
            sender: {
                name: SENDER_NAME,
                email: SENDER_EMAIL
            },
            to: [{
                email: to.email,
                name: to.name || to.email.split('@')[0]
            }],
            subject: subject,
            htmlContent: getEmailHtml(service, templateData)
        };

        // Add attachment if provided (CV Review)
        if (attachment && attachment.content) {
            emailPayload.attachment = [{
                content: attachment.content,
                name: attachment.name || 'cv.pdf',
                type: attachment.type || 'application/pdf'
            }];
        }

        // Send via Brevo API
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Brevo API error:', errorData);
            res.status(500).json({
                error: 'Failed to send email',
                details: errorData.message || 'Unknown error'
            });
            return;
        }

        const result = await response.json();
        console.log('Email sent successfully:', result);

        res.status(200).json({
            success: true,
            messageId: result.messageId,
            message: `Email sent to ${to.email}`
        });

    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
});
