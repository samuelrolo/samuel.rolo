// Solução final para o formulário Kickstart Pro
// Adaptado especificamente para o HTML real do site Share2Inspire
document.addEventListener('DOMContentLoaded', function() {
    console.log('Script de solução Kickstart Pro carregado');
    
    // Encontrar o botão que abre o modal Kickstart Pro
    const kickstartButton = document.querySelector('button[data-bs-target="#kickstartModal"]');
    if (kickstartButton) {
        console.log('Botão Kickstart Pro encontrado');
    }
    
    // Interceptar o formulário quando o modal for aberto
    document.body.addEventListener('shown.bs.modal', function(event) {
        if (event.target.id === 'kickstartModal') {
            console.log('Modal Kickstart Pro aberto');
            
            // Encontrar o formulário dentro do modal
            const kickstartForm = document.getElementById('kickstartForm');
            if (kickstartForm) {
                console.log('Formulário Kickstart Pro encontrado, aplicando solução');
                
                // Substituir o evento de submissão padrão
                kickstartForm.addEventListener('submit', function(event) {
                    // Impedir o comportamento padrão do formulário
                    event.preventDefault();
                    console.log('Interceptando submissão do formulário Kickstart Pro');
                    
                    // Recolher dados do formulário
                    const nome = document.querySelector('input[name="nome"]').value;
                    const email = document.querySelector('input[name="email"]').value;
                    const telefone = document.querySelector('input[name="telefone"]').value;
                    const data = document.querySelector('input[name="data"]').value;
                    const hora = document.querySelector('input[name="hora"]').value;
                    
                    // Obter valores dos campos ocultos
                    const duracao = document.getElementById('kickstartDurationHidden').value;
                    const amount = document.getElementById('kickstartAmountHidden').value;
                    
                    // Criar iframe oculto para evitar redirecionamento
                    const iframe = document.createElement('iframe');
                    iframe.name = 'hidden_iframe';
                    iframe.style.display = 'none';
                    document.body.appendChild(iframe);
                    
                    // Criar formulário temporário para submissão tradicional
                    const tempForm = document.createElement('form');
                    tempForm.method = 'POST';
                    tempForm.action = 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate';
                    tempForm.target = 'hidden_iframe'; // Enviar para o iframe oculto
                    
                    // Adicionar campos ao formulário
                    const addField = (name, value) => {
                        const input = document.createElement('input');
                        input.type = 'hidden';
                        input.name = name;
                        input.value = value || '';
                        tempForm.appendChild(input);
                    };
                    
                    // Adicionar todos os campos necessários
                    addField('customerName', nome);
                    addField('customerEmail', email);
                    addField('customerPhone', telefone);
                    addField('serviceDate', data);
                    addField('serviceTime', hora);
                    addField('paymentMethod', 'mbway');  // Forçar mbway
                    addField('amount', amount);  // Usar o valor do campo oculto
                    addField('service', 'Kickstart Pro');
                    addField('duration', duracao);
                    addField('orderId', 'kickstart-' + Date.now());
                    
                    // Adicionar ao documento e submeter
                    document.body.appendChild(tempForm);
                    tempForm.submit();
                    
                    // Mostrar mensagem de confirmação
                    alert('Formulário enviado com sucesso! Verifique seu email para detalhes do pagamento.');
                    
                    // Fechar o modal
                    const modalElement = document.getElementById('kickstartModal');
                    const modalInstance = bootstrap.Modal.getInstance(modalElement);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                    
                    // Limpar formulário original
                    kickstartForm.reset();
                    
                    // Remover formulário temporário e iframe após submissão
                    setTimeout(() => {
                        document.body.removeChild(tempForm);
                        document.body.removeChild(iframe);
                    }, 1000);
                });
                
                console.log('Solução tradicional aplicada ao formulário Kickstart Pro');
            } else {
                console.warn('Formulário Kickstart Pro não encontrado dentro do modal');
            }
        }
    });
    
    // Inicializar o valor do preço ao carregar a página
    if (typeof updatePrice === 'function') {
        updatePrice();
    }
});
