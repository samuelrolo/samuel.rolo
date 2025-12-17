const axios = require('axios');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phoneNumber, amount, email } = req.body;
  // const mbWayKey = process.env.MBWAY_KEY;
  const mbWayKey = 'BCS-378163'; // Updated API Key

  if (!mbWayKey) {
    return res.status(500).json({ error: 'Configuração em falta: MBWAY_KEY não encontrada no servidor.' });
  }

  if (!phoneNumber || !amount) {
    return res.status(400).json({ error: 'Dados em falta: Telemóvel e Valor são obrigatórios.' });
  }

  try {
    // Ifthenpay MB WAY API Endpoint
    const url = 'https://mbway.ifthenpay.com/ifthenpaymbw.asmx/SetPedidoJSON';

    // Generate a unique reference ID
    const orderId = 'MR' + Date.now();

    const params = new URLSearchParams();
    params.append('MbWayKey', mbWayKey);
    params.append('canal', '03');
    params.append('referencia', orderId);
    params.append('valor', amount);
    params.append('nrtlm', phoneNumber);
    params.append('email', email || '');
    params.append('descricao', 'Consulta Nutricao');

    // Using axios for better compatibility and error handling
    const response = await axios.post(url, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = response.data;

    // Ifthenpay returns 200 even on logical errors, we need to check the response body
    // If successful, data usually contains "Estado": "000"
    return res.status(200).json(data);

  } catch (error) {
    console.error('MB WAY API Error:', error);

    // Extract meaningful error message
    let errorDetail = error.message;
    if (error.response && error.response.data) {
      try {
        errorDetail = JSON.stringify(error.response.data);
      } catch (e) {
        errorDetail = "Erro desconhecido no servidor de pagamentos";
      }
    }

    return res.status(500).json({ error: `Erro de comunicação: ${errorDetail}` });
  }
};
