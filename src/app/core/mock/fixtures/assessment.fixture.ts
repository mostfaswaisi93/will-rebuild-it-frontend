import { AssessmentQuestion } from '@core/models';

/**
 * A curated, static assessment question set held in BOTH languages. Question
 * text is backend content (not UI chrome), so it is not part of the i18n
 * dictionaries — instead the handler resolves it per request from the
 * caller's `lang`, exactly as a real localized API would.
 */
interface LocalizedOption {
  id: string;
  labelEn: string;
  labelAr: string;
}

interface LocalizedQuestion {
  id: string;
  promptEn: string;
  promptAr: string;
  inputType: AssessmentQuestion['inputType'];
  options?: LocalizedOption[];
}

export const seedAssessmentQuestions: LocalizedQuestion[] = [
  {
    id: 'q-property-type',
    promptEn: 'What type of property was damaged?',
    promptAr: 'ما نوع العقار المتضرّر؟',
    inputType: 'radio',
    options: [
      { id: 'opt-residential', labelEn: 'Residential', labelAr: 'سكني' },
      { id: 'opt-commercial', labelEn: 'Commercial', labelAr: 'تجاري' },
      { id: 'opt-agricultural', labelEn: 'Agricultural', labelAr: 'زراعي' },
      { id: 'opt-infrastructure', labelEn: 'Infrastructure', labelAr: 'بنية تحتية' },
      { id: 'opt-public', labelEn: 'Public facility', labelAr: 'مرفق عام' },
    ],
  },
  {
    id: 'q-severity',
    promptEn: 'How severe is the damage?',
    promptAr: 'ما درجة الضرر؟',
    inputType: 'radio',
    options: [
      { id: 'opt-partial', labelEn: 'Partial damage', labelAr: 'ضرر جزئي' },
      { id: 'opt-severe', labelEn: 'Severe damage', labelAr: 'ضرر شديد' },
      { id: 'opt-total', labelEn: 'Total loss', labelAr: 'دمار كامل' },
    ],
  },
  {
    id: 'q-occupancy',
    promptEn: 'Is the property currently safe to occupy?',
    promptAr: 'هل العقار آمن للسكن حاليًا؟',
    inputType: 'radio',
    options: [
      { id: 'opt-occupied', labelEn: 'Yes, we are living here', labelAr: 'نعم، ما زلنا نقيم فيه' },
      { id: 'opt-partly', labelEn: 'Partly, only some rooms', labelAr: 'جزئيًا، بعض الغرف فقط' },
      { id: 'opt-unsafe', labelEn: 'No, it is unsafe', labelAr: 'لا، غير آمن' },
    ],
  },
  {
    id: 'q-utilities',
    promptEn: 'Which utilities are affected?',
    promptAr: 'ما الخدمات المتأثرة؟',
    inputType: 'checkbox',
    options: [
      { id: 'opt-water', labelEn: 'Water', labelAr: 'المياه' },
      { id: 'opt-electricity', labelEn: 'Electricity', labelAr: 'الكهرباء' },
      { id: 'opt-sewage', labelEn: 'Sewage', labelAr: 'الصرف الصحي' },
      { id: 'opt-none', labelEn: 'None', labelAr: 'لا شيء' },
    ],
  },
  {
    id: 'q-household',
    promptEn: 'How many people live in the household?',
    promptAr: 'كم عدد أفراد الأسرة المقيمين؟',
    inputType: 'number',
  },
];

/** Resolves the stored bilingual question set down to one locale's content. */
export function localizeAssessmentQuestions(
  questions: LocalizedQuestion[],
  lang: string,
): AssessmentQuestion[] {
  const isArabic = lang === 'ar';
  return questions.map((question) => ({
    id: question.id,
    prompt: isArabic ? question.promptAr : question.promptEn,
    inputType: question.inputType,
    options: question.options?.map((option) => ({
      id: option.id,
      label: isArabic ? option.labelAr : option.labelEn,
    })),
  }));
}
