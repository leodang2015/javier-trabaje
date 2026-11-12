import jwt from 'jsonwebtoken';
import Jugador from '../models/Jugador.js';

// --- HELPER PARA GENERAR EL TOKEN ---
export const generarJWT = (uid) => {
  return new Promise((resolve, reject) => {
    const payload = { uid };

    jwt.sign(
      payload,
      process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#',
      { expiresIn: "4h" },
      (err, token) => {
        if (err) {
          console.error("Error al firmar JWT:", err);
          reject("No se pudo generar el token");
        } else {
          resolve(token);
        }
      }
    );
  });
};

// --- AUTENTICACIÓN (LOGIN) ---
export const loginJugador = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({
        msg: "El correo y la contraseña son obligatorios"
      });
    }

    const jugador = await Jugador.findOne({ email });

    if (!jugador) {
      return res.status(400).json({
        msg: "El jugador no existe"
      });
    }

    if (jugador.estado === 0) {
      return res.status(400).json({
        msg: "Jugador inactivo - contacte al administrador"
      });
    }

    if (jugador.password !== password) {
      return res.status(400).json({
        msg: "Contraseña incorrecta"
      });
    }

    // BLOQUEO TOTAL REGLAMENTARIO: Si no está Aceptado por el DT, no puede hacer nada ni ingresar
    if (jugador.estadoAprobacion === 'Pendiente') {
      return res.status(403).json({
        msg: "🚫 ACCESO BLOQUEADO: Tu ficha de futbolista está pendiente de aprobación. El Entrenador de tu club debe aceptarte en su plantel antes de que puedas realizar cualquier acción en el sistema.",
        estadoAprobacion: 'Pendiente'
      });
    }

    if (jugador.estadoAprobacion === 'Rechazado') {
      return res.status(403).json({
        msg: "🚫 ACCESO DENEGADO: Tu solicitud de ingreso fue rechazada por el Entrenador. No tienes permisos para operar en el sistema.",
        estadoAprobacion: 'Rechazado'
      });
    }

    const token = await generarJWT(jugador._id);

    res.json({
      jugador,
      token
    });

  } catch (error) {
    console.error("Error en loginJugador:", error);
    res.status(400).json({
      msg: "No se pudo procesar el inicio de sesión. Verifique los datos enviados."
    });
  }
};

// --- MÉTODOS CRUD SIN ERRORES 500 ---

export const crearJugador = async (req, res) => {
  try {
    // Soportar dorsal o numero
    if (!req.body.numero && req.body.dorsal) {
      req.body.numero = Number(req.body.dorsal);
    }
    if (!req.body.numero) {
      req.body.numero = 10;
    }

    // Apellido por defecto si viene vacío
    if (!req.body.apellido || !req.body.apellido.trim()) {
      req.body.apellido = '-';
    }

    // Email por defecto si viene vacío
    if (!req.body.email || !req.body.email.trim()) {
      const nom = (req.body.nombre || 'jugador').toLowerCase().replace(/[^a-z0-9]/g, '');
      const ape = (req.body.apellido || 'club').toLowerCase().replace(/[^a-z0-9]/g, '');
      const rnd = Math.floor(1000 + Math.random() * 9000);
      req.body.email = `${nom}.${ape}.${rnd}@futbolito.local`;
    }

    // Password reglamentario 1234 para jugadores
    if (!req.body.password || !req.body.password.trim()) {
      req.body.password = '1234';
    }

    let { email } = req.body;

    // Verificar que el dorsal no esté ya asignado en el mismo equipo
    if (req.body.equipo && req.body.numero) {
      const dorsalEnUso = await Jugador.findOne({
        equipo: req.body.equipo,
        numero: req.body.numero
      });
      if (dorsalEnUso) {
        const nombreJugador = `${dorsalEnUso.nombre}${dorsalEnUso.apellido && dorsalEnUso.apellido !== '-' ? ' ' + dorsalEnUso.apellido : ''}`;
        return res.status(400).json({
          msg: `El dorsal #${req.body.numero} ya está registrado para ${nombreJugador} en este equipo. Cada jugador debe tener un número dorsal único.`
        });
      }
    }

    if (email) {
      const existeEmail = await Jugador.findOne({ email });
      if (existeEmail) {
        const nom = (req.body.nombre || 'jugador').toLowerCase().replace(/[^a-z0-9]/g, '');
        const rnd = Date.now().toString().slice(-4);
        req.body.email = `${nom}.${rnd}@futbolito.local`;
      }
    }

    const jugador = new Jugador(req.body);
    await jugador.save();

    // Crear cuenta de usuario con contraseña reglamentaria 1234 para que pueda iniciar sesión
    try {
      const Usuario = (await import('../models/Usuario.js')).default;
      const cleanUser = (jugador.nombre || 'jugador').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const usuarioExistente = await Usuario.findOne({ usuario: cleanUser });
      if (!usuarioExistente) {
        const u = new Usuario({
          usuario: cleanUser,
          nombre: `${jugador.nombre} ${jugador.apellido && jugador.apellido !== '-' ? jugador.apellido : ''}`.trim(),
          rol: 'jugador',
          equipo: jugador.equipo,
          posicion: jugador.posicion || 'Delantero'
        });
        u.setPassword('1234');
        await u.save();
      }
    } catch (_) {}

    res.status(201).json(jugador);

  } catch (error) {
    console.error("Error en crearJugador:", error);

    if (error.code === 11000) {
      const campoDuplicado = Object.keys(error.keyPattern || {})[0] || 'campo';
      return res.status(400).json({
        msg: `El ${campoDuplicado} ya se encuentra registrado`
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        msg: mensajes.join(', ')
      });
    }

    res.status(400).json({
      msg: error.message || "Error al registrar el jugador"
    });
  }
};

export const listarJugadores = async (req, res) => {
  try {
    const { equipo } = req.query;
    // Jugadores con estadoAprobacion: 'Rechazado' fueron denegados/eliminados del equipo y no deben figurar en la nómina
    const filtro = {
      estadoAprobacion: { $ne: 'Rechazado' }
    };
    if (equipo) {
      filtro.equipo = equipo;
    }

    const jugadores = await Jugador.find(filtro).populate('equipo');

    res.json(jugadores);

  } catch (error) {
    console.error("Error en listarJugadores:", error);
    res.status(400).json({
      msg: "Error al consultar la lista de jugadores"
    });
  }
};

export const editarJugador = async (req, res) => {
  try {
    const { id } = req.params;
    const { _id, password, ...resto } = req.body;
    if (!resto.numero && resto.dorsal) {
      resto.numero = Number(resto.dorsal);
    }

    const jugadorActual = await Jugador.findById(id);
    if (!jugadorActual) {
      return res.status(404).json({
        msg: "El jugador no existe en la base de datos"
      });
    }

    // Si se modifica el número o el equipo, verificar duplicados
    const equipoDestino = resto.equipo || jugadorActual.equipo;
    const numeroDestino = resto.numero !== undefined ? resto.numero : jugadorActual.numero;

    if (equipoDestino && numeroDestino) {
      const dorsalEnUso = await Jugador.findOne({
        _id: { $ne: id },
        equipo: equipoDestino,
        numero: numeroDestino
      });
      if (dorsalEnUso) {
        const nombreJugador = `${dorsalEnUso.nombre}${dorsalEnUso.apellido && dorsalEnUso.apellido !== '-' ? ' ' + dorsalEnUso.apellido : ''}`;
        return res.status(400).json({
          msg: `El dorsal #${numeroDestino} ya está en uso por ${nombreJugador} en este equipo. Cada jugador debe tener un dorsal único.`
        });
      }
    }

    // Regla Oficial: En el fútbol solo se permite 1 arquero titular en cancha por equipo
    if (resto.posicion) {
      const pNorm = String(resto.posicion).toLowerCase();
      if ((pNorm.includes('arquero') || pNorm.includes('portero')) && !pNorm.includes('banc')) {
        const arqueroExistente = await Jugador.findOne({
          _id: { $ne: id },
          equipo: equipoDestino,
          posicion: { $regex: /arquero|portero/i }
        });
        if (arqueroExistente && !String(arqueroExistente.posicion).toLowerCase().includes('banc')) {
          return res.status(400).json({
            msg: `Solo se permite 1 arquero titular en cancha. ${arqueroExistente.nombre} ${arqueroExistente.apellido || ''} ya es el arquero titular. Para ingresar otro arquero, debes enviar al titular a la banca.`
          });
        }
      }
    }

    const jugador = await Jugador.findByIdAndUpdate(id, resto, { new: true, runValidators: true });

    if (!jugador) {
      return res.status(404).json({
        msg: "El jugador no existe en la base de datos"
      });
    }

    res.json(jugador);

  } catch (error) {
    console.error("Error en editarJugador:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es válido"
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        msg: "El valor ingresado ya está en uso por otro registro"
      });
    }

    res.status(400).json({
      msg: "No se pudo actualizar el jugador"
    });
  }
};

export const eliminarJugador = async (req, res) => {
  try {
    const { id } = req.params;

    const jugador = await Jugador.findByIdAndDelete(id);

    if (!jugador) {
      return res.status(404).json({
        msg: "El jugador no existe en la base de datos"
      });
    }

    res.json({
      msg: "Jugador eliminado correctamente"
    });

  } catch (error) {
    console.error("Error en eliminarJugador:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es válido"
      });
    }

    res.status(400).json({
      msg: "No se pudo eliminar el jugador"
    });
  }
};

export default { generarJWT, loginJugador, crearJugador, listarJugadores, editarJugador, eliminarJugador };
