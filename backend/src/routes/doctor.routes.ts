import { Router } from 'express';
import { getDoctors, getDoctorById, getSpecialties } from '../controllers/doctor.controller';

const router = Router();

router.get('/', getDoctors);
router.get('/:id', getDoctorById);

export default router;

// Specialty routes are exported separately
export const specialtyRouter = Router();
specialtyRouter.get('/', getSpecialties);
