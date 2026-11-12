import { Router } from 'express'
import {
  registro,
  login,
  perfil,
  codigosInfo,
  consultarCodigoOmar,
  editarPerfil,
  eliminarMiCuenta
} from '../controllers/authController.js'
const router = Router()

router.post('/registro', registro)
router.post('/login', login)
router.get('/perfil', perfil)
router.get('/roles-codigos', codigosInfo)
router.get('/codigo-omar', consultarCodigoOmar)

export default router
