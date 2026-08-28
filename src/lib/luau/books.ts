/** مكتبة المصادر: أين يجلب اللاعبون المعرفة ليطعموا النموذج */
export interface BookSource {
  title: string;
  kind: "كتاب" | "موقع" | "فيديو" | "مرجع";
  description: string;
  url: string;
  bestFor: string;
}

export const BOOK_SOURCES: BookSource[] = [
  {
    title: "وثائق Roblox الرسمية — Luau",
    kind: "مرجع",
    description:
      "المرجع الرسمي الكامل للغة لواو من روبلوكس: الأنواع، المكتبات، والفروقات عن لوا. أفضل مصدر للتفاصيل الدقيقة.",
    url: "https://create.roblox.com/docs/luau",
    bestFor: "التفاصيل الدقيقة والمكتبات الرسمية",
  },
  {
    title: "وثائق Roblox Creator — الخدمات والواجهات",
    kind: "مرجع",
    description:
      "توثيق كل خدمات روبلوكس: اللاعبين، الداتا ستور، الريموتات، الواجهات... مع أمثلة جاهزة لكل خدمة.",
    url: "https://create.roblox.com/docs",
    bestFor: "الخدمات وأحداثها وخصائصها",
  },
  {
    title: "Programming in Lua — Roberto Ierusalimschy",
    kind: "كتاب",
    description:
      "الكتاب الأم للغة لوا من صانع اللغة نفسه. يشرح الميتا تيبل والكوروتينات والأنماط بعمق لا تجده في مكان آخر.",
    url: "https://www.lua.org/pil/",
    bestFor: "فهم أسس اللغة العميقة والميتا تيبل",
  },
  {
    title: "Lua 5.1 Reference Manual",
    kind: "كتاب",
    description:
      "المرجع الرسمي للغة التي بنيت عليها لواو. مفيد لفهم السلوكيات الأصلية التي حافظت عليها روبلوكس.",
    url: "https://www.lua.org/manual/5.1/",
    bestFor: "المرجع السريع والدقيق",
  },
  {
    title: "قناة TheDevKing على يوتيوب",
    kind: "فيديو",
    description:
      "من أشهر قنوات تعليم سكربتات روبلوكس: سلسلة كاملة من الصفر حتى أنظمة متقدمة، بشرح عملي داخل ستوديو.",
    url: "https://www.youtube.com/@TheDevKing",
    bestFor: "التعلم البصري خطوة بخطوة",
  },
  {
    title: "قناة AlvinBlox على يوتيوب",
    kind: "فيديو",
    description:
      "دورات روبلوكس للمبتدئين وأنظمة ألعاب كاملة مشروحة بالتفصيل — مصدر ممتاز للمشاريع التطبيقية.",
    url: "https://www.youtube.com/@AlvinBlox",
    bestFor: "مشاريع كاملة للمبتدئين",
  },
  {
    title: "منتدى Roblox DevForum",
    kind: "موقع",
    description:
      "منتدى مطوري روبلوكس الرسمي: آلاف المواضيع عن حلول مشاكل حقيقية، حيل أداء، ونقاشات أمان — منجم ذهب للمعرفة.",
    url: "https://devforum.roblox.com/",
    bestFor: "الحلول العملية والمشاكل الشائعة",
  },
  {
    title: "Toolbox والمشاريع مفتوحة المصدر",
    kind: "موقع",
    description:
      "تصفح سكربتات ألعاب حقيقية في مكتبة روبلوكس — اقرأ كيف بنى المحترفون أنظمتهم ثم اطعم خلاصتها للنموذج.",
    url: "https://create.roblox.com/store",
    bestFor: "قراءة كود حقيقي من ألعاب فعلية",
  },
];
