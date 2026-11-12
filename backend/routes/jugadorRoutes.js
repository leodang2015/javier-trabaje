import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Jugador from '../models/Jugador.js';

import { 
  crearJugador, 
  listarJugadores, 
  editarJugador, 
  eliminarJugador, 
  loginJugador 
} from '../controllers/jugadorController.js';
import { 
  crearJugadorValidator, 
  loginJugadorValidator, 
  actualizarJugadorValidator, 
  idValidator 
} from '../validators/jugadorValidator.js';

const router = Router();

// Middleware para validar el WebToken
const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({ msg: "No hay token en la petición" });
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#');
    const jugador = await Jugador.findById(uid);

    if (!jugador) {
      return res.status(401).json({ msg: "Token no válido - el jugador no existe en DB" });
    }

    if (jugador.estado === 0) {
      return res.status(401).json({ msg: "Token no válido - jugador inactivo" });
    }

    req.jugador = jugador;
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Token no válido" });
  }
};

// --- RUTA PÚBLICA ---
router.post('/login', loginJugadorValidator, loginJugador);

// --- RUTAS DE JUGADORES ---
router.get('/', listarJugadores);
router.post('/', crearJugadorValidator, crearJugador);
router.put('/:id', [idValidator, actualizarJugadorValidator], editarJugador);
router.delete('/:id', idValidator, eliminarJugador);

// Rutas de Autorización de Fichaje de Jugador (por el Entrenador o el Organizador)
router.put('/:id/autorizar', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const jug = await Jugador.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Aprobado' }, { new: true }).populate('equipo');
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });
    res.json({ msg: `¡Futbolista ${jug.nombre} autorizado e incorporado al club!`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al autorizar jugador' });
  }
});

router.put('/:id/rechazar', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const jug = await Jugador.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Rechazado' }, { new: true }).populate('equipo');
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });
    res.json({ msg: `Solicitud de fichaje de ${jug.nombre} rechazada.`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al rechazar jugador' });
  }
});


// --- RUTAS DE TRASPASO DE EQUIPO (SOLICITUD Y DOBLE ACEPTACIÓN DT ORIGEN Y DT DESTINO) ---
router.post('/:id/solicitar-traspaso', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const Equipo = (await import('../models/Equipo.js')).default;
    const Notificacion = (await import('../models/Notificacion.js')).default;

    const { id } = req.params;
    const { nuevoEquipoId, motivo } = req.body;

    if (!nuevoEquipoId) {
      return res.status(400).json({ msg: 'Debes seleccionar el equipo de destino' });
    }

    const jugador = await Jugador.findById(id).populate('equipo');
    if (!jugador) return res.status(404).json({ msg: 'Jugador no encontrado' });

    if (String(jugador.equipo?._id || jugador.equipo) === String(nuevoEquipoId)) {
      return res.status(400).json({ msg: 'Ya perteneces a este equipo' });
    }

    const nuevoEquipo = await Equipo.findById(nuevoEquipoId);
    if (!nuevoEquipo) return res.status(404).json({ msg: 'Equipo destino no encontrado' });

    const nombreCompleto = `${jugador.nombre} ${jugador.apellido && jugador.apellido !== '-' ? jugador.apellido : ''}`.trim();
    const clubOrigenNombre = jugador.equipo?.nombre || 'Club Actual';

    // Crear notificación para el DT de origen (Fase 1: Autorización de salida)
    await Notificacion.create({
      tipo: 'traspaso_salida',
      titulo: `🔄 Solicitud de Traspaso: ${nombreCompleto}`,
      mensaje: `El futbolista ${nombreCompleto} solicita autorización para salir de ${clubOrigenNombre} y fichar por ${nuevoEquipo.nombre}. Como DT de origen, debes autorizar su carta de salida.`,
      remitente: 'Sistema de Traspasos',
      equipo: jugador.equipo?._id || jugador.equipo,
      equipoNombre: clubOrigenNombre,
      datos: {
        jugadorId: jugador._id,
        jugadorNombre: nombreCompleto,
        clubOrigenId: jugador.equipo?._id || jugador.equipo,
        clubOrigenNombre,
        clubDestinoId: nuevoEquipo._id,
        clubDestinoNombre: nuevoEquipo.nombre,
        motivo: motivo || 'Decisión deportiva'
      }
    });

    res.json({
      msg: `Solicitud de traspaso enviada con éxito. Se notificó al DT de ${clubOrigenNombre} para su aprobación de salida.`,
      jugador
    });
  } catch (err) {
    console.error('Error en solicitar-traspaso:', err);
    res.status(400).json({ msg: err.message || 'Error al procesar solicitud de traspaso' });
  }
});

// Aprobación de salida por parte del DT de origen -> Pasa a notificación para DT de destino
router.put('/:id/autorizar-salida-traspaso', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const Equipo = (await import('../models/Equipo.js')).default;
    const Notificacion = (await import('../models/Notificacion.js')).default;

    const { id } = req.params;
    const { clubDestinoId, notificacionId } = req.body;

    const jugador = await Jugador.findById(id).populate('equipo');
    if (!jugador) return res.status(404).json({ msg: 'Jugador no encontrado' });

    const clubDestino = await Equipo.findById(clubDestinoId);
    if (!clubDestino) return res.status(404).json({ msg: 'Club de destino no encontrado' });

    const nombreCompleto = `${jugador.nombre} ${jugador.apellido && jugador.apellido !== '-' ? jugador.apellido : ''}`.trim();
    const clubOrigenNombre = jugador.equipo?.nombre || 'Club Origen';

    // Marcar como leída la notificación de salida
    if (notificacionId) {
      await Notificacion.findByIdAndUpdate(notificacionId, { leida: true });
    }

    // Crear notificación para el DT de destino (Fase 2: Aceptación de llegada)
    await Notificacion.create({
      tipo: 'traspaso_llegada',
      titulo: `📥 Fichaje Aprobado por Club de Origen: ${nombreCompleto}`,
      mensaje: `El DT de ${clubOrigenNombre} ha liberado la carta de traspaso de ${nombreCompleto}. Ahora tú como DT de ${clubDestino.nombre} debes dar el visto bueno final para incorporarlo a tu equipo.`,
      remitente: `DT ${clubOrigenNombre}`,
      equipo: clubDestino._id,
      equipoNombre: clubDestino.nombre,
      datos: {
        jugadorId: jugador._id,
        jugadorNombre: nombreCompleto,
        clubOrigenId: jugador.equipo?._id || jugador.equipo,
        clubOrigenNombre,
        clubDestinoId: clubDestino._id,
        clubDestinoNombre: clubDestino.nombre
      }
    });

    res.json({
      msg: `Carta de salida concedida a ${nombreCompleto}. Solicitud remitida al DT de ${clubDestino.nombre}.`
    });
  } catch (err) {
    console.error('Error en autorizar-salida-traspaso:', err);
    res.status(400).json({ msg: err.message || 'Error al autorizar salida' });
  }
});

// Aprobación final por parte del DT de destino -> Se ejecuta el cambio de equipo y usuario asociado
router.put('/:id/confirmar-llegada-traspaso', async (req, res) => {
  try {
    const Jugador = (await import('../models/Jugador.js')).default;
    const Equipo = (await import('../models/Equipo.js')).default;
    const Usuario = (await import('../models/Usuario.js')).default;
    const Notificacion = (await import('../models/Notificacion.js')).default;

    const { id } = req.params;
    const { clubDestinoId, notificacionId } = req.body;

    const clubDestino = await Equipo.findById(clubDestinoId);
    if (!clubDestino) return res.status(404).json({ msg: 'Club destino no encontrado' });

    // Actualizar jugador: moverlo al nuevo equipo con posición 'En Banca' y estado 'Aprobado'
    const jugador = await Jugador.findByIdAndUpdate(
      id,
      {
        equipo: clubDestino._id,
        posicion: 'En Banca',
        esCapitan: false,
        estadoAprobacion: 'Aprobado'
      },
      { new: true }
    ).populate('equipo');

    if (!jugador) return res.status(404).json({ msg: 'Jugador no encontrado' });

    // Sincronizar el usuario asociado si existe
    if (jugador.usuarioAsociado) {
      await Usuario.findOneAndUpdate(
        { usuario: jugador.usuarioAsociado },
        { equipo: clubDestino._id }
      );
    }

    if (notificacionId) {
      await Notificacion.findByIdAndUpdate(notificacionId, { leida: true });
    }

    const nombreCompleto = `${jugador.nombre} ${jugador.apellido && jugador.apellido !== '-' ? jugador.apellido : ''}`.trim();

    // Notificación de confirmación exitosa
    await Notificacion.create({
      tipo: 'traspaso_completado',
      titulo: `✅ Traspaso Oficializado: ${nombreCompleto}`,
      mensaje: `El futbolista ${nombreCompleto} ha sido transferido oficialmente y se encuentra integrado a la banca de ${clubDestino.nombre}.`,
      remitente: 'Liga Oficial',
      equipo: clubDestino._id,
      equipoNombre: clubDestino.nombre,
      datos: {
        jugadorId: jugador._id,
        jugadorNombre: nombreCompleto,
        clubDestinoId: clubDestino._id,
        clubDestinoNombre: clubDestino.nombre
      }
    });

    res.json({
      msg: `¡Traspaso completado! ${nombreCompleto} ahora es parte del club ${clubDestino.nombre}.`,
      jugador
    });
  } catch (err) {
    console.error('Error en confirmar-llegada-traspaso:', err);
    res.status(400).json({ msg: err.message || 'Error al confirmar llegada de traspaso' });
  }
});


// Actualizar posición de un jugador (Pizarra Táctica / DT)
router.patch('/:id/posicion', async (req, res) => {
  try {
    const JugadorModel = (await import('../models/Jugador.js')).default;
    const { id } = req.params;
    const { posicion } = req.body;
    if (!posicion) {
      return res.status(400).json({ msg: 'La posición es requerida' });
    }
    const jug = await JugadorModel.findByIdAndUpdate(
      id,
      { posicion: String(posicion).trim() },
      { new: true }
    ).populate('equipo');
    if (!jug) {
      return res.status(404).json({ msg: 'Jugador no encontrado' });
    }
    res.json({
      msg: `Posición de ${jug.nombre} actualizada a ${jug.posicion}`,
      jugador: jug
    });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al actualizar posición' });
  }
});

// Soporte PUT para posición (fallback)
router.put('/:id/posicion', async (req, res) => {
  try {
    const JugadorModel = (await import('../models/Jugador.js')).default;
    const { id } = req.params;
    const { posicion } = req.body;
    const jug = await JugadorModel.findByIdAndUpdate(
      id,
      { posicion: String(posicion).trim() },
      { new: true }
    ).populate('equipo');
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });
    res.json({ msg: `Posición de ${jug.nombre} actualizada`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al actualizar posición' });
  }
});

// Actualizar dorsal del jugador
router.patch('/:id/dorsal', async (req, res) => {
  try {
    const JugadorModel = (await import('../models/Jugador.js')).default;
    const { id } = req.params;
    const { numero } = req.body;
    const num = Number(numero);
    if (!num || num < 1 || num > 99) {
      return res.status(400).json({ msg: 'El dorsal debe ser entre 1 y 99' });
    }
    const jug = await JugadorModel.findById(id);
    if (!jug) return res.status(404).json({ msg: 'Jugador no encontrado' });

    // Validar dorsal repetido en el mismo club
    const ocupado = await JugadorModel.findOne({
      equipo: jug.equipo,
      numero: num,
      _id: { $ne: jug._id }
    });
    if (ocupado) {
      return res.status(400).json({
        msg: `El dorsal #${num} ya está asignado a ${ocupado.nombre} en este equipo.`
      });
    }

    jug.numero = num;
    jug.dorsal = num;
    await jug.save();
    res.json({ msg: `Dorsal #${num} asignado a ${jug.nombre}`, jugador: jug });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al actualizar dorsal' });
  }
});

export default router;
