export type Language = 'en' | 'ar';

export const translations = {
  en: {
    brand: 'HealTrip',
    tagline: 'AI Patient Decision Assistant',
    status: {
      connected: 'Online',
      disconnected: 'Offline',
      model: 'Gemini AI',
    },
    chat: {
      welcomeTitle: 'How can we help you today?',
      welcomeSubtitle: 'Tell us about your symptoms or medical concerns. HealTrip AI will evaluate urgency, guide your next steps, and connect you with verified specialists.',
      inputPlaceholder: 'Type your symptoms or health question...',
      send: 'Send',
      thinking: 'Evaluating symptoms and checking medical database...',
      newChat: 'New Chat',
      disclaimer: 'HealTrip provides medical guidance and triage assistance, not definitive diagnosis. For emergencies, always seek immediate care.',
      startersTitle: 'Try an example scenario:',
      starters: [
        {
          label: 'Chest Pain Decision',
          query: "I have chest pain and I'm not sure whether I should see a cardiologist, go to the ER, or seek a second opinion.",
        },
        {
          label: 'Knee Injury Triage',
          query: 'I twisted my knee during football yesterday. It is swollen and I cannot put weight on it. What should I do?',
        },
        {
          label: 'Persistent Migraines',
          query: 'I have had persistent severe headaches with light sensitivity for 10 days. Can you suggest a neurologist in Istanbul?',
        },
        {
          label: 'Cancer Second Opinion',
          query: 'I need a second opinion on a breast cancer treatment plan with top oncologists in Turkey or Saudi Arabia.',
        },
      ],
      toolsUsed: 'Verified Data Sources',
      hideTools: 'Hide sources',
      showTools: 'View database queries',
      recommendedDoctors: 'Recommended Specialists',
      recommendedHospitals: 'Recommended Medical Centers',
    },
    urgency: {
      emergency: 'Emergency — Go to ER',
      urgent: 'Urgent — See Doctor in 24-48h',
      routine: 'Routine Consultation',
      self_care: 'Self-Care & Monitoring',
    },
    doctor: {
      experience: 'yrs exp',
      fee: 'Fee',
      availability: 'Available',
      book: 'Book Consultation',
    },
    hospital: {
      emergency24: '24/7 ER',
      accredited: 'JCI Accredited',
      specialties: 'Specialties',
      call: 'Call',
      website: 'Website',
    },
  },
  ar: {
    brand: 'HealTrip',
    tagline: 'المساعد الذكي لاتخاذ القرار الطبي',
    status: {
      connected: 'متصل',
      disconnected: 'غير متصل',
      model: 'جيميني الذكي',
    },
    chat: {
      welcomeTitle: 'كيف يمكننا مساعدتك اليوم؟',
      welcomeSubtitle: 'صف أعراضك أو استفسارك الصحي، وسيقوم المساعد الذكي بفرز حالتك، وتحديد مدى إلحاحها، وترشيح الأطباء والمستشفيات المعتمدة.',
      inputPlaceholder: 'اكتب أعراضك أو استفسارك الطبي هنا...',
      send: 'إرسال',
      thinking: 'جاري فحص الأعراض والبحث في قاعدة البيانات الطبية...',
      newChat: 'محادثة جديدة',
      disclaimer: 'يقدم HealTrip دليلاً استرشاديًا أوليًا ولا يغني عن الفحص الطبي المباشر. في الحالات الحرجة يرجى التوجه للطوارئ فوراً.',
      startersTitle: 'جرّب أحد السيناريوهات التالية:',
      starters: [
        {
          label: 'ألم في الصدر (طوارئ أم كشف؟)',
          query: 'أعاني من ألم في الصدر ولست متأكدًا هل يجب أن أذهب إلى قسم الطوارئ فورًا أو أقابل طبيب قلب أو أطلب رأيًا ثانيًا.',
        },
        {
          label: 'إصابة في الركبة وتورم',
          query: 'تعرضت لالتواء في الركبة أمس وأصبحت متورمة ولا أستطيع المشي عليها بشكل طبيعي. ما التخصص المناسب وما الإجراء؟',
        },
        {
          label: 'صداع نصفي مستمر',
          query: 'أعاني من صداع نصفي حاد ومستمر منذ 10 أيام مع حساسية للضوء. هل يمكنك ترشيح استشاري مخ وأعصاب في إسطنبول؟',
        },
        {
          label: 'رأي طبي ثانٍ في الأورام',
          query: 'أبحث عن رأي طبي ثانٍ لخطة علاج أورام مع استشاريين متميزين في السعودية أو تركيا.',
        },
      ],
      toolsUsed: 'بيانات موثوقة من قاعدة البيانات',
      hideTools: 'إخفاء التفاصيل',
      showTools: 'عرض الاستعلامات الفعلية',
      recommendedDoctors: 'الأطباء المرشحون',
      recommendedHospitals: 'المستشفيات المقترحة',
    },
    urgency: {
      emergency: 'طوارئ — توجه للطوارئ فوراً',
      urgent: 'عاجل — استشر طبيباً خلال 24-48 ساعة',
      routine: 'كشف اعتيادي مجدول',
      self_care: 'عناية ومتابعة منزلية',
    },
    doctor: {
      experience: 'سنوات خبرة',
      fee: 'الكشف',
      availability: 'المواعيد',
      book: 'حجز موعد',
    },
    hospital: {
      emergency24: 'طوارئ 24 ساعة',
      accredited: 'معتمد JCI',
      specialties: 'التخصصات',
      call: 'اتصال',
      website: 'الموقع',
    },
  },
};
