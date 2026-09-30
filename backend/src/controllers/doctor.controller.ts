import { Request, Response } from 'express';
import { doctorService } from '../services/doctor.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * GET /api/v1/doctors
 * Search or list doctors.
 */
export const getDoctors = (req: Request, res: Response): void => {
  const {
    specialty,
    city,
    country,
    language,
    minRating,
    maxFee,
    limit,
  } = req.query;

  const doctors = doctorService.searchDoctors({
    specialty: specialty as string | undefined,
    city: city as string | undefined,
    country: country as string | undefined,
    language: language as string | undefined,
    minRating: minRating ? parseFloat(minRating as string) : undefined,
    maxFee: maxFee ? parseFloat(maxFee as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });

  sendSuccess(res, doctors, 200, { total: doctors.length });
};

/**
 * GET /api/v1/doctors/:id
 * Get a specific doctor by ID.
 */
export const getDoctorById = (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    sendError(res, 'Invalid doctor ID', 400, 'INVALID_ID');
    return;
  }

  const doctor = doctorService.getDoctorById(id);

  if (!doctor) {
    sendError(res, 'Doctor not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, doctor);
};

/**
 * GET /api/v1/specialties
 * List all medical specialties.
 */
export const getSpecialties = (_req: Request, res: Response): void => {
  const specialties = doctorService.getAllSpecialties();
  sendSuccess(res, specialties, 200, { total: specialties.length });
};
