/**
 * Google Apps Script para integração com Share2Inspire
 * Este script cria eventos no Google Calendar quando um pagamento é confirmado.
 * 
 * Para implementar:
 * 1. Acesse https://script.google.com/
 * 2. Crie um novo projeto
 * 3. Cole este código
 * 4. Implemente como aplicação web
 * 5. Copie o URL da aplicação web para usar no backend
 */

/**
 * Função executada quando o endpoint recebe uma solicitação POST
 * @param {Object} e - Objeto de evento contendo os dados da solicitação
 * @return {TextOutput} Resposta JSON com o resultado da operação
 */
function doPost(e) {
  try {
    // Registrar solicitação recebida
    console.log("Solicitação recebida: " + e.postData.contents);
    
    // Analisar os dados recebidos
    var data = JSON.parse(e.postData.contents);
    
    // Verificar dados mínimos necessários
    if (!data.customerName || !data.appointmentDate || !data.appointmentTime) {
      throw new Error("Dados obrigatórios ausentes: nome do cliente, data ou hora");
    }
    
    // Obter detalhes da marcação
    var customerName = data.customerName;
    var appointmentDate = data.appointmentDate;
    var appointmentTime = data.appointmentTime;
    var duration = data.duration || "30min";
    
    // Calcular data/hora de início e fim
    var startDateTime;
    try {
      // Tentar diferentes formatos de data
      if (appointmentDate.includes("-")) {
        // Formato ISO: 2025-05-30
        startDateTime = new Date(appointmentDate + "T" + appointmentTime + ":00");
      } else if (appointmentDate.includes("/")) {
        // Formato PT: 30/05/2025
        var parts = appointmentDate.split("/");
        var formattedDate = parts[2] + "-" + parts[1] + "-" + parts[0];
        startDateTime = new Date(formattedDate + "T" + appointmentTime + ":00");
      } else {
        throw new Error("Formato de data não reconhecido: " + appointmentDate);
      }
      
      // Verificar se a data é válida
      if (isNaN(startDateTime.getTime())) {
        throw new Error("Data/hora inválida: " + appointmentDate + " " + appointmentTime);
      }
    } catch (dateError) {
      console.error("Erro ao processar data/hora: " + dateError);
      // Usar data/hora atual + 1 dia como fallback
      startDateTime = new Date();
      startDateTime.setDate(startDateTime.getDate() + 1);
      startDateTime.setHours(9, 0, 0, 0);
    }
    
    var endDateTime = new Date(startDateTime.getTime());
    
    // Adicionar duração
    if (duration === "15min") {
      endDateTime.setMinutes(endDateTime.getMinutes() + 15);
    } else if (duration === "30min") {
      endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    } else if (duration === "1h") {
      endDateTime.setMinutes(endDateTime.getMinutes() + 60);
    } else if (duration === "test") {
      // Para testes, usar 5 minutos
      endDateTime.setMinutes(endDateTime.getMinutes() + 5);
    } else {
      // Duração padrão de 30 minutos
      endDateTime.setMinutes(endDateTime.getMinutes() + 30);
    }
    
    // Criar descrição detalhada
    var description = "Detalhes da Marcação:\n" +
      "- Cliente: " + customerName + "\n" +
      "- Email: " + (data.customerEmail || "") + "\n" +
      "- Telefone: " + (data.customerPhone || "") + "\n" +
      "- Serviço: " + (data.description || "Kickstart Pro") + "\n" +
      "- Duração: " + duration + "\n" +
      "- Formato: " + (data.format || "Online") + "\n\n" +
      "Detalhes do Pagamento:\n" +
      "- Valor: " + (data.amount || "") + "€\n" +
      "- Método: " + (data.method || "") + "\n" +
      "- Referência: " + (data.reference || "") + "\n" +
      "- Data do Pagamento: " + (data.date || "");
    
    // Criar evento no calendário
    var calendar = CalendarApp.getDefaultCalendar();
    var event = calendar.createEvent(
      "Kickstart Pro - " + customerName,
      startDateTime,
      endDateTime,
      {
        description: description,
        location: data.format || "Online",
        guests: data.customerEmail || "",
        sendInvites: false
      }
    );
    
    // Configurar lembretes
    event.addEmailReminder(24 * 60); // 24 horas antes
    event.addPopupReminder(30);      // 30 minutos antes
    
    // Registrar sucesso
    console.log("Evento criado com sucesso: " + event.getId());
    
    // Retornar sucesso
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      eventId: event.getId(),
      eventTitle: event.getTitle(),
      eventStart: event.getStartTime().toISOString(),
      eventEnd: event.getEndTime().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    // Registrar erro
    console.error("Erro ao criar evento: " + error);
    
    // Retornar erro
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Função para testar o script diretamente no editor
 */
function testCreateEvent() {
  // Dados de teste
  var testData = {
    customerName: "Cliente Teste",
    customerEmail: "teste@example.com",
    customerPhone: "912345678",
    appointmentDate: "2025-05-30",
    appointmentTime: "10:00",
    description: "Kickstart Pro - Teste",
    duration: "30min",
    format: "Online",
    amount: "30",
    method: "MB WAY",
    reference: "TEST123",
    date: new Date().toISOString()
  };
  
  // Simular uma solicitação POST
  var mockEvent = {
    postData: {
      contents: JSON.stringify(testData)
    }
  };
  
  // Chamar doPost com os dados de teste
  var result = doPost(mockEvent);
  
  // Exibir resultado
  console.log(result.getContent());
}

/**
 * Função executada quando o endpoint recebe uma solicitação GET
 * Útil para verificar se o serviço está funcionando
 */
function doGet() {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "O serviço de integração Share2Inspire com Google Calendar está funcionando!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}
