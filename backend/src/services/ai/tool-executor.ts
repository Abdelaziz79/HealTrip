import { doctorService } from '../doctor.service';
import { hospitalService } from '../hospital.service';
import { ToolCallResult, UrgencyAssessment, UrgencyLevel, DoctorSearchFilters, HospitalSearchFilters } from '../../types';
import { logger } from '../../utils/logger';

const CONTEXT = 'ToolExecutor';

/**
 * Executes AI agent tool calls against the actual database.
 * This is the bridge between Gemini function calling and our data layer.
 */
export class ToolExecutor {
  /**
   * Execute a tool call and return the result.
   */
  execute(toolName: string, args: Record<string, unknown>): ToolCallResult {
    logger.info(CONTEXT, `Executing tool: ${toolName}`, args);

    let result: unknown;

    switch (toolName) {
      case 'search_doctors':
        result = this.searchDoctors(args as unknown as DoctorSearchFilters);
        break;
      case 'search_hospitals':
        result = this.searchHospitals(args as unknown as HospitalSearchFilters);
        break;
      case 'get_specialties':
        result = this.getSpecialties();
        break;
      case 'assess_urgency':
        result = this.assessUrgency(args);
        break;
      default:
        logger.warn(CONTEXT, `Unknown tool: ${toolName}`);
        result = { error: `Unknown tool: ${toolName}` };
    }

    logger.debug(CONTEXT, `Tool ${toolName} result`, result);
    return { toolName, args, result };
  }

  private searchDoctors(filters: DoctorSearchFilters) {
    const doctors = doctorService.searchDoctors({
      ...filters,
      limit: filters.limit || 5,
    });

    if (doctors.length === 0) {
      return {
        found: 0,
        message: 'No doctors found matching the criteria. Try broadening your search.',
        doctors: [],
      };
    }

    return {
      found: doctors.length,
      doctors: doctors.map((d) => ({
        id: d.id,
        name: d.name,
        name_ar: d.name_ar,
        specialty: d.specialty_name,
        specialty_ar: d.specialty_name_ar,
        hospital: d.hospital_name,
        hospital_ar: d.hospital_name_ar,
        city: d.hospital_city,
        country: d.hospital_country,
        experience_years: d.experience_years,
        rating: d.rating,
        languages: typeof d.languages === 'string' ? JSON.parse(d.languages) : d.languages,
        consultation_fee: d.consultation_fee,
        availability: typeof d.availability === 'string' ? JSON.parse(d.availability) : d.availability,
        bio: d.bio,
        bio_ar: d.bio_ar,
      })),
    };
  }

  private searchHospitals(filters: HospitalSearchFilters) {
    const hospitals = hospitalService.searchHospitals({
      ...filters,
      limit: filters.limit || 5,
    });

    if (hospitals.length === 0) {
      return {
        found: 0,
        message: 'No hospitals found matching the criteria. Try broadening your search.',
        hospitals: [],
      };
    }

    return {
      found: hospitals.length,
      hospitals: hospitals.map((h) => ({
        id: h.id,
        name: h.name,
        name_ar: h.name_ar,
        city: h.city,
        country: h.country,
        address: h.address,
        rating: h.rating,
        phone: h.phone,
        emergency_available: h.emergency_available === 1 || h.emergency_available === true,
        website: h.website,
        description: h.description,
        description_ar: h.description_ar,
        specialties: h.specialties.map((s) => ({
          name: s.name,
          name_ar: s.name_ar,
        })),
      })),
    };
  }

  private getSpecialties() {
    const specialties = doctorService.getAllSpecialties();
    return {
      total: specialties.length,
      specialties: specialties.map((s) => ({
        id: s.id,
        name: s.name,
        name_ar: s.name_ar,
        description: s.description,
      })),
    };
  }

  /**
   * Assess urgency based on symptoms.
   * This is a rule-based heuristic, not a medical diagnosis.
   */
  private assessUrgency(args: Record<string, unknown>): UrgencyAssessment {
    const symptoms = ((args.symptoms as string) || '').toLowerCase();
    const severity = ((args.severity as string) || '').toLowerCase();
    const duration = ((args.duration as string) || '').toLowerCase();

    // Emergency keywords
    const emergencyKeywords = [
      'chest pain', 'heart attack', 'stroke', 'can\'t breathe', 'cannot breathe',
      'severe bleeding', 'unconscious', 'seizure', 'paralysis', 'anaphylaxis',
      'choking', 'severe head injury', 'suicidal', 'overdose', 'collapsed',
      'ألم في الصدر', 'نوبة قلبية', 'سكتة', 'لا أستطيع التنفس', 'نزيف حاد',
    ];

    const urgentKeywords = [
      'high fever', 'broken', 'fracture', 'severe pain', 'blood in',
      'persistent vomiting', 'dehydration', 'infected', 'swelling',
      'difficulty breathing', 'blurred vision', 'sudden weight loss',
      'حمى شديدة', 'كسر', 'ألم شديد', 'دم في', 'تورم',
    ];

    const routineKeywords = [
      'mild pain', 'ongoing', 'chronic', 'check-up', 'consultation',
      'second opinion', 'follow-up', 'preventive', 'screening',
      'ألم خفيف', 'مزمن', 'فحص', 'استشارة', 'رأي ثاني',
    ];

    // Check emergency first
    if (
      emergencyKeywords.some((kw) => symptoms.includes(kw)) ||
      severity === 'severe'
    ) {
      // Refine: chest pain alone might not be emergency without other signs
      if (symptoms.includes('chest pain') && severity !== 'severe') {
        return {
          level: 'urgent' as UrgencyLevel,
          reasoning: 'Chest pain requires prompt medical evaluation. While it may not always indicate a heart emergency, it should be assessed by a cardiologist within 24 hours.',
          recommended_action: 'Visit a cardiologist or emergency department if symptoms worsen or are accompanied by shortness of breath, arm pain, or dizziness.',
          recommended_action_ar: 'قم بزيارة طبيب قلب أو قسم الطوارئ إذا تفاقمت الأعراض أو كانت مصحوبة بضيق في التنفس أو ألم في الذراع أو دوار.',
        };
      }

      return {
        level: 'emergency' as UrgencyLevel,
        reasoning: 'The described symptoms indicate a potentially life-threatening situation requiring immediate medical attention.',
        recommended_action: 'Call emergency services immediately or go to the nearest emergency room.',
        recommended_action_ar: 'اتصل بخدمات الطوارئ فوراً أو اذهب إلى أقرب غرفة طوارئ.',
      };
    }

    // Check urgent
    if (urgentKeywords.some((kw) => symptoms.includes(kw))) {
      return {
        level: 'urgent' as UrgencyLevel,
        reasoning: 'The symptoms suggest a condition that needs medical attention within the next 24-48 hours.',
        recommended_action: 'Schedule an appointment with an appropriate specialist as soon as possible.',
        recommended_action_ar: 'حدد موعداً مع أخصائي مناسب في أقرب وقت ممكن.',
      };
    }

    // Check if it seems routine
    if (
      routineKeywords.some((kw) => symptoms.includes(kw)) ||
      duration.includes('week') ||
      duration.includes('month')
    ) {
      return {
        level: 'routine' as UrgencyLevel,
        reasoning: 'The symptoms appear to be non-urgent and can be addressed through a scheduled appointment.',
        recommended_action: 'Schedule a regular appointment with an appropriate specialist.',
        recommended_action_ar: 'حدد موعداً عادياً مع أخصائي مناسب.',
      };
    }

    // Default to routine if unclear
    return {
      level: 'routine' as UrgencyLevel,
      reasoning: 'Based on the available information, this appears to be a non-emergency situation.',
      recommended_action: 'Schedule an appointment with a relevant specialist for proper evaluation.',
      recommended_action_ar: 'حدد موعداً مع أخصائي مناسب للتقييم الصحيح.',
    };
  }
}

export const toolExecutor = new ToolExecutor();
