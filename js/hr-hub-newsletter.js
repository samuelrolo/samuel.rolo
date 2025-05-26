/**
 * HR Hub Newsletter Content Display - Share2Inspire
 * 
 * Este ficheiro contém o código para exibir o conteúdo da newsletter
 * na página HR Hub
 */

document.addEventListener('DOMContentLoaded', function() {
    // Carregar e exibir o conteúdo da newsletter
    loadNewsletterContent();
    
    // Inicializar o formulário de Newsletter
    setupNewsletterForm();
});

/**
 * Carrega e exibe o conteúdo da newsletter a partir do JSON
 */
function loadNewsletterContent() {
    // Verificar se o elemento de exibição da newsletter existe
    const newsletterContentContainer = document.getElementById('newsletterContent');
    if (!newsletterContentContainer) return;
    
    // Carregar o conteúdo da newsletter a partir do JSON
    // Caminho ajustado para a estrutura do repositório GitHub
    fetch('/newsletter_content.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar o conteúdo da newsletter');
            }
            return response.json();
        })
        .then(data => {
            displayNewsletterContent(data, newsletterContentContainer);
            updateNewsletterStats(data.stats);
        })
        .catch(error => {
            console.error('Erro ao carregar o conteúdo da newsletter:', error);
            newsletterContentContainer.innerHTML = '<div class="alert alert-danger">Não foi possível carregar o conteúdo da newsletter. Por favor, tente novamente mais tarde.</div>';
        });
}

/**
 * Atualiza as estatísticas da newsletter na página HR Hub
 * @param {Object} stats - Estatísticas da newsletter
 */
function updateNewsletterStats(stats) {
    const statsContainer = document.querySelector('.newsletter-stats');
    if (!statsContainer) return;
    
    const statItems = statsContainer.querySelectorAll('.stat-item');
    if (statItems.length >= 4) {
        // Atualizar os valores das estatísticas
        statItems[0].querySelector('.stat-number').textContent = stats.subscribers;
        statItems[1].querySelector('.stat-number').textContent = stats.newSubscribers;
        statItems[2].querySelector('.stat-number').textContent = stats.articleViews;
        statItems[3].querySelector('.stat-number').textContent = stats.totalImpressions;
    }
}

/**
 * Exibe o conteúdo da newsletter no container especificado
 * @param {Object} data - Dados da newsletter em formato JSON
 * @param {HTMLElement} container - Container onde o conteúdo será exibido
 */
function displayNewsletterContent(data, container) {
    // Criar estrutura HTML para o conteúdo da newsletter
    let html = `
        <div class="newsletter-content">
            <div class="row">
                <div class="col-lg-12">
                    <h2 class="section-title text-center mb-5">Newsletter HR Innovation Hub</h2>
                </div>
            </div>
            
            <!-- Artigo em Destaque -->
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
            </div>
            
            <!-- Artigos Recentes -->
            <div class="row recent-articles">
                <div class="col-lg-12">
                    <h3 class="section-subtitle mb-4">Artigos Recentes</h3>
                </div>`;
    
    // Adicionar cada artigo recente
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
    
    html += `
            </div>
        </div>
    `;
    
    // Inserir o HTML no container
    container.innerHTML = html;
}

/**
 * Configura o formulário de newsletter
 */
function setupNewsletterForm() {
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (!newsletterForm) return;
    
    newsletterForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const statusMessage = document.getElementById('newsletterMessage') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('newsletterMessage')) {
            statusMessage.id = 'newsletterMessage';
            newsletterForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(newsletterForm);
        const data = {
            email: formData.get('email'),
            name: formData.get('name') || 'Subscritor Newsletter',
            message: 'Pedido de subscrição da newsletter',
            subject: 'Subscrição Newsletter',
            source: 'website_newsletter'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend (usando o endpoint booking para evitar erro 405)
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/booking/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response);
            if (!response.ok) {
                // Tentar endpoint alternativo se o primeiro falhar
                return fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Origin': 'https://share2inspire.pt',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
            }
            return response;
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status + ' - ' + text);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Mostrar mensagem de sucesso
            statusMessage.innerHTML = '<div class="alert alert-success">Subscrição realizada com sucesso! Obrigado por subscrever a nossa newsletter.</div>';
            
            // Resetar formulário
            newsletterForm.reset();
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
            
            // Enviar email de confirmação via Brevo se disponível
            if (typeof sendBrevoEmail === 'function') {
                sendBrevoEmail({
                    email: formData.get('email'),
                    name: formData.get('name') || 'Subscritor',
                    subject: 'Confirmação de Subscrição da Newsletter HR Innovation Hub',
                    message: 'Obrigado por subscrever a nossa newsletter! Em breve receberá os nossos artigos mais recentes e insights exclusivos.'
                });
            }
            
            // Limpar mensagem após 5 segundos
            setTimeout(() => {
                statusMessage.innerHTML = '';
            }, 5000);
        })
        .catch(error => {
            console.error('Erro ao processar subscrição:', error);
            
            // Mostrar mensagem de erro
            statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'Subscrever';
        });
    });
}
