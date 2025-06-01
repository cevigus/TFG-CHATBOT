const express = require('express');
const path = require('path');
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
 alegria: [
   "alegría", "felicidad", "contento", "contenta", "entusiasmo", "euforia", 
   "emoción", "placer", "satisfacción", "gozo", "alegría inmensa", 
   "estoy feliz", "me siento bien", "estoy en la gloria", "estoy de buen humor", 
   "ando con buenas vibras", "ando re feliz", "ando chill", "tengo buenas vibes", 
   "estoy lo más feliz", "ando de chill", "alegre", "feliz", "entusiasmado", 
   "emocionado", "eufórico", "animado", "satisfecho", "entusiasmada", 
   "todo va genial", "estoy sonriendo", "me encanta", "me hizo el día", 
   "estoy en las nubes", "me siento pleno", "estoy radiante", 
   "disfrutando al máximo", "con el corazón lleno", "con una sonrisa", 
   "vibro alto", "estoy feliz de la vida", "júbilo", "emocionada", 
   "radiante", "vibrante", "lleno de vida", "pura energía positiva", 
   "que chévere", "esto es maravilloso", "una alegría enorme", "estoy on fire", 
   "estoy en mi peak", "pura buena onda", "piel de gallina de la emoción", 
   "brillo en los ojos", "no puedo dejar de sonreír", "saltando de alegría", 
   "mi alma canta", "la vida me sonríe", "agradecido con la vida", 
   "bendecido", "bendecida", "mil gracias", "qué afortunado soy", 
   "lleno de amor", "feliz por ti", "compartiendo alegría", 
   "tu felicidad es mi felicidad"
],

 ira: [
  "ira", "enojo", "enfado", "rabia", "furia", "molestia", "irritación", 
  "frustración", "cólera", "me hierve la sangre", "estoy que exploto", 
  "me tienen harto", "me tienen harta", "estoy re caliente", 
  "me sacaron de quicio", "me re sacó", "furioso", "furiosa", 
  "estoy furiosa", "estoy furioso", "estoy hecho una furia", 
  "me tienen podrido", "me tiene enojado", "enfadado", "enfadada", 
  "ardido", "ardida", "me fastidia", "estoy rojo de la rabia", 
  "perdí la paciencia", "me saca de quicio", "harto", "harta", 
  "colérico", "colérica"
],

miedo: [
  "miedo", "temor", "pánico", "susto", "terror", "espanto", "angustia", 
  "ansiedad", "nervios", "me da miedo", "estoy con los pelos de punta", 
  "estoy cagado de miedo", "estoy en shock", "me da cosa", "me pone mal", 
  "me da pavor", "tengo un mal presentimiento", "estoy asustado", 
  "estoy asustada", "me pone nervioso", "me pone nerviosa", "asustado", 
  "temeroso", "nervioso", "ansioso", "aterrorizado", "tengo temor", 
  "estoy inquieto", "con angustia", "me siento inseguro", 
  "me tiemblan las manos", "con los pelos de punta", "me da ansiedad", 
  "estresado", "tengo susto", "siento una amenaza", "presiento algo malo", 
  "me siento vulnerable", "estoy tenso", "no me siento seguro", 
  "en estado de alerta", "intranquilo"
],

 tristeza : [
 "triste", "tristeza", "deprimido", "decaído", "desanimado", 
 "melancólico", "llorando", "con el corazón roto", "abatido", 
 "me siento mal", "desconsolado", "con el alma en el suelo", 
 "vacío por dentro", "nostálgico", "apagado", "cabizbajo", 
 "no tengo ganas de nada", "lleno de pena", "me siento solo", 
 "me siento miserable", "no dejo de llorar", "con mucha carga emocional", 
 "me duele el alma", "sufriendo por dentro", "hecho polvo", 
 "me siento derrumbado", "sin ánimos", "desesperanzado",
 "pena", "dolor", "melancolía", "depresión", "nostalgia",
 "desánimo", "bajón", "aflicción", "estoy triste",
 "me siento solo", "me siento vacio", "me siento vacia",
 "estoy bajoneado", "estoy bajoneada",
 "tengo el ánimo por el piso",
 "ando con la moral baja",
 "estoy hecho polvo",
 "me partió el alma",
 "sufriendo"
],

asco : [
    "asco", "repugnante", "repulsivo", "desagradable", "horrible",
    "vomitivo", "me da náuseas", "me da arcadas", "me da asco",
    "no lo soporto", "me resulta repulsivo", "me revuelve el estómago",
    "descompuesto", "me siento sucio", "indignante", "me produce rechazo",
    "me desagrada profundamente", "qué asqueroso", "me da cosa",
    "me da impresión", "abominable", "detestable", "de mal gusto",
    "sucio", "asqueroso", "grotesco", "apestoso",
    "repulsión", "repugnancia", "desagrado", "náuseas", 
    "disgusto", "rechazo", "estoy asqueado", "estoy asqueada",
    "lo detesto", "me repugna", "me da un no sé qué", 
    "me desagrada"
]

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


// 6. Rutas para servir archivos estáticos (Frontend)
// Primero configuramos la carpeta estática:
app.use(express.static(path.join(__dirname, 'Frontend')));

// Luego definimos la ruta específica para la raíz:
app.get('/', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'Frontend', 'index.html'));
});



// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor iniciado en el puerto ${PORT}`);
});





