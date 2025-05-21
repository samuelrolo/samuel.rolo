// Código para gerenciar secções condicionais
document.addEventListener("DOMContentLoaded", function() {
    // Selecionar todos os links de navegação condicional
    const conditionalLinks = document.querySelectorAll('.conditional-nav-link');
    
    // Selecionar todas as secções condicionais
    const conditionalSections = document.querySelectorAll('.conditional-section');
    
    // Adicionar evento de clique a cada link condicional
    conditionalLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Obter o alvo da secção a partir do atributo data-target
            const targetId = this.getAttribute('data-target');
            
            // Ocultar todas as secções condicionais
            conditionalSections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Remover classe ativa de todos os links condicionais
            conditionalLinks.forEach(link => {
                link.classList.remove('active');
            });
            
            // Mostrar a secção alvo
            const targetSection = document.getElementById(targetId);
            if (targetSection) {
                targetSection.classList.add('active');
                this.classList.add('active');
                
                // Rolar até a secção
                window.scrollTo({
                    top: targetSection.offsetTop - document.querySelector('header').offsetHeight,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Verificar se há um hash na URL para mostrar uma secção específica
    const hash = window.location.hash;
    if (hash) {
        const targetId = hash.substring(1); // Remover o # do início
        const targetLink = document.querySelector(`.conditional-nav-link[data-target="${targetId}"]`);
        if (targetLink) {
            // Simular um clique no link correspondente
            targetLink.click();
        }
    }
});
