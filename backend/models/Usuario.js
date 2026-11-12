import { Schema, model } from 'mongoose'
import crypto from 'crypto'

const usuarioSchema = new Schema({
  usuario: {
    type: String,
    required: [true, 'El nombre de usuario es obligatorio'],
    unique: true,
    trim: true,
    lowercase: true,
    minlength: [3, 'El usuario debe tener al menos 3 caracteres']
  },
  nombre: {
    type: String,
    trim: true,
    default: ''
  },
  password: {
    type: String,
    required: [true, 'La contraseña es obligatoria']
  },
  salt: {
    type: String,
    required: true
  },
  rol: {
    type: String,
    required: [true, 'El rol es obligatorio'],
    enum: {
      values: ['organizador', 'entrenador', 'jugador'],
      message: 'El rol debe ser organizador, entrenador o jugador'
    }
  },
  codigoUsado: {
    type: String,
    default: '2'
  },
  equipo: {
    type: Schema.Types.ObjectId,
    ref: 'Equipo',
    default: null
  },
  posicion: {
    type: String,
    default: ''
  },
  estado: {
    type: Boolean,
    default: true
  }
}, { timestamps: true })

// Configuración de contraseña con hashing seguro crypto pbkdf2
usuarioSchema.methods.setPassword = function(pwd) {
  this.salt = crypto.randomBytes(16).toString('hex')
  this.password = crypto.pbkdf2Sync(pwd, this.salt, 1000, 64, 'sha512').toString('hex')
}

usuarioSchema.methods.validPassword = function(pwd) {
  if (!this.salt || !this.password) return false
  const hash = crypto.pbkdf2Sync(pwd, this.salt, 1000, 64, 'sha512').toString('hex')
  return this.password === hash
}

// Ocultar password y salt al devolver JSON
usuarioSchema.methods.toJSON = function() {
  const obj = this.toObject()
  delete obj.password
  delete obj.salt
  return obj
}

export default model('Usuario', usuarioSchema)
