import { check, param } from 'express-validator';
import { validarCampos } from '../middlewares/validarCampos.js';

export const crearEquipoValidator = [
  check('nombre', 'El nombre del equipo es obligatorio').not().isEmpty().trim(),
  validarCampos
];

export const actualizarEquipoValidator = [
  param('id', 'El ID del equipo no es válido').isMongoId(),
  check('nombre', 'El nombre del equipo es obligatorio').not().isEmpty().trim(),
  validarCampos
];
