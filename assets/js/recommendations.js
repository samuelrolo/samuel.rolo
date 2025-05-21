document.addEventListener('DOMContentLoaded', function() {
    // Carregar as recomendações do arquivo JSON
    const recomendacoesSection = document.getElementById('recomendacoes');
    if (!recomendacoesSection) return;

    const carouselSlides = recomendacoesSection.querySelector('.carousel-slides');
    if (!carouselSlides) return;

    const prevButton = recomendacoesSection.querySelector('.carousel-button.prev');
    const nextButton = recomendacoesSection.querySelector('.carousel-button.next');
    let currentIndex = 0;
    let slides = [];

    fetch('linkedin_recommendations.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao carregar as recomendações: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            // Limpar o container
            carouselSlides.innerHTML = '';
            
            // Adicionar cada recomendação ao carrossel
            data.recommendations.forEach(recommendation => {
                const slide = document.createElement('div');
                slide.className = 'recomendacao-card carousel-slide';
                
                const img = document.createElement('img');
                // Corrigir o caminho das imagens para apontar para a pasta assets/img/recommendations
                const imageName = recommendation.avatar.split('/').pop();
                img.src = `assets/img/recommendations/${imageName}`;
                
                // Verificar especificamente para João Lince e Joana Russinho
                if (recommendation.name === "João Miguel Lince") {
                    img.src = "assets/img/recommendations/Joao_Lince.jpeg";
                } else if (recommendation.name === "Joana Russinho") {
                    img.src = "assets/img/recommendations/default_avatar.png";
                }
                img.alt = `Foto de ${recommendation.name}`;
                img.className = 'recomendacao-foto';
                img.onerror = function() {
                    this.src = 'assets/img/recommendations/default_avatar.png';
                };
                
                const conteudo = document.createElement('div');
                conteudo.className = 'recomendacao-conteudo';
                
                const texto = document.createElement('p');
                texto.className = 'recomendacao-texto';
                texto.textContent = recommendation.text;
                
                const autor = document.createElement('p');
                autor.className = 'recomendacao-autor';
                const autorStrong = document.createElement('strong');
                autorStrong.textContent = recommendation.name;
                autor.appendChild(autorStrong);
                
                const cargo = document.createElement('p');
                cargo.className = 'recomendacao-cargo';
                cargo.textContent = recommendation.title;
                
                conteudo.appendChild(texto);
                conteudo.appendChild(autor);
                conteudo.appendChild(cargo);
                
                slide.appendChild(img);
                slide.appendChild(conteudo);
                
                carouselSlides.appendChild(slide);
                slides.push(slide);
            });

            // Configurar navegação do carrossel
            if (slides.length > 0) {
                updateCarousel();
                
                if (nextButton) {
                    nextButton.addEventListener('click', () => {
                        currentIndex = (currentIndex + 1) % slides.length;
                        updateCarousel();
                    });
                }
                
                if (prevButton) {
                    prevButton.addEventListener('click', () => {
                        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
                        updateCarousel();
                    });
                }
                
                // Ajustar o carrossel no redimensionamento da janela
                window.addEventListener('resize', updateCarousel);
            }
        })
        .catch(error => {
            console.error('Erro ao carregar as recomendações:', error);
            carouselSlides.innerHTML = '<div class="error-message">Não foi possível carregar as recomendações. Por favor, tente novamente mais tarde.</div>';
        });

    function updateCarousel() {
        if (slides.length === 0) return;
        
        const slideWidth = slides[0].offsetWidth;
        carouselSlides.style.transform = `translateX(${-currentIndex * slideWidth}px)`;
    }
});
