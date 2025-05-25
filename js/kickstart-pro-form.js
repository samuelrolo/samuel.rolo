/**
 * Formulário Kickstart Pro - Share2Inspire
 * Este ficheiro contém a lógica específica para o formulário Kickstart Pro
 * IMPORTANTE: Este ficheiro preserva exatamente a lógica original que já estava a funcionar
 * Não foram feitas alterações na funcionalidade, apenas isolamento do código
 */

// Esperar pelo carregamento completo do DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar apenas o formulário Kickstart Pro
    setupKickstartProForm();
});

/**
 * Configura o formulário Kickstart Pro
 */
function setupKickstartProForm() {
    const kickstartForm = document.getElementById('kickstartForm');
    
    if (!kickstartForm) return;
    
    kickstartForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitButton = this.querySelector('button[type="submit"]');
        const formMessage = this.querySelector('.form-message') || document.createElement('div');
        
        // Garantir que o elemento de mensagem existe
        if (!this.querySelector('.form-message')) {
            formMessage.className = 'form-message mt-3';
            kickstartForm.appendChild(formMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(kickstartForm);
        
        // Obter valores específicos para garantir o formato correto
        const name = formData.get('name') || '';
        const email = formData.get('email') || '';
        const phone = formData.get('phone') || '';
        const date = formData.get('date') || '';
        const format = formData.get('format') || 'Online';
        const duration = formData.get('duration') || '30min';
        const paymentMethod = formData.get('paymentMethod') || 'mb';
        
        // Calcular o preço com base na duração
        const price = duration === '30min' ? 30 : 45;
        
        // Gerar ID de pedido único
        const orderId = 'KP' + Date.now();
        
        // Preparar dados no formato exato esperado pelo backend
        const data = {
            service: 'Kickstart Pro',
            name: name,
            email: email,
            phone: phone,
            date: date,
            format: format,
            duration: duration,
            paymentMethod: paymentMethod,
            amount: price,
            orderId: orderId,
            description: `Kickstart Pro ${duration} - ${format} - ${date}`,
            customerName: name,
            customerEmail: email,
            customerPhone: phone,
            source: 'website_service_booking'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Enviar dados para o backend - MANTENDO EXATAMENTE O ENDPOINT ORIGINAL
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Origin': 'https://share2inspire.pt',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Resposta do servidor:', response.status, response.statusText);
            
            if (!response.ok) {
                return response.text().then(text => {
                    console.error('Erro na resposta do servidor:', response.status, text);
                    throw new Error('Erro na resposta do servidor: ' + response.status);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Dados recebidos do servidor:', data);
            
            // Remover a mensagem genérica de sucesso que pode estar a sobrepor-se
            const genericSuccessMessage = document.querySelector('.alert-success');
            if (genericSuccessMessage) {
                genericSuccessMessage.remove();
            }
            
            if (data.success) {
                // Handle payment methods
                if (data.paymentMethod === 'mbway') {
                    // Show MBWAY payment info
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento MB WAY</h5>
                            <p>Foi enviado um pedido de pagamento para o número ${data.phone}.</p>
                            <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
                        </div>
                    `;
                } else if (data.paymentMethod === 'mb') {
                    // Show Multibanco payment info with detailed debugging
                    console.log('Detalhes Multibanco:', {
                        entity: data.entity || 'Não disponível',
                        reference: data.reference || 'Não disponível',
                        amount: data.amount || 'Não disponível'
                    });
                    
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento por Referência Multibanco</h5>
                            <p><strong>Entidade:</strong> ${data.entity || 'Aguardando...'}</p>
                            <p><strong>Referência:</strong> ${data.reference || 'Aguardando...'}</p>
                            <p><strong>Valor:</strong> ${data.amount || price}€</p>
                            <p>A referência é válida por 48 horas.</p>
                        </div>
                    `;
                } else if (data.paymentMethod === 'payshop') {
                    // Show Payshop payment info with detailed debugging
                    console.log('Detalhes Payshop:', {
                        reference: data.reference || 'Não disponível',
                        amount: data.amount || 'Não disponível'
                    });
                    
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento por Referência Payshop</h5>
                            <p><strong>Referência:</strong> ${data.reference || 'Aguardando...'}</p>
                            <p><strong>Valor:</strong> ${data.amount || price}€</p>
                            <p>A referência é válida por 48 horas.</p>
                        </div>
                    `;
                } else {
                    // Generic success message
                    formMessage.innerHTML = '<div class="alert alert-success">Reserva processada com sucesso! Receberá um email com os detalhes.</div>';
                }
                
                // Garantir que a mensagem é visível
                formMessage.style.display = 'block';
                
                // Scroll para a mensagem
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Reset form
                kickstartForm.reset();
            } else {
                // Show error message from server
                formMessage.innerHTML = `<div class="alert alert-danger">${data.message || 'Erro ao processar pedido. Por favor tente novamente.'}</div>`;
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
        })
        .catch(error => {
            console.error('Erro ao processar reserva:', error);
            
            // Show error message
            formMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
        });
    });
}

// Função para atualizar o preço com base na duração selecionada
function updatePrice() {
    const duration = document.getElementById('kickstartDuration').value;
    const priceElement = document.getElementById('kickstartPrice');
    
    if (priceElement) {
        if (duration === '30min') {
            priceElement.textContent = '30€';
        } else {
            priceElement.textContent = '45€';
        }
        
        // Update hidden field in form
        const hiddenField = document.getElementById('kickstartDurationHidden');
        if (hiddenField) {
            hiddenField.value = duration;
        }
    }
}
