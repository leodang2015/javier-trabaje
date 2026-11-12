import { validationResult } from 'express-validator';

export const validarCampos = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      msg: errors.array().map(err => err.msg).join(', ')
    });
  }
  next();
};

export default validarCampos;
