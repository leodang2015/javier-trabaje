import Torneo from '../models/Torneo.js'
import Partido from '../models/Partido.js'

// Crear un torneo
export const crearTorneo = async (req, res) => {
  try {
    const { nombre, equipos } = req.body
    const torneo = new Torneo({ nombre, equipos })
    await torneo.save()
    res.status(201).json({ msg: 'Torneo creado con éxito', torneo })
  } catch (error) {
    res.status(400).json({ msg: 'Error al crear el torneo' })
  }
}

// Obtener todos los torneos
export const obtenerTorneos = async (req, res) => {
  try {
    const torneos = await Torneo.find().populate('equipos', 'nombre')
    res.json(torneos)
  } catch (error) {
    res.status(400).json({ msg: 'Error al obtener los torneos' })
  }
}

// Obtener torneo por ID
export const obtenerTorneoPorId = async (req, res) => {
  try {
    const { id } = req.params
    const torneo = await Torneo.findById(id).populate('equipos', 'nombre')
    
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado' })
    }
    
    res.json(torneo)
  } catch (error) {
    res.status(400).json({ msg: 'ID de torneo no válido' })
  }
}

// Generar Fixture Round-Robin (Maneja pares/impares y previene duplicados)
export const generarFixture = async (req, res) => {
  try {
    const { id } = req.params

    const torneo = await Torneo.findById(id)
    if (!torneo) {
      return res.status(404).json({ msg: 'Torneo no encontrado en la base de datos' })
    }

    const equipos = torneo.equipos || []
    if (equipos.length < 2) {
      return res.status(400).json({
        msg: 'Se necesitan al menos 2 equipos registrados para generar el fixture'
      })
    }

    // 1. Limpieza preventiva: eliminar fixture previo si se regenera
    await Partido.deleteMany({ torneo: torneo._id })

    // 2. Preparar lista de equipos (soporte para impares agregando comodín null)
    let listaEquipos = [...equipos]
    if (listaEquipos.length % 2 !== 0) {
      listaEquipos.push(null)
    }

    const totalEquipos = listaEquipos.length
    const jornadasIda = totalEquipos - 1
    const partidosPorJornada = totalEquipos / 2
    const partidosGenerados = []

    // 3. Generación de Ida
    for (let jornada = 0; jornada < jornadasIda; jornada++) {
      for (let i = 0; i < partidosPorJornada; i++) {
        const local = listaEquipos[i]
        const visitante = listaEquipos[totalEquipos - 1 - i]

        // Solo crea el partido si ninguno de los dos es el comodín de descanso
        if (local && visitante) {
          partidosGenerados.push({
            torneo: torneo._id,
            local,
            visitante,
            jornada: jornada + 1,
            estado: 'Programado'
          })
        }
      }
      // Rotación Round-Robin dejando el primer elemento fijo
      const temp = listaEquipos.pop()
      listaEquipos.splice(1, 0, temp)
    }

    // 4. Generación de Vuelta (Inversión de localía)
    const partidosVuelta = partidosGenerados.map(p => ({
      torneo: torneo._id,
      local: p.visitante,
      visitante: p.local,
      jornada: p.jornada + jornadasIda,
      estado: 'Programado'
    }))

    const fixturesTotales = [...partidosGenerados, ...partidosVuelta]

    // 5. Inserción masiva y actualización del torneo
    await Partido.insertMany(fixturesTotales)

    torneo.estado = 'En Curso'
    await torneo.save()

    res.status(201).json({
      msg: 'Fixture generado con éxito (Ida y Vuelta)',
      totalPartidos: fixturesTotales.length,
      partidos: fixturesTotales
    })

  } catch (error) {
    console.error('Error en generarFixture:', error)

    if (error.name === 'CastError') {
      return res.status(400).json({ msg: 'El ID del torneo no es válido' })
    }

    res.status(400).json({ msg: 'No se pudo generar el fixture del torneo' })
  }
}

export default { crearTorneo, obtenerTorneos, obtenerTorneoPorId, generarFixture };
