import { body, param, validationResult } from "express-validator";

// Middleware obligatorio para capturar los errores de validación
export const validarCampos = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(400).json({ errores: errores.array() });
  }
  next();
};

// Validaciones para crear un Jugador
export const crearJugadorValidator = [
  body("nombre")
    .trim()
    .notEmpty().withMessage("El nombre es obligatorio"),

  body("apellido")
    .optional({ checkFalsy: true })
    .trim(),

  body("numero")
    .custom((val, { req }) => {
      const num = (val !== undefined && val !== null && val !== '') ? val : req.body.dorsal;
      if (num === undefined || num === null || num === '' || isNaN(num) || Number(num) < 1 || Number(num) > 99) {
        throw new Error("El número de camiseta debe ser un entero entre 1 y 99");
      }
      req.body.numero = Number(num);
      return true;
    }),

  body("posicion")
    .trim()
    .notEmpty().withMessage("La posición es obligatoria"),

  body("equipo")
    .notEmpty().withMessage("El equipo es obligatorio")
    .isMongoId().withMessage("El ID del equipo debe ser un ObjectId válido"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 4 }).withMessage("La contraseña debe tener al menos 4 caracteres"),

  validarCampos
];

// Validaciones para Login del Jugador
export const loginJugadorValidator = [
  body("email")
    .trim()
    .notEmpty().withMessage("El email es obligatorio")
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("password")
    .notEmpty().withMessage("La contraseña es obligatoria"),

  validarCampos
];

// Validaciones para actualizar un Jugador
export const actualizarJugadorValidator = [
  body("nombre")
    .optional()
    .trim(),

  body("apellido")
    .optional()
    .trim(),

  body("numero")
    .optional()
    .custom((val, { req }) => {
      const num = val !== undefined ? val : req.body.dorsal;
      if (num !== undefined && (isNaN(num) || Number(num) < 1 || Number(num) > 99)) {
        throw new Error("El número debe ser un entero entre 1 y 99");
      }
      if (num !== undefined) req.body.numero = Number(num);
      return true;
    }),

  body("posicion")
    .optional()
    .trim(),

  body("equipo")
    .optional()
    .isMongoId().withMessage("El ID del equipo debe ser un ObjectId válido"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail().withMessage("Debe proporcionar un correo electrónico válido")
    .normalizeEmail(),

  body("password")
    .optional({ checkFalsy: true })
    .isLength({ min: 4 }).withMessage("La contraseña debe tener al menos 4 caracteres"),

  body("goles")
    .optional()
    .isInt({ min: 0 }).withMessage("Los goles deben ser un número entero mayor o igual a 0"),

  body("asistencias")
    .optional()
    .isInt({ min: 0 }).withMessage("Las asistencias deben ser un número entero mayor o igual a 0"),

  body("esCapitan")
    .optional()
    .isBoolean().withMessage("esCapitan debe ser booleano"),

  validarCampos
];

// Validación de ID en los parámetros URL (ej. /:id)
export const idValidator = [
  param("id")
    .isMongoId().withMessage("El ID proporcionado no es un ObjectId válido de MongoDB"),

  validarCampos
];
