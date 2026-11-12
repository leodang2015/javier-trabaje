import jwt from 'jsonwebtoken';
import Jugador from '../models/Jugador.js';

// Generar JWT para el jugador
export const generarJWT = (uid) => {
  return new Promise((resolve, reject) => {
    const payload = { uid };

    jwt.sign(
      payload,
      process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#',
      { expiresIn: "4h" },
      (err, token) => {
        if (err) {
          console.error(err);
          reject("No se pudo generar el token");
        } else {
          resolve(token);
        }
      }
    );
  });
};

// Validar JWT del jugador en peticiones protegidas
export const validarJWT = async (req, res, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({
      msg: "No hay token en la petición"
    });
  }

  try {
    const { uid } = jwt.verify(token, process.env.SECRETORPRIVATEKEY || 'TuClaveSecretaSuperSegura123!@#');

    // Se busca en la colección de Jugador
    const jugador = await Jugador.findById(uid);

    if (!jugador) {
      return res.status(401).json({
        msg: "Token no válido - el jugador no existe en DB"
      });
    }

    if (jugador.estado === 0) {
      return res.status(401).json({
        msg: "Token no válido - jugador inactivo"
      });
    }

    req.jugador = jugador;
    next();

  } catch (error) {
    console.error(error);
    return res.status(401).json({
      msg: "Token no valido"
    });
  }
};

export default { generarJWT, validarJWT };
