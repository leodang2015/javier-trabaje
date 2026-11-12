import { Schema, model } from 'mongoose'

const torneoSchema = new Schema({
  nombre: { type: String, required: true },
  equipos: [{ type: Schema.Types.ObjectId, ref: 'Equipo' }],
  estado: { 
    type: String, 
    enum: ['Inscripción', 'En Curso', 'Finalizado'], 
    default: 'Inscripción' 
  }
}, { timestamps: true })

export default model('Torneo', torneoSchema)
