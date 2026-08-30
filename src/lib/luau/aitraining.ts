/**
 * خط التدريب المكثف: يولّد قاعدة معرفة عالية الجودة عبر نموذج Qwen
 * (المفتاح من إعدادات .env.local) ويحفظها في knowledgeEntries
 * احتراماً لنفس آلية المحرك: تدخل فهرس البحث خلال دقيقة.
 *
 * المكالمات كلها على الخادم — لا يشارك جهاز الزائر في هذا التدريب.
 */
import { and, desc, eq, like, or } from "drizzle-orm";
import { db } from "@/db";
import { knowledgeEntries } from "@/db/schema";
import { qwenAvailable, qwenChat } from "../qwen";
import { buildSearchText, tokenize } from "./text";
import { EXTENDED_TOPICS } from "./curriculum-ext";
// يُعاد تصديره من مركز المنهج (aitraining) ليستورده autoTrainer من مكان واحد
export { EXTENDED_TOPICS };

export interface AITopic {
  topic: string; // المعرّف والعنوان — أيضاً مفتاح منع التكرار
  kind: "lesson" | "system";
  level: string;
  focus: string; // تفصيل التوجيه للنموذج
  lang?: string; // اسم اللغة — الافتراضي "لواو"
  context?: string; // بيئة تشغيل مثال الكود — الافتراضي "روبلكس ستوديو"
}

/** منع تكرار أسماء المواضيع عبر كل اللغات */
function assertNoDupes(topics: AITopic[]): void {
  const seen = new Set(topics.map((t) => t.topic));
  if (seen.size !== topics.length) {
    throw new Error("منهج التدريب فيه أسماء مواضيع مكررة");
  }
}

const LUA_TOPICS: AITopic[] = [
  // ─── الأساسيات ───
  { topic: "المتغيرات في لوا", kind: "lesson", level: "مبتدئ", focus: "local والأنواع والتسمية، مع 8 أمثلة متنوعة" },
  { topic: "أنواع البيانات في لوا", kind: "lesson", level: "مبتدئ", focus: "number/string/boolean/nil + التحويل بينها + print" },
  { topic: "الجداول في لوا", kind: "lesson", level: "مبتدئ", focus: "مصفوفات وقواميس وطرق الإضافة والمرور عليها" },
  { topic: "الجمل الشرطية if else", kind: "lesson", level: "مبتدئ", focus: "if/elseif/else مع and/or/not + أمثلة من ألعاب" },
  { topic: "حلقات while و repeat", kind: "lesson", level: "مبتدئ", focus: "while true + break + repeat حتى وشرط الخروج" },
  { topic: "حلقة for الرقمية", kind: "lesson", level: "مبتدئ", focus: "for i=1,10 وخطوة بالسالب + مثال عدّاد" },
  { topic: "حلقة for على الجداول", kind: "lesson", level: "مبتدئ", focus: "ipairs و pairs و الفرق بينهما" },
  { topic: "الدوال في لوا", kind: "lesson", level: "مبتدئ", focus: "تعريف/استدعاء/إرجاع قيم متعددة و local function" },
  { topic: "نطاق المتغيرات", kind: "lesson", level: "مبتدئ", focus: "local مقابل global و scoping و do block" },
  { topic: "السلاسل النصية", kind: "lesson", level: "مبتدئ", focus: "الدمج + string.format + gsub والأنماط البسيطة" },
  { topic: "التعليقات وترتيب الكود", kind: "lesson", level: "مبتدئ", focus: "-- و --[[ ]] وأهمية التعليقات للمبتدئ" },
  { topic: "العمليات الحسابية", kind: "lesson", level: "مبتدئ", focus: "+ - * / // % ^ مع أمثلة نظام نقاط" },
  // ─── متوسط ───
  { topic: "الميتا تيبل في لوا", kind: "lesson", level: "متوسط", focus: "__index/__newindex/__add/__call مع أمثلة كاملة" },
  { topic: "الكوروتينات coroutine", kind: "lesson", level: "متوسط", focus: "create/resume/yield + أمثلة من الألعاب" },
  { topic: "الكائنات والأصناف OOP", kind: "lesson", level: "متوسط", focus: "محاكاة أصناف عبر الميتا تيبل والدوال" },
  { topic: "معالجة الأخطاء pcall", kind: "lesson", level: "متوسط", focus: "pcall/xpcall والتقاط أخطاء الكود بأمان" },
  // ─── روبلكس ───
  { topic: "الأحداث Events", kind: "lesson", level: "متوسط", focus: "Touched/Changed/RunService مع أمثلة تطبيقية" },
  { topic: "الـ RemoteEvent والأمان", kind: "lesson", level: "متوسط", focus: "FireServer/OnClientEvent والتحقق من المدخلات" },
  { topic: "الـ ModuleScript", kind: "lesson", level: "متوسط", focus: "require وتنظيم الأكواد الكبيرة ومشاركة الدوال" },
  { topic: "TweenService والحركة الناعمة", kind: "lesson", level: "متوسط", focus: "TweenInfo وtransitions الناعمة" },
  { topic: "لدرات Leaderstats", kind: "lesson", level: "متوسط", focus: "نقاط/عملات تظهر للجميع وتتحدث بأمان" },
  { topic: "DataStore حفظ البيانات", kind: "lesson", level: "متقدم", focus: "SetAsync/GetAsync + الحفظ التلقائي مع الأخطاء" },
  { topic: "Raycast ومعاينة الهدف", kind: "lesson", level: "متقدم", focus: "Workspace:Raycast وأمثلة إطلاق نار" },
  { topic: "أعداء يتبعون اللاعب Pathfinding", kind: "lesson", level: "متقدم", focus: "PathfindingService والحذر من الانهيارات" },
  { topic: "حماية بيانات اللاعب", kind: "lesson", level: "متقدم", focus: "أمثلة آمنة ضد الاستغلال + تحديثات" },
  // ─── أنظمة جاهزة ───
  { topic: "نظام نقاط وعملات", kind: "system", level: "متوسط", focus: "لدادات + دفع آمن لكل لاعب + حفظ" },
  { topic: "نظام متجر آمن", kind: "system", level: "متقدم", focus: "شراء عبر RemoteEvent مع التحقق من المال والنوع" },
  { topic: "نظام مكافأة يومية", kind: "system", level: "مبتدئ", focus: "دخول يومي + مكافأة + حفظ آخر دخول" },
  { topic: "نظام حفظ تلقائي كامل", kind: "system", level: "متقدم", focus: "autosave كل 60 ثانية + رسائل صامتة" },
  { topic: "نظام ألقاب وألوان", kind: "system", level: "متوسط", focus: "قوالب للاعبين مع حفظ عبر DataStore" },
  { topic: "نظام صيد السمك", kind: "system", level: "متوسط", focus: "زر + انتظار + ندرة أسماك + جائزة وحفظ" },
  { topic: "نظام زراعة ونمو", kind: "system", level: "متوسط", focus: "بذور + مراحل نمو + قطاف + حفظ" },
  { topic: "نظام تعدين بالمعاول", kind: "system", level: "متوسط", focus: "عروق + ضربات + نقاط قوة + جرد" },
  { topic: "نظام جرد Inventory", kind: "system", level: "متقدم", focus: "جرد شبكي + إضافة/إزالة + حفظ" },
  { topic: "نظام مهام ودروس", kind: "system", level: "متوسط", focus: "قائمة مهام + مكافآت + تتبع لكل لاعب" },
  { topic: "نظام زومبي يلاحق", kind: "system", level: "متوسط", focus: "أعداء يلاحقون اللاعب الأقرب + قطر تناول" },
  { topic: "نظام أبواب وصناديق", kind: "system", level: "مبتدئ", focus: "أبواب تفتح بلمسة + صناديق أسرار" },
  { topic: "نظام منصات متحركة", kind: "system", level: "مبتدئ", focus: "منصات جوال + Tween + حلقات" },
  { topic: "نظام أسلحة وقذائف", kind: "system", level: "متقدم", focus: "أسلحة بعيدة + مقذوفات حقيقية" },
];

const PYTHON_TOPICS: AITopic[] = [
  { topic: "المتغيرات في بايثون", kind: "lesson", level: "مبتدئ", focus: "التهيئة والديناميكية والتسمية مع أمثلة رقم", lang: "بايثون", context: "مفسر بايثون 3 (python script.py)" },
  { topic: "أنواع البيانات في بايثون", kind: "lesson", level: "مبتدئ", focus: "int/float/str/bool + التحويل والفحص type()", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "القوائم في بايثون", kind: "lesson", level: "مبتدئ", focus: "list طرق الإضافة والحذف والتقطيع slicing", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "القواميس في بايثون", kind: "lesson", level: "مبتدئ", focus: "dict الاسترجاع الآمن get والتكرار والتداخل", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "الشروط في بايثون", kind: "lesson", level: "مبتدئ", focus: "if/elif/else مع أمثلة تطبيقية", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "الحلقات في بايثون", kind: "lesson", level: "مبتدئ", focus: "for + range و while و break/continue", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "الدوال في بايثون", kind: "lesson", level: "مبتدئ", focus: "def + إرجاع عدة قيم و args و kwargs", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "السلاسل النصية في بايثون", kind: "lesson", level: "مبتدئ", focus: "f-strings والطرق الأساسية والدمج", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "التعامل مع الأخطاء في بايثون", kind: "lesson", level: "متوسط", focus: "try/except/finally + رفع استثناء مخصص", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "قراءة وكتابة الملفات في بايثون", kind: "lesson", level: "متوسط", focus: "open + with و json.dump/load", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "الأصناف والكائنات في بايثون", kind: "lesson", level: "متوسط", focus: "class + __init__ و self + وراثة بسيطة", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "الـ tuples و الـ sets في بايثون", kind: "lesson", level: "متوسط", focus: "الفرق بينها وبين القوائم واستخداماتها", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "مكتبة datetime والتعامل مع الوقت", kind: "lesson", level: "متوسط", focus: "الآن/الفرق/التنسيق strftime", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "التعبيرات العادية في بايثون", kind: "lesson", level: "متقدم", focus: "re.search/findall مع أمثلة تحقق", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "المولدات Generator في بايثون", kind: "lesson", level: "متقدم", focus: "yield والكسل في توليد الأرقام", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "التزامن threading في بايثون", kind: "lesson", level: "متقدم", focus: "Thread و تشغيل مهام بالتوازي مع قفل s", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "لعبة تخمين الرقم", kind: "system", level: "مبتدئ", focus: "أرقام عشوائية + عدّادات محاولات + واجهة نصية", lang: "بايثون", context: "مفسر بايثون 3 (تصيقة كامل للنسخ)" },
  { topic: "برنامج إدارة مهام يومية", kind: "system", level: "متوسط", focus: "رفع أوامر add/done/list مع حفظ في ملف json", lang: "بايثون", context: "محطة أوامر ببايثون 3" },
  { topic: "حاسبة متقدمة بواجهة نصية", kind: "system", level: "مبتدئ", focus: "عمليات + ذاكرة + تعامل مع أخطاء القسمة", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "مشروع محول عملات", kind: "system", level: "متوسط", focus: "نسب ثابتة + تهيئة إدخال مستخدم + تكرار", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "برنامج بحث وفرز تطبيقي", kind: "system", level: "متوسط", focus: "فرز قائمة + بحث ثنائي بالكود الكامل", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "مشروع إدارة سجل طلاب", kind: "system", level: "متوسط", focus: "أصناف + إضافة علامات + حساب متوسط + ملف", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "تشفير كلمات السر برمجياً", kind: "system", level: "متقدم", focus: "hashlib + salted hash وتخزين آمن", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "أتمتة تنظيم ملفات المجلد", kind: "system", level: "متوسط", focus: "os + shutil نقل حسب الامتداد", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "رسم بيانات بسيط ببايثون", kind: "system", level: "متوسط", focus: "matplotlib رسم عمود وخطي لمثال صغير", lang: "بايثون", context: "مفسر بايثون 3" },
  { topic: "بوت تلغرام تعليمي بسيط", kind: "system", level: "متقدم", focus: "مكتبة python-telegram-bot ورسالة ترحيب + أوامر", lang: "بايثون", context: "مفسر بايثون 3 بمكتبة مثبتة" },
];

const JS_TOPICS: AITopic[] = [
  { topic: "المتغيرات في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "let/const + التسمية + أساسيات", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "أنواع البيانات في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "البدائية والسلسلة والرقم + typeof", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "المصفوفات في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "طُرق الدفع والبحث و map/filter", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "الكائنات في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "{...} + destructuring و spread", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "الشروط في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "if/else + switch + الشرط الثلاثي", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "الحلقات في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "for + while + for...of مع أمثلة", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "الدوال في جافاسكريبت", kind: "lesson", level: "مبتدئ", focus: "function + arrow + القيم الافتراضية", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "الأصناف في جافاسكريبت", kind: "lesson", level: "متوسط", focus: "class + constructor + وراثة بسيطة", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "البرمجة غير المتزامنة في جافاسكريبت", kind: "lesson", level: "متوسط", focus: "Promise + async/await + fetch", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "التعامل مع DOM في جافاسكريبت", kind: "lesson", level: "متوسط", focus: "document.querySelector + الأحداث + تغيير النص", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "السلاسل والقوالب النصية", kind: "lesson", level: "مبتدئ", focus: "template literals + الطرق الشائعة", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "التخزين في المتصفح localStorage", kind: "lesson", level: "متوسط", focus: "setItem/getItem وتخزين JSON", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "معالجة الأخطاء في جافاسكريبت", kind: "lesson", level: "متوسط", focus: "try/catch/finally + throw وربط أخطاء fetch", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "مكتبة Node.js الأساسية", kind: "lesson", level: "متوسط", focus: "require/import + fs + http وحدة جاهزة", lang: "جافاسكريبت", context: "Node.js" },
  { topic: "التعبيرات regex في جافاسكريبت", kind: "lesson", level: "متقدم", focus: "new RegExp + exec/match مع تحقق صيغ", lang: "جافاسكريبت", context: "متصفح أو Node.js" },
  { topic: "أساسيات TypeScript", kind: "lesson", level: "متوسط", focus: "أنواع + interfaces + تجميع صغير", lang: "TypeScript", context: "Node.js مع tsc" },
  { topic: "سيرفر صغير مع Express", kind: "system", level: "متوسط", focus: "مسارات + استقبال JSON + إرسال ردود", lang: "جافاسكريبت", context: "Node.js مع npm" },
  { topic: "لعبة عرصيص X وO", kind: "system", level: "متوسط", focus: "لوحة + تبديل الأدوار + كشف الفوز جاهز", lang: "جافاسكريبت", context: "متصفح + HTML/CSS بسيط" },
  { topic: "تطبيق قائمة مهام Todo", kind: "system", level: "متوسط", focus: "إضافة/حذف/إتمام مع localStorage", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "مؤقت بومودورو", kind: "system", level: "مبتدئ", focus: "عدّاد تنازلي + أزرار + تنبيه على الانتهاء", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "آلة حاسبة بواجهة تفاعلية", kind: "system", level: "مبتدئ", focus: "أزرار + ترتيب عمليات + عرض النتيجة", lang: "جافاسكريبت", context: "متصفح + HTML/CSS بسيط" },
  { topic: "نظام تصويت مباشر بسيط", kind: "system", level: "متوسط", focus: "أزرار تصويت + تحديث الأرقام بدون تحديث الصفحة", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "رسم متحرك بالـ Canvas", kind: "system", level: "متقدم", focus: "requestAnimationFrame + رسم كرة متحركة", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "بحث حي في قائمة", kind: "system", level: "متوسط", focus: "فلاتر نتيجة حسب الإدخال لحظياً", lang: "جافاسكريبت", context: "متصفح" },
  { topic: "عرض ساعات عالمية", kind: "system", level: "مبتدئ", focus: "setInterval + تحديث الوقت + فرق التوقيت", lang: "جافاسكريبت", context: "متصفح" },
];

const CPP_TOPICS: AITopic[] = [
  { topic: "المتغيرات في C++", kind: "lesson", level: "مبتدئ", focus: "int/double/string + auto + التسمية", lang: "C++", context: "مترجم g++ أو تمثّل" },
  { topic: "أنواع البيانات في C++", kind: "lesson", level: "مبتدئ", focus: "الأنواع الأساسية وأحجامها + sizeof", lang: "C++", context: "مترجم g++" },
  { topic: "الشروط في C++", kind: "lesson", level: "مبتدئ", focus: "if/else if/else + switch", lang: "C++", context: "مترجم g++" },
  { topic: "الحلقات في C++", kind: "lesson", level: "مبتدئ", focus: "for + while + do-while + break", lang: "C++", context: "مترجم g++" },
  { topic: "المصفوفات والمتجهات في C++", kind: "lesson", level: "مبتدئ", focus: "array + vector والعمليات الشائعة", lang: "C++", context: "مترجم g++" },
  { topic: "الدوال في C++", kind: "lesson", level: "مبتدئ", focus: "تعريف/استدعاء + قيم افتراضية + overload", lang: "C++", context: "مترجم g++" },
  { topic: "السلاسل النصية في C++", kind: "lesson", level: "مبتدئ", focus: "std::string والطرق الأساسية", lang: "C++", context: "مترجم g++" },
  { topic: "المؤشرات في C++", kind: "lesson", level: "متوسط", focus: "address-of + dereference + مؤشرات بسيطة", lang: "C++", context: "مترجم g++" },
  { topic: "المراجع في C++", kind: "lesson", level: "متوسط", focus: "pass by reference مقابل value", lang: "C++", context: "مترجم g++" },
  { topic: "الكلاسات في C++", kind: "lesson", level: "متوسط", focus: "class + constructor + دوال أعضاء", lang: "C++", context: "مترجم g++ (فحص: لا تُعقّد بالهيدرات)" },
  { topic: "الوراثة في C++", kind: "lesson", level: "متقدم", focus: "ميراث بسيط + virtual دوال", lang: "C++", context: "مترجم g++" },
  { topic: "المكتبة القياسية STL", kind: "lesson", level: "متوسط", focus: "vector + map + sort", lang: "C++", context: "مترجم g++" },
  { topic: "الستاك والطوابير C++", kind: "lesson", level: "متوسط", focus: "stack + queue + deque مع مثال", lang: "C++", context: "مترجم g++" },
  { topic: "الذاكرة الذكية في C++", kind: "lesson", level: "متقدم", focus: "unique_ptr و shared_ptr وفوائدها", lang: "C++", context: "مترجم g++" },
  { topic: "الملفات في C++", kind: "lesson", level: "متوسط", focus: "fstream للكتابة والقراءة", lang: "C++", context: "مترجم g++" },
  { topic: "معالجة الأخطاء في C++", kind: "lesson", level: "متوسط", focus: "try/throw/catch مع مثال", lang: "C++", context: "مترجم g++" },
  { topic: "المدخلات والمخرجات في C++", kind: "lesson", level: "مبتدئ", focus: "cin + getline + تنسيق الناتج", lang: "C++", context: "مترجم g++" },
  { topic: "تنظيم الكود فصول ملفات C++", kind: "lesson", level: "متقدم", focus: "ملف h و cpp + رأسي ترجمة", lang: "C++", context: "مشروع صغير بمجمّع" },
  { topic: "لعبة تخمين الرقم بواجهة نصية", kind: "system", level: "مبتدئ", focus: "rand + حلقات + محاولات", lang: "C++", context: "تطبيق سطر أوامر بمجمّع" },
  { topic: "متتالية فيبوناتشي وتحليلها", kind: "system", level: "مبتدئ", focus: "حلقات + تخزين + طباعة أول 20", lang: "C++", context: "تطبيق سطر أوامر" },
  { topic: "سجل طلاب C++", kind: "system", level: "متوسط", focus: "struct + vector + إحصاء متوسط", lang: "C++", context: "تطبيق سطر أوامر" },
  { topic: "لعبة نرد بسيطة", kind: "system", level: "مبتدئ", focus: "أرقام عشوائية + تجميع نقاط", lang: "C++", context: "تطبيق سطر أوامر" },
  { topic: "آلة حاسبة شاملة C++", kind: "system", level: "متوسط", focus: "عمليات + switch + التعامل مع صفر", lang: "C++", context: "تطبيق سطر أوامر" },
  { topic: "إدارة جرد مخزن C++", kind: "system", level: "متقدم", focus: "struct + map + بحث وتحديث", lang: "C++", context: "تطبيق سطر أوامر" },
  { topic: "نظام صفوف انتظار تطبيقي", kind: "system", level: "متوسط", focus: "queue + عمليات جاهزة", lang: "C++", context: "تطبيق سطر أوامر" },
];

const CRAFT_TOPICS: AITopic[] = [
  { topic: "كيف تحلل مشكلة برمجية خطوة بخطوة", kind: "lesson", level: "مبتدئ", focus: "من ثمّ تفسير المشكلة، تقسيمها، حل كل جزء ثم الدمج والاختبار" },
  { topic: "اختبار الكود وتتبّع الأخطاء Debugging", kind: "lesson", level: "متوسط", focus: "قراءة رسائل الأخطاء + print/طباعة + تقسيم الكود لقطع صغيرة" },
  { topic: "الأخطاء الشائعة للمبتدئين في البرمجة", kind: "lesson", level: "مبتدئ", focus: "تسمية خاطئة، نسيان إنهاء الجملة، خلط الأنواع وطرق تفاديها" },
  { topic: "تحسين أداء الأنظمة الكبيرة", kind: "lesson", level: "متقدم", focus: "تجنب الحلقات المؤذية + خطط الأحداث + إعادة الاستخدام الذكية" },
  { topic: "الأمان أولاً عند كتابة أنظمة", kind: "lesson", level: "متوسط", focus: "لا تثق بالكلينت + تدقيق المدخلات + حماية المال الافتراضي" },
  { topic: "إعادة استخدام الأكواد وتنظيمها Refactoring", kind: "lesson", level: "متوسط", focus: "دوال صغيرة + ModuleScript + تجنب النسخ المتكرر" },
  { topic: "المصطلحات البرمجية بالعربية والإنكليزية", kind: "lesson", level: "مبتدئ", focus: "قاموس مبسط: متغير/دالة/حلقة/كائن ومعناها بالعمل" },
  { topic: "شرح الكود للمبتدئ بلغة بسيطة", kind: "lesson", level: "مبتدئ", focus: "تبسيط المفاهيم بأمثلة الحياة اليومية بدون كلام معقد" },
  { topic: "كتابة رسائل ودية بلغة شامية محببة", kind: "lesson", level: "مبتدئ", focus: "أسلوب مرحب بكلاعبين، عبارات تشجيع، ونبرة صديق" },
  { topic: "إعطاء أمثلة من الحياة اليومية لتوضيح المفاهيم", kind: "lesson", level: "مبتدئ", focus: "ربط الجداول بالرفوف والحلقات بالدورات اليومية والشروط بالخيارات" },
  { topic: "التفكير النقدي في الحلول البرمجية", kind: "lesson", level: "متوسط", focus: "سؤال لماذا اشتغل ولماذا فشل، ومقارنة الحلول البديلة" },
  { topic: "فن وضع التلميحات والنصائح المفيدة", kind: "lesson", level: "مبتدئ", focus: "نصائح عملية قصيرة تنفع المبتدئ عند كل مبدأ" },
  { topic: "كتابة التوثيق والتعليقات بمعنى", kind: "lesson", level: "مبتدئ", focus: "تعليقات تشرح الهدف لا تكرر السطر، وترتيب يسهل القراءة" },
  { topic: "عادة التعلم الذاتي للمبرمج", kind: "lesson", level: "مبتدئ", focus: "كيف يبحث عن إجابات، يقرأ الكود الجاهز، ويتدرب يومياً" },
];

/**
 * المنهج الأساسي — الـ129 موضوعاً التي تمثّل «بوابة الاكتمال»: عند تغطيتها
 * يظهر زر «جرّب النموذج بدون Qwen» وشريط التقدّم يُقاس عليها. لا تُضخّم هذه
 * القائمة؛ أضِف الجديد إلى المنهج الموسّع ([[curriculum-ext]]) بدلاً من ذلك.
 */
export const CORE_TOPICS: AITopic[] = [
  ...LUA_TOPICS,
  ...PYTHON_TOPICS,
  ...JS_TOPICS,
  ...CPP_TOPICS,
  ...CRAFT_TOPICS,
];

/**
 * كل نطاق التدريب: الأساسي أولاً (يمرّ عليه المدرّب بالترتيب) ثم المنهج الموسّع
 * الذي يُدرَّب بالخلفية. `assertNoDupes` يضمن تفرّد كل اسم موضوع عبر القائمتين.
 */
export const AI_TOPICS: AITopic[] = [...CORE_TOPICS, ...EXTENDED_TOPICS];

assertNoDupes(AI_TOPICS);

export interface TrainedResult {
  status: "trained" | "skipped" | "failed";
  topic: string;
  title?: string;
  tokens?: number;
  error?: string;
}

async function existsTitle(title: string): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: knowledgeEntries.id })
      .from(knowledgeEntries)
      .where(eq(knowledgeEntries.title, title))
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

/** هل عنوان درس سابق يمثل هذا الموضوع؟ — مطابقة تامة أو جزئية (للمقدمات قبل إضافة الوسوم) */
function topicMatches(topic: string, title: string): boolean {
  if (title === topic) return true;
  return title.includes(topic) || topic.includes(title);
}

/** هل درس هذا الموضوع موجود من قبل؟ (بوسم الموضوع، أو بمطابقة العنوان) — استعلام واحد مفهرس */
export async function existsTopic(topic: string): Promise<boolean> {
  try {
    const marker = "تدريب:" + topic;
    const rows = await db
      .select({ id: knowledgeEntries.id })
      .from(knowledgeEntries)
      .where(
        and(
          eq(knowledgeEntries.authorName, "تدريب Qwen"),
          or(
            like(knowledgeEntries.tags, "%" + marker + "%"),
            like(knowledgeEntries.title, "%" + topic + "%")
          )
        )
      )
      .limit(1);
    return rows.length > 0;
  } catch {
    return false;
  }
}

function extractJson(raw: string): Record<string, unknown> | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(raw.slice(start, end + 1));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function cleanCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  if (!text) return null;
  // إزالة فواصل markdown أياً كانت لغتها
  return text.replace(/^```[a-z+#]*\s*/i, "").replace(/\s*```\s*$/, "");
}

/** توليد درس واحد عبر Qwen ثم حفظه — يدخل فهرس البحث فوراً */
export async function generateAILesson(topic: AITopic): Promise<TrainedResult> {
  if (!qwenAvailable()) {
    return { status: "failed", topic: topic.topic, error: "Qwen غير مفعّل" };
  }

  // فحص التكرار أولاً — قبل أي مكالمة LLM (كان يحرق مكالمة كاملة على كل موضوع متدرّب!)
  if (await existsTopic(topic.topic)) {
    return { status: "skipped", topic: topic.topic, title: topic.topic };
  }

  const langName = topic.lang ?? "لواو";
  const runContext =
    topic.context ?? (langName === "لواو" ? "روبلكس ستوديو" : "بيئة التطوير المستهدفة");

  const system =
    "أنت «عقل لواو» — خبير برمجة بلغة " +
    langName +
    ". أنشئ درساً تعليمياً عربياً " +
    "باللهجة العامية (شامية)، بمستوى " +
    topic.level +
    ". أجب حصراً بصيغة JSON صالحة ووحيدة بدون أي نص خارجها، بهذا الشكل بالضبط:\n" +
    '{"title":"عنوان قصير",\n"content":"شرح تفصيلي مباشر، استخدم \\n للأسطر الجديدة ولعناوين داخلية مثل ### عنوان-داخلية، لكن لا تضع كوداً داخل content",\n"code":"مثال كود كامل قابل للنسخ ومكتوب بلغة ' +
    langName +
    ' مع تعليقات عربية",\n"tags":"كلمة1,كلمة2",\n"level":"' +
    topic.level +
    '"}';

  const user =
    "الموضوع: " +
    topic.topic +
    ".\nاللغة: " +
    langName +
    " — مثال الكود يجب أن يعمل في: " +
    runContext +
    ".\nالتوجيه التفصيلي: " +
    topic.focus +
    ".\nاكتب شرحاً عميقاً كافياً (400-800 كلمة) يبني الفهم خطوة بخطوة، ومثال كود حقيقي كامل قابل للنسخ والتشغيل. إذا تعلق الموضوع بالأمان أو الشبكات أو المال الافتراضي، اشرح أفضل الممارسات الآمنة.";

  let raw = await qwenChat({ system, user, maxTokens: 3000, temperature: 0.5, timeoutMs: 45_000 });
  // محاولة واحدة ثانية بعد فاصل قصير — غالباً rate limit مؤقت أو مهلة
  if (!raw) {
    await new Promise((resolve) => setTimeout(resolve, 2500));
    raw = await qwenChat({ system, user, maxTokens: 3000, temperature: 0.5, timeoutMs: 45_000 });
  }
  if (!raw) return { status: "failed", topic: topic.topic, error: "لم يرد النموذج" };

  const json = extractJson(raw);
  let title = typeof json?.title === "string" && json.title.trim() ? json.title.trim().slice(0, 200) : "";
  let content = typeof json?.content === "string" && json.content.trim() ? json.content.trim() : "";
  const code = cleanCode(json?.code);
  let tags = typeof json?.tags === "string" ? json.tags.trim().slice(0, 300) : topic.topic;
  if (tags && !tags.includes("تدريب")) tags += ",تدريب";

  const marker = "تدريب:" + topic.topic;
  // الوسم أولاً ليبقى ضمن حد 400 حرف مهما طالت وسوم النموذج
  if (tags && !tags.includes(marker)) tags = marker + "," + tags;

  if (!title) title = topic.topic;
  if (content.length < 40) content = raw.slice(0, 6000);

  if (await existsTopic(topic.topic)) {
    return { status: "skipped", topic: topic.topic, title };
  }

  try {
    await db.insert(knowledgeEntries).values({
      title,
      content: content.slice(0, 6000),
      code: code ? code.slice(0, 8000) : null,
      tags: tags.slice(0, 400),
      sourceType: "درس",
      authorName: "تدريب Qwen",
      searchText: buildSearchText(title, content, code, tags),
    });
    const tokens = tokenize(title + " " + content + " " + (code ?? "")).length;
    return { status: "trained", topic: topic.topic, title, tokens };
  } catch (error) {
    console.error("train ai insert error", error);
    return { status: "failed", topic: topic.topic, error: "فشل الحفظ بقاعدة البيانات" };
  }
}

/** تشغيل جلسة تدريب — يمر على مواضيع غير مدربة ويحفظ الدروس */
export async function runAITraining(batch = 3, onlyTopic?: string): Promise<{
  trained: TrainedResult[];
  skipped: TrainedResult[];
  failed: TrainedResult[];
  remaining: number;
}> {
  const scope = onlyTopic ? AI_TOPICS.filter((t) => t.topic === onlyTopic) : AI_TOPICS;

  const results: TrainedResult[] = [];
  let acted = 0;
  for (const item of scope) {
    if (acted >= batch) break;
    const result = await generateAILesson(item);
    results.push(result);
    if (result.status !== "skipped") acted++;
    // فاصل قصير بين المكالمات
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }

  const trained = results.filter((r) => r.status === "trained");
  const skipped = results.filter((r) => r.status === "skipped");
  const failed = results.filter((r) => r.status === "failed");

  // الفاشل يبقى في القائمة (قابل لإعادة التدريب) — المتبقي نحسبه بـ المنجز والمنقص فقط
  return {
    trained,
    skipped,
    failed,
    remaining: Math.max(0, scope.length - (trained.length + skipped.length)),
  };
}

/** حالة التدريب الحالية: كم درس مدرب ومتى كان آخرها */
export async function trainingStatus(): Promise<{
  aiDocs: number;
  totalTopics: number;
  coreTopics: number;
  coreComplete: boolean;
  lastTrainedAt: string | null;
  nextTopics: string[];
}> {
  const rows = await db
    .select({ title: knowledgeEntries.title, tags: knowledgeEntries.tags, createdAt: knowledgeEntries.createdAt })
    .from(knowledgeEntries)
    .where(eq(knowledgeEntries.authorName, "تدريب Qwen"))
    .orderBy(desc(knowledgeEntries.createdAt))
    .limit(8000);

  // المواضيع المنجزة: بتوسم "تدريب:اسم-الموضوع" أو بمطابقة العنوان
  const trainedTopics = new Set<string>();
  for (const row of rows) {
    const m = row.tags.match(/تدريب:(.+?)(?:,|$)/);
    if (m) trainedTopics.add(m[1].trim());
    for (const t of AI_TOPICS) {
      if (topicMatches(t.topic, row.title)) trainedTopics.add(t.topic);
    }
  }
  const nextTopics = AI_TOPICS.filter((t) => !trainedTopics.has(t.topic)).map((t) => t.topic).slice(0, 5);

  // اكتمال المنهج الأساسي (بوابة الزر): لا مواضيع أساسية ناقصة، أو عدد الدروس بلغ حجم الأساسي.
  const coreMissing = CORE_TOPICS.filter((t) => !trainedTopics.has(t.topic)).length;
  const coreComplete = coreMissing === 0 || rows.length >= CORE_TOPICS.length;

  return {
    aiDocs: rows.length,
    totalTopics: AI_TOPICS.length,
    coreTopics: CORE_TOPICS.length,
    coreComplete,
    lastTrainedAt: rows[0]?.createdAt?.toISOString?.() ?? null,
    nextTopics,
  };
}