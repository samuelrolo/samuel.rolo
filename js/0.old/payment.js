// Sistema de pagamento para o calendário de marcações
document.addEventListener('DOMContentLoaded', function() {
    // Configuração do sistema de pagamento
    const paymentSystem = {
        // Inicializar sistema de pagamento
        init: function() {
            this.setupPaymentMethodSelection();
            this.setupPaymentConfirmation();
            console.log('Sistema de pagamento inicializado');
        },

        // Configurar seleção de método de pagamento
        setupPaymentMethodSelection: function() {
            const paymentMethods = document.querySelectorAll('.payment-method');
            paymentMethods.forEach(method => {
                method.addEventListener('click', function() {
                    // Remover seleção anterior
                    paymentMethods.forEach(m => m.classList.remove('selected'));
                    // Adicionar seleção ao método clicado
                    this.classList.add('selected');
                });
            });
        },

        // Configurar confirmação de pagamento
        setupPaymentConfirmation: function() {
            const confirmButton = document.getElementById('confirm-booking');
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    this.processPaymentFlow();
                });
            }
        },

        // Processar fluxo de pagamento
        processPaymentFlow: function() {
            // Verificar termos e condições
            if (!document.getElementById('terms-accept').checked) {
                alert('Por favor, aceite os termos e condições para continuar.');
                return;
            }

            // Verificar se todos os campos obrigatórios estão preenchidos
            const userName = document.getElementById('user-name-coaching').value;
            const userEmail = document.getElementById('user-email-coaching').value;
            const userPhone = document.getElementById('user-phone-coaching').value;
            if (!userName || !userEmail || !userPhone) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }

            // Verificar se um método de pagamento foi selecionado
            const selectedPayment = document.querySelector('.payment-method.selected');
            if (!selectedPayment) {
                alert('Por favor, selecione um método de pagamento.');
                return;
            }

            // Obter método de pagamento selecionado
            const paymentMethod = selectedPayment.getAttribute('data-method');

            // Obter detalhes da reserva
            const sessionType = document.getElementById('session-type').value;
            const sessionDuration = parseInt(document.getElementById('session-duration').value);
            const sessionQuantity = parseInt(document.getElementById('session-quantity').value);
            const finalPrice = parseFloat(document.getElementById('final-price').textContent.replace('€', ''));

            // Criar objeto de reserva
            const booking = {
                type: sessionType,
                duration: sessionDuration,
                quantity: sessionQuantity,
                userName: userName,
                userEmail: userEmail,
                userPhone: userPhone,
                price: finalPrice,
                paymentMethod: paymentMethod
            };

            // Processar pagamento com base no método selecionado
            this.processPayment(paymentMethod, booking);
        },

        // Processar pagamento
        processPayment: function(method, booking) {
            // Mostrar indicador de carregamento
            this.showLoadingIndicator('Processando pagamento...');

            // Selecionar método de pagamento apropriado
            switch(method) {
                case 'mb':
                    this.processMultibancoPayment(booking);
                    break;
                case 'mbway':
                    this.processMBWayPayment(booking);
                    break;
                case 'payshop':
                    this.processPayshopPayment(booking);
                    break;
                case 'bank-transfer':
                    this.processBankTransferPayment(booking);
                    break;
                default:
                    this.hideLoadingIndicator();
                    alert('Método de pagamento não suportado.');
                    break;
            }
        },

        // Processar pagamento Multibanco
        processMultibancoPayment: function(booking) {
            console.log('Processando pagamento Multibanco:', booking);
            
            // Preparar dados para enviar ao backend
            const paymentData = {
                paymentMethod: 'mb',
                orderId: 'order_' + Date.now(),
                amount: booking.price.toFixed(2),
                customerName: booking.userName,
                customerEmail: booking.userEmail,
                customerPhone: booking.userPhone
            };

            // Enviar pedido ao backend
            fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao processar pagamento');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Mostrar referências Multibanco
                    this.showMultibancoReferences(data, booking);
                } else {
                    throw new Error(data.error || 'Erro ao gerar referência Multibanco');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                this.hideLoadingIndicator();
                alert('Ocorreu um erro ao processar o pagamento: ' + error.message);
            });
        },

        // Processar pagamento MB WAY
        processMBWayPayment: function(booking) {
            console.log('Processando pagamento MB WAY:', booking);
            
            // Preparar dados para enviar ao backend
            const paymentData = {
                paymentMethod: 'mbway',
                orderId: 'order_' + Date.now(),
                amount: booking.price.toFixed(2),
                customerName: booking.userName,
                customerEmail: booking.userEmail,
                customerPhone: booking.userPhone
            };

            // Enviar pedido ao backend
            fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao processar pagamento');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Mostrar informações MB WAY
                    this.showMBWayInformation(data, booking);
                } else {
                    throw new Error(data.error || 'Erro ao iniciar pagamento MB WAY');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                this.hideLoadingIndicator();
                alert('Ocorreu um erro ao processar o pagamento: ' + error.message);
            });
        },

        // Processar pagamento Payshop
        processPayshopPayment: function(booking) {
            console.log('Processando pagamento Payshop:', booking);
            
            // Preparar dados para enviar ao backend
            const paymentData = {
                paymentMethod: 'payshop',
                orderId: 'order_' + Date.now(),
                amount: booking.price.toFixed(2),
                customerName: booking.userName,
                customerEmail: booking.userEmail,
                customerPhone: booking.userPhone
            };

            // Enviar pedido ao backend
            fetch('/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(paymentData)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro ao processar pagamento');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    // Mostrar referência Payshop
                    this.showPayshopReference(data, booking);
                } else {
                    throw new Error(data.error || 'Erro ao gerar referência Payshop');
                }
            })
            .catch(error => {
                console.error('Erro:', error);
                this.hideLoadingIndicator();
                alert('Ocorreu um erro ao processar o pagamento: ' + error.message);
            });
        },

        // Processar pagamento por transferência bancária
        processBankTransferPayment: function(booking) {
            console.log('Processando pagamento por transferência bancária:', booking);
            
            // Mostrar informações de transferência bancária
            this.showBankTransferInformation(booking);
        },

        // Mostrar referências Multibanco
        showMultibancoReferences: function(data, booking) {
            this.hideLoadingIndicator();
            
            // Criar e mostrar modal com referências
            const modalHtml = `
                <div id="payment-modal" class="modal" style="display: block;">
                    <div class="modal-content" style="max-width: 500px;">
                        <span class="close" onclick="document.getElementById('payment-modal').remove()">&times;</span>
                        <h2>Pagamento por Multibanco</h2>
                        <div class="payment-info">
                            <p>Por favor, utilize os seguintes dados para efetuar o pagamento:</p>
                            <div class="mb-references">
                                <div class="mb-reference-item">
                                    <span>Entidade:</span>
                                    <strong>${data.entity}</strong>
                                </div>
                                <div class="mb-reference-item">
                                    <span>Referência:</span>
                                    <strong>${data.reference}</strong>
                                </div>
                                <div class="mb-reference-item">
                                    <span>Valor:</span>
                                    <strong>${data.amount}€</strong>
                                </div>
                            </div>
                            <p class="mb-note">Esta referência é válida até ${data.expiryDate || 'N/A'}.</p>
                            <p>Após efetuar o pagamento, receberá um email de confirmação.</p>
                        </div>
                        <button onclick="document.getElementById('payment-modal').remove()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Fechar</button>
                    </div>
                </div>
            `;
            
            this.showPaymentModal(modalHtml);
            
            // Enviar email com detalhes da reserva
            this.sendBookingConfirmationEmail(booking, data);
        },

        // Mostrar informações MB WAY
        showMBWayInformation: function(data, booking) {
            this.hideLoadingIndicator();
            
            // Criar e mostrar modal com informações MB WAY
            const modalHtml = `
                <div id="payment-modal" class="modal" style="display: block;">
                    <div class="modal-content" style="max-width: 500px;">
                        <span class="close" onclick="document.getElementById('payment-modal').remove()">&times;</span>
                        <h2>Pagamento por MB WAY</h2>
                        <div class="payment-info">
                            <p>Foi enviado um pedido de pagamento para o seu telemóvel:</p>
                            <div class="mbway-info">
                                <div class="mbway-info-item">
                                    <span>Telemóvel:</span>
                                    <strong>${booking.userPhone}</strong>
                                </div>
                                <div class="mbway-info-item">
                                    <span>Valor:</span>
                                    <strong>${data.amount}€</strong>
                                </div>
                            </div>
                            <p class="mbway-note">Por favor, aceite o pedido na aplicação MB WAY.</p>
                            <p>Após confirmar o pagamento, receberá um email de confirmação.</p>
                        </div>
                        <button onclick="document.getElementById('payment-modal').remove()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Fechar</button>
                    </div>
                </div>
            `;
            
            this.showPaymentModal(modalHtml);
            
            // Enviar email com detalhes da reserva
            this.sendBookingConfirmationEmail(booking, data);
        },

        // Mostrar referência Payshop
        showPayshopReference: function(data, booking) {
            this.hideLoadingIndicator();
            
            // Criar e mostrar modal com referência Payshop
            const modalHtml = `
                <div id="payment-modal" class="modal" style="display: block;">
                    <div class="modal-content" style="max-width: 500px;">
                        <span class="close" onclick="document.getElementById('payment-modal').remove()">&times;</span>
                        <h2>Pagamento por Payshop</h2>
                        <div class="payment-info">
                            <p>Por favor, utilize a seguinte referência para efetuar o pagamento em qualquer agente Payshop ou CTT:</p>
                            <div class="payshop-reference">
                                <div class="payshop-reference-item">
                                    <span>Referência:</span>
                                    <strong>${data.reference}</strong>
                                </div>
                                <div class="payshop-reference-item">
                                    <span>Valor:</span>
                                    <strong>${data.amount}€</strong>
                                </div>
                            </div>
                            <p class="payshop-note">Esta referência é válida até ${data.expiryDate || 'N/A'}.</p>
                            <p>Após efetuar o pagamento, receberá um email de confirmação.</p>
                        </div>
                        <button onclick="document.getElementById('payment-modal').remove()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Fechar</button>
                    </div>
                </div>
            `;
            
            this.showPaymentModal(modalHtml);
            
            // Enviar email com detalhes da reserva
            this.sendBookingConfirmationEmail(booking, data);
        },

        // Mostrar informações de transferência bancária
        showBankTransferInformation: function(booking) {
            this.hideLoadingIndicator();
            
            // Criar e mostrar modal com informações de transferência
            const modalHtml = `
                <div id="payment-modal" class="modal" style="display: block;">
                    <div class="modal-content" style="max-width: 500px;">
                        <span class="close" onclick="document.getElementById('payment-modal').remove()">&times;</span>
                        <h2>Pagamento por Transferência Bancária</h2>
                        <div class="payment-info">
                            <p>Por favor, utilize os seguintes dados para efetuar a transferência:</p>
                            <div class="bank-info">
                                <div class="bank-info-item">
                                    <span>Banco:</span>
                                    <strong>Banco Share2Inspire</strong>
                                </div>
                                <div class="bank-info-item">
                                    <span>IBAN:</span>
                                    <strong>PT50 1234 5678 9012 3456 7890 1</strong>
                                </div>
                                <div class="bank-info-item">
                                    <span>BIC/SWIFT:</span>
                                    <strong>ABCDEFGHXXX</strong>
                                </div>
                                <div class="bank-info-item">
                                    <span>Beneficiário:</span>
                                    <strong>Share2Inspire</strong>
                                </div>
                                <div class="bank-info-item">
                                    <span>Valor:</span>
                                    <strong>${booking.price.toFixed(2)}€</strong>
                                </div>
                                <div class="bank-info-item">
                                    <span>Descrição:</span>
                                    <strong>Reserva ${booking.userName}</strong>
                                </div>
                            </div>
                            <p class="bank-note">Após efetuar a transferência, envie o comprovativo para srshare2inspire@gmail.com.</p>
                        </div>
                        <button onclick="document.getElementById('payment-modal').remove()" class="btn btn-primary" style="width: 100%; margin-top: 20px;">Fechar</button>
                    </div>
                </div>
            `;
            
            this.showPaymentModal(modalHtml);
            
            // Enviar email com detalhes da reserva
            this.sendBookingConfirmationEmail(booking, {
                method: 'bank-transfer',
                amount: booking.price.toFixed(2)
            });
        },

        // Mostrar modal de pagamento
        showPaymentModal: function(modalHtml) {
            const modalContainer = document.createElement('div');
            modalContainer.innerHTML = modalHtml;
            document.body.appendChild(modalContainer.firstElementChild);
        },

        // Enviar email de confirmação da reserva
        sendBookingConfirmationEmail: function(booking, paymentData) {
            // Aqui você pode implementar o envio de email
            console.log('Enviando email de confirmação para:', booking.userEmail);
            console.log('Detalhes da reserva:', booking);
            console.log('Detalhes do pagamento:', paymentData);
            
            // Simular envio bem-sucedido
            setTimeout(() => {
                console.log('Email de confirmação enviado com sucesso!');
            }, 1000);
        },

        // Mostrar indicador de carregamento
        showLoadingIndicator: function(message) {
            // Criar e mostrar indicador de carregamento
            const loadingHtml = `
                <div id="loading-indicator" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 9999;">
                    <div style="background-color: white; padding: 20px; border-radius: 5px; text-align: center;">
                        <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
                        <p style="margin-top: 10px;">${message || 'Carregando...'}</p>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            
            const loadingContainer = document.createElement('div');
            loadingContainer.innerHTML = loadingHtml;
            document.body.appendChild(loadingContainer.firstElementChild);
        },

        // Esconder indicador de carregamento
        hideLoadingIndicator: function() {
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
        }
    };

    // Inicializar sistema de pagamento
    paymentSystem.init();
});
