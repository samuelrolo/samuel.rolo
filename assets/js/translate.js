// Função para traduzir o site para inglês
function translateToEnglish() {
    // Dicionário de traduções
    const translations = {
        // Navegação
        "Início": "Home",
        "Sobre": "About",
        "Serviços": "Services",
        "Sobre o Autor": "About the Author",
        "Newsletter": "Newsletter",
        "Contacto": "Contact",
        
        // Seção de serviços
        "Nossos Serviços": "Our Services",
        "Coaching": "Coaching",
        "Momentos de Inspiração": "Inspiration Moments",
        "Conteúdos Digitais": "Digital Content",
        "Revisão de CV e/ ou preparação para entrevistas": "CV Review and/or Interview Preparation",
        "Apoio individual a profissionais": "Individual support for professionals",
        "Sessões práticas e dinâmicas": "Practical and dynamic sessions",
        "Desenvolvimento de conteúdos digitais": "Development of digital content",
        "Sessão práticas e com o objetivo": "Practical session with the objective",
        "Agendar Coaching": "Schedule Coaching",
        "Agendar Sessão": "Schedule Session",
        "Solicitar Conteúdo": "Request Content",
        "Agendar Revisão": "Schedule Review",
        
        // Seção sobre o autor
        "Samuel Rolo": "Samuel Rolo",
        "Com mais de 14 anos de experiência": "With over 14 years of experience",
        "Formado em Gestão": "Graduated in Management",
        "A sua abordagem única": "His unique approach",
        "Através da Share2Inspire": "Through Share2Inspire",
        
        // Questionário
        "Descobre o Teu Arquétipo de Liderança": "Discover Your Leadership Archetype",
        "Responde a este questionário rápido": "Answer this quick questionnaire",
        "Iniciar Questionário": "Start Questionnaire",
        
        // Contato
        "Contato": "Contact",
        "Estás perante uma transformação": "You are facing a transformation",
        "Email": "Email",
        "Telefone": "Phone",
        
        // Rodapé
        "Todos os direitos reservados": "All rights reserved",
        
        // Agendamento
        "Agendar uma Sessão": "Schedule a Session",
        "Nome Completo": "Full Name",
        "Data Preferida": "Preferred Date",
        "Tipo de Serviço": "Service Type",
        "Selecione um serviço": "Select a service",
        "Mensagem (Opcional)": "Message (Optional)",
        "Enviar Pedido": "Send Request",
        
        // Recomendações
        "Recomendações": "Testimonials",
        
        // Botões
        "Traduzir para Português": "Translate to Portuguese"
    };
    
    // Função para traduzir texto
    function translateText(element) {
        if (element.nodeType === Node.TEXT_NODE) {
            const text = element.nodeValue.trim();
            if (text && translations[text]) {
                element.nodeValue = element.nodeValue.replace(text, translations[text]);
            }
        } else if (element.nodeType === Node.ELEMENT_NODE) {
            // Traduzir atributos específicos
            if (element.hasAttribute('placeholder')) {
                const placeholder = element.getAttribute('placeholder');
                if (translations[placeholder]) {
                    element.setAttribute('placeholder', translations[placeholder]);
                }
            }
            
            if (element.hasAttribute('value') && element.type !== 'email' && element.type !== 'hidden') {
                const value = element.getAttribute('value');
                if (translations[value]) {
                    element.setAttribute('value', translations[value]);
                }
            }
            
            // Recursivamente traduzir todos os nós filhos
            Array.from(element.childNodes).forEach(translateText);
        }
    }
    
    // Traduzir todo o documento
    translateText(document.body);
    
    // Alternar botão de tradução
    const translateButton = document.getElementById('translate-button');
    if (translateButton) {
        translateButton.textContent = 'Traduzir para Português';
        translateButton.onclick = translateToPortuguese;
    }
    
    // Armazenar preferência do usuário
    localStorage.setItem('language', 'en');
}

// Função para traduzir de volta para português
function translateToPortuguese() {
    // Simplesmente recarregar a página, já que o português é o idioma padrão
    localStorage.setItem('language', 'pt');
    window.location.reload();
}

// Verificar preferência de idioma ao carregar a página
document.addEventListener('DOMContentLoaded', function() {
    const language = localStorage.getItem('language');
    if (language === 'en') {
        translateToEnglish();
    }
});
