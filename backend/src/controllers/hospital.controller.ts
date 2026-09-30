import { Request, Response } from 'express';
import { hospitalService } from '../services/hospital.service';
import { sendSuccess, sendError } from '../utils/apiResponse';

/**
 * GET /api/v1/hospitals
 * Search or list hospitals.
 */
export const getHospitals = (req: Request, res: Response): void => {
  const {
    city,
    country,
    specialty,
    emergencyOnly,
    minRating,
    limit,
  } = req.query;

  const hospitals = hospitalService.searchHospitals({
    city: city as string | undefined,
    country: country as string | undefined,
    specialty: specialty as string | undefined,
    emergencyOnly: emergencyOnly === 'true',
    minRating: minRating ? parseFloat(minRating as string) : undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
  });

  sendSuccess(res, hospitals, 200, { total: hospitals.length });
};

/**
 * GET /api/v1/hospitals/:id
 * Get a specific hospital by ID.
 */
export const getHospitalById = (req: Request, res: Response): void => {
  const id = parseInt(req.params.id as string, 10);

  if (isNaN(id)) {
    sendError(res, 'Invalid hospital ID', 400, 'INVALID_ID');
    return;
  }

  const hospital = hospitalService.getHospitalById(id);

  if (!hospital) {
    sendError(res, 'Hospital not found', 404, 'NOT_FOUND');
    return;
  }

  sendSuccess(res, hospital);
};
