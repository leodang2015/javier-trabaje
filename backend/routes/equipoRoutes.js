import { Router } from 'express';
import { 
  crearEquipo, 
  listarEquipos, 
  editarEquipo, 
  eliminarEquipo,
  completarPlantel
} from '../controllers/equipoController.js';

const router = Router();

router.get('/', listarEquipos);
router.post('/', crearEquipo);
router.post('/:id/completar-plantel', completarPlantel);
router.put('/:id', editarEquipo);
router.delete('/:id', eliminarEquipo);

// Rutas de Autorización por el Organizador
router.put('/:id/autorizar', async (req, res) => {
  try {
    const Equipo = (await import('../models/Equipo.js')).default;
    const eq = await Equipo.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Aprobado' }, { new: true });
    if (!eq) return res.status(404).json({ msg: 'Club no encontrado' });
    res.json({ msg: `¡Club "${eq.nombre}" autorizado exitosamente!`, equipo: eq });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al autorizar club' });
  }
});

router.put('/:id/rechazar', async (req, res) => {
  try {
    const Equipo = (await import('../models/Equipo.js')).default;
    const eq = await Equipo.findByIdAndUpdate(req.params.id, { estadoAprobacion: 'Rechazado' }, { new: true });
    if (!eq) return res.status(404).json({ msg: 'Club no encontrado' });
    res.json({ msg: `Club "${eq.nombre}" rechazado.`, equipo: eq });
  } catch (err) {
    res.status(400).json({ msg: err.message || 'Error al rechazar club' });
  }
});

export default router;
