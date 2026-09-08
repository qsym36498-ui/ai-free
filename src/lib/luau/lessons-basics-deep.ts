import type { KnowledgeDoc } from "./types";

/**
 * أساسيات اللغة العميقة — الدروس الناقصة في المنهاج الأساسي.
 * مفاهيم جوهرية في Luau خالص (منطق، مراجع، varargs، self، التحويل،
 * البت، if التعبيري، المساواة، الوقت، nil، فرز مخصص، الأولويات)
 * — مكتوبة يدوياً لتكون في دماغ النموذج فوراً وليس بعد انتظار التدريب.
 */
export const BASICS_DEEP_LESSONS: KnowledgeDoc[] = [
  {
    id: "logic-truthy",
    kind: "lesson",
    level: "مبتدئ",
    title: "المنطق and/or/not: ماذا يعني الصدق في لواو؟",
    summary: "القيم الصادقة والكاذبة، and/or بعمق، وخدعة a or b للقيم الافتراضية.",
    content: [
      "في لواو القيمتان الوحيدتان الكاذبتان هما nil و false فقط. كل شيء آخر صادق: صفر (0)، نص فارغ (\"\")، جدول فارغ — كلها صادقة. هذا أهم اختلاف عن C و JavaScript.",
      "عامل and يرجع القيمة الثانية إذا كانت الأولى صادقة، ويرجع الأولى إذا كانت كاذبة. عامل or يرجع الأولى إذا صادقة وإلا الثانية. لذلك a or b تعني: استخدم a إن وُجد، وإلا استخدم b — هذه خدعة القيمة الافتراضية الشهيرة.",
      "انتبه لفخ: إذا كانت a تساوي false أو nil بالتعمد، فـ a or b ستستبدلها حتى لو لم تقصد ذلك. لهذا عند التعامل مع قيم قد تكون false أو 0 استخدم فحصاً صريحاً بدل الاختصار.",
      "مبدأ الفحص القصير (short-circuit): يقيّم لواو فقط ما يلزم — في a and b لن يُقيَّم b إن كانت a كاذبة، وهذا يسمح بفحص مفاتيح مترابطة بأمان: data and data.xp.",
    ],
    code: `local health = 0
print(health or 100)     -- 0 (صحيح! الصفر صادق فلا يُستبدل)
print(nil or 100)        -- 100
print(false or 100)      -- 100

local name = ""
local display = name or "زائر"
print(display)           -- "" (الفارغ صادق فلا يُستبدل)

-- الاختصار الآمن لدخول متداخل
local data = { player = { xp = 250 } }
local xp = data and data.player and data.player.xp
print(xp)                -- 250

-- بدل if قصير
local ready = true
local msg = ready and "ابدأ اللعبة" or "انتظر اللاعبين"
print(msg)`,
    tags: ["منطق", "منطقي", "and", "or", "not", "صادق", "كاذب", "صحيح", "خاطئ", "nil", "false", "true", "فهرس", "اختصار", "افتراضي", "logic", "truthy"],
  },
  {
    id: "tables-references",
    kind: "lesson",
    level: "متوسط",
    title: "الجداول مراجع لا نسخ: متى يتغير الأصل؟",
    summary: "لماذا تعديل جدول داخل دالة يغيّر الأصلي، و table.clone للنسخ الحقيقي.",
    content: [
      "الجداول والأرقام يتصرفون بشكل مختلف كلياً: عند كتابة a = b والطرفان عددان تحصل على نسخة، أما الجداول فتحصل على مرجع للجدول نفسه — أي تغيير عبر أي منهما يظهر في كلاهما.",
      "هذا هو السبب أن تمرير جدول لدالة يسمح للدالة بتعديله، وقيم القواميس المتداخلة تشير إلى نفس الكائنات. الميزة: تمرير مرجع بلا نسخ يوفر ذاكرة وسرعة في الأنظمة الكبيرة.",
      "الخطر: عندما تريد نسخة مستقلة (مثل نسخ قالب مخزون قبل تعديله) يجب استخدام table.clone للنسخ السطحي — وهي تنسخ المستوى الأول فقط، فلو بداخلك جداول ستبقى مشتركة وتحتاج نسخاً عميقاً يدوياً للمستويات العميقة.",
      "هذا يفسر أيضاً لماذا == على الجداول لا يقارن المحتوى بل يسأل: هل هما نفس الكائن؟",
    ],
    code: `-- الجداول مراجع
local a = { name = "سيف" }
local b = a
b.name = "درع"
print(a.name)            -- درع (تغيّر الأصل!)

-- الأرقام نسخ
local x, y = 5, 5
y = 10
print(x)                 -- 5 (لا يتأثر)

-- نسخة سطحية مستقلة
local copy = table.clone(a)
copy.name = "قوس"
print(a.name)            -- درع (الأصل سليم)

-- تمرير لدالة يعدّل الأصل
local function addBuff(mob, amount)
    mob.hp = (mob.hp or 100) + amount
end
local troll = { hp = 80 }
addBuff(troll, 20)
print(troll.hp)          -- 100`,
    tags: ["جدول", "جداول", "مرجع", "نسخ", "نسخة", "clone", "كائن", "قيمة", "اشارة", "deep", "shallow", "reference", "copy", "table"],
  },
  {
    id: "multireturn-varargs",
    kind: "lesson",
    level: "متوسط",
    title: "إرجاع قيم متعددة و varargs (...)",
    summary: "دوال تُرجع أكثر من قيمة، والمعاملات المتغيرة (...) لتجميع الوسائط دون حد.",
    content: [
      "الدالة في لواو تُرجع أكثر من قيمة بفصلها بفواصل. عند الاستدعاء تلتقط القيم بترتيبها، ويتم تجاهل الزائد إن لم تستقبله متغيرات كافية — وستصبح أي قيمة ناقصة nil.",
      "الاستعمالات الشائعة: إرجاع نجاحٍ وبيانات (local ok, data = ...)، إرجاع إحداثيات (local x, y = part.Position.X, part.Position.Y)، وقبل كل شيء string.find التي تُرجع موقعين معاً.",
      "المعامل المتغير ... يجمع كل وسطيات الدالة دون حد. داخل الدالة تتعامل معه عبر جدول {...} أو دالة select('#', ...) لعدّها. حقيبة فائقة الفائدة لبناء دوال مرنة مثل sum والتنسيق.",
      "احذر: لفّ {...} إلى جدول يكسر قيم nil — عددك يصير صحيحاً لكن فهارس القيم اللاحقة تتغير. لمعالجة آمنة على القيم استخدم select(i, ...).",
    ],
    code: `-- إرجاع قيم متعددة
local function stats()
    return 10, 5
end
local hp, mp = stats()
print(hp, mp)            -- 10  5

-- معامل متغير
local function sum(...)
    local total = 0
    for _, v in ipairs({ ... }) do
        total += v
    end
    return total
end
print(sum(1, 2, 3, 4))   -- 10

-- عدّ الوسائط بأمان مع وجود nil
local function peekFirst(...)
    local first = select(1, ...)
    return select("#", ...), first
end
local count, first = peekFirst("أ", nil, "ب")
print(count, first)      -- 3  أ

-- pattern شائع: إرجاع نتيجتين
local startPos = string.find("أحب لواو", "لواو")
print(startPos)          -- 7`,
    tags: ["دالة", "دوال", "عودة", "ارجاع", "قيم", "متعددة", "نقاط", "متغير", "varargs", "select", "تجميع", "وسائط", "return", "multiple", "values", "..."],
  },
  {
    id: "colon-self",
    kind: "lesson",
    level: "متوسط",
    title: "self و النقطتان (:) — دوال الكائنات",
    summary: "لماذا تُكتب method:func بدل method.func، وكيف يعمل self تلقائياً.",
    content: [
      "النقطتان : في استدعاء طريقة تختصر تمرير الكائن نفسه: table:add(5) تعادل table.add(table, 5). داخل التعريف، المعامل الأول للأسلوب بـ : يصبح تلقائياً self الذي يشير للكائن.",
      "الفرق جوهري عند بناء «أصناف»: عرّف الدالة بـ function Player:damage(x) لتستقبل self، واستدعها بـ player:damage(10). إن نسيت النقطتين من التعريف أو الاستدعاء ستحصل على أخطاء \"self مفقود\" أو nil.",
      "هذه الخدعة لا تكتمل دون تعريف مُنشئ يستخدم المعيار: function Player.new(name) مع setmetatable وجدول __index لنفس الأصناف — فيرث كل الكائنات دوال الأصناف عبر self.",
      "افحص المراجع: string.find تسترجع مواضع، بينما string.sub أو tween:Play() أصول تتوقع self تلقائياً.",
    ],
    code: `-- صنف بسيط بالنقطتين
local Player = {}
Player.__index = Player

function Player.new(name)
    local self = setmetatable({}, Player)
    self.name = name
    self.hp = 100
    return self
end

function Player:damage(amount)   -- : يضيف self تلقائياً
    self.hp -= amount
    return self.hp
end

function Player:describe()
    return self.name .. " صحته " .. self.hp
end

local p = Player.new("أمل")
p:damage(25)                     -- استدعاء بـ : يمرر p
print(p:describe())              -- أمل صحته 75

-- مكافئ صريح بالنقطة
print(Player.describe(p))        -- نفسه تماماً`,
    tags: ["self", "نقطتين", "نقطه", "دالة", "طريقة", "كائن", "صنف", "كلاس", "كلاس", "method", "colon", "المعامل", "oop", "الكائنات"],
  },
  {
    id: "type-coercion",
    kind: "lesson",
    level: "مبتدئ",
    title: "التحويل بين الأنواع: tonumber و tostring والتجميع",
    summary: "من نص إلى رقم وبالعكس، ما الذي يتحوّل تلقائياً ومتى يعود nil.",
    content: [
      "تحوّل النصوص إلى أرقام بـ tonumber(\"42\") وترجع nil إن كان النص غير رقمي — لا استثناء (خطأ) بل nil، فافحصها قبل الاستخدام. لوضع نص من رقم استخدم tostring(100) أو ببساطة الدمج \"..\" الذي يحوّل الأرقام تلقائياً.",
      "الدمج \"..\" يحوّل الأرقام والقيم المنطقية إلى نص تلقائياً، لكن الجدول لا يتحوّل — ستحصل على خطأ نوع عند دمج جدول مباشرة، لهذا نبني النصوص من عناصر الجداول واحداً واحداً.",
      "في لواو يوجد تشابه ذاتي: true تتحوّل إلى \"true\" عند الدمج، وnil لا تتحول أصلاً (دمج nil يرمي خطأ). الرفيق العملي: table.concat تسلسل عناصر الجدول إلى نص واحد بلا أخطاء أنواع.",
      "لا تنسَ التحويل الشائع في ألعابك: النصوص القادمة من Input وواجهات المستخدم هي strings دائماً — حوّلها قبل جمعها مع أرقام: tonumber(input.Text) else افترض 0.",
    ],
    code: `print(tonumber("42") + 1)      -- 43
print(tonumber("abc"))          -- nil (يجب فحصه)
print(tostring(100) .. " سكة")  -- 100 سكة

-- دمج ".." يحوّل الأرقام تلقائياً
local coins = 7
print("عندك " .. coins .. " عملة")   -- عندك 7 عملة

local function safeNumber(input)
    local n = tonumber(input)
    return n or 0
end
print(safeNumber("12") + 3)     -- 15
print(safeNumber("ما تبني") + 3) -- 3 (الافتراضي)

-- table.concat بدل حلقات
local words = { "أهلاً", "بك", "يا", "بطل" }
print(table.concat(words, " ")) -- أهلاً بك يا بطل`,
    tags: ["تحويل", "واع", "انواع", "tonumber", "tostring", "رقم", "نص", "دمج", "ضم", "symbol", "concat", "type", "coercion", "تحويل الانواع"],
  },
  {
    id: "bitwise",
    kind: "lesson",
    level: "متقدم",
    title: "العمليات على البت bitwise في لواو",
    summary: "& و | و ~ و << و >> لتخزين عدة أعلام في رقم واحد وضغط البيانات.",
    content: [
      "لواو تدعم عمليات البت مباشرة: & (و)، | (أو)، ~ (معاكس/قيمة مع تجاهل)، << و >> (إزاحة). مفيدة جداً عند تخزين عدة أعلام (permissions) كنقطة ثنائية واحدة بدل أحرف/عدّة قيم.",
      "نمط الأعلام: عرّف كل صلاحية كقوة من رقم 2 (1, 2, 4, 8...). امزج بجمع | ، واحفظها كلها في عدد واحد، ثم افحص الصلاحية بـ (flags & FLAG) ~= 0 ، وأضِف/أزل صلاحية بـ flags = flags | FLAG أو flags = flags & ~FLAG.",
      "الإزاحة مفيدة للضغط: لتخزين إحداثيات (x, y, z) من 0-1023 في عدد واحد ادمجها بـ (x << 20) | (y << 10) | z ثم استخرج كل بُعد بتحويل معيّن. كل إزاحة 10 بت تعطي مجال 1024 قيمة.",
      "البديل المقروء أكثر في لواو: استخدام جدول booleans مثل { admin = true }. البت تبقى الأسرع والأقل حجماً عند الإرسال فوق الريموتات أو الحفظ في DataStore.",
    ],
    code: `-- أعلام صلاحيات
local CAN_FLY = 2 ^ 0   -- 1
local ADMIN   = 2 ^ 1   -- 2
local VIP     = 2 ^ 2   -- 4

local flags = ADMIN | VIP      -- 6

local isAdmin = (flags & ADMIN) ~= 0
local canFly  = (flags & CAN_FLY) ~= 0
print(isAdmin, canFly)         -- true  false

-- إضافة ثم إزالة صلاحية
flags = flags | CAN_FLY
print((flags & CAN_FLY) ~= 0)  -- true
flags = flags & ~CAN_FLY
print((flags & CAN_FLY) ~= 0)  -- false

-- ضغط إحداثيات صغيرة في عدد واحد
local function pack(x, y, z)
    return (x << 20) | (y << 10) | z
end
local function unpack(n)
    return n >> 20, (n >> 10) & 1023, n & 1023
end
local packed = pack(5, 9, 3)
local x, y, z = unpack(packed)
print(x, y, z)                 -- 5  9  3`,
    tags: ["بت", "بتات", "bitwise", "علامات", "صلاحيات", "اذن", "ازاحة", "ضغط", "flags", "permissions", "وانارة", "bit", "binary", "ثنائي"],
  },
  {
    id: "ternary-if-expr",
    kind: "lesson",
    level: "متوسط",
    title: "if تعبيري وقيم الشرط في سطر واحد",
    summary: "if ... then ... else كتعبير يعيد قيمة، أوضح وأأمن من الخدع القديمة.",
    content: [
      "لواو توفّر شرطاً تعبيرياً: local v = if cond then a else b — يعيد قيمة مباشرة دون write if كامل. أرسله مكان أي قيمة: في إرجاع، تعيين، وحتى دمج نص.",
      "هذا أفضل من الخدعة القديمة (cond and a or b) لأن الأخيرة تنكسر عندما تكون القيمة الصحيحة كاذبة (nil أو false) — فتعيد الفرع البديل. التعبير if ... else يتعامل مع القيم النيلكي بصدق.",
      "يمكن أن تكون الفروع أي تعبير: استدعاء دالة، حساب، حتى كتلة جداول. الشرط سطر واحد لكن الفروع قد تكون طويلة — الوضوح فوق الاختصار.",
      "لا تخلط بين التعبير التلقائي if/else وبين الجملة الشرطية الكاملة: التعبير لا يحتاج كلمة then في بداية تعيين، لكن عند الكتابة في سطر مبكر انتبه ألا تترك تعبير الصياغة ناقصاً قبل نهاية الفرع؛ فكل تعبير يعيد قيمة واحدة فقط.",
    ],
    code: `local isRaining = true
local gear = if isRaining then "مظلة" else "قبعة"
print(gear)                 -- مظلة

local function rating(score)
    return if score >= 90 then "نجمي" else "عادي"
end
print(rating(95))           -- نجمي

-- استخدمه داخل النص مباشرة
local level = "مبتدئ"
local title = if level == "مبتدئ" then "بطل ناشئ" else "بطل محترف"
print("اللقب: " .. title)   -- اللقب: بطل ناشئ

-- متعدد الفروع بإعادة سطرين؟
local hp = 30
local status =
    if hp <= 0 then "سقط"
    elseif hp < 50 then "مصاب"
    else "سليم"
print(status)               -- مصاب`,
    tags: ["شرط", "شروط", "تعبيري", "ثلاثي", "if", "else", "elseif", "قيمة", "اختصار", "سطر", "ternary", "expression", "condition", "اختصار شرط"],
  },
  {
    id: "deep-equality",
    kind: "lesson",
    level: "متوسط",
    title: "المساواة العميقة بين الجداول",
    summary: "لماذا {1,2} ~= {1,2}، وكيف تقارن المحتوى فعلياً بعودية آمنة.",
    content: [
      "عامل == على جدولين يقارن المراجع لا المحتوى: {1, 2} == {1, 2} تُرجع false رغم تطابق المحتوى. نفس السلوك للدوال — المقارنة تسأل \"هل هما نفس الكائن في الذاكرة؟\".",
      "عند مقارنة محتوى ما خُزِّن فعلاً نكتب دالة deepEqual تنتقل بالمفاتيح بالتدرج: تقارن عدد المفاتيح وحقولها المتناظرة بعودية، وتعيد false عند أول اختلاف، وتحترم الندرة المتضمنة (مصفوفة داخل جدول) حتى النهاية — مع انتباه أن المراجع الدائرية قد تعلقها.",
      "عادة ما نقارن حقلاً معيناً لا الجدول كاملاً: if a.score == b.score. وأشهر تطبيق واقعي هو التغيير في DataStore — لو قارنت نسخين اكتشفت هل تغيّر الحفظ؟ لكن الاهتمام عادة يكون بمفاتيح محددة.",
      "للتحقق من التشابه دون كتابة مقارنة: حوّل إلى JSON واستقارن السلاسل — لكن انتبه أن ترتيب المفاتيح قد يختلف وربما تتشابه قيم مختلفة الشكل (مثل أرقام كبيرة).",
    ],
    code: `print({ 1, 2, 3 } == { 1, 2, 3 })    -- false (مراجع مختلفة)

local function deepEqual(a, b)
    if a == b then return true end
    if typeof(a) ~= "table" or typeof(b) ~= "table" then return false end
    local seenKeys = {}
    for k, v in pairs(a) do
        seenKeys[k] = true
        if b[k] == nil then return false end
        if not deepEqual(v, b[k]) then return false end
    end
    for k in pairs(b) do
        if seenKeys[k] == nil then return false end
    end
    return true
end

local save1 = { coins = 90, inv = { "سيف", "درع" } }
local save2 = { coins = 90, inv = { "سيف", "درع" } }
print(deepEqual(save1, save2))       -- true

-- مقارنة محددة بالحقول غالباً أسهل
print(save1.coins == save2.coins)    -- true`,
    tags: ["مساواة", "مقارنة", "تساوي", "== ", "جدول", "جداول", "عميقة", "محتوى", "مرجع", "deep", "equal", "equality", "compare", "comparison"],
  },
  {
    id: "os-time",
    kind: "lesson",
    level: "متوسط",
    title: "مكتبة os: الوقت والساعة والتوقيت",
    summary: "os.time و os.clock و os.date لقياس الزمن والتاريخ ومؤقتات الأداء.",
    content: [
      "os.time() ترجع عدد الثواني منذ بداية العصر (Unix epoch) — ممتاز لحفظ تاريخ آخر دخول أو حساب فارق زمني فعلي للمكافآت اليومية: الفرق بين مرتين = seconds بمقدار 86400 لليوم.",
      "os.clock() ترجع وقت CPU المستهلك في البرنامج — استخدمها لقياس أداء القطعة الحساسة: سجّل القيمة قبل العمل وبعده واطرح. لا تستخدمها لمعرفة وقت حقيقي بل لقياس الاستهلاك.",
      "os.date(\"تنسيق\") تنسّق الوقت للقراءة: %Y سنة، %m شهر، %d يوم، %H ساعة، %M دقيقة، %S ثانية. بدون وسائط ترجع جدولاً تفصيلياً بكل الحقول — مفيد للحسابات.",
      "تحذير روبلكس: os.clock على الخادم تحسب زمن الواقع العلني تقريباً، ويمكن اختلاق os.time() من الكلينت — للمكافآت اليومية احسبها سيرفس فقط ولا تثق بقيمة العميل.",
    ],
    code: `local t0 = os.clock()
local sum = 0
for i = 1, 1000 do sum += i end
print(string.format("الحلقة استغرقت %.4f ثانية", os.clock() - t0))

-- تاريخ آمن للسيرفر
local stamp = os.time()
os.date("%Y/%m/%d %H:%M")   -- "2026/09/08 14:05"

-- مكافأة يومية: الفرق بالثواني
local lastVisit = stamp - 25 * 3600  -- زيارة الأمس
local DAY = 86400
if (stamp - lastVisit) >= DAY then
    print("جديدة المكافأة اليومية تعمل!")
end`,
    tags: ["وقت", "الوقت", "زمن", "تاريخ", "clock", "time", "os", "ساعة", "ثانية", "يوم", "daily", "مكافأة", "توقيت", "مسافة", "epoch"],
  },
  {
    id: "nil-safety",
    kind: "lesson",
    level: "مبتدئ",
    title: "التعامل الآمن مع nil: افحص قبل الوصول",
    summary: "قراءة مفاتيح غير موجودة، وفحوص الدخول، وقيم افتراضية بدون انهيار.",
    content: [
      "قراءة مفتاح غير موجود في جدول تُرجع nil بهدوء — لا تنهار. لكن الوصول لمفتاح داخل قيمة nil نفسها ينفجر: data.player.xp ستنهار إن لم يكن data.player موجودة. القاعدة: لا تنقض من مربع غير موجود.",
      "ارفع عادة الفحص: if data.player then ... واختصر بـ data and data.player and data.player.xp (يبحث فوق كل منهما، لكن يكمل فقط إن وُجد). في لواو لا يوجد بادئ \"?.\" كـ JS بعد.",
      "الطرق العميقة الآمنة: pre فحص nil يدوي، أو تعيين افتراضي عند البناء: data = data or {}. جرّب حتى لا تبقى مفتاح في روبلكس فريق server غير مضبوط جيداً.",
      "من الأخطاء الشائعة الجذر النص: الوصول إلى جزء غير محمَّل بعد يُرجع nil مؤقتاً في StreamingEnabled — لهذا WaitForChild موجود أصلاً، وفي النهاية بعد اكتمال التحميل يصبح الوصول آمناً.",
    ],
    code: `local data = { player = { xp = 250 } }

print(data.player.xp)            -- 250

-- بدون فحص: data.missing.xp ستنهار? انظر:
-- local bad = data.missing.xp     -- خطأ: محاولة فهرسة nil

-- الأسلوب الآمن المتسلسل
local xp = (data and data.player and data.player.xp) or 0
print(xp)                        -- 250

-- قيمة افتراضية عند غياب كامل
local config = {}
local volume = config.volume or 0.5
print(volume)                    -- 0.5

-- تعيين جذر آمن
local settings = settings or {}
settings.graphics = settings.graphics or {}`,
    tags: ["nil", "آمن", "امان", "فحص", "قيمة", "افتراضية", "مفتاح", "جدول", "فارغ", "مفقود", "missing", "safety", "defensive", "default", "null"],
  },
  {
    id: "table-sort-custom",
    kind: "lesson",
    level: "متوسط",
    title: "table.sort بمعيار مخصص وفرز المرتبات",
    summary: "فرز الجداول حسب أي حقل (نقاط، اسم، ملكية) مع دالة مقارنة.",
    content: [
      "table.sort(جداول) تفرز قيم رقمية/نصية أساسية تصاعدياً. للجداول المتداخلة (مثل قوائم لاعبين) مرر دالة مقارنة ثانية تُرجع صحيحاً عندما يكون العنصر الأول قبل الثاني في الترتيب المطلوب.",
      "مثال مباريات النقاط: table.sort(players, function(a, b) return a.score > b.score end). انتبه أن الدالة يجب أن تكون ترتيبها متسقاً — a قبل b أم b قبل a — اللاإتساق يجعل الفرز يرمي خطأ \"invalid order function\".",
      "لا تخزن نتيجة table.sort — تفرز الجدول نفسه في المكان (in-place) وترجع nil. إن أردت نسخة محفوظة انسخ أولاً بـ clone ثم افرز النسخة.",
      "أخطاء شائعة: تمرير أعداد بدل جداول، مقارنة مساحات بقيم متساوية تُرجع false بالاتجاهين، والفرز ليس مستقراً — عناصر متساوية قد تتبادل أماكنها.",
    ],
    code: `local players = {
    { name = "زيد", score = 10 },
    { name = "أمل", score = 30 },
    { name = "سامي", score = 20 },
}

-- تنازلي حسب النقاط
table.sort(players, function(a, b)
    return a.score > b.score
end)
for _, p in ipairs(players) do
    print(p.name, p.score)
end
-- أمل 30 / سامي 20 / زيد 10

-- تصاعدي حسب الاسم
table.sort(players, function(a, b)
    return a.name < b.name
end)

-- فرز مصفوفة أرقام أساسية
local nums = { 5, 2, 9, 1 }
table.sort(nums)
print(table.concat(nums, ", "))    -- 1, 2, 5, 9`,
    tags: ["جدول", "ترتيب", "فرز", "جدول", "sort", "تبويب", "نقاط", "اكثر", "اقل", "تصاعدي", "تنازلي", "leaderboard", "order", "sorting", "مقارنة"],
  },
  {
    id: "operator-precedence",
    kind: "lesson",
    level: "مبتدئ",
    title: "أولويات العمليات: كيف يحسب لواو تعبيرك؟",
    summary: "ترتيب الحسابات والمقارنات والمنطق، وفوائد الأقواس عند الشك.",
    content: [
      "لواو تحسب بالترتيب التقليدي: الأقواس أولاً، ثم الأُس ^ من اليمين لليسار، ثم الضرب والقسمة والباقي، ثم الجمع والطرح، ثم الدمج \"..\" (يمين لليسار)، ثم المقارنات، ثم and ثم or ثم not بأعلى أولوية فوقها.",
      "نظراً لأن and أعلى من or: a or b and c تُحسب a or (b and c). لهذا في الشروط المعقدة ضع أقواساً دائماً — الوضوح أهم من تذكر جدول الأولويات بدقة.",
      "الأُس يتسلسل من اليمين: 2^3^2 = 2^(3^2) = 512 وليس (2^3)^2. والدمج أيضاً يمين لليسار: \"أ\" .. \"ب\" .. \"ج\" تُبنى من اليمين.",
      "not أعلى من الحساب في لواو؟ لا: not يعمل على تعبير كامل بجانبه. فـ not 1 == ... غامض — ضع أقواساً: not (a == b) إن أردت نفي مقارنة.",
    ],
    code: `print(1 + 2 * 3)        -- 7
print((1 + 2) * 3)      -- 9
print(2 ^ 3 ^ 2)        -- 512 (يمين لليسار)

-- and قبل or
print(true or false and false)   -- true  (تساوي true or (false and false))
print((true or false) and false) -- false

-- not على تعبير كامل
print(not 1 + 1 == 2)    -- غامض — استخدم أقواساً
print(not (1 + 1 == 2))  -- false

-- الدمج يبني من اليمين
local msg = "أ" .. "ب" .. "ج"
print(msg)               -- أبج`,
    tags: ["اولوية", "عمليات", "اقواس", "حساب", "ترتيب", "قبل", "وراء", "precedence", "operator", "parentheses", "and", "or", "not", "اولويه"],
  },
  {
    id: "metatable-pitfalls",
    kind: "lesson",
    level: "متوسط",
    title: "فخاخ الميتاتيبل والتسمية: أخطاء يقع فيها المبتدئون",
    summary: "لماذا t.__index = f لا يعمل، ولماذا أسماء المتغيرات يجب أن تكون لاتينية، وما علاقة المراجع بذلك.",
    content: [
      "أشهر خطأ في الميتاتيبل: كتابة الجدول.__index = دالة ثم توقع أن تلتقط المفاتيح الناقصة. الحقيقة أن __index ميتاميثود لا يعمل كخانةٍ عادية — يجب ربطه عبر الميتا تيبل نفسه بدالة setmetatable وعندها فقط يعمل: setmetatable(الجدول, { __index = دالة }). بدون setmetatable، يحفظ الجدول الدالة كقيمةٍ عادية ويبقى المفتاح الناقص يعيد nil.",
      "نتيجة هذا الخطأ العملية: t.missing يرجع nil وليس رسالتك، وأسوأ من ذلك حلقة pairs ستعرض خانة __index كخانةٍ عادية لأنها مخزنة فعلاً في الجدول — فتوحي أن نظامك يعمل وهو لا يعمل.",
      "خطأ شائع ثانٍ مستقل تماماً: التسمية. لواو روبلكس يقبل في أسماء المتغيرات والدوال فقط a-z و A-Z و _ والأرقام (لا رقم في البداية) — أي اسمٍ عربي مثل local العدد = 10 يرفضه المترجم فوراً ويؤلف Syntax Error في الاستوديو. الحل أسماء إنجليزية أو لاتينية واضحة: local count = 10.",
      "الأخطاء الثلاثة يفسرها فهم مرجعية الجداول: عند تمرير جدولٍ لدالة تمرر المرجع لا نسخة، فأي تعديلٍ داخل الدالة يظهر خارجها لأن الكائنين مرجعٌ واحد في الذاكرة. النسخ الحقيقي الوحيد عبر table.clone، والميتاتيبل يربط سلوك الجدول نفسه لا نسخةً منه.",
    ],
    code: `-- الخطأ 1 و 2: __index كخانة عادية (لا يعمل)
local t = { num = 10 }
t.__index = function(_, key) return "لا يوجد: " .. key end
print(t.missing)  --> nil  (وليس الرسالة!)

-- الصحيح: ربطه عبر الميتا تيبل
local ok = {}
setmetatable(ok, {
	__index = function(_, key)
		return "لا توجد خانة: " .. tostring(key)
	end,
})
print(ok.missing) --> "لا توجد خانة: missing"
for k, v in pairs(ok) do print(k, v) end  --> num فقط (نظيفة)

-- الخطأ 3 (تسمية): أسماء لاتينية فقط!
local count = 10
local function addOne(t)
	t.num += 1    -- المرجع: التغيير يظهر خارج الدالة
end
addOne(t)
print(t.num)      --> 11

-- نسخ حقيقي فقط بـ table.clone
local copy = table.clone(t)
copy.num = 99
print(t.num, copy.num)  --> 11  99  (كلاهما مستقل)`,
    tags: ["ميتاتيبل", "setmetatable", "__index", "فخاخ", "اخطاء", "اخطاء شائعه", "تسميه", "اسم متغير", "عربي", "latin", "identifiers", "مراجع", "نسخ", "clone", "table.clone", "syntax", "خطا شائع"],
  },
];