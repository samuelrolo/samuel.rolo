// Função para carregar o conteúdo da newsletter a partir do JSON
async function loadNewsletterContent() {
    try {
        // Carregar o ficheiro JSON
        const response = await fetch('newsletter_content.json');
        if (!response.ok) {
            throw new Error('Erro ao carregar o conteúdo da newsletter');
        }
        const data = await response.json();
        
        // Renderizar o artigo em destaque
        renderFeaturedArticle(data.featuredArticle);
        
        // Renderizar a grelha de artigos
        renderArticlesGrid(data.articles);
        
        // Atualizar as estatísticas
        updateStats(data.stats);
    } catch (error) {
        console.error('Erro:', error);
    }
}

// Função para renderizar o artigo em destaque
function renderFeaturedArticle(article) {
    const featuredPostContainer = document.querySelector('.newsletter-featured-post');
    if (!featuredPostContainer) return;
    
    featuredPostContainer.innerHTML = `
        <img src="${article.image}" alt="${article.title}" style="width: 100%; max-width: 800px;">
        <div style="padding: 30px; text-align: center; max-width: 800px;">
            <h3 style="font-size: 1.9rem; margin-bottom: 10px; color: #343a40;">${article.title}</h3>
            <p style="color: #6c757d; margin-bottom: 15px; font-size: 0.9rem;">${article.date}</p>
            <p style="font-size: 1.05rem; margin-bottom: 25px; line-height: 1.7;">${article.summary}</p>
            <a href="${article.link}" style="text-align:center; margin-top: 50px; margin-bottom: 30px; font-size: 2rem; color: #B08D57;">Ler mais</a>
        </div>
    `;
}

// Função para renderizar a grelha de artigos
function renderArticlesGrid(articles) {
    const postsGrid = document.querySelector('.newsletter-posts-grid');
    if (!postsGrid) return;
    
    // Limpar o conteúdo existente
    postsGrid.innerHTML = '';
    
    // Adicionar cada artigo à grelha
    articles.forEach(article => {
        const articleCard = document.createElement('div');
        articleCard.className = 'newsletter-post-card';
        articleCard.style = 'background-color: white; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); overflow: hidden; margin-bottom: 30px;';
        
        articleCard.innerHTML = `
            <img src="${article.image}" alt="${article.title}" style="width: 100%;">
            <div style="padding: 25px; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h4 style="font-size: 1.3rem; margin-bottom: 10px; color: #343a40;">${article.title}</h4>
                    <p style="color: #6c757d; margin-bottom: 15px; font-size: 0.8rem;">${article.date}</p>
                    <p style="font-size: 0.95rem; margin-bottom: 20px; line-height: 1.6;">${article.summary}</p>
                </div>
                <a href="${article.link}" style="color: #B08D57; text-decoration: none; font-weight: bold;">Ler mais</a>
            </div>
        `;
        
        postsGrid.appendChild(articleCard);
    });
}

// Função para atualizar as estatísticas da newsletter
function updateStats(stats) {
    // Atualizar o número de subscritores
    const subscribersElement = document.querySelector('.newsletter-stat-card:nth-child(1) div:nth-child(2)');
    if (subscribersElement) subscribersElement.textContent = stats.subscribers;
    
    // Atualizar o texto de novos subscritores
    const newSubscribersElement = document.querySelector('.newsletter-stat-card:nth-child(1) div:nth-child(3)');
    if (newSubscribersElement) newSubscribersElement.textContent = stats.newSubscribers;
    
    // Atualizar visualizações de artigos
    const articleViewsElement = document.querySelector('.newsletter-stat-card:nth-child(2) div:nth-child(2)');
    if (articleViewsElement) articleViewsElement.textContent = stats.articleViews;
    
    // Atualizar impressões totais
    const impressionsElement = document.querySelector('.newsletter-stat-card:nth-child(3) div:nth-child(2)');
    if (impressionsElement) impressionsElement.textContent = stats.totalImpressions;
}

// Carregar o conteúdo quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', loadNewsletterContent);
