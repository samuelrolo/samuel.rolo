// Interceptor para formulários de pagamento
// Este script garante compatibilidade total com o backend
// Adiciona este script antes do fechamento do body em todas as páginas

document.addEventListener('DOMContentLoaded', function() {
    // Interceptar todos os formulários que possam conter pagamentos
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            // Verificar se é um formulário de pagamento (contém campo de método de pagamento)
            const hasPaymentMethod = form.querySelector('[name*="payment"], [name*="pagamento"], [name*="método"], [id*="payment"], [id*="pagamento"]');
            
            if (hasPaymentMethod) {
                // É um formulário de pagamento, interceptar o envio
                event.preventDefault();
                
                console.log('Formulário de pagamento interceptado:', form);
                
                // Coletar todos os dados do formulário
                const formData = new FormData(form);
                const paymentData = {};
                
                // Converter FormData para objeto e normalizar campos
                for (let [key, value] of formData.entries()) {
                    // Normalizar nomes de campos para o formato esperado pelo backend
                    let normalizedKey = key;
                    
                    // Normalizar campo de método de pagamento
                    if (key.toLowerCase().includes('payment') || 
                        key.toLowerCase().includes('pagamento') || 
                        key.toLowerCase().includes('método')) {
                        normalizedKey = 'paymentMethod';
                        
                        // Normalizar valor do método de pagamento
                        if (value.toLowerCase().includes('mbway') || 
                            value.toLowerCase().includes('mb way') || 
                            value.toLowerCase().includes('mb-way')) {
                            value = 'mbway';
                        } else if (value.toLowerCase().includes('multibanco') || 
                                  value.toLowerCase().includes('mb')) {
                            value = 'mb';
                        } else if (value.toLowerCase().includes('payshop')) {
                            value = 'payshop';
                        }
                    }
                    
                    // Normalizar outros campos comuns
                    if (key.toLowerCase().includes('nome') || 
                        key.toLowerCase().includes('name')) {
                        normalizedKey = 'customerName';
                    } else if (key.toLowerCase().includes('email') || 
                              key.toLowerCase().includes('mail')) {
                        normalizedKey = 'customerEmail';
                    } else if (key.toLowerCase().includes('telefone') || 
                              key.toLowerCase().includes('phone')) {
                        normalizedKey = 'customerPhone';
                    } else if (key.toLowerCase().includes('valor') || 
                              key.toLowerCase().includes('amount') || 
                              key.toLowerCase().includes('price')) {
                        normalizedKey = 'amount';
                    }
                    
                    paymentData[normalizedKey] = value;
                }
                
                // Garantir que temos um orderId
                if (!paymentData.orderId) {
                    paymentData.orderId = 'order-' + Date.now();
                }
                
                console.log('Dados normalizados:', paymentData);
                
                // Enviar para o backend usando fetch com cabeçalhos corretos
                fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    body: JSON.stringify(paymentData)
                })
                .then(response => {
                    console.log('Resposta do servidor:', response);
                    return response.json();
                })
                .then(data => {
                    console.log('Dados da resposta:', data);
                    if (data.success) {
                        // Sucesso - mostrar mensagem de confirmação
                        alert('Pagamento iniciado com sucesso! ' + data.message);
                        
                        // Limpar formulário
                        form.reset();
                    } else {
                        // Erro - mostrar mensagem de erro
                        alert('Erro ao processar pagamento: ' + (data.error || 'Erro desconhecido'));
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição:', error);
                    alert('Erro ao comunicar com o servidor. Por favor, tente novamente mais tarde.');
                });
            }
        });
    });
    
    console.log('Interceptor de formulários de pagamento inicializado');
});
