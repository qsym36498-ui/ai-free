import type { KnowledgeDoc } from "./types";

/** دروس مستوى الاحتراف — تقنيات يستخدمها المطورون في الألعاب الكبيرة */
export const PRO_LESSONS: KnowledgeDoc[] = [
  {
    id: "proximity-prompt",
    kind: "lesson",
    level: "متوسط",
    title: "ProximityPrompt: زر تفاعل يظهر عند الاقتراب",
    summary: "أفضل طريقة لعمل زر فتح/تحدث/التقاط بدون واجهات معقدة.",
    content: [
      "خدمة ProximityPrompt تظهر للاعب زر تفاعل عندما يقترب من جزء، مثل زر فتح صندوق أو التحدث مع شخصية — بدون ما تبني واجهة بنفسك.",
      "أضف كائن ProximityPrompt داخل الجزء، اضبط ObjectText (نص الزر) و ActionText (الفعل)، واربط حدث Triggered على السيرفر لتنفيذ الفعل بأمان.",
      "الخاصية HoldDuration تحدد كم ثانية يجب أن يضغط اللاعب، و RequiresLineOfSight تجعل الزر يظهر فقط لو اللاعب شايف الجزء.",
      "تفصيلة أمان: حدث Triggered يشتغل على السيرفر دائماً — لا تنفذ منطقاً حساساً من كلينت حتى لو ظهر لك أن الزر هناك.",
    ],
    code: `local part = workspace:WaitForChild("TreasureChest")

local prompt = Instance.new("ProximityPrompt")
prompt.ObjectText = "فتح الصندوق"
prompt.ActionText = "اضغط"
prompt.HoldDuration = 0.5
prompt.MaxActivationDistance = 10
prompt.RequiresLineOfSight = true
prompt.Parent = part

prompt.Triggered:Connect(function(player)
	print(player.Name .. " فتح الصندوق!")
	prompt.Enabled = false  -- مرة واحدة فقط
	-- هنا منطق فتح الصندوق على السيرفر
end)`,
    tags: ["بروكسيميتي", "تفاعل", "زر", "اقتراب", "صندوق", "فتح", "التقاط", "prompt", "proximityprompt", "تفاعل مع شيء"],
  },
  {
    id: "object-pooling",
    kind: "lesson",
    level: "متقدم",
    title: "Object Pooling: لا تصنع وتدمر كل مرة",
    summary: "إعادة تدوير الكائنات بدل Instance.new و Destroy المتكرر — أساس الأداء.",
    content: [
      "صنع جزء جديد بـ Instance.new وتدميره بـ Destroy عمليات مكلفة إذا تكررت مئات المرات بالثانية (رصاص، جزيئات، أعداء). الحل: البولينج.",
      "الفكرة: جهز مجموعة كائنات مسبقاً وأخفها. عند الحاجة خذ واحداً وأظهره بدل صنع جديد، وعند الانتهاء أخفه وأرجعه للمجموعة بدل تدميره.",
      "هذا يخفض الضغط على محرك اللعبة ويمنع التقطيع (lag) في المعارك الكبيرة، وهو نمط تستخدمه ألعاب التصويب الاحترافية.",
      "تفصيلة: أخف الكائن بـ Parent = nil أو بتعطيل خصائصه، وتذكر إعادة ضبط خصائصه (الموقع، الصحة) قبل كل استخدام جديد.",
    ],
    code: `local pool = {}
local POOL_SIZE = 20
local bulletsFolder = Instance.new("Folder")
bulletsFolder.Name = "Bullets"
bulletsFolder.Parent = workspace

-- تجهيز المسبق
for i = 1, POOL_SIZE do
	local bullet = Instance.new("Part")
	bullet.Size = Vector3.new(0.4, 0.4, 1)
	bullet.Anchored = true
	bullet.CanCollide = false
	bullet.Parent = bulletsFolder
	table.insert(pool, bullet)
end

local index = 1
local function getBullet()
	local bullet = pool[index]
	index = (index % POOL_SIZE) + 1
	return bullet  -- أعدنا تدويره بدل صنع جديد
end

-- استخدام: خذ رصاصة، حركها، ثم أعد تدويرها في الدورة القادمة
local b = getBullet()
b.Position = Vector3.new(0, 5, 0)`,
    tags: ["بولينج", "اداء", "تحسين", "رصاص", "تقطيع", "لاق", "اعاده تدوير", "كائنات", "pool", "object pooling", "performance", "lag"],
  },
  {
    id: "state-machine",
    kind: "lesson",
    level: "متقدم",
    title: "آلة الحالات: دماغ منظم للأعداء والشخصيات",
    summary: "نظام حالات (دورية/مطاردة/هجوم) يجعل سلوك العدو نظيفاً وقابلاً للتوسعة.",
    content: [
      "بدل كتابة منطق العدو كله في حلقة واحدة متشابكة، قسّمه إلى حالات واضحة: دورية (Patrol)، مطاردة (Chase)، هجوم (Attack)، موت (Dead).",
      "كل حالة لها دخول وتنفيذ وخروج. في كل إطار تنفذ الحالة الحالية، وعندما يتغير شرط تنتقل إلى حالة أخرى — هذا يسهل الإضافة والتعديل.",
      "النمط يسمى Finite State Machine وهو مستخدم في كل ألعاب الأكشن الكبيرة. يجعل سلوك العدو متوقعاً وسهل التنقيح.",
      "تفصيلة: احفظ الحالة الحالية في متغير، واستخدم دالة تغيير حالة تنظف الحالة القديمة قبل تفعيل الجديدة (أوقف الحركة، أوقف المؤثرات...).",
    ],
    code: `local zombie = script.Parent
local humanoid = zombie:WaitForChild("Humanoid")

local currentState = "patrol"

local States = {}

function States.patrol()
	humanoid.WalkSpeed = 8
	-- تحرك عشوائي بين نقاط
end

function States.chase()
	humanoid.WalkSpeed = 16
	-- طارد أقرب لاعب
end

function States.attack()
	humanoid.WalkSpeed = 0
	-- وجّه ضربة
end

local function setState(newState)
	if currentState == newState then return end
	currentState = newState
	print("الزومبي الآن في حالة: " .. newState)
end

-- حلقة رئيسية تختار الحالة حسب الظروف
while humanoid.Health > 0 do
	local seesPlayer = false  -- منطق الرؤية هنا
	if seesPlayer then
		setState("chase")
	else
		setState("patrol")
	end
	if States[currentState] then States[currentState]() end
	task.wait(0.3)
end`,
    tags: ["اله حالات", "حالات", "دماغ", "عدو ذكي", "سلوك", "منطقه", "دوريه", "مطارده", "هجوم", "state machine", "fsm", "ai", "ذكاء العدو"],
  },
  {
    id: "raycasting",
    kind: "lesson",
    level: "متقدم",
    title: "Raycasting: إطلاق شعاع للكشف عن الأشياء",
    summary: "أساس التصويب والرؤية: ارسم خطاً مستقيماً واعرف ماذا يضرب.",
    content: [
      "الريكاستنج يطلق شعاعاً (خطاً مستقيماً) من نقطة باتجاه معين لمسافة محددة، ويرجع أول شيء يصطدم به — أساس أنظمة التصويب والرؤية.",
      "استخدم ()\u200bworkspace:Raycast(من، الاتجاه، إعدادات). الإعدادات (RaycastParams) تحدد ما يتجاهله الشعاع، مثل تجاهل شخصية مطلق النار.",
      "النتيجة (RaycastResult) فيها Instance (الكائن المصاب)، و Position (نقطة الاصطدام)، و Distance المسافة، و Normal اتجاه السطح.",
      "تفصيلة: اضرب الاتجاه في طول الوحدة (Unit) ثم في المسافة — لأن معادلة الريكاست تأخذ متجه اتجاه بطول المسافة المطلوبة، وليس نقطة نهاية.",
    ],
    code: `local origin = Vector3.new(0, 5, 0)
local direction = Vector3.new(0, 0, -1) * 100  -- اتجاه × مسافة

local params = RaycastParams.new()
params.FilterType = Enum.RaycastFilterType.Exclude
params.FilterDescendantsInstances = { script.Parent }  -- تجاهل نفسي

local result = workspace:Raycast(origin, direction, params)

if result then
	print("أصبنا:", result.Instance.Name)
	print("الموقع:", result.Position)
	print("المسافة:", result.Distance)
	-- مثال: لو أصبنا لاعباً، نطبق ضرر
else
	print("لم نصب شيئاً")
end`,
    tags: ["ريكاست", "شعاع", "تصويب", "رؤيه", "اطلاق", "كشف", "اصابه", "مسدس", "raycast", "raycasting", "aim", "shoot", "line of sight"],
  },
  {
    id: "debugging-perf",
    kind: "lesson",
    level: "متقدم",
    title: "التنقيح والأداء: كيف تجد البطء وتصلحه",
    summary: "أدوات ستوديو لقياس الأداء، ونمط التفكير لاكتشاف الأخطاء.",
    content: [
      "نافذة Performance Stats في الاستوديو تعرض استهلاك كل سكربت بالمللي ثانية — رتبها تنازلياً واعرف أي سكربت يخنق اللعبة.",
      "أشهر أسباب البطء: حلقات تعمل كل إطار بلا انتظار، صنع وتدمير كائنات متكرر (استخدم البولينج)، واتصالات أحداث لا تفصلها فتتراكم.",
      "للبحث عن خطأ منطقي ضع ()\u200bprint عند نقاط الشك لتتبع القيم، أو استخدم نقاط التوقف (Breakpoints) في محرر السكربت.",
      "تفصيلة: افصل دائماً اتصالات الأحداث المؤقتة بـ Disconnect، ولا تربط دالة بحدث داخل حلقة بدون فصل القديم — هذا يسبب تكرار التنفيذ وتراكم الحمل.",
    ],
    code: `-- قياس زمن عملية بدقة
local start = os.clock()
for i = 1, 100000 do
	-- عملية تريد قياسها
end
local elapsed = os.clock() - start
print(string.format("استغرقت %.4f ثانية", elapsed))

-- فصل اتصال حدث عند الانتهاء (منع التراكم)
local part = workspace:WaitForChild("Sensor")
local connection
connection = part.Touched:Connect(function()
	print("لمسة!")
	connection:Disconnect()  -- مرة واحدة فقط
end)`,
    tags: ["تنقيح", "اداء", "بطء", "لاق", "قياس", "تحسين", "بريك بوينت", "ديباق", "debug", "debugging", "performance", "optimize", "profile"],
  },
  {
    id: "remote-security-deep",
    kind: "lesson",
    level: "متقدم",
    title: "أمان الريموتات بعمق: صد المخترقين المحترفين",
    summary: "التحقق من المعدل، حدود القيم، وعدم الثقة مطلقاً بأي قادم من الكلينت.",
    content: [
      "المخترقون يرسلون ريموتات مباشرة بأدوات خاصة متجاوزين أي واجهة — لذلك كل فحص يجب أن يكون على السيرفر، وليس في اللوكال سكريبت.",
      "طبقات الدفاع: تحقق من النوع ()\u200btypeof، ثم المدى ()\u200bmath.clamp، ثم المنطق (هل اللاعب يملك فعلاً ما يطلبه؟)، ثم المعدل (كم طلباً بالثانية مسموح).",
      "أضف عداد معدل (Rate Limiter) لكل لاعب: لو تجاوز الحد تجاهل طلباته مؤقتاً وسجله — هذا يصد هجمات الإغراق.",
      "تفصيلة: لا ترسل للكلينت أي بيانات سرية (مفاتيح، كميات غير ظاهرة) حتى لو 'للعرض فقط' — كل ما يصل للكلينت مكشوف للمخترق.",
    ],
    code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local doAction = ReplicatedStorage:WaitForChild("DoAction")

local lastRequest = {}
local RATE_LIMIT = 5  -- طلبات مسموحة في 10 ثوانٍ
local window = {}

doAction.OnServerEvent:Connect(function(player, payload)
	local now = os.clock()

	-- 1) فحص المعدل
	window[player] = window[player] or {}
	local recent = window[player]
	-- احذف الطلبات الأقدم من 10 ثوانٍ
	for i = #recent, 1, -1 do
		if now - recent[i] > 10 then table.remove(recent, i) end
	end
	if #recent >= RATE_LIMIT then
		warn(player.Name .. " يتجاوز المعدل المسموح")
		return
	end
	table.insert(recent, now)

	-- 2) فحص النوع والمدى
	if typeof(payload) ~= "table" then return end
	local amount = tonumber(payload.amount) or 0
	amount = math.clamp(math.floor(amount), 0, 100)  -- حد صارم

	-- 3) هنا المنطق الآمن بعد كل الفحوصات
	print(player.Name .. " طلب كمية آمنة: " .. amount)
end)`,
    tags: ["امان ريموت", "تصدي", "مخترقين", "معدل", "حمايه متقدمه", "فلتره", "تحقق صارم", "rate limit", "remote security", "exploit", "server validation"],
  },
];
