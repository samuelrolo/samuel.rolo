// Solução direta para o formulário de pagamento Kickstart Pro
// Este script deve ser adicionado diretamente na página servicos.html

document.addEventListener('DOMContentLoaded', function() {
    // Encontrar o formulário de pagamento Kickstart Pro
    const kickstartForm = document.querySelector('form');
    
    if (kickstartForm) {
        console.log('Formulário Kickstart Pro encontrado, aplicando solução direta');
        
        // Substituir o evento de submissão padrão
        kickstartForm.addEventListener('submit', function(event) {
            // Impedir o comportamento padrão do formulário
            event.preventDefault();
            
            console.log('Interceptando submissão do formulário Kickstart Pro');
            
            // Coletar dados do formulário
            const nome = document.querySelector('input[name="nome"], input[name="name"], input#nome, input#name').value;
            const email = document.querySelector('input[name="email"], input[type="email"], input#email').value;
            const telefone = document.querySelector('input[name="telefone"], input[name="phone"], input#telefone, input#phone').value;
            const data = document.querySelector('input[name="data"], input[type="date"], input#data').value;
            const hora = document.querySelector('input[name="hora"], input[type="time"], input#hora').value;
            const formato = document.querySelector('select[name="formato"], select#formato').value;
            const metodo = document.querySelector('select[name*="pagamento"], select[name*="payment"], select#metodo').value;
            
            // Criar objeto de dados no formato exato que o backend espera
            const paymentData = {
                customerName: nome,
                customerEmail: email,
                customerPhone: telefone,
                serviceDate: data,
                serviceTime: hora,
                serviceFormat: formato,
                paymentMethod: metodo.toLowerCase().replace(/\s+/g, ''), // Normalizar método (remover espaços)
                amount: 30, // Valor fixo para Kickstart Pro
                orderId: 'kickstart-' + Date.now() // Gerar ID único
            };
            
            console.log('Dados preparados para envio:', paymentData);
            
            // Enviar dados diretamente para o backend
            fetch('https://share2inspire-beckend.lm.r.appspot.com/api/payment/initiate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': 'https://share2inspire.pt'
                },
                body: JSON.stringify(paymentData)
            })
            .then(response => {
                console.log('Resposta recebida:', response);
                return response.json();
            })
            .then(data => {
                console.log('Dados da resposta:', data);
                if (data.success) {
                    // Sucesso - mostrar mensagem e limpar formulário
                    alert('Pagamento iniciado com sucesso! ' + data.message);
                    kickstartForm.reset();
                } else {
                    // Erro - mostrar mensagem
                    alert('Erro ao processar pagamento: ' + (data.error || 'Erro desconhecido'));
                }
            })
            .catch(error => {
                console.error('Erro na requisição:', error);
                alert('Erro ao comunicar com o servidor. Por favor, tente novamente mais tarde.');
            });
        });
        
        console.log('Solução direta aplicada ao formulário Kickstart Pro');
    } else {
        console.warn('Formulário Kickstart Pro não encontrado');
    }
});
