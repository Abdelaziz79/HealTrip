import { Router } from 'express';
import healthRoutes from './health.routes';
import chatRoutes from './chat.routes';
import doctorRoutes, { specialtyRouter } from './doctor.routes';
import hospitalRoutes from './hospital.routes';

const router = Router();

router.use('/health', healthRoutes);
router.use('/chat', chatRoutes);
router.use('/doctors', doctorRoutes);
router.use('/hospitals', hospitalRoutes);
router.use('/specialties', specialtyRouter);

export default router;
