import { DOCTORS, HOSPITALS, SPECIALTIES } from '../data';
import { Doctor, DoctorWithDetails, DoctorSearchFilters, Specialty } from '../types';
import { normalizeCity, normalizeCountry } from '../utils/locationMap';

export class DoctorService {
  private doctors: Doctor[] = DOCTORS;
  private hospitals = HOSPITALS;
  private specialties: Specialty[] = SPECIALTIES;

  /**
   * Search doctors with flexible filters.
   */
  searchDoctors(filters: DoctorSearchFilters): DoctorWithDetails[] {
    const specialtyQuery = filters.specialty ? filters.specialty.trim().toLowerCase() : null;
    const city = normalizeCity(filters.city);
    const country = normalizeCountry(filters.country);
    const language = filters.language ? filters.language.trim().toLowerCase() : null;
    const limit = filters.limit || 10;

    const enrichedDoctors = this.doctors.map((d) => this.enrichDoctor(d));

    let filtered = enrichedDoctors.filter((d) => {
      if (specialtyQuery) {
        const nameLower = d.specialty_name.toLowerCase();
        const nameArLower = d.specialty_name_ar.toLowerCase();

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

        if (!matchesExact && !matchesWord && !matchesArSub && !matchesEnSub && !matchesKeywords) {
          return false;
        }
      }

      if (city) {
        const docCityNorm = normalizeCity(d.hospital_city);
        if (!docCityNorm || !docCityNorm.includes(city)) {
          return false;
        }
      }

      if (country) {
        const docCountryNorm = normalizeCountry(d.hospital_country);
        if (!docCountryNorm || !docCountryNorm.includes(country)) {
          return false;
        }
      }

      if (language) {
        let hasLanguage = false;
        if (Array.isArray(d.languages)) {
          hasLanguage = d.languages.some((l) => l.toLowerCase().includes(language));
        } else if (typeof d.languages === 'string') {
          hasLanguage = d.languages.toLowerCase().includes(language);
        }
        if (!hasLanguage) return false;
      }

      if (filters.minRating !== undefined && d.rating < filters.minRating) {
        return false;
      }

      if (filters.maxFee !== undefined && d.consultation_fee > filters.maxFee) {
        return false;
      }

      return true;
    });

    // Sort by rating descending
    filtered.sort((a, b) => b.rating - a.rating);

    // Apply limit
    return filtered.slice(0, limit);
  }

  /**
   * Get a single doctor by ID with full details.
   */
  getDoctorById(id: number): DoctorWithDetails | undefined {
    const doctor = this.doctors.find((d) => d.id === id);
    if (!doctor) return undefined;
    return this.enrichDoctor(doctor);
  }

  /**
   * Get all doctors (with details).
   */
  getAllDoctors(): DoctorWithDetails[] {
    return this.searchDoctors({ limit: 100 });
  }

  /**
   * Get all specialties.
   */
  getAllSpecialties(): Specialty[] {
    return [...this.specialties].sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Helper to attach specialty and hospital metadata to a doctor record.
   */
  private enrichDoctor(doctor: Doctor): DoctorWithDetails {
    const specialty = this.specialties.find((s) => s.id === doctor.specialty_id);
    const hospital = doctor.hospital_id
      ? this.hospitals.find((h) => h.id === doctor.hospital_id)
      : undefined;

    return {
      ...doctor,
      specialty_name: specialty ? specialty.name : 'General',
      specialty_name_ar: specialty ? specialty.name_ar : 'عام',
      hospital_name: hospital ? hospital.name : null,
      hospital_name_ar: hospital ? hospital.name_ar : null,
      hospital_city: hospital ? hospital.city : null,
      hospital_country: hospital ? hospital.country : null,
    };
  }
}

export const doctorService = new DoctorService();
