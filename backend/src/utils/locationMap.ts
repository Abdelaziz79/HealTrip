export const CITY_MAP: Record<string, string> = {
  'الرياض': 'riyadh',
  'riyadh': 'riyadh',
  'جدة': 'jeddah',
  'جده': 'jeddah',
  'jeddah': 'jeddah',
  'الخبر': 'al khobar',
  'al khobar': 'al khobar',
  'khobar': 'al khobar',
  'الدمام': 'dammam',
  'dammam': 'dammam',
  'الظهران': 'dhahran',
  'dhahran': 'dhahran',
  'مكة': 'mecca',
  'مكه': 'mecca',
  'مكة المكرمة': 'mecca',
  'مكه المكرمه': 'mecca',
  'mecca': 'mecca',
  'المدينة': 'medina',
  'المدينه': 'medina',
  'المدينة المنورة': 'medina',
  'المدينه المنوره': 'medina',
  'medina': 'medina',
  'الأحساء': 'al ahsa',
  'الاحساء': 'al ahsa',
  'al ahsa': 'al ahsa',
  'الهفوف': 'al ahsa',
  'الطائف': 'taif',
  'taif': 'taif',
  'بريدة': 'buraidah',
  'القصيم': 'buraidah',
  'buraidah': 'buraidah',
  'أبها': 'abha',
  'ابها': 'abha',
  'abha': 'abha',
  'تبوك': 'tabuk',
  'tabuk': 'tabuk',
  'أبوظبي': 'abu dhabi',
  'ابوظبي': 'abu dhabi',
  'abu dhabi': 'abu dhabi',
  'دبي': 'dubai',
  'dubai': 'dubai',
  'إسطنبول': 'istanbul',
  'اسطنبول': 'istanbul',
  'istanbul': 'istanbul',
  'أنقرة': 'ankara',
  'انقرة': 'ankara',
  'ankara': 'ankara',
  'بانكوك': 'bangkok',
  'bangkok': 'bangkok',
};

export const COUNTRY_MAP: Record<string, string> = {
  'السعودية': 'saudi arabia',
  'السعوديه': 'saudi arabia',
  'المملكة العربية السعودية': 'saudi arabia',
  'المملكه العربيه السعوديه': 'saudi arabia',
  'saudi': 'saudi arabia',
  'saudi arabia': 'saudi arabia',
  'ksa': 'saudi arabia',
  'الإمارات': 'uae',
  'الامارات': 'uae',
  'uae': 'uae',
  'تركيا': 'turkey',
  'turkey': 'turkey',
  'تايلاند': 'thailand',
  'thailand': 'thailand',
};

export function normalizeCity(query?: string | null): string | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  return CITY_MAP[clean] || clean;
}

export function normalizeCountry(query?: string | null): string | null {
  if (!query) return null;
  const clean = query.trim().toLowerCase();
  return COUNTRY_MAP[clean] || clean;
}
