import { Schema, model } from 'mongoose'

const notificacionSchema = new Schema({
  tipo: { type: String, default: 'reporte_goleadores' },
  titulo: { type: String, required: true },
  mensaje: { type: String, required: true },
  remitente: { type: String, default: 'Entrenador (DT)' },
  equipo: { type: Schema.Types.ObjectId, ref: 'Equipo' },
  equipoNombre: { type: String },
  partido: { type: Schema.Types.ObjectId, ref: 'Partido' },
  datos: { type: Schema.Types.Mixed },
  leida: { type: Boolean, default: false }
}, { timestamps: true })

export default model('Notificacion', notificacionSchema)
