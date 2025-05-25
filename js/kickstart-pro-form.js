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
        const statusMessage = document.getElementById('kickstartStatus') || document.createElement('div');
        
        // Garantir que o elemento de status existe
        if (!document.getElementById('kickstartStatus')) {
            statusMessage.id = 'kickstartStatus';
            kickstartForm.appendChild(statusMessage);
        }
        
        // Desabilitar botão e mostrar estado de carregamento
        submitButton.disabled = true;
        submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> A processar...';
        
        // Obter dados do formulário
        const formData = new FormData(kickstartForm);
        const data = {
            service: formData.get('service'),
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            date: formData.get('date') || '',
            time: formData.get('time') || '',
            format: formData.get('format') || '',
            message: formData.get('message') || '',
            duration: formData.get('duration') || '',
            amount: formData.get('amount') || '',
            paymentMethod: formData.get('paymentMethod') || '',
            source: 'website_service_booking'
        };
        
        // Enviar dados para o backend - MANTENDO EXATAMENTE O ENDPOINT ORIGINAL
        fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro na resposta do servidor: ' + response.status);
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                // Handle payment methods
                if (data.paymentMethod === 'mbway') {
                    // Show MBWAY payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento MB WAY</h5>
                                <p>Foi enviado um pedido de pagamento para o número ${data.phone}.</p>
                                <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
                            </div>
                        `;
                    }
                } else if (data.paymentMethod === 'multibanco') {
                    // Show Multibanco payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento por Referência Multibanco</h5>
                                <p>Entidade: ${data.entity}</p>
                                <p>Referência: ${data.reference}</p>
                                <p>Valor: ${data.amount}€</p>
                                <p>A referência é válida por 48 horas.</p>
                            </div>
                        `;
                    }
                } else if (data.paymentMethod === 'payshop') {
                    // Show Payshop payment info
                    if (statusMessage) {
                        statusMessage.innerHTML = `
                            <div class="alert alert-success">
                                <h5>Pagamento por Referência Payshop</h5>
                                <p>Referência: ${data.reference}</p>
                                <p>Valor: ${data.amount}€</p>
                                <p>A referência é válida por 48 horas.</p>
                            </div>
                        `;
                    }
                } else {
                    // Generic success message
                    if (statusMessage) {
                        statusMessage.innerHTML = '<div class="alert alert-success">Reserva processada com sucesso! Receberá um email com os detalhes.</div>';
                    }
                }
                
                // Reset form
                kickstartForm.reset();
            } else {
                // Show error message from server
                if (statusMessage) {
                    statusMessage.innerHTML = `<div class="alert alert-danger">${data.message || 'Erro ao processar pedido. Por favor tente novamente.'}</div>`;
                }
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
        })
        .catch(error => {
            console.error('Erro ao processar reserva:', error);
            
            // Show error message
            if (statusMessage) {
                statusMessage.innerHTML = '<div class="alert alert-danger">Erro ao processar pedido. Por favor tente novamente.</div>';
            }
            
            // Re-enable submit button
            submitButton.disabled = false;
            submitButton.innerHTML = 'Submeter';
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
