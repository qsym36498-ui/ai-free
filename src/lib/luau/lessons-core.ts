import type { KnowledgeDoc } from "./types";

/**
 * المنهاج الأساسي — لغة Luau من الصفر حتى الاحتراف.
 * كل درس مكتوب يدوياً: شرح + تفاصيل صغيرة + كود جاهز.
 */
export const LANGUAGE_LESSONS: KnowledgeDoc[] = [
  {
    id: "intro-luau",
    kind: "lesson",
    level: "مبتدئ",
    title: "مقدمة: ما هي Luau ولماذا تختلف عن Lua؟",
    summary: "الفرق بين Lua و Luau، وأين تكتب السكربتات في Roblox Studio.",
    content: [
      "Luau هي نسخة مطوّرة من لغة Lua 5.1 صنعتها روبلوكس خصيصاً لألعابها: أسرع، أكثر أماناً، وفيها نظام أنواع (Type Checking) وتدرّج عددي أفضل.",
      "أهم الفروقات عن Lua الكلاسيكية: كلمة continue داخل الحلقات، العوامل المركبة مثل += و -= و *= و ..=، الدوال النوعية (type)، والمكتبة الحديثة task بدل الانتظار القديم.",
      "أنواع السكربتات ثلاثة: Script يعمل على السيرفر، و LocalScript يعمل على جهاز اللاعب (الكلينت)، و ModuleScript وحدة كود مشتركة تستدعيها بـ require.",
      "تكتب السكربتات في نافذة السكربت داخل Roblox Studio، وكل شيء في اللعبة يوجد داخل شجرة الكائنات التي جذرها game.",
    ],
    code: `-- أول سكربت لك: اطبع رسالة في نافذة Output
print("مرحباً من عالم روبلوكس!")

local name = "لاعبة"
print("أهلاً " .. name .. " — لنبرمج معاً")

-- العوامل المركبة موجودة في لواو
local coins = 10
coins += 5        -- تساوي coins = coins + 5
print(coins)      -- 15`,
    tags: ["مقدمة", "لواو", "لوا", "روبلكس", "سكربت", "فرق", "بداية", "luau", "lua", "intro", "بدايه"],
  },
  {
    id: "variables",
    kind: "lesson",
    level: "مبتدئ",
    title: "المتغيرات وأنواع البيانات الأساسية",
    summary: "local، الأنواع: رقم، نص، منطقي، nil، وكيف تتحقق من النوع.",
    content: [
      "المتغير صندوق له اسم يحفظ قيمة. في لواو ننشئه دائماً بكلمة local إلا إذا كان هناك سبب قوي للعكس — المتغيرات العامة (بدون local) مصدر أخطاء شائع جداً.",
      "الأنواع الأساسية: number (أرقام مثل 7 أو 3.14)، string (نص بين علامتي تنصيص)، boolean (true أو false)، و nil بمعنى لا شيء — المتغير غير الموجود قيمته nil.",
      "الدالة ()\u200btype ترجع اسم النوع كنص، وهي مفيدة جداً عند فحص القيم القادمة من أماكن غير مضمونة.",
      "تفصيلة صغيرة مهمة: النص الفارغ \"\" ليس nil، والرقم 0 ليس false — في لواو القيمة الوحيدة التي تُعامل ككذب هي nil و false فقط.",
    ],
    code: `local playerName = "زيد"      -- string
local health = 100            -- number
local speed = 16.5            -- number أيضاً (كسر)
local isAlive = true          -- boolean
local target = nil            -- لا شيء

print(type(playerName))  -- string
print(type(health))      -- number
print(type(isAlive))     -- boolean
print(type(target))      -- nil

-- إعادة التسمية والتعديل
health -= 25
print(health)  -- 75`,
    tags: ["متغيرات", "متغير", "انواع", "نوع", "رقم", "نص", "local", "nil", "boolean", "string", "number", "variables", "types"],
  },
  {
    id: "strings",
    kind: "lesson",
    level: "مبتدئ",
    title: "النصوص بالتفصيل: الدمج والتنسيق والأنماط",
    summary: "string.format و string.find و string.sub و string.split والـ string interpolation.",
    content: [
      "تدمج النصوص بعامل .. أو الأجمل منها: القوالب مع الأقواس — في لواو يمكنك كتابة \\`مرحباً {name}\\` مباشرة داخل نص بعلامات القالب الخلفية.",
      "الدالة string.format تشبه الطباعة المنسقة: %d للأرقام الصحيحة، %s للنصوص، %.2f لرقم بمنزلتين عشريتين.",
      "من الدوال المهمة: #نص يرجع الطول، و string.sub(نص، بداية، نهاية) يقص جزءاً، و string.split(نص، فاصل) يفككه إلى جدول، و string.find يبحث عن نمط ويرجع مواضع البداية والنهاية.",
      "تفصيلة يغفلها المبتدئون: ترقيم لواو يبدأ من 1 وليس 0 — أول حرف في النص موضعه 1.",
    ],
    code: `local player, coins = "سارة", 1250

-- الطريقة الحديثة المفضلة (string interpolation)
print(\`اللاعبة {player} تملك {coins} عملة\`)

-- الطريقة الكلاسيكية
print(string.format("%s يملك %d عملة", player, coins))

print(#"سلام")                     -- 4
print(string.sub("Roblox", 1, 3))  -- Rob
print(string.upper("luau"))        -- LUAU

local parts = string.split("نار،ماء،هواء", "،")
print(parts[2])  -- ماء

local start, finish = string.find("أحب البرمجة", "البرمجة")
print(start, finish)  -- 7  13`,
    tags: ["نص", "نصوص", "سترنج", "دمج", "تنسيق", "قص", "بحث", "سترينج", "string", "format", "split", "find", "sub", "نصوصيه"],
  },
  {
    id: "math",
    kind: "lesson",
    level: "مبتدئ",
    title: "الحساب والرياضيات: math والعمليات",
    summary: "الجمع والطرح والقسمة والباقي والأُس، ودوال مكتبة math الأساسية.",
    content: [
      "العمليات الأساسية: + جمع، - طرح، * ضرب، / قسمة، ^ أُس، و % باقي القسمة — الباقي مفيد جداً لمعرفة هل العدد زوجي (ن % 2 == 0).",
      "قائمة الأولويات مثل الرياضيات: الأقواس ثم الأُس ثم الضرب والقسمة ثم الجمع والطرح. عند الشك ضع أقواساً.",
      "مكتبة math فيها: math.floor للتقريب نحو الأسفل، math.ceil نحو الأعلى، math.round للأقرب، math.abs للقيمة المطلقة، math.random لرقم عشوائي، و math.clamp لحصر قيمة بين حدين (موجودة في لواو وليست في لوا الأصلية).",
      "لأرقام عشوائية صحيحة بين حدين: math.random(أدنى، أقصى) شامل الطرفين. لعدد عششري بين 0 و1 استدعها بلا حدود، ويفضل أولاً تهيئة المولّد بـ math.randomseed(os.time()).",
    ],
    code: `print(7 + 3, 7 - 3, 7 * 3, 7 / 3)  -- 10  4  21  2.333
print(2 ^ 10)      -- 1024
print(10 % 3)      -- 1 (الباقي)

print(math.floor(3.9))   -- 3
print(math.ceil(3.1))    -- 4
print(math.round(3.5))   -- 4
print(math.abs(-12))     -- 12
print(math.clamp(15, 0, 10))  -- 10 (حُصرت بين 0 و10)

math.randomseed(os.time())
print(math.random(1, 100))   -- رقم صحيح من 1 حتى 100
print(math.random())         -- عشري بين 0 و 1`,
    tags: ["رياضيات", "حساب", "جمع", "طرح", "ضرب", "قسمه", "باقي", "عشوائي", "تقريب", "ماث", "math", "random", "عمليات"],
  },
  {
    id: "conditions",
    kind: "lesson",
    level: "مبتدئ",
    title: "الشروط: إذا وإلا ومتى تتخذ قرارات",
    summary: "if / elseif / else، عوامل المقارنة، و and / or / not.",
    content: [
      "جملة if تفحص شرطاً وتنفذ الكود فقط إذا كان صحيحاً. يمكن إضافة elseif لفحوصات إضافية متسلسلة، و else لما تبقى.",
      "عوامل المقارنة: == يساوي، ~= لا يساوي، > أكبر، < أصغر، >= أكبر أو يساوي، <= أصغر أو يساوي. انتبه: المقارنة بين نص ورقم لا تتحقق أبداً.",
      "العوامل المنطقية: and (كلاهما)، or (أحدهما)، not (عكس). تسلسلها: الأقواس ثم not ثم and ثم or.",
      "حيلة لواو الشهيرة: العبارة (شرط و أ أو ب) تعمل غالباً مثل الشرط الثلاثي في لغات أخرى، لكنها تنكسر إذا كانت قيمة أ تساوي false أو nil — فانتبه.",
    ],
    code: `local health = 40
local level = 12

if health <= 0 then
	print("انتهت اللعبة")
elseif health < 30 then
	print("خطر! اهرب أو اشرب جرعة")
else
	print("الوضع جيد")
end

-- عوامل منطقية
if level >= 10 and health > 20 then
	print("تستطيع دخول الزنزانة")
end

-- اختيار قيمة باختصار
local weapon = (level >= 10 and "سيف") or "عصا"
print(weapon)  -- سيف`,
    tags: ["شروط", "شرط", "اذا", "إذا", "تحقق", "قرار", "مقارنه", "منطق", "if", "else", "elseif", "and", "or", "not", "conditions"],
  },
  {
    id: "loops",
    kind: "lesson",
    level: "مبتدئ",
    title: "الحلقات: التكرار بأشكاله الثلاثة",
    summary: "while و for العدّاد و for على الجداول و repeat حتى، مع break و continue.",
    content: [
      "حلقة while تكرر ما دام الشرط صحيحاً. خطر النسيان: إذا لم يتغير الشرط داخلها تتحول إلى حلقة لا نهائية تجمد السكربت.",
      "حلقة العدّاد: for i = بداية، نهاية، خطوة. الخطوة اختيارية وقيمتها الافتراضية 1، ويمكن أن تكون سالبة للعد التنازلي.",
      "للمرور على جدول: for فهرس، قيمة in ipairs(الجدول)، أو for مفتاح، قيمة in pairs(الجدول) لأي مفاتيح.",
      "توقف فوري بالكلمة break، وتخطي الدورة الحالية بالكلمة continue — هذه الأخيرة ميزة من لواو غير موجودة في لوا الأصلية. وفي روبلوكس للانتظار داخل الحلقات استخدم دائماً task.wait() وليس الانتظار القديم بدون وسيط.",
    ],
    code: `-- عد تصاعدي
for i = 1, 5 do
	print("الدورة رقم " .. i)
end

-- عد تنازلي بخطوة -1
for i = 5, 1, -1 do
	task.wait(0.5)
	print(i)
end

-- while مع شرط يتغير
local energy = 3
while energy > 0 do
	print("طاقة متبقية: " .. energy)
	energy -= 1
	task.wait(1)
end

-- break و continue
for i = 1, 10 do
	if i == 3 then continue end  -- تخطي 3
	if i == 8 then break end     -- أوقف عند 8
	print(i)
end`,
    tags: ["حلقه", "حلقات", "تكرار", "كرر", "عد", "دوره", "لانهائي", "لانهائيه", "while", "for", "repeat", "break", "continue", "loops"],
  },
  {
    id: "tables-arrays",
    kind: "lesson",
    level: "مبتدئ",
    title: "الجداول 1: المصفوفات (قوائم مرتبة)",
    summary: "إنشاء القوائم، الإضافة والحذف، الطول، والترتيب.",
    content: [
      "الجدول أهم بنية بيانات في لواو — هو القائمة والصندوق المتعدد والخريطة كلها في شيء واحد. تنشئه بقوسين معقوفين {}، والفهرسة تبدأ من 1.",
      "الدوال الأساسية على القوائم: table.insert لإضافة عنصر (في النهاية أو بموضع محدد)، و table.remove لحذف وإرجاع العنصر المحذوف، و #جدول للطول، و table.sort للترتيب، و table.find لإرجاع موضع أول ظهور لقيمة.",
      "خطأ شائع: المرور على قائمة وحذف عناصر منها للأمام — الفهارس تنزلق وستتخطى عناصر. الحل: الحذف من النهاية للبداية، أو بناء قائمة جديدة.",
      "تفصيلة صغيرة: #جدول تعطي الطول الصحيح للقوائم المتسلسلة فقط؛ إذا كان عندك مفاتيح متناثرة أو nil في المنتصف فالنتيجة غير مضمونة.",
    ],
    code: `local fruits = {"تفاحة", "موزة", "عنب"}

print(fruits[1])      -- تفاحة
print(#fruits)        -- 3

table.insert(fruits, "مانجا")          -- إضافة في النهاية
table.insert(fruits, 2, "كيوي")        -- إضافة بالموضع 2
print(fruits[2])      -- كيوي

local removed = table.remove(fruits, 1) -- حذف الأول
print(removed)        -- تفاحة

print(table.find(fruits, "عنب"))  -- موضع العنب

table.sort(fruits)
for index, fruit in ipairs(fruits) do
	print(index, fruit)
end`,
    tags: ["جدول", "جداول", "مصفوفه", "قائمه", "ترتيب", "اضافه", "حذف", "طول", "فهرس", "اراي", "table", "array", "insert", "remove", "sort", "قوائم"],
  },
  {
    id: "tables-dicts",
    kind: "lesson",
    level: "متوسط",
    title: "الجداول 2: القواميس (مفاتيح وقيم)",
    summary: "تخزين أزواج مفتاح/قيمة، المرور بـ pairs، والوصول الآمن.",
    content: [
      "الجدول القاموس يربط أسماء بقيم: مثل بطاقة لاعب فيها الاسم والذهب والمستوى. تكتب المفتاح = القيمة داخل {}، وإذا كان المفتاح كلمة صالحة تكتبه بلا علامات تنصيص.",
      "للقراءة: جدول[\"مفتاح\"] أو جدول.مفتاح إذا كان المفتاح نصاً صالحاً كمعرّف. وللمرور على كل الأزواج استخدم pairs — ترتيب المفاتيح غير مضمون فلا تعتمد عليه.",
      "للحذف ضع قيمة المفتاح = nil. وللتحقق من وجود مفتاح: قارن القيمة بـ nil أو استخدم جدول[المفتاح] ~= nil.",
      "تفصيلة احترافية: يمكن جعل الجداول متداخلة (جدول داخل جدول) لبناء هياكل معقدة مثل بيانات حفظ اللاعب — هذا أساس أنظمة الحفظ في روبلوكس.",
    ],
    code: `local playerData = {
	name = "ليلى",
	gold = 500,
	level = 7,
	inventory = {"سيف", "درع"},
}

print(playerData.name)       -- ليلى
print(playerData["gold"])    -- 500

playerData.gold += 250        -- تعديل
playerData.guild = "الصقور"  -- إضافة مفتاح جديد

-- المرور على كل المفاتيح
for key, value in pairs(playerData) do
	print(key, "=>", value)
end

-- وصول آمن لمفتاح قد لا يوجد
local gem = playerData.gems
if gem == nil then
	print("لا يوجد نظام جواهر بعد")
end`,
    tags: ["قاموس", "مفاتيح", "مفتاح", "قيمه", "قيم", "ديكت", "بينات", "حفظ", "جدول", "pairs", "dictionary", "key", "value", "متداخله"],
  },
  {
    id: "functions",
    kind: "lesson",
    level: "مبتدئ",
    title: "الدوال: صناعة أوامرك الخاصة",
    summary: "تعريف الدوال، الوسائط، الإرجاع، والدوال المحلية المجهولة.",
    content: [
      "الدالة قطعة كود مسماة تناديها متى شئت: تعرفها بـ local function الاسم(وسائط) ثم تناديها بالاسم مع أقواس. الوسائط قيم تدخلها، و return ترجع نتيجة وتوقف الدالة فوراً.",
      "يمكن إرجاع أكثر من قيمة مفصولة بفواصل، ويمكن تمرير دوال كوسائط — هذا الأساس الذي تُبنى عليه الأحداث في روبلوكس مثل ربط دالة بحدث لمس.",
      "إذا ناديت دالة بدون وسيط فقيمته داخلها تساوي nil، وإذا أرجعت أكثر مما تستقبل يُهمل الباقي. الدالة بلا return ترجع nil.",
      "تفصيلة مهمة للأداء: الدوال المحلية (المعرفة بـ local) أسرع من العامة في لواو — اجعل كل شيء محلياً قدر الإمكان.",
    ],
    code: `local function greet(name)
	print("أهلاً يا " .. name .. "!")
end
greet("عمر")

local function add(a, b)
	return a + b
end
print(add(3, 4))  -- 7

-- إرجاع قيمتين معاً
local function divide(a, b)
	if b == 0 then
		return nil, "القسمة على صفر ممنوعة!"
	end
	return a / b, "نجحت العملية"
end

local result, message = divide(10, 2)
print(result, message)

-- دالة مجهولة تُمرَّر كوسيط (أسلوب روبلوكس في الأحداث)
local function onTouched(hit)
	print("لمسنا: " .. hit.Name)
end`,
    tags: ["داله", "دوال", "وظيفه", "استدعاء", "وسائط", "ارجاع", "معرف", "فنكشن", "function", "return", "arguments", "local function"],
  },
  {
    id: "scope-closures",
    kind: "lesson",
    level: "متوسط",
    title: "النطاقات والإغلاقات: أين تعيش متغيراتك؟",
    summary: "النطاق المحلي والعام، بلوكات do، والدوال التي تتذكر متغيراتها.",
    content: [
      "كل متغير يعيش داخل نطاق: المتغير المحلي (الذي بدأ بـ local) يُرى فقط داخل البلوك الذي وُلد فيه — البلوك هو جسم دالة أو حلقة أو شرط أو do ... end.",
      "المتغير العام يُرى من كل مكان، وهذا خطر: قد يتعارض مع اسم في مكان آخر، وأبطأ قليلاً في لواو. القاعدة الذهبية: كل شيء محلي إلا ما اضطررت.",
      "الإغلاق (Closure): دالة تستخدم متغيراً محلياً من نطاق أوسع — المتغير لا يموت بل يبقى حياً ما دامت الدالة موجودة. بهذه الطريقة تصنع عدادات وحالات خاصة لكل كائن.",
      "تفصيلة صغيرة: الظل (Shadowing) — إذا عرفت متغيراً محلياً بنفس اسم متغير خارجي، الداخلي يحجب الخارجي داخل بلوكه فقط.",
    ],
    code: `local function makeCounter()
	local count = 0  -- يعيش داخل هذا الإغلاق
	return function()
		count += 1
		return count
	end
end

local counterA = makeCounter()
local counterB = makeCounter()

print(counterA())  -- 1
print(counterA())  -- 2
print(counterB())  -- 1 (مستقل تماماً عن A)

-- مثال الظل
local x = "خارجي"
do
	local x = "داخلي"
	print(x)  -- داخلي
end
print(x)  -- خارجي`,
    tags: ["نطاق", "مجال", "اغلاق", "كلوجر", "ظل", "محلي", "عام", "بلوك", "متغيرات", "scope", "closure", "local", "global"],
  },
  {
    id: "error-handling",
    kind: "lesson",
    level: "متوسط",
    title: "معالجة الأخطاء: pcall و xpcall مثل المحترفين",
    summary: "اصطياد الأخطاء بدل انهيار السكربت، وإرجاع رسائل واضحة.",
    content: [
      "أي خطأ في سكربت يوقفه بالكامل من تلك النقطة — لهذا نغلف العمليات الخطرة بالدالة ()\u200bpcall: تنفذ الدالة وترجع قيمتين: نجاح (صحيح/خطأ) ثم النتيجة أو رسالة الخطأ.",
      "أهم استخدام في روبلوكس: استدعاءات الداتا ستور والاتصالات الشبكية قد تفشل مؤقتاً، فنفشلها داخل حلقة إعادة محاولة مع pcall — هكذا تُبنى أنظمة الحفظ المحترفة.",
      "لرفع خطأ يدوياً استخدم ()\u200berror مع رسالة — يوقف التنفيذ ويقفز لأقرب pcall. و assert تختصر فحص القيم: ترجع القيمة إن وجدت أو ترفع خطأ برسالتك.",
      "تفصيلة: ()\u200bxpcall مثل pcall لكنها تأخذ دالة معالجة تُنفذ لحظة الخطأ — مفيدة لتسجيل الأخطاء قبل أن تكمل اللعبة.",
    ],
    code: `local success, result = pcall(function()
	error("شيء ما انفجر هنا!")
end)

if not success then
	warn("أمسكنا الخطأ: " .. tostring(result))
end

-- محاولة مع إعادة تجربة (نمط أنظمة الحفظ)
local attempts = 0
local saved = false
while not saved and attempts < 3 do
	attempts += 1
	local ok = pcall(function()
		-- هنا تضع عملية خطرة مثل DataStore:SetAsync
		print("محاولة الحفظ رقم " .. attempts)
	end)
	saved = ok
	if not ok then task.wait(1) end
end

-- assert للتحقق السريع
local function giveCoins(player)
	assert(player ~= nil, "يجب تمرير لاعب!")
	print("أُعطي اللاعب " .. player.Name .. " عملات")
end`,
    tags: ["خطا", "اخطاء", "معالجه", "حمايه", "فشل", "اعاده", "بيكال", "اسرت", "خطاً", "خطأ", "خطاْ", "اخطاءْ", "اخطاءٌ", "اخطاءً", "اخطاءٍ", "خطأً", "pcall", "xpcall", "error", "assert", "try"],
  },
  {
    id: "typechecking",
    kind: "lesson",
    level: "متقدم",
    title: "نظام الأنواع في لواو: اكتب كوداً لا ينكسر",
    summary: "type تعريفات، توثيق الوسائط، وصرامة الأنواع في ستوديو.",
    content: [
      "لواو تضيف نظام أنواع تدريجياً: تكتب نوع كل وسيط وقيمة راجعة بعلامة النقطتين، ومحرر ستوديو يحذرك قبل التشغيل إذا خالفت الأنواع.",
      "الأنواع المدمجة أشهرها: number و string و boolean و nil و any (أي شيء) — وتراكيب مثل {عدد من الأرقام} للجداول و (نوع، نوع) -> مرجع للدوال.",
      "تعرف أنواعك الخاصة بكلمة ()\u200btype: مثلاً نوع اللاعب في روبلوكس هو Player، ويمكن صنع نوع مخصص لبطاقة سلاح أو بيانات حفظ.",
      "لتفعيل الفحص الكامل في ستوديو: من ملف السكربت نفسه أو من إعدادات الاستوديو اضبط Analysis على Strict. الأنواع لا تغير أداء اللعبة إطلاقاً — هي فحص وقت كتابة فقط.",
    ],
    code: `-- أنواع مخصصة
type Weapon = {
	name: string,
	damage: number,
	speed: number,
}

type PlayerData = {
	gold: number,
	level: number,
	inventory: { string },
}

-- دالة موثقة بالأنواع
local function createWeapon(name: string, damage: number): Weapon
	return {
		name = name,
		damage = damage,
		speed = 1,
	}
end

local sword = createWeapon("سيف النار", 35)
print(sword.damage)

-- دالة تقبل دالة كوسيط مع تحديد شكلها
local function repeatTask(times: number, action: () -> ()): ()
	for i = 1, times do
		action()
	end
end`,
    tags: ["انواع", "نوع", "تايب", "فحص", "ستركت", "توثيق", "صرامه", "تايب تشيك", "type", "types", "typing", "strict", "annotation"],
  },
  {
    id: "metatables",
    kind: "lesson",
    level: "متقدم",
    title: "الميتا تيبل: القوة الخفية خلف كل شيء",
    summary: "setmetatable و __index و __newindex و __call وباقي الميتاميثودز.",
    content: [
      "الميتا تيبل جدول يتحكم بسلوك جدول آخر: تربطهما بالدالة ()\u200bsetmetatable(الجدول، الميتا تيبل). أشهر حقل هو __index: عندما تطلب مفتاحاً غير موجود، ينظر لواو في __index قبل أن يرجع nil.",
      "بهذه الحيلة تُبنى الوراثة والبرمجة الكائنية بالكامل: اجعل __index يشير إلى جدول الأب، فيرث الابن كل دوال الأب.",
      "من الحقول المفيدة أيضاً: __newindex يعترض الكتابة على مفاتيح جديدة (مفيد للتحقق)، و __call يجعل الجدول قابلًا للنداء كأنه دالة، و __tostring يتحكم بشكل الطباعة، و __len يتحكم بعامل #.",
      "تفصيلة مهمة للأداء: الميتا تيبل يُفحص عند كل قراءة لمفتاح ناقص — لا تبالغ في تداخل سلاسل الوراثة، وجمّد الجداول الثابتة بـ ()\u200btable.freeze لحمايتها وتسريعها.",
    ],
    code: `local Animal = {}
Animal.__index = Animal

function Animal.new(species: string, sound: string)
	local self = setmetatable({}, Animal)
	self.species = species
	self.sound = sound
	return self
end

function Animal:speak()
	print(self.species .. " يقول: " .. self.sound)
end

-- كائن فرعي يرث من الحيوان
local Wolf = setmetatable({}, { __index = Animal })

function Wolf.new(name: string)
	local self = Animal.new("ذئب", "عواء")
	setmetatable(self, Wolf)
	self.name = name
	return self
end

function Wolf:howl()
	print(self.name .. " يعوي في الليل!")
end

local grey = Wolf.new("رمادي")
grey:speak()  -- موروثة من Animal
grey:howl()   -- خاصة بالذئب`,
    tags: ["ميتا", "ميتاتيبل", "وراثة", "وراثه", "كائنات", "اووب", "ميتاميثود", "اندكس", "ست ميتا", "metatable", "setmetatable", "__index", "oop", "inheritance", "كائن"],
  },
  {
    id: "modules",
    kind: "lesson",
    level: "متوسط",
    title: "الموديول سكريبت: نظّم مشروعك كوحدات",
    summary: "require والموديولات المشتركة وتنظيم الكود في مشاريع كبيرة.",
    content: [
      "الموديول سكريبت وحدة كود تُستخدم من سكربتات أخرى — ترجع جدولاً أو قيمة واحدة عند استدعائها بالدالة ()\u200brequire. الموديول يُحمَّل مرة واحدة فقط وتُخزن نتيجته.",
      "النمط الأشهر: موديول يرجع جدولاً فيه دوال مساعدة، مثل موديول أدوات الأسلحة أو موديول إعدادات اللعبة. هذا يمنع نسخ الكود ويجعل التعديل في مكان واحد.",
      "طريقة الوصول: require(script.Parent.MyModule) إذا كان الموديول مجاوراً، أو عبر المسار الكامل. الأفضل استخدام ServerStorage أو ReplicatedStorage للموديولات المشتركة حسب الجهة المستخدمة.",
      "تفصيلة احترافية: حلقات الاستدعاء بين الموديولات (أ يستدعي ب وب يستدعي أ) تسبب تعليقاً — صمم وحداتك باتجاه واحد، أو أرجع دوالاً تُستدعى لاحقاً بدل القيم الفورية.",
    ],
    code: `-- موديول سكريبت اسمه: GameConfig
local GameConfig = {}

GameConfig.START_GOLD = 100
GameConfig.MAX_LEVEL = 50
GameConfig.XP_PER_LEVEL = 250

function GameConfig.xpNeeded(level: number): number
	return level * GameConfig.XP_PER_LEVEL
end

return GameConfig`,
    tags: ["موديول", "وحده", "وحدات", "ري كواير", "تنظيم", "مشروع", "مكتبه", "مكتبات", "module", "modulescript", "require", "وحدة"],
  },
  {
    id: "task-library",
    kind: "lesson",
    level: "متوسط",
    title: "مكتبة task: طريقة روبلوكس الحديثة للانتظار والخيوط",
    summary: "task.wait و task.spawn و task.defer و task.delay بدل الأساليب القديمة.",
    content: [
      "مكتبة task هي الطريقة الرسمية الحديثة لإدارة الوقت والخيوط في لواو روبلوكس — أدق وأسلم من الأساليب القديمة مثل ()\u200bwait أو ()\u200bspawn أو ()\u200bdelay.",
      "الدوال الأربع: ()\u200btask.wait(ثواني) يوقف الخيط الحالي ويعيد الزمن الفعلي المنتظر، و ()\u200btask.spawn(دالة) يشغل دالة فوراً في خيط جديد، و ()\u200btask.defer(دالة) يؤجلها لنهاية الإطار الحالي، و ()\u200btask.delay(ثواني، دالة) ينفذها بعد مدة. ويوجد ()\u200btask.cancel لإلغاء خيط.",
      "الفرق بين defer و spawn: spawn يبدأ فوراً في نفس الإطار، بينما defer ينتظر حتى نهاية دورة التحديث الحالية — ممتاز لتأجيل عمل غير عاجز دون تجميد.",
      "تفصيلة مهمة: داخل الحلقات الدائمة استخدم دائماً ()\u200btask.wait() على الأقل، وإلا ستشنق اللعبة كاملة بسبب خيط لا يتوقف.",
    ],
    code: `-- انتظار دقيق
print("البداية")
local elapsed = task.wait(2)  -- يرجع الزمن الفعلي المنتظر
print("مرت تقريباً " .. elapsed .. " ثانية")

-- تشغيل دالة في خيط موازٍ
task.spawn(function()
	for i = 1, 3 do
		print("خيط موازٍ: " .. i)
		task.wait(0.5)
	end
end)

-- تأجيل لنهاية الإطار
task.defer(function()
	print("أنفذ لاحقاً في نفس الإطار")
end)

-- تنفيذ بعد 5 ثوانٍ مع إمكانية الإلغاء
local thread = task.delay(5, function()
	print("لن ترى هذه الرسالة إذا أُلغيت")
end)
task.cancel(thread)`,
    tags: ["تاسك", "انتظار", "تايمر", "تاجيل", "خيط", "خيوط", "مهام", "سبون", "ديلاي", "مكتبه", "task", "wait", "spawn", "defer", "delay", "مكتبة"],
  },
  {
    id: "iteration-deep",
    kind: "lesson",
    level: "متوسط",
    title: "المرور العميق: ipairs و pairs و next ومتى تستخدم كلاً",
    summary: "الفروق الدقيقة بين طرق المرور، والحذف الآمن أثناء المرور.",
    content: [
      "()ipairs يمر على الفهارس الرقمية المتسلسلة من 1 ويتوقف عند أول فجوة — الخيار الصحيح للقوائم المرتبة، ويرجع الفهرس والقيمة.",
      "()pairs يمر على كل المفاتيح بلا ترتيب مضمون — الخيار للقواميس، ويرجع المفتاح والقيمة. و ()\u200bnext هو الأساس الذي يُبنى عليه: يرجع أول زوج أو يستلم مفتاحاً ليرجع التالي.",
      "خطأ الحذف أثناء المرور: إذا حذفت من جدول وأنت تمر عليه بـ ipairs للأمام، تنزلق الفهارس وتتخطى عناصر. الحلان: المرور من النهاية إلى البداية عند الحذف، أو جمع ما تريد حذفه ثم حذفه بعد الحلقة.",
      "تفصيلة أداء: في الحلقات الحرجة (التي تعمل كل إطار) خزّن الدوال المحلية خارج الحلقة ومرر بـ ipairs — الفروقات الصغيرة تتراكم في الألعاب الكبيرة.",
    ],
    code: `local items = {"سيف", "درع", "جرعة", "قوس"}

-- المرور الآمن مع الحذف: من النهاية للبداية
for i = #items, 1, -1 do
	if items[i] == "جرعة" then
		table.remove(items, i)
	end
end

-- بديل أنيق: بناء قائمة جديدة
local filtered = {}
for _, item in ipairs(items) do
	if item ~= "جرعة" then
		table.insert(filtered, item)
	end
end

-- المرور على قاموس بمفتاح اختياري
local config = { speed = 16, jump = 50, gravity = 196 }
for key, value in pairs(config) do
	print(key, "=", value)
end

-- next للتحقق هل الجدول فارغ
if next(config) == nil then
	print("الجدول فارغ")
end`,
    tags: ["مرور", "تكرار", "ازاله", "حذف", "حلقات", "فهارس", "ابرس", "بيرز", "نيكست", "اداء", "ipairs", "pairs", "next", "iteration"],
  },
];
