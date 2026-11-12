import Partido from '../models/Partido.js';
import Equipo from '../models/Equipo.js';
import Jugador from '../models/Jugador.js';

export const listarPartidos = async (req, res) => {
  try {
    const { jornada, equipo, torneo } = req.query;
    let filtro = {};

    if (torneo) filtro.torneo = torneo;
    if (jornada) filtro.jornada = jornada;
    if (equipo) filtro.$or = [{ local: equipo }, { visitante: equipo }];

    const partidos = await Partido.find(filtro).populate('local visitante');

    res.json(partidos);

  } catch (error) {
    console.error("Error en listarPartidos:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El parámetro de búsqueda proporcionado no es un ID válido"
      });
    }

    res.status(400).json({
      msg: "Error al consultar los partidos"
    });
  }
};

export const cargarResultado = async (req, res) => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisitante, goleadores, tarjetas } = req.body;

    const partido = await Partido.findById(id);

    if (!partido) {
      return res.status(404).json({
        msg: "El partido no existe en la base de datos"
      });
    }

    if (partido.estado === 'Finalizado') {
      return res.status(400).json({
        msg: "El resultado de este partido ya fue cargado previamente"
      });
    }

    // Regla Oficial: Solo se podrá jugar cuando el entrenador escoja al capitán del equipo
    const eqLocal = await Equipo.findById(partido.local);
    const eqVisitante = await Equipo.findById(partido.visitante);
    const jugsLocal = await Jugador.find({ equipo: partido.local });
    const jugsVisitante = await Jugador.find({ equipo: partido.visitante });
    const capLocal = Boolean(eqLocal?.capitan?.trim()) || jugsLocal.some(j => j.esCapitan);
    const capVisitante = Boolean(eqVisitante?.capitan?.trim()) || jugsVisitante.some(j => j.esCapitan);

    if (!capLocal) {
      return res.status(400).json({
        msg: `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club "${eqLocal?.nombre || 'Local'}" no tiene capitán designado.`
      });
    }
    if (!capVisitante) {
      return res.status(400).json({
        msg: `Solo se podrá jugar cuando el entrenador escoja al capitán del equipo. El club "${eqVisitante?.nombre || 'Visitante'}" no tiene capitán designado.`
      });
    }

    if (golesLocal < 0 || golesVisitante < 0) {
      return res.status(400).json({
        msg: "Los goles no pueden ser números negativos"
      });
    }

    partido.golesLocal = golesLocal;
    partido.golesVisitante = golesVisitante;
    partido.tarjetas = tarjetas || [];
    partido.estado = 'Finalizado';
    partido.cambios = Array.isArray(req.body.cambios) ? req.body.cambios : (partido.cambios || []);

    if (Array.isArray(goleadores) && goleadores.length) {
      partido.goleadores = goleadores;
    } else if (Number(golesLocal) > 0 || Number(golesVisitante) > 0) {
      partido.goleadores = await autoGenerarGoleadoresParaEquipos(partido);
    } else {
      partido.goleadores = [];
    }

    await partido.save();
    await recalcularEstadisticasJugadores();

    res.json({
      msg: "Resultado cargado exitosamente",
      partido
    });

  } catch (error) {
    console.error("Error en cargarResultado:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID del partido no es un ObjectId válido"
      });
    }

    if (error.name === 'ValidationError') {
      const mensajes = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        msg: mensajes.join(', ')
      });
    }

    res.status(400).json({
      msg: "No se pudo registrar el resultado del partido"
    });
  }
};

export const obtenerTablaPosiciones = async (req, res) => {
  try {
    const { torneoId } = req.params;

    const partidos = await Partido.find({ torneo: torneoId, estado: 'Finalizado' }).populate('local visitante');

    const tabla = {};

    partidos.forEach(p => {
      if (!p.local || !p.visitante) return;

      const l = p.local._id.toString();
      const v = p.visitante._id.toString();
      const nombreL = p.local.nombre;
      const nombreV = p.visitante.nombre;

      if (!tabla[l]) tabla[l] = { equipo: nombreL, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 };
      if (!tabla[v]) tabla[v] = { equipo: nombreV, pts: 0, pj: 0, pg: 0, pe: 0, pp: 0, gf: 0, gc: 0, dg: 0 };

      tabla[l].pj += 1;
      tabla[v].pj += 1;

      tabla[l].gf += p.golesLocal;
      tabla[l].gc += p.golesVisitante;
      tabla[v].gf += p.golesVisitante;
      tabla[v].gc += p.golesLocal;

      if (p.golesLocal > p.golesVisitante) {
        tabla[l].pts += 3; 
        tabla[l].pg += 1;
        tabla[v].pp += 1;
      } else if (p.golesLocal < p.golesVisitante) {
        tabla[v].pts += 3; 
        tabla[v].pg += 1;
        tabla[l].pp += 1;
      } else {
        tabla[l].pts += 1; 
        tabla[l].pe += 1;
        tabla[v].pts += 1; 
        tabla[v].pe += 1;
      }
    });

    Object.values(tabla).forEach(t => t.dg = t.gf - t.gc);

    const resultadoFinal = Object.values(tabla).sort((a, b) => b.pts - a.pts || b.dg - a.dg);

    res.json(resultadoFinal);

  } catch (error) {
    console.error("Error en obtenerTablaPosiciones:", error);

    if (error.name === 'CastError') {
      return res.status(400).json({
        msg: "El ID del torneo no es un ObjectId válido"
      });
    }

    res.status(400).json({
      msg: "No se pudo generar la tabla de posiciones"
    });
  }
};

export const crearPartido = async (req, res) => {
  try {
    let { torneo, local, visitante, jornada, fecha, golesLocal, golesVisitante, estado } = req.body;

    if (!local || !visitante) {
      return res.status(400).json({
        msg: 'Debes seleccionar tanto el equipo local como el visitante.'
      });
    }

    if (String(local) === String(visitante)) {
      return res.status(400).json({
        msg: 'El equipo local y el equipo visitante no pueden ser el mismo club.'
      });
    }

    const equipoLocal = await Equipo.findById(local);
    const equipoVisitante = await Equipo.findById(visitante);

    if (!equipoLocal || !equipoVisitante) {
      return res.status(400).json({
        msg: 'Uno o ambos equipos seleccionados no existen en la base de datos.'
      });
    }

    // Regla Oficial: Un equipo solo se podrá registrar a partidos cuando sus jugadores sean mínimo de 11 personas
    const countLocal = await Jugador.countDocuments({ equipo: local });
    const countVisitante = await Jugador.countDocuments({ equipo: visitante });

    if (countLocal < 11) {
      return res.status(400).json({
        msg: `El club "${equipoLocal.nombre}" no puede disputar partidos: solo tiene ${countLocal} jugadores en nómina. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
      });
    }

    if (countVisitante < 11) {
      return res.status(400).json({
        msg: `El club "${equipoVisitante.nombre}" no puede disputar partidos: solo tiene ${countVisitante} jugadores en nómina. Se exige un mínimo reglamentario de 11 personas para registrarse a partidos.`
      });
    }

    // Regla Oficial: Solo se permite jugar con máximo 11 jugadores en la cancha (los demás en banca)
    const jugadoresLocal = await Jugador.find({ equipo: local });
    const jugadoresVisitante = await Jugador.find({ equipo: visitante });
    const esBanca = (pos) => {
      const p = String(pos || '').toLowerCase();
      return p.includes('banc') || p.includes('supl');
    };
    const enCanchaLocal = jugadoresLocal.filter(j => !esBanca(j.posicion)).length;
    const enCanchaVisitante = jugadoresVisitante.filter(j => !esBanca(j.posicion)).length;

    if (enCanchaLocal > 11) {
      return res.status(400).json({
        msg: `Advertencia reglamentaria: El club "${equipoLocal.nombre}" tiene ${enCanchaLocal} jugadores en cancha. Solo se permite jugar con un máximo de 11 jugadores en la cancha (asigna el rol "En Banca" a los suplentes).`
      });
    }

    if (enCanchaVisitante > 11) {
      return res.status(400).json({
        msg: `Advertencia reglamentaria: El club "${equipoVisitante.nombre}" tiene ${enCanchaVisitante} jugadores en cancha. Solo se permite jugar con un máximo de 11 jugadores en la cancha (asigna el rol "En Banca" a los suplentes).`
      });
    }

    // Regla Oficial: Solo se podrá jugar cuando el entrenador escoja al capitán del equipo
    const tieneCapitanLocal = Boolean(equipoLocal.capitan && equipoLocal.capitan.trim()) || jugadoresLocal.some(j => j.esCapitan);
    const tieneCapitanVisitante = Boolean(equipoVisitante.capitan && equipoVisitante.capitan.trim()) || jugadoresVisitante.some(j => j.esCapitan);

    if (!tieneCapitanLocal) {
      return res.status(400).json({
        msg: `Regla reglamentaria: Solo se permite disputar partidos cuando el entrenador escoja al capitán del equipo. El club "${equipoLocal.nombre}" aún no tiene capitán designado.`
      });
    }

    if (!tieneCapitanVisitante) {
      return res.status(400).json({
        msg: `Regla reglamentaria: Solo se permite disputar partidos cuando el entrenador escoja al capitán del equipo. El club "${equipoVisitante.nombre}" aún no tiene capitán designado.`
      });
    }

    // Regla de Equidad Oficial: Un equipo solo se puede enfrentar a otro que tenga su misma cantidad de partidos jugados
    // (un club que ya jugo un partido se enfrenta a otro que ya jugo, y no con otro que no ha jugado ninguno)
    const partidosJugadosLocal = await Partido.countDocuments({
      $or: [{ local: local }, { visitante: local }],
      estado: { $in: ['Finalizado', 'jugado'] }
    });

    const partidosJugadosVisitante = await Partido.countDocuments({
      $or: [{ local: visitante }, { visitante: visitante }],
      estado: { $in: ['Finalizado', 'jugado'] }
    });

    if (partidosJugadosLocal !== partidosJugadosVisitante) {
      return res.status(400).json({
        msg: `Regla de equidad del torneo: El club "${equipoLocal.nombre}" lleva ${partidosJugadosLocal} partido(s) jugado(s), mientras que "${equipoVisitante.nombre}" lleva ${partidosJugadosVisitante}. Los equipos deben enfrentarse entre pares con igual cantidad de partidos jugados.`
      });
    }

    // Regla de Descanso Oficial: Minimo 2 dias de descanso entre partidos para cada equipo
    const fechaPropuesta = req.body.fechaHora ? new Date(req.body.fechaHora) : new Date();
    const tiempoPropuesto = fechaPropuesta.getTime();
    const DOS_DIAS_MS = 2 * 24 * 60 * 60 * 1000 - 60000; // 2 días en milisegundos

    const partidosPrevios = await Partido.find({
      $or: [
        { local: local }, { visitante: local },
        { local: visitante }, { visitante: visitante }
      ]
    });

    for (const p of partidosPrevios) {
      if (p.fechaHora) {
        const tiempoPrevio = new Date(p.fechaHora).getTime();
        const diffDias = Math.abs(tiempoPropuesto - tiempoPrevio);
        const involucraLocal = String(p.local) === String(local) || String(p.visitante) === String(local);
        const involucraVisitante = String(p.local) === String(visitante) || String(p.visitante) === String(visitante);

        if (diffDias < DOS_DIAS_MS) {
          const clubAfectado = involucraLocal ? equipoLocal.nombre : equipoVisitante.nombre;
          const fechaPrevStr = new Date(p.fechaHora).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return res.status(400).json({
            msg: `Regla de descanso oficial: El club "${clubAfectado}" tiene un partido el ${fechaPrevStr}. Por reglamento debe haber un mínimo de 2 días de descanso entre partidos para volver a jugar.`
          });
        }
      }
    }

    const j = partidosJugadosLocal + 1;

    // Si no viene torneo, asignar o inicializar el torneo oficial de la liga
    if (!torneo) {
      const Torneo = (await import('../models/Torneo.js')).default;
      let t = await Torneo.findOne();
      if (!t) {
        t = await Torneo.create({
          nombre: 'Torneo Oficial Barrial 2026',
          categoria: 'Libre Masculino'
        });
      }
      torneo = t._id;
    }

    const fechaReal = req.body.fechaHora ? new Date(req.body.fechaHora) : new Date();

    const nuevoPartido = new Partido({
      torneo,
      local,
      visitante,
      jornada: j,
      fechaHora: fechaReal,
      golesLocal: Number(golesLocal) || 0,
      golesVisitante: Number(golesVisitante) || 0,
      asistenciasLocal: Number(req.body.asistenciasLocal) || 0,
      asistenciasVisitante: Number(req.body.asistenciasVisitante) || 0,
      estado: req.body.estado || (Number(golesLocal) > 0 || Number(golesVisitante) > 0 ? 'Finalizado' : 'Por Confirmar'),
      confirmacionLocal: req.body.confirmacionLocal || false,
      confirmacionVisitante: req.body.confirmacionVisitante || false,
      confirmadoPorDTs: Boolean(req.body.confirmacionLocal && req.body.confirmacionVisitante)
    });

    if (Array.isArray(req.body.goleadores) && req.body.goleadores.length) {
      nuevoPartido.goleadores = req.body.goleadores;
      nuevoPartido.estado = 'Finalizado';
    } else if (Number(golesLocal) > 0 || Number(golesVisitante) > 0) {
      nuevoPartido.goleadores = await autoGenerarGoleadoresParaEquipos(nuevoPartido);
      nuevoPartido.estado = 'Finalizado';
    }

    await nuevoPartido.save();
    if (nuevoPartido.estado === 'Finalizado') {
      await recalcularEstadisticasJugadores();
    }

    // Notificaciones oficiales automáticas para que los dos entrenadores confirmen que van a jugar
    try {
      const Notificacion = (await import('../models/Notificacion.js')).default;
      await Notificacion.create({
        tipo: 'convocatoria_partido',
        titulo: `📅 Convocatoria Oficial: Jornada ${j} vs ${equipoVisitante.nombre}`,
        mensaje: `El Organizador ha programado el partido de tu club ${equipoLocal.nombre} vs ${equipoVisitante.nombre} para la Jornada ${j}. Ambos entrenadores deben confirmar que van a jugar.`,
        remitente: 'Organizador del Torneo',
        equipo: equipoLocal._id,
        equipoNombre: equipoLocal.nombre,
        partido: nuevoPartido._id,
        datos: { partidoId: nuevoPartido._id, jornada: j, rival: equipoVisitante.nombre, esLocal: true }
      });

      await Notificacion.create({
        tipo: 'convocatoria_partido',
        titulo: `📅 Convocatoria Oficial: Jornada ${j} vs ${equipoLocal.nombre}`,
        mensaje: `El Organizador ha programado el partido de tu club ${equipoVisitante.nombre} vs ${equipoLocal.nombre} para la Jornada ${j}. Ambos entrenadores deben confirmar que van a jugar.`,
        remitente: 'Organizador del Torneo',
        equipo: equipoVisitante._id,
        equipoNombre: equipoVisitante.nombre,
        partido: nuevoPartido._id,
        datos: { partidoId: nuevoPartido._id, jornada: j, rival: equipoLocal.nombre, esLocal: false }
      });
    } catch (_) {}

    const partidoPoblado = await Partido.findById(nuevoPartido._id).populate('local visitante');

    res.status(201).json({
      msg: 'Partido registrado exitosamente y convocatoria enviada a ambos entrenadores para confirmar que van a jugar.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al registrar partido:', error);
    res.status(400).json({
      msg: error.message || 'Error al registrar el partido'
    });
  }
};

export const confirmarPartidoDT = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipoId, entrenadorNombre } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    // Regla Oficial: Cuando un partido está finalizado, el marcador queda cerrado y no se puede modificar
    if (['finalizado', 'jugado'].includes(String(partido.estado || '').toLowerCase())) {
      return res.status(400).json({
        msg: 'Este partido ya está FINALIZADO oficialmente. Por reglamento, los partidos finalizados quedan cerrados y no pueden modificarse.'
      });
    }

    const eqIdStr = String(equipoId || '').trim();
    const locIdStr = String(partido.local._id || partido.local);
    const visIdStr = String(partido.visitante._id || partido.visitante);

    if (eqIdStr === locIdStr) {
      partido.confirmacionLocal = true;
    } else if (eqIdStr === visIdStr) {
      partido.confirmacionVisitante = true;
    } else {
      return res.status(400).json({ msg: 'Tu club no forma parte de este encuentro.' });
    }

    const Notificacion = (await import('../models/Notificacion.js')).default;

    if (partido.confirmacionLocal && partido.confirmacionVisitante) {
      partido.confirmadoPorDTs = true;
      if (partido.estado === 'Por Confirmar') {
        partido.estado = 'En Preparación';
      }

      // Notificar al organizador
      try {
        await Notificacion.create({
          tipo: 'partido_confirmado_dts',
          titulo: `✅ Ambos DTs Confirmaron: ${partido.local.nombre} vs ${partido.visitante.nombre}`,
          mensaje: `Los directores técnicos de ambos clubes han confirmado que van a jugar el partido de la Jornada ${partido.jornada}. El encuentro está listo en preparación; el organizador ya puede fijar los goles y asistencias oficiales.`,
          remitente: entrenadorNombre || 'Directores Técnicos',
          partido: partido._id,
          datos: { partidoId: partido._id, jornada: partido.jornada }
        });
      } catch (_) {}
    } else {
      try {
        const nombreClubConfirmado = eqIdStr === locIdStr ? partido.local.nombre : partido.visitante.nombre;
        await Notificacion.create({
          tipo: 'confirmacion_dt',
          titulo: `⚽ El DT de ${nombreClubConfirmado} confirmó su participación`,
          mensaje: `El DT de ${nombreClubConfirmado} confirmó que jugará el partido de la Jornada ${partido.jornada}. Se espera la confirmación del DT rival.`,
          remitente: entrenadorNombre || 'Entrenador',
          equipo: equipoId,
          partido: partido._id,
          datos: { partidoId: partido._id }
        });
      } catch (_) {}
    }

    await partido.save();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: partido.confirmadoPorDTs 
        ? '¡Confirmado por ambos DTs! El partido pasa a estar En Preparación para disputarse.' 
        : '¡Tu club ha confirmado la participación! Esperando confirmación del DT rival.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al confirmar partido DT:', error);
    res.status(400).json({ msg: error.message || 'Error al confirmar partido' });
  }
};


export const reportarGolesDT = async (req, res) => {
  try {
    const { id } = req.params;
    const { equipoId, entrenadorNombre, goles, goleadores, faltas, tarjetas } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    if (['finalizado', 'jugado'].includes(String(partido.estado || '').toLowerCase())) {
      return res.status(400).json({
        msg: 'Este partido ya fue oficializado y cerrado en la tabla de posiciones.'
      });
    }

    const eqIdStr = String(equipoId || '').trim();
    const locIdStr = String(partido.local._id || partido.local);
    const visIdStr = String(partido.visitante._id || partido.visitante);

    const cantGoles = Math.max(0, Number(goles) || 0);
    const autores = Array.isArray(goleadores) ? goleadores : [];

    let esLocal = false;
    let nombreMiClub = '';

    const cantFaltas = Math.max(0, Number(faltas) || 0);
    const listaTarjetasDT = Array.isArray(tarjetas) ? tarjetas : [];

    if (eqIdStr === locIdStr) {
      esLocal = true;
      nombreMiClub = partido.local.nombre;
      partido.reporteGolesLocal = {
        goles: cantGoles,
        reportado: true,
        goleadores: autores
      };
      partido.golesLocal = cantGoles;
      partido.faltasLocal = cantFaltas;
    } else if (eqIdStr === visIdStr) {
      nombreMiClub = partido.visitante.nombre;
      partido.reporteGolesVisitante = {
        goles: cantGoles,
        reportado: true,
        goleadores: autores
      };
      partido.golesVisitante = cantGoles;
      partido.faltasVisitante = cantFaltas;
    }

    // Registrar tarjetas reportadas
    if (listaTarjetasDT.length > 0) {
      try {
        await procesarSancionesDisciplinarias(listaTarjetasDT, eqIdStr);
      } catch (errSancion) {
        console.error('Error al procesar sanciones disciplinarias:', errSancion);
      }
      if (!Array.isArray(partido.tarjetas)) partido.tarjetas = [];
      listaTarjetasDT.forEach(t => {
        partido.tarjetas.push({
          jugadorId: t.jugadorId,
          nombre: t.nombre,
          dorsal: t.dorsal,
          equipo: eqIdStr === locIdStr ? partido.local._id : partido.visitante._id,
          equipoNombre: nombreMiClub,
          tipo: t.tipo || 'Amarilla',
          motivo: t.motivo || 'Falta reglamentaria',
          minuto: Number(t.minuto) || 45
        });
      });
    } else {
      return res.status(400).json({ msg: 'Tu club no forma parte de este encuentro.' });
    }

    // Si ambos DTs ya reportaron sus goles, unificar los goleadores oficiales y finalizar el encuentro
    const repLoc = partido.reporteGolesLocal;
    const repVis = partido.reporteGolesVisitante;

    const Notificacion = (await import('../models/Notificacion.js')).default;

    if (repLoc?.reportado && repVis?.reportado) {
      partido.estado = 'Finalizado';
    partido.cambios = Array.isArray(req.body.cambios) ? req.body.cambios : (partido.cambios || []);

      // Unificar lista de goleadores oficiales reportados por cada DT
      const listaGoleadores = [];
      if (Array.isArray(repLoc.goleadores)) {
        repLoc.goleadores.forEach((g, idx) => {
          listaGoleadores.push({
            jugadorId: g.jugadorId,
            nombre: g.nombre,
            dorsal: g.dorsal,
            equipo: partido.local._id,
            equipoNombre: partido.local.nombre,
            goles: Number(g.goles) || 1,
            minuto: 15 + (idx * 20) % 70
          });
        });
      }
      if (Array.isArray(repVis.goleadores)) {
        repVis.goleadores.forEach((g, idx) => {
          listaGoleadores.push({
            jugadorId: g.jugadorId,
            nombre: g.nombre,
            dorsal: g.dorsal,
            asistenteId: g.asistenteId || '',
            asistenteNombre: g.asistenteNombre || '',
            equipo: partido.visitante._id,
            equipoNombre: partido.visitante.nombre,
            goles: Number(g.goles) || 1,
            minuto: 20 + (idx * 25) % 65
          });
        });
      }
      partido.goleadores = listaGoleadores;

      // Recalcular estadísticas
      await recalcularEstadisticasJugadores(partido);

      // Notificación al organizador con el resultado consolidado
      try {
        await Notificacion.create({
          tipo: 'marcador_fijado',
          titulo: `⚽ Resultado Oficial Consolidado: ${partido.local.nombre} ${partido.golesLocal} - ${partido.golesVisitante} ${partido.visitante.nombre}`,
          mensaje: `Ambos Directores Técnicos reportaron los goles de sus respectivos clubes (${partido.local.nombre}: ${partido.golesLocal} goles, ${partido.visitante.nombre}: ${partido.golesVisitante} goles). El partido ha quedado oficializado automáticamente en la tabla de posiciones.`,
          remitente: 'Sistema Oficial del Torneo',
          partido: partido._id,
          destinatarioRol: 'organizador',
          datos: { partidoId: partido._id, golesLocal: partido.golesLocal, golesVisitante: partido.golesVisitante }
        });
      } catch (_) {}
    } else {
      // Notificar que un DT reportó los goles de su equipo
      try {
        await Notificacion.create({
          tipo: 'reporte_goleadores',
          titulo: `📋 El DT de ${nombreMiClub} reportó ${cantGoles} gol(es) para su equipo`,
          mensaje: `El DT de ${nombreMiClub} ha registrado el reporte oficial de goles de su club (${cantGoles} gol/es). Se espera que el DT rival reporte los suyos para oficializar el resultado final.`,
          remitente: entrenadorNombre || `DT ${nombreMiClub}`,
          equipo: equipoId,
          partido: partido._id,
          destinatarioRol: 'organizador',
          datos: { partidoId: partido._id, goles: cantGoles, equipo: nombreMiClub }
        });
      } catch (_) {}
    }

    await partido.save();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: `¡Reporte de goles enviado con éxito! Indicaste ${cantGoles} gol(es) para ${nombreMiClub}.`,
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error en reportarGolesDT:', error);
    res.status(400).json({ msg: error.message || 'Error al reportar goles del DT' });
  }
};


// Regla Única Oficial de Faltas (Sin acumulación de partidos ni expulsión del equipo):
// - Si un jugador recibe 1 tarjeta roja o 2 tarjetas amarillas en el encuentro, no jugará el siguiente partido (1 partido suspendido).
// - No se acumulan sanciones entre partidos ni se expulsa del equipo.
export const procesarSancionesDisciplinarias = async (tarjetasReportadas, equipoId) => {
  if (!Array.isArray(tarjetasReportadas) || tarjetasReportadas.length === 0) return [];
  const Jugador = (await import('../models/Jugador.js')).default;
  const Notificacion = (await import('../models/Notificacion.js')).default;

  // Agrupar tarjetas por jugadorId en este encuentro
  const porJugador = {};
  for (const t of tarjetasReportadas) {
    const jId = String(t.jugadorId || t.jugador || '').trim();
    if (!jId) continue;
    if (!porJugador[jId]) {
      porJugador[jId] = { amarillas: 0, rojas: 0, nombre: t.nombre || 'Jugador', dorsal: t.dorsal };
    }
    if (t.tipo === 'Amarilla') {
      porJugador[jId].amarillas += 1;
    } else if (t.tipo === 'Roja') {
      porJugador[jId].rojas += 1;
    }
  }

  const resultadoSanciones = [];

  for (const [jugadorId, stats] of Object.entries(porJugador)) {
    const jugador = await Jugador.findById(jugadorId);
    if (!jugador) continue;

    // Regla única: 1 roja directa O 2 amarillas en el partido -> 1 partido sin jugar (no se acumula)
    const mereceSuspension = stats.rojas >= 1 || stats.amarillas >= 2;

    if (mereceSuspension) {
      jugador.partidosSuspendidosRestantes = 1;
      jugador.expulsadoDelTorneo = false; // Jamás es sacado del equipo
      jugador.motivoSancion = stats.rojas >= 1
        ? 'SUSPENDIDO: Tarjeta roja en el último partido. No jugará el siguiente encuentro.'
        : 'SUSPENDIDO: Doble amarilla en el último partido. No jugará el siguiente encuentro.';

      try {
        await Notificacion.create({
          tipo: 'sancion_disciplinaria',
          titulo: `🛑 Suspensión de 1 Partido: ${jugador.nombre}`,
          mensaje: `El futbolista ${jugador.nombre} (#${jugador.numero}) recibió ${stats.rojas >= 1 ? 'tarjeta roja' : 'doble amarilla'} y no podrá disputar el siguiente encuentro reglamentario.`,
          remitente: 'Comité de Disciplina',
          equipo: jugador.equipo,
          destinatarioRol: 'organizador'
        });
      } catch (_) {}
    } else {
      // Si solo sacó 1 amarilla, no se suspende
      jugador.partidosSuspendidosRestantes = 0;
      jugador.motivoSancion = '';
    }

    await jugador.save();
    resultadoSanciones.push({
      jugadorId,
      nombre: jugador.nombre,
      suspendidoPartidos: jugador.partidosSuspendidosRestantes
    });
  }

  return resultadoSanciones;
};

export const fijarMarcadorOrganizador = async (req, res) => {
  try {
    const { id } = req.params;
    const { golesLocal, golesVisitante, asistenciasLocal, asistenciasVisitante } = req.body;

    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    // Regla Oficial: Cuando un partido está finalizado, el marcador queda cerrado y no se puede modificar
    if (['finalizado', 'jugado'].includes(String(partido.estado || '').toLowerCase())) {
      return res.status(400).json({
        msg: 'Este partido ya está FINALIZADO oficialmente. Por reglamento, los partidos finalizados quedan cerrados y no pueden modificarse.'
      });
    }

    // Permitir fijar el marcador oficial; si no habían confirmado, se auto-valida al fijar la puntuación final
    partido.confirmacionLocal = true;
    partido.confirmacionVisitante = true;
    partido.confirmadoPorDTs = true;

    
    // -------------------------------------------------------------
    // REGLA OFICIAL DE TITULARES Y SUPLENTES (CAMBIOS REGLAMENTARIOS)
    // Solo puede marcar gol quien está en la alineación titular/cancha,
    // o un suplente de banca que haya entrado por un cambio reglamentario
    // y cuyo gol sea posterior (o en el) minuto de su ingreso al campo.
    // -------------------------------------------------------------
    const Jugador = (await import('../models/Jugador.js')).default;
    const listaCambios = Array.isArray(req.body.cambios) ? req.body.cambios : [];

    if (Array.isArray(req.body.goleadores) && req.body.goleadores.length > 0) {
      for (const g of req.body.goleadores) {
        if (!g.jugadorId) continue;
        const jugDoc = await Jugador.findById(g.jugadorId);
        if (!jugDoc) continue;

        const minutoGol = typeof g.minuto === 'number' ? g.minuto : (parseInt(String(g.minuto || '45').replace(/[^0-9]/g, ''), 10) || 45);
        const estaEnBanca = jugDoc.posicion === 'En Banca';

        if (estaEnBanca) {
          // Buscar si hubo un cambio donde este jugador entró a la cancha
          const cambioDelJugador = listaCambios.find(c => String(c.jugadorEntraId) === String(jugDoc._id));
          if (!cambioDelJugador) {
            return res.status(400).json({
              msg: `⚠️ REGLA REGLAMENTARIA: El futbolista "${jugDoc.nombre}" se encuentra registrado como suplente (En Banca). Para que un suplente anote un gol, debe registrarse un cambio oficial en el partido sustituyendo a un titular.`
            });
          }

          const minutoCambio = Number(cambioDelJugador.minuto) || 60;
          if (minutoGol < minutoCambio) {
            return res.status(400).json({
              msg: `⚠️ REGLA CRONOLÓGICA DE SUSTITUCIÓN: El gol de "${jugDoc.nombre}" (Minuto ${minutoGol}') no puede ser anterior al minuto de su ingreso al campo (Cambio en Minuto ${minutoCambio}'). Los goles del suplente deben ser después de entrar a la cancha.`
            });
          }
        }
      }
    }

    partido.golesLocal = Number(golesLocal) || 0;
    partido.golesVisitante = Number(golesVisitante) || 0;
    partido.asistenciasLocal = Number(asistenciasLocal) || 0;
    partido.asistenciasVisitante = Number(asistenciasVisitante) || 0;
    partido.estado = 'Finalizado';
    partido.cambios = Array.isArray(req.body.cambios) ? req.body.cambios : (partido.cambios || []);

    // Goleadores oficiales fijados por el Organizador (o autogenerados si no vinieron explícitos)
    if (Array.isArray(req.body.goleadores) && req.body.goleadores.length > 0) {
      partido.goleadores = req.body.goleadores.map(g => ({
        ...g,
        goles: Number(g.goles) || 1,
        minuto: typeof g.minuto === 'number' ? g.minuto : (parseInt(String(g.minuto || '45').replace(/[^0-9]/g, ''), 10) || 45)
      }));
    } else if (partido.golesLocal > 0 || partido.golesVisitante > 0) {
      partido.goleadores = await autoGenerarGoleadoresParaEquipos(partido);
    } else {
      partido.goleadores = [];
    }

    await partido.save();
    await recalcularEstadisticasJugadores();

    // Notificar a los entrenadores
    try {
      const Notificacion = (await import('../models/Notificacion.js')).default;
      await Notificacion.create({
        tipo: 'marcador_fijado',
        titulo: `⚽ Marcador Oficial Fijado: ${partido.local.nombre} ${partido.golesLocal} - ${partido.golesVisitante} ${partido.visitante.nombre}`,
        mensaje: `El Organizador ha fijado el marcador oficial: ${partido.local.nombre} (${partido.golesLocal} goles, ${partido.asistenciasLocal} asistencias) vs ${partido.visitante.nombre} (${partido.golesVisitante} goles, ${partido.asistenciasVisitante} asistencias). Entrenadores: Ingresen a la Pizarra DT para escoger los autores de los goles. Los cuadros se crearán automáticamente.`,
        remitente: 'Organizador del Torneo',
        partido: partido._id,
        datos: {
          partidoId: partido._id,
          golesLocal: partido.golesLocal,
          golesVisitante: partido.golesVisitante,
          asistenciasLocal: partido.asistenciasLocal,
          asistenciasVisitante: partido.asistenciasVisitante
        }
      });
    } catch (_) {}

    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');
    res.json({
      msg: 'Marcador y asistencias fijados por el Organizador exitosamente.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al fijar marcador organizador:', error);
    res.status(400).json({ msg: error.message || 'Error al fijar marcador' });
  }
};

export const actualizarGoleadores = async (req, res) => {
  try {
    const { id } = req.params;
    const { goleadores, golesLocal, golesVisitante, equipoId } = req.body;

    const partido = await Partido.findById(id);
    if (!partido) {
      return res.status(404).json({ msg: 'El partido no existe en la base de datos' });
    }

    // Regla Oficial: Bloquear modificación si el partido ya está cerrado y finalizado
    if (['finalizado', 'jugado'].includes(String(partido.estado || '').toLowerCase()) && Array.isArray(partido.goleadores) && partido.goleadores.length > 0) {
      return res.status(400).json({
        msg: 'El partido ya se encuentra Finalizado con su acta oficial registrada. No se permite modificar los registros de un partido cerrado.'
      });
    }

    const eqLocal = await Equipo.findById(partido.local);
    const eqVisitante = await Equipo.findById(partido.visitante);
    const jugsLocal = await Jugador.find({ equipo: partido.local });
    const jugsVisitante = await Jugador.find({ equipo: partido.visitante });
    const capLocal = Boolean(eqLocal?.capitan?.trim()) || jugsLocal.some(j => j.esCapitan);
    const capVisitante = Boolean(eqVisitante?.capitan?.trim()) || jugsVisitante.some(j => j.esCapitan);

    if (!capLocal || !capVisitante) {
      return res.status(400).json({
        msg: 'Solo se podrá jugar y registrar goles cuando el entrenador escoja al capitán del equipo. Ambos equipos deben contar con capitán designado.'
      });
    }

    if (golesLocal !== undefined) partido.golesLocal = Number(golesLocal);
    if (golesVisitante !== undefined) partido.golesVisitante = Number(golesVisitante);

    if (Array.isArray(goleadores)) {
      const targetEqId = String(equipoId || '').trim();
      const otrosClubes = (partido.goleadores || []).filter(g => {
        const gEq = String(g.equipo || g.equipoId || '');
        return targetEqId && gEq && gEq !== targetEqId;
      });
      const goleadoresSanitizados = goleadores.map(g => {
        let min = g.minuto;
        if (typeof min === 'string') {
          const parsed = parseInt(min.replace(/[^0-9]/g, ''), 10);
          min = isNaN(parsed) ? 45 : parsed;
        } else if (typeof min !== 'number') {
          min = 45;
        }
        return {
          ...g,
          minuto: min,
          goles: Number(g.goles) || 1
        };
      });
      partido.goleadores = [...otrosClubes, ...goleadoresSanitizados];
    }
    partido.estado = 'Finalizado';
    partido.cambios = Array.isArray(req.body.cambios) ? req.body.cambios : (partido.cambios || []);

    await partido.save();
    await recalcularEstadisticasJugadores();
    const partidoPoblado = await Partido.findById(partido._id).populate('local visitante');

    res.json({
      msg: 'Goleadores registrados exitosamente por el Entrenador.',
      partido: partidoPoblado
    });
  } catch (error) {
    console.error('Error al actualizar goleadores:', error);
    res.status(400).json({ msg: error.message || 'Error al actualizar los goleadores' });
  }
};

export const autoGenerarGoleadoresParaEquipos = async (partido) => {
  try {
    const localId = partido.local?._id || partido.local;
    const visId = partido.visitante?._id || partido.visitante;

    const [eqLocal, eqVis, jugsLocal, jugsVis] = await Promise.all([
      Equipo.findById(localId),
      Equipo.findById(visId),
      Jugador.find({ equipo: localId }),
      Jugador.find({ equipo: visId })
    ]);

    const totalGolesLocal = Number(partido.golesLocal) || 0;
    const totalGolesVis = Number(partido.golesVisitante) || 0;

    const listaGoleadores = [];

    const distribuirGoles = (jugadores, totalGoles, eqNombre, eqId) => {
      if (!jugadores || !jugadores.length || totalGoles <= 0) return [];

      const outfield = jugadores.filter(j => {
        const p = String(j.posicion || '').toLowerCase();
        return !p.includes('porter') && !p.includes('arqu') && !p.includes('banc');
      });
      const pool = outfield.length >= 2 ? outfield : jugadores;

      const asignaciones = [];
      let golesRestantes = totalGoles;

      // Barajar aleatoriamente
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      let idx = 0;

      while (golesRestantes > 0) {
        const jugador = shuffled[idx % shuffled.length];
        golesRestantes -= 1;

        const posiblesAsistentes = jugadores.filter(j => String(j._id) !== String(jugador._id));
        const tieneAsistencia = posiblesAsistentes.length > 0 && Math.random() > 0.35;
        const asistente = tieneAsistencia ? posiblesAsistentes[Math.floor(Math.random() * posiblesAsistentes.length)] : null;

        asignaciones.push({
          jugador: jugador._id,
          jugadorId: String(jugador._id),
          nombre: `${jugador.nombre} ${jugador.apellido && jugador.apellido !== '-' ? jugador.apellido : ''}`.trim(),
          dorsal: jugador.numero ?? jugador.dorsal ?? 10,
          goles: 1,
          minuto: 0, // Se distribuirá con separación mínima garantizada de 2 minutos
          asistente: asistente ? asistente._id : null,
          asistenteId: asistente ? String(asistente._id) : '',
          asistenteNombre: asistente ? `${asistente.nombre} ${asistente.apellido && asistente.apellido !== '-' ? asistente.apellido : ''}`.trim() : '',
          equipo: eqId,
          equipoId: String(eqId),
          equipoNombre: eqNombre || ''
        });
        idx++;
      }
      return asignaciones;
    };

    if (totalGolesLocal > 0) {
      listaGoleadores.push(...distribuirGoles(jugsLocal, totalGolesLocal, eqLocal?.nombre, localId));
    }
    if (totalGolesVis > 0) {
      listaGoleadores.push(...distribuirGoles(jugsVis, totalGolesVis, eqVis?.nombre, visId));
    }

    // Regla: Separación obligatoria de al menos 2 minutos entre CADA gol del partido (no pueden coincidir en el mismo minuto)
    const totalGolesTotales = listaGoleadores.length;
    if (totalGolesTotales > 0) {
      const shuffledGoles = [...listaGoleadores].sort(() => 0.5 - Math.random());
      const espacioDisponible = Math.floor(75 / (totalGolesTotales + 1));
      const paso = Math.max(3, Math.min(12, espacioDisponible));
      let minActual = 10 + Math.floor(Math.random() * 4);

      shuffledGoles.forEach((g) => {
        g.minuto = Math.min(90, minActual);
        minActual += Math.max(2, paso + Math.floor(Math.random() * 2));
      });

      shuffledGoles.sort((a, b) => Number(a.minuto) - Number(b.minuto));
      return shuffledGoles;
    }

    return listaGoleadores;
  } catch (err) {
    console.error('Error al autogenerar goleadores:', err);
    return [];
  }
};

export const autogenerarGoleadoresHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const partido = await Partido.findById(id).populate('local visitante');
    if (!partido) {
      return res.status(404).json({ msg: 'Partido no encontrado' });
    }
    // No permitir modificar goleadores si el partido ya está finalizado con acta oficial registrada
    if (['finalizado', 'jugado'].includes(String(partido.estado || '').toLowerCase()) && Array.isArray(partido.goleadores) && partido.goleadores.length > 0) {
      return res.status(400).json({
        msg: 'El partido ya está Finalizado con acta oficial registrada. No se puede modificar.'
      });
    }

    partido.goleadores = await autoGenerarGoleadoresParaEquipos(partido);
    partido.estado = 'Finalizado';
    partido.cambios = Array.isArray(req.body.cambios) ? req.body.cambios : (partido.cambios || []);
    await partido.save();
    await recalcularEstadisticasJugadores();

    const actualizado = await Partido.findById(partido._id).populate('local visitante');
    res.json({
      msg: 'Goleadores y asistencias escogidos automáticamente con éxito.',
      partido: actualizado
    });
  } catch (error) {
    console.error('Error en autogenerarGoleadoresHandler:', error);
    res.status(400).json({ msg: error.message || 'Error al autogenerar goleadores' });
  }
};

async function recalcularEstadisticasJugadores() {
  try {
    const partidos = await Partido.find({ estado: 'Finalizado' });
    const golesPorJugador = {};
    const asistenciasPorJugador = {};

    for (const p of partidos) {
      if (Array.isArray(p.goleadores)) {
        for (const g of p.goleadores) {
          const jId = g.jugadorId ? String(g.jugadorId) : '';
          const aId = g.asistenteId ? String(g.asistenteId) : '';
          const esAutogol = Boolean(g.esAutogol);
          // Si es autogol, cuenta en el marcador del partido a favor del rival, pero no suma goles individuales al jugador
          if (jId && !esAutogol) {
            golesPorJugador[jId] = (golesPorJugador[jId] || 0) + (Number(g.goles) || 1);
          }
          if (aId && !esAutogol) {
            asistenciasPorJugador[aId] = (asistenciasPorJugador[aId] || 0) + 1;
          }
        }
      }
    }

    const updates = [];
    for (const [id, goles] of Object.entries(golesPorJugador)) {
      updates.push(Jugador.findByIdAndUpdate(id, { $set: { goles } }));
    }
    for (const [id, asistencias] of Object.entries(asistenciasPorJugador)) {
      updates.push(Jugador.findByIdAndUpdate(id, { $set: { asistencias } }));
    }
    if (updates.length) {
      await Promise.all(updates);
    }
  } catch (err) {
    console.error('Error en recalcularEstadisticasJugadores:', err);
  }
}

export default { 
  listarPartidos, 
  cargarResultado, 
  obtenerTablaPosiciones, 
  crearPartido, 
  confirmarPartidoDT,
  reportarGolesDT, 
  fijarMarcadorOrganizador, 
  actualizarGoleadores,
  autogenerarGoleadoresHandler,
  autoGenerarGoleadoresParaEquipos
};
