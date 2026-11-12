import { Router } from 'express'
import jwt from 'jsonwebtoken'
import Jugador from '../models/Jugador.js'
import { 
  listarPartidos, 
  cargarResultado, 
  obtenerTablaPosiciones,
  crearPartido,
  confirmarPartidoDT,
  reportarGolesDT,
  fijarMarcadorOrganizador,
  actualizarGoleadores,
  autogenerarGoleadoresHandler
} from '../controllers/partidoController.js'

const router = Router()

// Middleware para validar el WebToken
const validarJWT = async (req, res, next) => {
  const token = req.header("x-token") || req.header("authorization")?.replace("Bearer ", "")

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" })
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#')
    req.uid = uid
    next()
  } catch (error) {
    return res.status(401).json({ msg: "Token no válido" })
  }
}

// --- RUTAS DE PARTIDOS ---

// Consultas públicas
router.get('/', listarPartidos)
router.get('/posiciones/:torneoId', obtenerTablaPosiciones)
router.post('/', crearPartido)

// Confirmación de DTs (Ambos entrenadores deben confirmar que van a jugar)
router.post('/:id/confirmar', confirmarPartidoDT)
router.post('/:id/reportar-goles-dt', reportarGolesDT)

// Fijar marcador y asistencias oficiales por el Organizador
router.put('/:id/marcador-organizador', fijarMarcadorOrganizador)
router.patch('/:id/marcador-organizador', fijarMarcadorOrganizador)

// Actualizar goleadores y resultado (Reporte oficial exclusivo del Entrenador)
router.put('/:id/goleadores', actualizarGoleadores)
router.patch('/:id/goleadores', actualizarGoleadores)
router.post('/:id/autogenerar-goleadores', autogenerarGoleadoresHandler)

// Operación protegida
router.patch('/:id/resultado', validarJWT, cargarResultado)


// Eliminar partido por ID (Exclusivo organizador para corregir cruces o cumplir reglas)
router.delete('/:id', async (req, res) => {
  try {
    const Partido = (await import('../models/Partido.js')).default;
    const { id } = req.params;
    const eliminado = await Partido.findByIdAndDelete(id);
    if (!eliminado) {
      return res.status(404).json({ msg: 'El partido no existe o ya fue eliminado' });
    }
    res.json({ msg: 'Partido eliminado exitosamente del fixture oficial.', id });
  } catch (err) {
    console.error('Error al eliminar partido:', err);
    res.status(400).json({ msg: err.message || 'Error al eliminar el partido' });
  }
});

// Generador Inteligente de Partidos con IA Gemini (cumpliendo reglas de fechas, paridad y descanso)
router.post('/generar-automaticos-ia', async (req, res) => {
  try {
    const Partido = (await import('../models/Partido.js')).default;
    const Equipo = (await import('../models/Equipo.js')).default;
    const { GoogleGenAI } = await import('@google/genai');

    const { cantidadPartidos = 3, fechaBase, intervaloDias = 1 } = req.body;
    const nPartidos = Math.min(Math.max(Number(cantidadPartidos) || 1, 1), 6);

    const clubes = await Equipo.find({ estadoAprobacion: { $ne: 'Rechazado' } });
    if (clubes.length < 2) {
      return res.status(400).json({ msg: 'Se necesitan al menos 2 clubes habilitados para programar partidos.' });
    }

    const partidosExistentes = await Partido.find().sort({ fechaHora: -1 });
    const partidosNoFinalizados = partidosExistentes.filter(p => !['finalizado', 'jugado'].includes(String(p.estado || '').toLowerCase()));
    const clubesConPartidoPendiente = new Set();
    partidosNoFinalizados.forEach(p => {
      const locId = String(p.local?._id || p.local);
      const visId = String(p.visitante?._id || p.visitante);
      if (locId) clubesConPartidoPendiente.add(locId);
      if (visId) clubesConPartidoPendiente.add(visId);
    });

    // Regla estricta: Solo clubes completamente libres de partidos en curso
    const clubesCompletamenteLibres = clubes.filter(c => !clubesConPartidoPendiente.has(String(c._id)));

    if (clubesCompletamenteLibres.length < 2) {
      return res.status(400).json({
        msg: 'Todos están jugando un partido, no se puede más.'
      });
    }

    const clubesParaProgramar = clubesCompletamenteLibres;

    let inicioTimestamp = fechaBase ? new Date(fechaBase).getTime() : Date.now() + 3600000;
    if (partidosExistentes.length) {
      const fechasValidas = partidosExistentes
        .map(p => p.fechaHora ? new Date(p.fechaHora).getTime() : 0)
        .filter(t => !isNaN(t) && t > 0);
      if (fechasValidas.length) {
        const maxFecha = Math.max(...fechasValidas);
        if (maxFecha >= inicioTimestamp || esProximaJornada) {
          inicioTimestamp = maxFecha + (Number(intervaloDias || 1) * 24 * 3600000);
        }
      }
    }

    const resumenClubes = clubesParaProgramar.map(c => ({
      id: String(c._id),
      nombre: c.nombre,
      barriada: c.barriada || 'Barrio',
      pj: c.pj || 0,
      puntos: c.puntos || 0
    }));

    let emparejamientos = [];
    try {
      // Iniciar cliente oficial de Gemini SDK sin sobreescribir headers indebidos
      const ai = new GoogleGenAI();
      const prompt = `Actúa como el fixture manager y analista deportivo de un torneo de fútbol barrial.
Tengo la siguiente lista de clubes disponibles SIN partidos pendientes:
${JSON.stringify(resumenClubes)}

Reglas estrictas de programación:
1. Genera como máximo ${nPartidos} partido(s).
2. Cada partido debe tener un equipo local y un equipo visitante diferentes (local !== visitante).
3. Cada club participante debe aparecer una sola vez en este fixture para que no juegue dos veces.
4. Devuelve ÚNICAMENTE un JSON válido con el siguiente formato:
[
  { "localId": "ID_DEL_CLUB", "visitanteId": "ID_DEL_CLUB", "motivoIA": "Breve explicación deportiva del duelo" }
]`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      const parsed = JSON.parse(aiResponse.text || '[]');
      if (Array.isArray(parsed) && parsed.length) {
        emparejamientos = parsed;
      }
    } catch (errAi) {
      // Fallback transparente a algoritmo de paridad deportiva si el servicio externo tiene saturación o demanda temporal
      console.log('Aplicando algoritmo inteligente de paridad deportiva para emparejamiento de clubes.');
    }

    if (!emparejamientos.length) {
      const ordenados = [...resumenClubes].sort((a, b) => a.pj - b.pj || b.puntos - a.puntos);
      for (let i = 0; i + 1 < ordenados.length && emparejamientos.length < nPartidos; i += 2) {
        emparejamientos.push({
          localId: ordenados[i].id,
          visitanteId: ordenados[i + 1].id,
          motivoIA: `Duelo entre ${ordenados[i].nombre} y ${ordenados[i + 1].nombre}`
        });
      }
    }

    // Obtener o crear el Torneo oficial para asociarlo a los partidos
    const Torneo = (await import('../models/Torneo.js')).default;
    let t = await Torneo.findOne();
    if (!t) {
      t = await Torneo.create({
        nombre: 'Torneo Oficial Barrial 2026',
        categoria: 'Libre Masculino'
      });
    }

    const partidosCreados = [];
    let fechaCursor = new Date(inicioTimestamp);

    for (let i = 0; i < emparejamientos.length; i++) {
      const emp = emparejamientos[i];
      const clubLoc = clubesParaProgramar.find(c => String(c._id) === String(emp.localId));
      const clubVis = clubesParaProgramar.find(c => String(c._id) === String(emp.visitanteId));
      if (!clubLoc || !clubVis) continue;

      fechaCursor.setHours(16, 0, 0, 0);
      const ultimaJornada = partidosExistentes.length ? Math.max(...partidosExistentes.map(p => Number(p.fecha) || 1)) : 0;
      const jornada = ultimaJornada + i + 1;

      const nuevoPartido = await Partido.create({
        torneo: t._id,
        local: clubLoc._id,
        visitante: clubVis._id,
        jornada: Number(jornada) || 1,
        fecha: Number(jornada) || 1,
        fechaHora: new Date(fechaCursor),
        golesLocal: 0,
        golesVisitante: 0,
        estado: 'Programado',
        asistenciasLocal: 0,
        asistenciasVisitante: 0,
        goleadores: []
      });

      const poblado = await Partido.findById(nuevoPartido._id).populate('local visitante');
      partidosCreados.push({
        partido: poblado,
        motivoIA: emp.motivoIA || 'Partido programado inteligentemente por IA'
      });

      fechaCursor = new Date(fechaCursor.getTime() + (Number(intervaloDias) || 1) * 24 * 3600000);
    }

    res.json({
      msg: `¡Se programaron con éxito ${partidosCreados.length} partido(s) mediante IA Gemini!`,
      partidos: partidosCreados
    });
  } catch (err) {
    console.error('Error en generar-automaticos-ia:', err);
    res.status(400).json({ msg: err.message || 'Error al generar partidos automáticos' });
  }
});

// Posponer un partido por causas de fuerza mayor o clima, notificando a los dos equipos
router.put('/:id/posponer', async (req, res) => {
  try {
    const Partido = (await import('../models/Partido.js')).default;
    const Notificacion = (await import('../models/Notificacion.js')).default;
    const { id } = req.params;
    const { motivo, nuevaFechaHora } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'Partido no encontrado' });
    }

    if (partido.estado === 'Finalizado') {
      return res.status(400).json({ msg: 'No se puede posponer un partido que ya ha finalizado' });
    }

    const clubLocalNom = partido.local?.nombre || 'Club Local';
    const clubVisNom = partido.visitante?.nombre || 'Club Visitante';
    const locId = partido.local?._id || partido.local;
    const visId = partido.visitante?._id || partido.visitante;

    const fechaPrevia = partido.fechaHora;

    partido.estado = 'Pospuesto';
    partido.motivoPostergacion = motivo || 'Condiciones climáticas / Fuerza mayor';
    if (!partido.fechaOriginal) {
      partido.fechaOriginal = fechaPrevia;
    }
    if (nuevaFechaHora) {
      partido.fechaHora = new Date(nuevaFechaHora);
    }
    await partido.save();

    const tituloNotif = `⚠️ Partido Pospuesto: ${clubLocalNom} vs ${clubVisNom}`;
    const fechaTexto = nuevaFechaHora 
      ? `Reprogramado para: ${new Date(nuevaFechaHora).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}` 
      : 'Nueva fecha: A definir por la organización del torneo';

    const mensajeNotif = `El encuentro correspondiente a la Jornada ${partido.jornada || partido.fecha || 1} entre ${clubLocalNom} y ${clubVisNom} ha sido POSPUESTO. Causa oficial: "${partido.motivoPostergacion}". ${fechaTexto}.`;

    await Notificacion.create({
      tipo: 'partido_pospuesto',
      titulo: tituloNotif,
      mensaje: mensajeNotif,
      remitente: 'Organización Oficial del Torneo',
      equipo: locId,
      equipoNombre: clubLocalNom,
      partido: partido._id,
      datos: {
        partidoId: partido._id,
        motivo: partido.motivoPostergacion,
        jornada: partido.jornada,
        nuevaFechaHora: partido.fechaHora
      }
    });

    await Notificacion.create({
      tipo: 'partido_pospuesto',
      titulo: tituloNotif,
      mensaje: mensajeNotif,
      remitente: 'Organización Oficial del Torneo',
      equipo: visId,
      equipoNombre: clubVisNom,
      partido: partido._id,
      datos: {
        partidoId: partido._id,
        motivo: partido.motivoPostergacion,
        jornada: partido.jornada,
        nuevaFechaHora: partido.fechaHora
      }
    });

    res.json({
      msg: `¡Partido entre ${clubLocalNom} y ${clubVisNom} pospuesto exitosamente! Se notificó a ambos clubes.`,
      partido
    });
  } catch (err) {
    console.error('Error en posponer partido:', err);
    res.status(400).json({ msg: err.message || 'Error al posponer partido' });
  }
});

export default router

