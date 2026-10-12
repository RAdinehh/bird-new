import type { GuideChapter } from '../types';

export const CHAPTER_SOURCES: GuideChapter = {
  id: 'sources',
  group: 'standards',
  title: 'منابع',
  icon: '📚',
  subtitle: 'مراجع علمی و استانداردها',
  sections: [
    {
      title: 'استانداردهای بین‌المللی',
      bullets: [
        'Cobb-Vantress. (2022). Cobb 500 Broiler Performance & Nutrition Supplement.',
        'Aviagen. (2022). Ross 308 Broiler Nutrition Specifications.',
        'Aviagen. (2022). Broiler Management Handbook.',
        'Hy-Line International. (2023). Commercial Management Guide — W36.',
        'Lohmann Breeders. (2023). Management Guide — LSL & LB.',
        'BUT (British United Turkeys). (2022). Commercial Management Guide.',
      ],
    },
    {
      title: 'منابع علمی بین‌المللی',
      bullets: [
        'MSD Veterinary Manual — Poultry Section. (2023).',
        'Hatching Time — Incubation Guide. (2024).',
        'FAO — Poultry Sector Reviews. (2020).',
        'World Poultry Science Association (WPSA) — Proceedings.',
      ],
    },
    {
      title: 'منابع ایرانی',
      bullets: [
        'وزارت جهاد کشاورزی. (۱۴۰۲). دستورالعمل پرورش مرغ گوشتی.',
        'سازمان دامپزشکی ایران. (۱۴۰۲). استانداردهای بهداشتی مرغداری.',
        'مرکز تحقیقات و آموزش کشاورزی آذربایجان شرقی — مرغ مرندی.',
        'مرکز اصلاح نژاد مرغ بومی اصفهان — مرغ گلپایگانی.',
        'مرکز تحقیقات مرغ بومی لارستان — مرغ لاری.',
        'مؤسسه تحقیقات علوم دامی کشور — مرغ گلین.',
      ],
    },
    {
      title: 'مقالات علمی',
      bullets: [
        'مطالعات دانشگاه تبریز — عملکرد مرغ بومی آذربایجان.',
        'پژوهش‌های دانشگاه اصفهان — مرغ گلپایگانی.',
        'مقالات علمی-پژوهشی درباره‌ی بلدرچین و اردک در ایران.',
      ],
    },
    {
      title: 'نکته',
      paragraphs: [
        'اگر می‌خواهید استانداردی را به‌روز کنید، به آخرین نسخه‌ی منبع اصلی مراجعه کنید. شرکت‌های بزرگ (Cobb، Aviagen، Hy-Line) هر ۱-۲ سال نسخه‌ی جدید منتشر می‌کنند.',
      ],
      callout: {
        tone: 'info',
        text: 'همه‌ی اعداد در نرم‌افزار «مدیریت مرغداری» قابل ویرایش هستند. اگر متوجه تفاوت بین نسخه‌ها شدید، می‌توانید از بخش «استانداردها» ویرایش کنید.',
      },
    },
  ],
};
