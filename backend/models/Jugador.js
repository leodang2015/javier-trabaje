import { Schema, model } from 'mongoose'

const jugadorSchema = new Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, default: '-' },
  numero: { type: Number, required: true, default: 10 },
  posicion: { type: String, required: true, default: 'Delantero' },
  equipo: { type: Schema.Types.ObjectId, ref: 'Equipo', required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, default: '1234' },
  goles: { type: Number, default: 0, min: 0 },
  asistencias: { type: Number, default: 0, min: 0 },
  esCapitan: { type: Boolean, default: false },
  estado: { type: Number, default: 1 }, // 1: Activo, 0: Inactivo
  estadoAprobacion: {
    type: String,
    enum: ['Pendiente', 'Aprobado', 'Rechazado'],
    default: 'Aprobado'
  },
  usuarioAsociado: { type: String, default: '' },
  // Historial de sanciones y tarjetas acumuladas
  tarjetasRojasAcumuladas: { type: Number, default: 0 },
  tarjetasAmarillasAcumuladas: { type: Number, default: 0 },
  partidosSuspendidosRestantes: { type: Number, default: 0 },
  expulsadoDelTorneo: { type: Boolean, default: false },
  motivoSancion: { type: String, default: '' }
}, { timestamps: true })

export default model('Jugador', jugadorSchema)
