/**
 * Formulário Kickstart Pro - Share2Inspire
 * 
 * Este ficheiro contém o código corrigido para o formulário Kickstart Pro
 * Correção principal: Garantir a exibição dos detalhes de pagamento Multibanco
 * e integração com as APIs da BREVO e IfthenPay
 */

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar o formulário Kickstart Pro
    setupKickstartForm();
    
    // Mostrar/ocultar campos específicos de MB WAY
    const paymentMethodSelect = document.getElementById('kickstartPaymentMethod');
    const mbwayFields = document.getElementById('mbwayFields');
    
    if (paymentMethodSelect && mbwayFields) {
        paymentMethodSelect.addEventListener('change', function() {
            if (this.value === 'mbway') {
                mbwayFields.style.display = 'block';
            } else {
                mbwayFields.style.display = 'none';
            }
        });
    }
    
    // Inicializar o preço com base na duração selecionada
    updatePrice();
});

/**
 * Configura o formulário Kickstart Pro
 */
function setupKickstartForm() {
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
        const mbwayPhone = formData.get('mbwayPhone') || phone;
        
        // Calcular o preço com base na duração
        const price = duration === '30min' ? 30 : 45;
        
        // Gerar ID de pedido único
        const orderId = 'KP' + Date.now();
        
        // Preparar dados no formato exato esperado pelo backend
        const data = {
            service: 'Kickstart Pro',
            name: name,
            email: email,
            phone: paymentMethod === 'mbway' ? mbwayPhone : phone,
            date: date,
            format: format,
            duration: duration,
            paymentMethod: paymentMethod,
            amount: price,
            orderId: orderId,
            description: `Kickstart Pro ${duration} - ${format} - ${date}`,
            customerName: name,
            customerEmail: email,
            customerPhone: paymentMethod === 'mbway' ? mbwayPhone : phone,
            source: 'website_service_booking'
        };
        
        console.log('Enviando dados para o backend:', data);
        
        // Primeiro, enviar dados para a API da BREVO
        if (window.brevoSDK && typeof window.brevoSDK.sendBookingConfirmation === 'function') {
            window.brevoSDK.sendBookingConfirmation(data)
                .then(() => {
                    console.log('Email de confirmação enviado com sucesso via Brevo');
                })
                .catch(error => {
                    console.error('Erro ao enviar email de confirmação via Brevo:', error);
                });
        }
        
        // Enviar dados para o backend de pagamento
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
            
            // Garantir que formMessage está visível
            formMessage.style.display = 'block';
            
            // Verificar se a resposta foi bem-sucedida
            if (data.success) {
                // Registar todos os dados recebidos para diagnóstico
                console.log('Detalhes completos da resposta:', JSON.stringify(data, null, 2));
                
                // Determinar o método de pagamento (com fallback para o método selecionado no formulário)
                const paymentMethodResponse = data.paymentMethod || paymentMethod;
                
                // Tratar diferentes métodos de pagamento
                if (paymentMethodResponse === 'mbway') {
                    // Mostrar informações de pagamento MB WAY
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento MB WAY</h5>
                            <p><strong>Número:</strong> ${data.phone || phone}</p>
                            <p><strong>Valor:</strong> ${data.amount || price}€</p>
                            <p>Foi enviado um pedido de pagamento para o seu número MB WAY.</p>
                            <p>Por favor, aceite o pagamento na aplicação MB WAY.</p>
                        </div>
                    `;
                } else if (paymentMethodResponse === 'mb' || paymentMethodResponse === 'multibanco') {
                    // Mostrar informações de pagamento Multibanco
                    // Garantir que os campos entity, reference e amount existem, mesmo que vazios
                    const entity = data.entity || data.Entity || '';
                    const reference = data.reference || data.Reference || '';
                    const amount = data.amount || data.Amount || price;
                    
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento por Referência Multibanco</h5>
                            <p><strong>Entidade:</strong> ${entity}</p>
                            <p><strong>Referência:</strong> ${reference}</p>
                            <p><strong>Valor:</strong> ${amount}€</p>
                            <p>A referência é válida por 48 horas.</p>
                        </div>
                    `;
                } else if (paymentMethodResponse === 'payshop') {
                    // Mostrar informações de pagamento Payshop
                    const reference = data.reference || data.Reference || '';
                    const amount = data.amount || data.Amount || price;
                    
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Pagamento por Referência Payshop</h5>
                            <p><strong>Referência:</strong> ${reference}</p>
                            <p><strong>Valor:</strong> ${amount}€</p>
                            <p>A referência é válida por 48 horas.</p>
                        </div>
                    `;
                } else {
                    // Mensagem genérica de sucesso com detalhes do pedido
                    formMessage.innerHTML = `
                        <div class="alert alert-success">
                            <h5>Reserva Processada com Sucesso!</h5>
                            <p>Obrigado pela sua reserva de Kickstart Pro.</p>
                            <p><strong>Data:</strong> ${date}</p>
                            <p><strong>Formato:</strong> ${format}</p>
                            <p><strong>Duração:</strong> ${duration}</p>
                            <p><strong>Valor:</strong> ${price}€</p>
                            <p>Receberá um email com os detalhes da sua reserva.</p>
                        </div>
                    `;
                }
                
                // Garantir que a mensagem é visível
                formMessage.style.display = 'block';
                
                // Scroll para a mensagem
                formMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Resetar formulário
                kickstartForm.reset();
            } else {
                // Mostrar mensagem de erro do servidor
                formMessage.innerHTML = `
                    <div class="alert alert-danger">
                        ${data.message || 'Erro ao processar pedido. Por favor tente novamente.'}
                    </div>
                `;
            }
            
            // Reabilitar botão
            submitButton.disabled = false;
            submitButton.innerHTML = 'SUBMETER E PROSSEGUIR PARA O PAGAMENTO';
        })
        .catch(error => {
            console.error('Erro ao processar reserva:', error);
            
            // Mostrar mensagem de erro
            formMessage.innerHTML = `
                <div class="alert alert-danger">
                    Erro ao processar pedido: ${error.message || 'Erro desconhecido'}. 
                    Por favor tente novamente ou contacte-nos diretamente.
                </div>
            `;
            
            // Reabilitar botão
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
