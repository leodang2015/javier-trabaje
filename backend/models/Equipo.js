import { Schema, model } from 'mongoose'

const equipoSchema = new Schema({
  nombre: { 
    type: String, 
    required: true, 
    trim: true,
    unique: true 
  },
  escudocolor: { 
    type: String, 
    default: 'bg-emerald-600' 
  },
  escudoUrl: {
    type: String,
    default: ''
  },
  escudoFigura: {
    type: String,
    default: '🛡️'
  },
  capitan: { 
    type: String, 
    default: '', 
    trim: true 
  },
  capitanId: {
    type: Schema.Types.ObjectId,
    ref: 'Jugador'
  },
  barriada: { 
    type: String, 
    required: true, 
    trim: true 
  },
  estadoAprobacion: {
    type: String,
    enum: ['Pendiente', 'Aprobado', 'Rechazado'],
    default: 'Aprobado'
  },
  solicitadoPor: {
    type: String,
    default: ''
  }
}, { 
  timestamps: true 
})

export default model('Equipo', equipoSchema)
