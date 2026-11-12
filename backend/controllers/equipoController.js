import Equipo from '../models/Equipo.js';

export const crearEquipo = async (req, res) => {
  try {
    const { nombre } = req.body;

    if (nombre) {
      const existeEquipo = await Equipo.findOne({ nombre });
      if (existeEquipo) {
        return res.status(400).json({
          msg: "El nombre del equipo ya se encuentra registrado"
        });
      }
    }

    const equipo = new Equipo(req.body);
    await equipo.save();

    res.status(201).json(equipo);

  } catch (error) {
    console.error("Error en crearEquipo:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        msg: "El equipo ya se encuentra registrado"
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        msg: mensajes.join(', ')
      });
    }

    res.status(400).json({
      msg: error.message || "Error al registrar el equipo"
    });
  }
};

export const listarEquipos = async (req, res) => {
  try {
    // Los equipos con estadoAprobacion: 'Rechazado' fueron cancelados/denegados y no deben aparecer en la lista de clubes del torneo
    const equipos = await Equipo.find({ estadoAprobacion: { $ne: 'Rechazado' } });
    res.json(equipos);

  } catch (error) {
    console.error("Error en listarEquipos:", error);
    res.status(400).json({
      msg: "Error al consultar la lista de equipos"
    });
  }
};

export const editarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByIdAndUpdate(
      id, 
      req.body, 
      { new: true, runValidators: true }
    );

    if (!equipo) {
      return res.status(404).json({
        msg: "El equipo no existe en la base de datos"
      });
    }

    res.json(equipo);

  } catch (error) {
    console.error("Error en editarEquipo:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es un ObjectId válido"
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        msg: "El nombre ingresado ya le pertenece a otro equipo"
      });
    }

    res.status(400).json({
      msg: "No se pudo actualizar la información del equipo"
    });
  }
};

export const eliminarEquipo = async (req, res) => {
  try {
    const { id } = req.params;

    const equipo = await Equipo.findByIdAndDelete(id);

    if (!equipo) {
      return res.status(404).json({
        msg: "El equipo no existe en la base de datos"
      });
    }

    res.json({
      msg: "Equipo eliminado correctamente"
    });

  } catch (error) {
    console.error("Error en eliminarEquipo:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID proporcionado no es un ObjectId válido"
      });
    }

    res.status(400).json({
      msg: "No se pudo eliminar el equipo"
    });
  }
};

export const completarPlantel = async (req, res) => {
  try {
    const { id } = req.params;
    const Jugador = (await import('../models/Jugador.js')).default;
    const equipo = await Equipo.findById(id);

    if (!equipo) {
      return res.status(404).json({ msg: 'El equipo no existe en la base de datos' });
    }

    const jugadoresActuales = await Jugador.find({ equipo: id });
    const faltantes = 11 - jugadoresActuales.length;

    if (faltantes <= 0) {
      return res.json({
        msg: `El club "${equipo.nombre}" ya cuenta con ${jugadoresActuales.length} futbolistas (cumple el mínimo reglamentario de 11).`,
        total: jugadoresActuales.length
      });
    }

    const dorsalesUsados = new Set(jugadoresActuales.map(j => Number(j.numero || j.dorsal)));
    const posicionesSugeridas = ['Arquero', 'Defensor', 'Defensor', 'Defensor', 'Defensor', 'Mediocampista', 'Mediocampista', 'Mediocampista', 'Mediocampista', 'Delantero', 'Delantero'];
    
    const nombresMuestra = [
      'Lucas Silva', 'Matías Fernández', 'Rodrigo Díaz', 'Javier Romero',
      'Cristian Benítez', 'Joaquín Castro', 'Facundo Morales', 'Ezequiel Herrera',
      'Nicolás Sosa', 'Agustín Pereyra', 'Santiago Giménez', 'Tomás Medina'
    ];

    let creados = 0;
    for (let i = 0; i < faltantes; i++) {
      let d = 1;
      while (dorsalesUsados.has(d)) {
        d++;
      }
      dorsalesUsados.add(d);

      const nomCompleto = nombresMuestra[(jugadoresActuales.length + i) % nombresMuestra.length];
      const partes = nomCompleto.split(' ');
      const pos = posicionesSugeridas[(jugadoresActuales.length + i) % posicionesSugeridas.length];
      const email = `ficha.${equipo.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.${d}.${Date.now().toString().slice(-4)}@futbolito.local`;

      const nuevoJ = await Jugador.create({
        nombre: partes[0],
        apellido: partes[1] || 'Club',
        numero: d,
        posicion: pos,
        equipo: equipo._id,
        email,
        password: '1234'
      });

      // Crear cuenta de usuario con contraseña reglamentaria 1234 para que pueda iniciar sesión
      try {
        const Usuario = (await import('../models/Usuario.js')).default;
        const cleanUser = partes[0].toLowerCase().trim().replace(/[^a-z0-9]/g, '') + d;
        const u = new Usuario({
          usuario: cleanUser,
          nombre: `${partes[0]} ${partes[1] || ''}`.trim(),
          rol: 'jugador',
          equipo: equipo._id,
          posicion: pos
        });
        u.setPassword('1234');
        await u.save();
      } catch (_) {}

      creados++;
    }

    res.json({
      msg: `Se han incorporado ${creados} futbolistas al club "${equipo.nombre}". Nómina habilitada con 11 jugadores reglamentarios para disputar partidos.`,
      total: jugadoresActuales.length + creados
    });
  } catch (error) {
    console.error('Error al completar plantel:', error);
    res.status(400).json({ msg: error.message || 'Error al completar nómina de jugadores' });
  }
};

export default { crearEquipo, listarEquipos, editarEquipo, eliminarEquipo, completarPlantel };
