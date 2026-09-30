import { HOSPITALS, SPECIALTIES, HospitalRecord } from '../data';
import { HospitalWithSpecialties, HospitalSearchFilters, Specialty } from '../types';
import { normalizeCity, normalizeCountry } from '../utils/locationMap';

export class HospitalService {
  private hospitals: HospitalRecord[] = HOSPITALS;
  private specialties: Specialty[] = SPECIALTIES;

  /**
   * Search hospitals with flexible filters.
   */
  searchHospitals(filters: HospitalSearchFilters): HospitalWithSpecialties[] {
    const city = normalizeCity(filters.city);
    const country = normalizeCountry(filters.country);
    const specialtyQuery = filters.specialty ? filters.specialty.trim().toLowerCase() : null;
    const limit = filters.limit || 10;

    let filtered = this.hospitals.filter((h) => {
      if (city) {
        const hospCityNorm = normalizeCity(h.city);
        if (!hospCityNorm || !hospCityNorm.includes(city)) {
          return false;
        }
      }

      if (country) {
        const hospCountryNorm = normalizeCountry(h.country);
        if (!hospCountryNorm || !hospCountryNorm.includes(country)) {
          return false;
        }
      }

      if (filters.emergencyOnly) {
        const isEmergency = h.emergency_available === 1 || h.emergency_available === true;
        if (!isEmergency) return false;
      }

      if (filters.minRating !== undefined && h.rating < filters.minRating) {
        return false;
      }

      if (specialtyQuery) {
        // Find matching specialty IDs
        const hasMatchingSpecialty = h.specialtyIds.some((sId) => {
          const spec = this.specialties.find((s) => s.id === sId);
          if (!spec) return false;
          const nameLower = spec.name.toLowerCase();
          const nameArLower = spec.name_ar.toLowerCase();

          // Exact match
          const matchesExact = nameLower === specialtyQuery || nameArLower === specialtyQuery;
          // Word boundary match
          const matchesWord = new RegExp(`(^|\\s)${specialtyQuery}(\\s|$)`, 'i').test(nameLower);
          // Substring bidirectional match in Arabic
          const matchesArSub = nameArLower.includes(specialtyQuery) || specialtyQuery.includes(nameArLower);
          const matchesEnSub = specialtyQuery.includes(nameLower);

          // Common medical keyword aliases
          const matchesKeywords =
            (nameLower === 'urology' && (specialtyQuery.includes('مسالك') || specialtyQuery.includes('urolog') || specialtyQuery.includes('كلى'))) ||
            (nameLower === 'cardiology' && (specialtyQuery.includes('قلب') || specialtyQuery.includes('cardio'))) ||
            (nameLower === 'orthopedics' && (specialtyQuery.includes('عظام') || specialtyQuery.includes('ortho'))) ||
            (nameLower === 'gastroenterology' && (specialtyQuery.includes('هضم') || specialtyQuery.includes('معدة') || specialtyQuery.includes('كبد') || specialtyQuery.includes('gastro'))) ||
            (nameLower === 'neurology' && (specialtyQuery.includes('أعصاب') || specialtyQuery.includes('اعصاب') || specialtyQuery.includes('صداع') || specialtyQuery.includes('neuro'))) ||
            (nameLower === 'dermatology' && (specialtyQuery.includes('جلد') || specialtyQuery.includes('derma'))) ||
            (nameLower === 'oncology' && (specialtyQuery.includes('أورام') || specialtyQuery.includes('اورام') || specialtyQuery.includes('سرطان') || specialtyQuery.includes('oncol')));

          return matchesExact || matchesWord || matchesArSub || matchesEnSub || matchesKeywords;
        });

        if (!hasMatchingSpecialty) return false;
      }

      return true;
    });

    // Sort by rating descending
    filtered.sort((a, b) => b.rating - a.rating);

    // Apply limit
    const paginated = filtered.slice(0, limit);

    return paginated.map((h) => this.attachSpecialties(h));
  }

  /**
   * Get a single hospital by ID with specialties.
   */
  getHospitalById(id: number): HospitalWithSpecialties | undefined {
    const hospital = this.hospitals.find((h) => h.id === id);
    if (!hospital) return undefined;
    return this.attachSpecialties(hospital);
  }

  /**
   * Get all hospitals.
   */
  getAllHospitals(): HospitalWithSpecialties[] {
    return this.searchHospitals({ limit: 100 });
  }

  /**
   * Attach specialties to a hospital object.
   */
  private attachSpecialties(hospital: HospitalRecord): HospitalWithSpecialties {
    const specialties = hospital.specialtyIds
      .map((id) => this.specialties.find((s) => s.id === id))
      .filter((s): s is Specialty => Boolean(s))
      .sort((a, b) => a.name.localeCompare(b.name));

    const { specialtyIds, ...hospitalData } = hospital;
    return {
      ...hospitalData,
      specialties,
    };
  }
}

export const hospitalService = new HospitalService();
