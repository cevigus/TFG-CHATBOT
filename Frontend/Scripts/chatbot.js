// chatbot.js

// Función para enviar el mensaje al backend y procesar la respuesta
async function enviarMensaje() {
  // Obtener el mensaje desde el input
  const inputField = document.getElementById('input');
  const mensaje = inputField.value.trim();

  // Si el mensaje está vacío, evitamos enviar la petición
  if (!mensaje) return;

  // Opcional: Agregar el mensaje del usuario en el área de mensajes
  agregarMensaje('user', mensaje);
  
  // Enviar mensaje a Dialogflow por medio del endpoint /chat
  try {
    const respuestaChat = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: mensaje,
        sessionId: "dummy-session" // Puedes usar un valor hardcodeado si no hay usuarios reales
      })
    });
    const dataChat = await respuestaChat.json();

    // Mostrar la respuesta del bot en el área de mensajes
    agregarMensaje('bot', dataChat.response);
  } catch (error) {
    console.error('Error enviando mensaje a /chat:', error);
  }

  console.log("Mensaje a enviar:", mensaje);

  // Enviar mensaje al endpoint /mensaje para guardarlo en MongoDB
  try {
  const respuestaMensaje = await fetch('http://localhost:3000/mensaje', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: mensaje })
  });
  const dataMensaje = await respuestaMensaje.json();
  console.log('Mensaje guardado en MongoDB:', dataMensaje);
} catch (error) {
  console.error('Error guardando mensaje en /mensaje:', error);
}


  // Limpiar el input
  inputField.value = '';
}

// Función auxiliar para agregar mensajes al contenedor de mensajes
function agregarMensaje(remitente, texto) {
  const messagesDiv = document.getElementById('messages');
  const messageContainer = document.createElement('div');
  messageContainer.className = 'message-container';

  // Agregar avatar solo si es mensaje del bot (ajusta según tu CSS)
  if (remitente === 'bot') {
    const avatar = document.createElement('img');
    avatar.src = "../Imagenes/imagen.png"; // La imagen del bot
    avatar.alt = "Bot avatar";
    avatar.className = "bot-avatar";
    messageContainer.appendChild(avatar);
  }

  const messageDiv = document.createElement('div');
  // Para el bot, usamos la clase 'message bot'; para el usuario, 'message user'
  messageDiv.className = `message ${remitente}`;
  messageDiv.textContent = texto;
  messageContainer.appendChild(messageDiv);

  messagesDiv.appendChild(messageContainer);

  // Scroll automático al último mensaje (asegurado con setTimeout)
  setTimeout(() => {
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 0);
}

// Agregar el listener al botón "Enviar"
document.getElementById('send').addEventListener('click', enviarMensaje);

// También podrías enviar el mensaje al pulsar Enter en el input
document.getElementById('input').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    enviarMensaje();
  }
});


async function enviarDatosUsuario() {
  const genero = document.getElementById('genero').value;
  const edad = document.getElementById('edad').value;

  if (!genero || !edad) {
    alert("Por favor, selecciona ambos campos para enviar.");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/estadisticas-usuario", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ genero, edad })
    });

    const data = await res.json();
    console.log("Datos enviados:", data);
    alert("Tus datos se han enviado correctamente");

    // Deshabilitar campos para evitar reenvío
    document.getElementById("genero").disabled = true;
    document.getElementById("edad").disabled = true;
  } catch (err) {
    console.error("Error enviando datos:", err);
    alert("Hubo un error al enviar tus datos.");
  }
}
