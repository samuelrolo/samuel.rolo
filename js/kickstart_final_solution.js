// Solução final para formulários Kickstart Pro
// Este script substitui completamente o comportamento AJAX por submissão tradicional HTML
// Deve ser adicionado ao final da página servicos.html

document.addEventListener('DOMContentLoaded', function() {
    // Configurar todos os formulários de serviço para submissão tradicional
    const serviceForms = document.querySelectorAll('.service-form');
    
    serviceForms.forEach(form => {
        // Definir atributos para submissão tradicional
        form.setAttribute('method', 'POST');
        form.setAttribute('action', 'https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate');
        form.setAttribute('target', '_blank'); // Abre resposta em nova aba
        
        // Remover qualquer event listener existente
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        
        // Adicionar campo oculto para orderId
        const orderIdField = document.createElement('input');
        orderIdField.type = 'hidden';
        orderIdField.name = 'orderId';
        orderIdField.value = 'order-' + Date.now();
        newForm.appendChild(orderIdField);
        
        // Corrigir nomes dos campos para corresponder ao backend
        const fieldMapping = {
            'name': 'customerName',
            'email': 'customerEmail',
            'phone': 'customerPhone',
            'date': 'serviceDate',
            'time': 'serviceTime',
            'format': 'serviceFormat'
        };
        
        // Adicionar campos ocultos com nomes corretos
        Array.from(newForm.elements).forEach(field => {
            if (fieldMapping[field.name]) {
                const hiddenField = document.createElement('input');
                hiddenField.type = 'hidden';
                hiddenField.name = fieldMapping[field.name];
                
                // Copiar valor inicial
                hiddenField.value = field.value;
                
                // Adicionar evento para manter sincronizado
                field.addEventListener('input', function() {
                    hiddenField.value = this.value;
                });
                
                // Adicionar evento para select
                if (field.tagName === 'SELECT') {
                    field.addEventListener('change', function() {
                        hiddenField.value = this.value;
                    });
                }
                
                newForm.appendChild(hiddenField);
            }
        });
        
        // Garantir que o método de pagamento está correto
        const paymentMethodSelect = newForm.querySelector('#paymentMethod');
        if (paymentMethodSelect) {
            // Remover a opção Payshop se existir
            Array.from(paymentMethodSelect.options).forEach(option => {
                if (option.value === 'payshop') {
                    paymentMethodSelect.removeChild(option);
                }
            });
        }
        
        console.log('Formulário configurado para submissão tradicional:', newForm.id);
    });
    
    console.log('Solução final para formulários Kickstart Pro instalada com sucesso');
});
