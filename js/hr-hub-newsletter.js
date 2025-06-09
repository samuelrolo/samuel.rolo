/**
 * HR Hub Newsletter e Download de Relatório - Share2Inspire
 * VERSÃO CORRIGIDA - Integração com Brevo e download direto do PDF
 */

document.addEventListener('DOMContentLoaded', function() {
    loadNewsletterContent();
    setupNewsletterForm();
    // CORREÇÃO: Configurar formulário de download do relatório HR
    setupHRReportForm();
});

/**
 * NOVO: Configurar formulário de download do relatório HR
 */
function setupHRReportForm() {
    const hrReportForm = document.getElementById('hrReportForm');
    if (!hrReportForm) {
        console.warn('Formulário de relatório HR não encontrado');
        return;
    }
    
    hrReportForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = document.getElementById('hrFormMessage');
        const emailInput = document.getElementById('hrEmail');
        
        if (!emailInput.value || !emailInput.checkValidity()) {
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Por favor, insira um email válido.
                </div>
            `;
            return;
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            const originalText = submitButton.innerHTML;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
            submitButton.originalText = originalText;
        }
        
        formMessage.innerHTML = '';
        
        const data = {
            email: emailInput.value,
            name: 'Utilizador HR Hub',
            subject: 'Download Relatório HR Trends 2025',
            message: 'Pedido de download do relatório HR Trends 2025',
            source: 'hr_hub_report_download',
            timestamp: new Date().toISOString()
        };
        
        console.log('Processando download do relatório HR:', data);
        
        // CORREÇÃO: Usar integração Brevo e fazer download direto
        processHRReportDownload(data)
            .then(result => {
                console.log('Download processado com sucesso:', result);
                
                // CORREÇÃO: Download direto do PDF
                downloadHRReport();
                
                formMessage.innerHTML = `
                    <div class="alert alert-success">
                        <h5>✅ Download Iniciado!</h5>
                        <p>📧 Também enviámos o relatório para o seu email.</p>
                        <p>📊 Obrigado por subscrever o HR Innovation Hub!</p>
                    </div>
                `;
                
                this.reset();
            })
            .catch(error => {
                console.error('Erro no download:', error);
                
                // CORREÇÃO: Mesmo com erro, permitir download direto
                downloadHRReport();
                
                formMessage.innerHTML = `
                    <div class="alert alert-warning">
                        <h5>📊 Download Iniciado!</h5>
                        <p>O relatório está a ser transferido.</p>
                        <p><small>Nota: Houve um problema ao enviar por email, mas o download continua disponível.</small></p>
                    </div>
                `;
            })
            .finally(() => {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.innerHTML = submitButton.originalText || '<i class="fas fa-download"></i> Aceder Gratuitamente';
                }
            });
    });
}

/**
 * NOVO: Processar download do relatório HR
 */
function processHRReportDownload(data) {
    return new Promise((resolve, reject) => {
        // CORREÇÃO: Enviar dados para backend para tracking
        fetch('/api/hr-downloads', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: data.email,
                timestamp: data.timestamp
            })
        })
        .then(response => response.json())
        .then(result => {
            console.log('Download registado no backend:', result);
            
            // CORREÇÃO: Usar integração Brevo se disponível
            if (window.brevoSDK && typeof window.brevoSDK.sendNewsletterSignup === 'function') {
                console.log('Usando integração Brevo para relatório HR');
                
                return window.brevoSDK.sendNewsletterSignup(data);
            } else {
                console.log('Brevo não disponível, mas tracking feito');
                return { success: true, method: 'backend_tracking' };
            }
        })
        .then(brevoResult => {
            resolve({
                success: true,
                method: 'backend_and_brevo',
                backend: true,
                brevo: brevoResult
            });
        })
        .catch(error => {
            console.warn('Erro no tracking, mas download continua:', error);
            resolve({ success: true, method: 'direct_download_only' });
        });
    });
}

/**
 * NOVO: Download direto do PDF do relatório HR
 */
function downloadHRReport() {
    // CORREÇÃO: Caminho correto para o PDF do relatório
    const pdfUrl = '/hr-report/Share2Inspire_HR_25_MidYear_Report.pdf';
    
    // Criar link temporário para download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Share2Inspire_HR_25_MidYear_Report.pdf';
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('Download do relatório HR iniciado:', pdfUrl);
}

/**
 * Carrega conteúdo da newsletter (mantido)
 */
function loadNewsletterContent() {
    const newsletterContentContainer = document.getElementById('newsletterContent');
    if (!newsletterContentContainer) return;
    
    // CORREÇÃO: Fallback se JSON não estiver disponível
    fetch('/newsletter_content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('JSON não encontrado');
            }
            return response.json();
        })
        .then(data => {
            displayNewsletterContent(data, newsletterContentContainer);
            updateNewsletterStats(data.stats);
        })
        .catch(error => {
            console.warn('JSON da newsletter não encontrado, usando conteúdo padrão:', error);
            displayDefaultContent(newsletterContentContainer);
        });
}

/**
 * NOVO: Exibir conteúdo padrão se JSON não estiver disponível
 */
function displayDefaultContent(container) {
    container.innerHTML = `
        <div class="newsletter-content">
            <div class="row">
                <div class="col-lg-12 text-center">
                    <h3>HR Innovation Hub</h3>
                    <p>Conteúdo da newsletter será carregado em breve.</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Atualiza estatísticas (mantido)
 */
function updateNewsletterStats(stats) {
    const statsContainer = document.querySelector('.newsletter-stats');
    if (!statsContainer || !stats) return;
    
    const statItems = statsContainer.querySelectorAll('.stat-item');
    if (statItems.length >= 4) {
        statItems[0].querySelector('.stat-number').textContent = stats.subscribers || '500+';
        statItems[1].querySelector('.stat-number').textContent = stats.newSubscribers || '50+';
        statItems[2].querySelector('.stat-number').textContent = stats.articleViews || '2K+';
        statItems[3].querySelector('.stat-number').textContent = stats.totalImpressions || '10K+';
    }
}

/**
 * Exibe conteúdo da newsletter (mantido)
 */
function displayNewsletterContent(data, container) {
    let html = `
        <div class="newsletter-content">
            <div class="row">
                <div class="col-lg-12">
                    <h2 class="section-title text-center mb-5">Newsletter HR Innovation Hub</h2>
                </div>
            </div>`;
    
    if (data.featuredArticle) {
        html += `
            <div class="row featured-article mb-5">
                <div class="col-lg-12">
                    <h3 class="section-subtitle mb-4">Artigo em Destaque</h3>
                </div>
                <div class="col-lg-5">
                    <div class="featured-image">
                        <img src="${data.featuredArticle.image}" alt="${data.featuredArticle.title}" class="img-fluid rounded">
                    </div>
                </div>
                <div class="col-lg-7">
                    <div class="featured-content">
                        <h4>${data.featuredArticle.title}</h4>
                        <p class="article-date">${data.featuredArticle.date}</p>
                        <p class="article-summary">${data.featuredArticle.summary}</p>
                        <a href="${data.featuredArticle.link}" target="_blank" class="btn btn-primary">Ler Artigo Completo</a>
                    </div>
                </div>
            </div>`;
    }
    
    if (data.articles && data.articles.length > 0) {
        html += `
            <div class="row recent-articles">
                <div class="col-lg-12">
                    <h3 class="section-subtitle mb-4">Artigos Recentes</h3>
                </div>`;
        
        data.articles.forEach(article => {
            html += `
                <div class="col-lg-4 col-md-6 mb-4">
                    <div class="article-card">
                        <div class="article-image">
                            <img src="${article.image}" alt="${article.title}" class="img-fluid rounded">
                        </div>
                        <div class="article-content">
                            <h5>${article.title}</h5>
                            <p class="article-date">${article.date}</p>
                            <p class="article-summary">${article.summary}</p>
                            <a href="${article.link}" target="_blank" class="btn btn-outline-primary btn-sm">Ler Mais</a>
                        </div>
                    </div>
                </div>`;
        });
        
        html += `</div>`;
    }
    
    html += `</div>`;
    container.innerHTML = html;
}

/**
 * CORREÇÃO: Configurar formulário de newsletter melhorado
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        let statusMessage = document.getElementById('newsletterMessage');
        
        if (!statusMessage) {
            statusMessage = document.createElement('div');
            statusMessage.id = 'newsletterMessage';
            statusMessage.className = 'mt-3';
            this.appendChild(statusMessage);
        }
        
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        }
        
        const formData = new FormData(this);
        const data = {
            email: formData.get('email'),
            name: formData.get('name') || 'Subscritor Newsletter',
            subject: 'Subscrição Newsletter HR Hub',
            message: 'Pedido de subscrição da newsletter HR Innovation Hub',
            source: 'hr_hub_newsletter',
            timestamp: new Date().toISOString()
        };
        
        console.log('Enviando subscrição newsletter:', data);
        
        // CORREÇÃO: Usar integração Brevo
        if (window.brevoSDK && typeof window.brevoSDK.sendNewsletterSignup === 'function') {
            window.brevoSDK.sendNewsletterSignup(data)
                .then(result => {
                    statusMessage.innerHTML = `
                        <div class="alert alert-success">
                            ✅ Subscrição realizada com sucesso! Obrigado por subscrever a nossa newsletter.
                        </div>
                    `;
                    this.reset();
                })
                .catch(error => {
                    console.error('Erro na subscrição:', error);
                    statusMessage.innerHTML = `
                        <div class="alert alert-danger">
                            Erro ao processar subscrição. Por favor tente novamente.
                        </div>
                    `;
                })
                .finally(() => {
                    if (submitButton) {
                        submitButton.disabled = false;
                        submitButton.innerHTML = 'Subscrever';
                    }
                    
                    setTimeout(() => {
                        statusMessage.innerHTML = '';
                    }, 5000);
                });
        } else {
            console.warn('Brevo não disponível para newsletter');
            statusMessage.innerHTML = `
                <div class="alert alert-warning">
                    Serviço temporariamente indisponível. Contacte-nos diretamente.
                </div>
            `;
            
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = 'Subscrever';
            }
        }
    });
}

