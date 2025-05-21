document.addEventListener('DOMContentLoaded', function() {
    // Survey Widget Modal
    const openSurveyWidgetBtn = document.getElementById('open-survey-widget');
    const surveyWidgetContainer = document.getElementById('survey-widget-container');
    const closeSurveyWidgetBtn = document.querySelector('.close-survey-widget');
    
    if (openSurveyWidgetBtn && surveyWidgetContainer) {
        // Abrir o widget do questionário
        openSurveyWidgetBtn.addEventListener('click', function() {
            surveyWidgetContainer.style.display = 'flex';
            document.body.style.overflow = 'hidden'; // Impedir rolagem da página
            
            // Garantir que o iframe é carregado corretamente
            const surveyIframe = surveyWidgetContainer.querySelector('iframe');
            if (surveyIframe) {
                // Recarregar o iframe para garantir conteúdo atualizado
                surveyIframe.src = surveyIframe.src;
            }
        });
        
        // Fechar o widget do questionário
        if (closeSurveyWidgetBtn) {
            closeSurveyWidgetBtn.addEventListener('click', function() {
                surveyWidgetContainer.style.display = 'none';
                document.body.style.overflow = 'auto'; // Restaurar rolagem da página
            });
        }
        
        // Fechar o widget ao clicar fora do conteúdo
        surveyWidgetContainer.addEventListener('click', function(event) {
            if (event.target === surveyWidgetContainer) {
                surveyWidgetContainer.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // Fechar o widget com a tecla ESC
        document.addEventListener('keydown', function(event) {
            if (event.key === 'Escape' && surveyWidgetContainer.style.display === 'flex') {
                surveyWidgetContainer.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
});
