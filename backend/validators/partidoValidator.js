import { check, param } from 'express-validator';
import { validarCampos } from '../middlewares/validarCampos.js';

export const cargarResultadoValidator = [
  param('id', 'El ID del partido no es un MongoID válido').isMongoId(),
  check('golesLocal', 'Los goles del equipo local deben ser un número no negativo').isInt({ min: 0 }),
  check('golesVisitante', 'Los goles del equipo visitante deben ser un número no negativo').isInt({ min: 0 }),
  check('goleadores', 'Goleadores debe ser un arreglo').optional().isArray(),
  check('goleadores.*.jugador', 'El ID del jugador es obligatorio y debe ser válido').optional().isMongoId(),
  check('goleadores.*.minuto', 'El minuto debe ser un número entero no negativo').optional().isInt({ min: 0 }),
  check('tarjetas', 'Tarjetas debe ser un arreglo').optional().isArray(),
  check('tarjetas.*.jugador', 'El ID del jugador sancionado debe ser válido').optional().isMongoId(),
  check('tarjetas.*.tipo', 'El tipo de tarjeta debe ser Amarilla o Roja').optional().isIn(['Amarilla', 'Roja']),
  validarCampos
];

export const tablaPosicionesValidator = [
  param('torneoId', 'El ID del torneo debe ser un MongoID válido').isMongoId(),
  validarCampos
];
