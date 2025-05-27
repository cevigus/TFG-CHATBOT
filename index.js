const express = require('express');
const path = require('path'); // Necesario para construir rutas correctas
const bodyParser = require('body-parser');
const cors = require('cors');
const { sendMessageToDialogflow } = require('./Backend/dialogflowClient'); // Asegúrate de tener este archivo configurado
const mongoose = require('mongoose');
require('dotenv').config({ path: './Backend/.env' });




// Inicia la aplicación Express
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Conectar a MongoDB

console.log("URI de MongoDB:", process.env.MONGODB_URI);


mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('🟢 Conectado a MongoDB Atlas');
}).catch(err => {
  console.error('🔴 Error conectando a MongoDB Atlas:', err);
});

// Crear el esquema y modelo para los mensajes
const messageSchema = new mongoose.Schema({
  message: String,
  emotion: String, // Se almacenará la emoción detectada: 'alegria', 'ira', 'miedo', 'tristeza' o 'neutral'
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

const Message = mongoose.model('Message', messageSchema);


const usuarioSchema = new mongoose.Schema({
  genero: String,
  edad: String,
  timestamp: { type: Date, default: Date.now }
}, { versionKey: false });

const Usuario = mongoose.model("Usuario", usuarioSchema);

function detectarEmocion(mensaje) {
  const lower = mensaje.toLowerCase();

  const emociones = {
    alegria: ["alegre", "alegria", "feliz", "contento", "entusiasmado", "emocionado"],
    ira: ["enojado", "furioso", "molesto", "ira", "rabia", "enfado"],
    miedo: ["asustado", "miedo", "aterrorizado", "nervioso", "ansioso", "temor"],
    tristeza: ["triste", "tristeza", "deprimido", "desanimado", "melancolico", "llorando"],
    asco: ["asco", "repugnante", "desagradable", "repulsivo", "horrible"]
  };

  for (const [emocion, palabrasClave] of Object.entries(emociones)) {
    if (palabrasClave.some(palabra => lower.includes(palabra))) {
      return emocion;
    }
  }

  return 'neutral'; 
}


  

// Endpoint para enviar mensaje a Dialogflow y obtener respuesta
app.post('/chat', async (req, res) => {
  const { message, sessionId } = req.body;
  try {
    // (Opcional) Si quieres guardar el mensaje antes de enviarlo,
    // puedes descomentar estas líneas y mover la lógica aquí.
    // const nuevoMensaje = new Message({ userId: sessionId, text: message });
    // await nuevoMensaje.save();

    const response = await sendMessageToDialogflow(message, sessionId);
    res.json({ response: response });
  } catch (error) {
    console.error('Error con Dialogflow: ', error);
    res.status(500).json({ error: 'Error al comunicarse con Dialogflow' });
  }
});

// Endpoint para guardar mensajes en MongoDB
app.post('/mensaje', async (req, res) => {
    console.log("Datos recibidos en /mensaje:", req.body);
    const { message } = req.body;

      // Detectar la emoción del mensaje
  const emocionDetectada = detectarEmocion(message);
  console.log("➡️ Emoción detectada:", emocionDetectada);

  if (emocionDetectada === 'neutral') {
  return res.status(200).json({ message: 'Mensaje ignorado por ser neutral' });
}


  // Crear el documento con el mensaje y la emoción
  const nuevoMensaje = new Message({ 
    message: message, 
    emotion: emocionDetectada 
  });




    try {
      await nuevoMensaje.save();
      res.status(200).json({ message: '✅ Mensaje guardado en MongoDB' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: '🔴 Error guardando el mensaje', details: err });
    }
  });
  
  app.get('/estadisticas', async (req, res) => {
  try {
    const resultados = await Message.aggregate([
  {
    $group: {
      _id: "$emotion",
      cantidad: { $sum: 1 }
    }
  },
  {
    $match: {
     _id: { $nin: ["neutral", null] }  // excluye neutral y null
    }

  },

  {
    $group: {
      _id: null,
      total: { $sum: "$cantidad" },
      emociones: { $push: { emotion: "$_id", cantidad: "$cantidad" } }
    }
  },
  { $unwind: "$emociones" },
{
    $project: {
        _id: 0,
        emotion: "$emociones.emotion",
        cantidad: "$emociones.cantidad",
        porcentaje: { $multiply: [{ $divide: ["$emociones.cantidad", "$total"] }, 100] }
    }
  }
]);
           


    res.json(resultados);
  } catch (error) {
    console.error("Error en /estadisticas:", error);
    res.status(500).json({ error: "Error al generar estadísticas" });
  }
});


app.post('/estadisticas-usuario', async (req, res) => {
  try {
    const { genero, edad } = req.body;

    if (!genero || !edad) {
      return res.status(400).json({ error: "Faltan datos" });
    }

    const nuevoUsuario = new Usuario({ genero, edad });
    await nuevoUsuario.save();

    res.json({ mensaje: "Datos guardados correctamente" });
  } catch (err) {
    console.error("Error guardando usuario:", err);
    res.status(500).json({ error: "Error al guardar datos" });
  }
});



//Endpoint usuario anonimo
app.get('/estadisticas-usuario', async (req, res) => {
  try {
    const generoStats = await Usuario.aggregate([
      { $group: { _id: "$genero", cantidad: { $sum: 1 } } }
    ]);

const edadStats = await Usuario.aggregate([
  { 
    $group: { 
      _id: "$edad", 
      cantidad: { $sum: 1 } 
    }
  },
  { 
    $sort: { _id: 1 } // Ordenar los rangos de edad correctamente
  }
]);


    console.log("Datos generados:", { generos: generoStats, edades: edadStats });
    res.json({ generos: generoStats, edades: edadStats });
  } catch (err) {
    console.error("Error obteniendo estadísticas de usuarios:", err);
    res.status(500).json({ error: "Error al obtener estadísticas" });
  }
});


// Servir frontend estático desde la carpeta Frontend
app.use(express.static(path.join(__dirname, 'Frontend')));
app.get('/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'Frontend', 'index.html'));
});


// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});





