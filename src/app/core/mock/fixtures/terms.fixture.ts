import { TermsDocument } from '@core/models';

export const seedTerms: TermsDocument[] = [
  {
    id: 'terms-1',
    title: 'شروط استخدام المنصة',
    audience: 'general',
    version: 'v2.0',
    body: 'باستخدامك المنصة فإنك توافق على تقديم بيانات صحيحة والالتزام بالسياسات المعتمدة. تُستخدم بياناتك لأغراض تنسيق الإعمار والتحقق من الاستحقاق فقط، ولا تُشارك خارج المنصة دون إذنك.',
    active: true,
    updatedAt: '2026-05-01T09:00:00.000Z',
  },
  {
    id: 'terms-2',
    title: 'شروط استخدام المنصة',
    audience: 'general',
    version: 'v1.0',
    body: 'النسخة الأولى من شروط الاستخدام.',
    active: false,
    updatedAt: '2025-11-01T09:00:00.000Z',
  },
  {
    id: 'terms-3',
    title: 'اتفاقية المقاولين',
    audience: 'contractor',
    version: 'v1.3',
    body: 'يلتزم المقاول بمعايير السلامة المهنية وبمواصفات البناء المعتمدة في كل مرحلة، وبتقديم مستخلصات دقيقة مطابقة للأعمال المنفّذة.',
    active: true,
    updatedAt: '2026-04-15T09:00:00.000Z',
  },
  {
    id: 'terms-4',
    title: 'إقرار المستفيد',
    audience: 'beneficiary',
    version: 'v1.1',
    body: 'يقرّ المستفيد بصحة بيانات الأسرة والأضرار المقدَّمة، ويتحمّل مسؤولية أي بيانات مضلّلة.',
    active: true,
    updatedAt: '2026-03-20T09:00:00.000Z',
  },
];
