import { check, param } from 'express-validator';
import { validarCampos } from '../middlewares/validarCampos.js';

export const crearTorneoValidator = [
  check('nombre', 'El nombre del torneo es obligatorio').not().isEmpty().trim(),
  check('equipos', 'Los equipos deben enviarse como un arreglo').optional().isArray(),
  check('equipos.*', 'Cada equipo debe ser un MongoID válido').optional().isMongoId(),
  validarCampos
];

export const generarFixtureValidator = [
  param('id', 'El ID del torneo no es un MongoID válido').isMongoId(),
  validarCampos
];
