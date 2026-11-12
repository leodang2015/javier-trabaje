import { Schema, model } from 'mongoose'

const partidoSchema = new Schema({
  torneo: { type: Schema.Types.ObjectId, ref: 'Torneo', required: true },
  local: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  visitante: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  jornada: { type: Number, required: true },
  fechaHora: { type: Date, default: Date.now },
  golesLocal: { type: Number, default: 0, min: 0 },
  golesVisitante: { type: Number, default: 0, min: 0 },
  asistenciasLocal: { type: Number, default: 0, min: 0 },
  asistenciasVisitante: { type: Number, default: 0, min: 0 },
  motivoPostergacion: { type: String, default: '' },
  fechaOriginal: { type: Date },
  estado: { 
    type: String, 
    enum: ['Por Confirmar', 'En Preparación', 'Programado', 'Finalizado', 'Pospuesto'], 
    default: 'Por Confirmar' 
  },
  confirmacionLocal: { type: Boolean, default: false },
  confirmacionVisitante: { type: Boolean, default: false },
  confirmadoPorDTs: { type: Boolean, default: false },
  reporteGolesLocal: {
    goles: { type: Number, default: 0 },
    reportado: { type: Boolean, default: false },
    goleadores: [{
      jugadorId: String,
      nombre: String,
      dorsal: Number,
      goles: { type: Number, default: 1 }
    }]
  },
  reporteGolesVisitante: {
    goles: { type: Number, default: 0 },
    reportado: { type: Boolean, default: false },
    goleadores: [{
      jugadorId: String,
      nombre: String,
      dorsal: Number,
      goles: { type: Number, default: 1 }
    }]
  },
  goleadores: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    jugadorId: String,
    nombre: String,
    dorsal: Number,
    minuto: Number,
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
    equipoNombre: String,
    asistente: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    asistenteNombre: String,
    esAutogol: { type: Boolean, default: false }
  }],
  faltasLocal: { type: Number, default: 0, min: 0 },
  faltasVisitante: { type: Number, default: 0, min: 0 },
  tarjetas: [{
    jugador: { type: Schema.Types.ObjectId, ref: 'Jugador' },
    jugadorId: String,
    nombre: String,
    dorsal: Number,
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
    equipoNombre: String,
    tipo: { type: String, enum: ['Amarilla', 'Roja'], default: 'Amarilla' },
    motivo: { type: String, default: 'Falta táctica' },
    minuto: { type: Number, default: 45 }
  }],
  cambios: [{
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
    equipoNombre: String,
    jugadorSaleId: String,
    jugadorSaleNombre: String,
    jugadorEntraId: String,
    jugadorEntraNombre: String,
    minuto: { type: Number, default: 60 }
  }],
  faltas: [{
    jugadorId: String,
    nombre: String,
    dorsal: Number,
    equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
    equipoNombre: String,
    motivo: { type: String, default: 'Falta común' },
    minuto: { type: Number, default: 30 }
  }]
}, { timestamps: true })

export default model('Partido', partidoSchema)
