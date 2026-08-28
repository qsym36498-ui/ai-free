import type { KnowledgeDoc } from "./types";

/** دروس روبلوكس التطبيقية + مرجع سريع للقيم الشائعة */
export const ROBLOX_LESSONS: KnowledgeDoc[] = [
  {
    id: "instances-tree",
    kind: "lesson",
    level: "مبتدئ",
    title: "شجرة الكائنات: Instance و game وخدمات الاستوديو",
    summary: "كيف تصل لأي شيء في اللعبة، والفرق بين FindFirstChild و WaitForChild.",
    content: [
      "كل شيء في اللعبة كائن (Instance) داخل شجرة جذرها game. تصل للخدمات مباشرة: ()\u200bgame:GetService(\"Players\") — هذه الطريقة الرسمية والمضمونة، بدل ()\u200bgame.Players.",
      "لإيجاد ابن استخدم ()\u200bFindFirstChild(\"الاسم\") — يرجع nil إذا لم يوجد (تحقق دائماً قبل الاستخدام). ولانتظار شيء يظهر لاحقاً استخدم ()\u200bWaitForChild مع مدة قصوى اختيارية حتى لا يعلق السكربت للأبد.",
      "لإنشاء كائن جديد برمجياً: ()\u200bInstance.new(\"Part\")، ثم اضبط خصائصه وألحقه بالشجرة بخاصية Parent — الترتيب مهم: اضبط الخصائص قبل الأب قدر الإمكان لتفادي استيقاظات غير ضرورية.",
      "من الخدمات الأساسية: Players للاعبين، Workspace للعالم، ReplicatedStorage لما يراه الطرفان، ServerStorage لما يخص السيرفر فقط، و ServerScriptService لسكربتات السيرفر.",
    ],
    code: `local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

-- انتظار شيء يظهر لاحقاً (مع مهلة 10 ثوانٍ)
local folder = ReplicatedStorage:WaitForChild("Assets", 10)
if folder == nil then
	warn("لم يظهر مجلد الأصول في الوقت المحدد!")
else
	print("وجدناه:", folder)
end

-- إنشاء جزء جديد بالكامل بالكود
local part = Instance.new("Part")
part.Name = "صندوق الكنز"
part.Size = Vector3.new(4, 4, 4)
part.Color = Color3.fromRGB(245, 185, 66)
part.Anchored = true
part.Position = Vector3.new(0, 5, 0)
part.Parent = workspace

-- فحص آمن قبل الاستخدام
local spawn = workspace:FindFirstChild("SpawnLocation")
if spawn then
	print("نقطة البداية موجودة")
end`,
    tags: ["انستانس", "كائن", "كائنات", "شجره", "خدمه", "خدمات", "فايند", "ويت", "قيم", "انشاء", "Instance", "FindFirstChild", "WaitForChild", "GetService", "workspace", "game"],
  },
  {
    id: "events",
    kind: "lesson",
    level: "مبتدئ",
    title: "الأحداث: اجعل اللعبة تتفاعل",
    summary: "Connect و Touched و Changed و Disconnect وربط الدوال بالأحداث.",
    content: [
      "الحدث شيء يحصل في اللعبة (لمس جزء، تغير خاصية، دخول لاعب) وتستطيع ربط دالة به تنفذ فور وقوعه: الحدث:Connect(دالة). هذا قلب التفاعلية في روبلوكس.",
      "أشهر الأحداث: ()\u200bTouched عند لمس الجزء لكائن فيزيائي (يمرر الجزء الملموس)، و ()\u200bChanged عند تغير أي خاصية (يمرر اسم الخاصية)، و Players.PlayerAdded عند دخول لاعب.",
      "الحدث يرجع اتصالاً (RBXScriptConnection) — احفظه وناده ()\u200bDisconnect عند عدم الحاجة، خصوصاً للأحداث المؤقتة، وإلا تسرب الذاكرة وتتكرر الاستجابات.",
      "تفصيلة يغفلها الجميع: حدث Touched قد يشتعل عدة مرات في لحظة واحدة لنفس الجسم — استخدمعلامة/جدول تحقق أو Debounce لمنع التكرار.",
    ],
    code: `local part = workspace:WaitForChild("TrapPart")
local touchedRecently = {}  -- جدول مكافحة التكرار

local connection = part.Touched:Connect(function(hit)
	-- تجاهل ما ليس له لاعب خلفه
	local character = hit:FindFirstAncestorOfClass("Model")
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if not humanoid then return end

	-- Debounce: مرة واحدة كل ثانية لكل شخصية
	if touchedRecently[character] then return end
	touchedRecently[character] = true
	task.delay(1, function()
		touchedRecently[character] = nil
	end)

	humanoid.Health = 0
	print(character.Name .. " وقع في الفخ!")
end)

-- إلغاء الربط عند الحاجة
-- connection:Disconnect()`,
    tags: ["حدث", "احداث", "لمس", "ربط", "تفاعل", "كونكت", "تاتشد", "مشغل", "ترقبر", "Trigger", "event", "events", "Connect", "Touched", "Changed", "Disconnect"],
  },
  {
    id: "player-character",
    kind: "lesson",
    level: "مبتدئ",
    title: "اللاعب والشخصية: Humanoid والحياة والحركة",
    summary: "الوصول للاعب وشخصيته، الصحة، السرعة، القفز، والوفاة.",
    content: [
      "اللاعب (Player) هو الحساب، والشخصية (Character) هي الجسم في العالم. من سكربت سيرفر تصل للاعبين عبر ()\u200bPlayers:GetPlayers()، وشخصية اللاعب في خاصيته Character — قد تكون nil لحظة الدخول فانتظرها.",
      "كائن Humanoid داخل الشخصية يدير كل شيء: الصحة Health والحد الأقصى MaxHealth وسرعة المشي WalkSpeed وقوة القفز JumpPower. مات اللاعب عندما تصل الصحة إلى 0 ويُطلق حدث Died.",
      "لتغيير السرعة مثلاً: ()\u200bhumanoid.WalkSpeed = 32 — لكن انتبه، بعض التعديلات تعاد ضبطها عند إعادة التولّد، فالأفضل ربطها بحدث ()\u200bCharacterAdded.",
      "تفصيلة: حدث ()\u200bHumanoid.Died يُطلق مرة واحدة فقط لكل شخصية، وإذا أردت معرفة القاتل ابحث في قيم الضرر أو استخدم نظامك الخاص لتسجيل آخر مصدر ضرر.",
    ],
    code: `local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	print("دخل اللعبة: " .. player.Name)

	player.CharacterAdded:Connect(function(character)
		local humanoid = character:WaitForChild("Humanoid")

		-- تخصيص الشخصية عند كل تولّد
		humanoid.WalkSpeed = 24
		humanoid.JumpPower = 60
		humanoid.MaxHealth = 150
		humanoid.Health = 150

		humanoid.Died:Connect(function()
			print(player.Name .. " مات — ننتظر إعادة التولّد")
		end)
	end)
end)`,
    tags: ["لاعب", "لاعبين", "شخصيه", "هيومانويد", "صحه", "حياه", "سرعه", "قفز", "موته", "ولاده", "player", "players", "humanoid", "character", "health", "walkspeed", "موت"],
  },
  {
    id: "remote-events",
    kind: "lesson",
    level: "متوسط",
    title: "التواصل بين السيرفر والكلينت: Remote بأمان",
    summary: "RemoteEvent و FireServer و OnServerEvent وقواعد الأمان الذهبية.",
    content: [
      "السيرفر لا يرى ما يفكر به الكلينت والعكس — الجسر بينهما RemoteEvent: من الكلينت ()\u200bFireServer(معطيات) يستقبله السيرفر بحدث OnServerEvent، ومن السيرفر ()\u200bFireClient(لاعب) أو FireAllClients يستقبله الكلينت بـ OnClientEvent.",
      "القاعدة الذهبية للأمان: لا تثق أبداً بأي شيء قادم من الكلينت. اللاعب (أو المخترق) يستطيع إرسال أي قيم — تحقق في السيرفر من كل معطى: نوعه، مداه، وهل اللاعب مؤهل فعلاً للطلب.",
      "لإرجاع جواب للطلب استخدم RemoteFunction مع OnServerInvoke، لكن بحذر: إذا نفذ الكلينت الدالة يستطيع تعليق السيرفر — استخدمها نادراً وفضّل نمط الطلب عبر RemoteEvent ثم بث النتيجة.",
      "تفصيلة مهمة: ضع الريموتات في ReplicatedStorage ليراها الطرفان، ولا ترسل أبداً كائنات سيرفر حساسة أو كميات ضخمة كل إطار.",
    ],
    code: `-- RemoteEvent اسمه BuyItem داخل ReplicatedStorage
-- ══ سكربت السيرفر (في ServerScriptService) ══
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local buyEvent = ReplicatedStorage:WaitForChild("BuyItem")

local PRICES = { sword = 100, potion = 25 }

buyEvent.OnServerEvent:Connect(function(player, itemName)
	-- تحقق 1: هل المعطى نص معروف؟
	if typeof(itemName) ~= "string" or not PRICES[itemName] then
		warn(player.Name .. " أرسل طلب شراء غير صالح")
		return
	end
	-- تحقق 2: منطق الشراء الفعلي على السيرفر فقط
	print(player.Name .. " اشترى " .. itemName .. " بسعر " .. PRICES[itemName])
end)`,
    tags: ["ريموت", "ريموتات", "سيرفر", "كلينت", "اتصال", "شبكه", "ارسال", "استقبال", "فاير", "احتيال", "اختراق", "remote", "remoteevent", "fireserver", "onserverevent", "fireclient", "networking", "امان"],
  },
  {
    id: "datastores",
    kind: "lesson",
    level: "متوسط",
    title: "حفظ بيانات اللاعبين: DataStore بالطريقة الصحيحة",
    summary: "GetAsync و SetAsync و UpdateAsync مع pcall وإعادة المحاولة.",
    content: [
      "خدمة DataStoreService تحفظ بيانات اللاعبين بين الجلسات: مفتاح لكل لاعب (عادة \"بيانات_\" .. UserId) وقيمة جدول كامل: الذهب، المستوى، الحقيبة وكل شيء.",
      "الاستدعاءات الشبكية قد تفشل — غلفها دائماً بـ pcall وأعد المحاولة 2-3 مرات مع انتظار قصير. استخدم ()\u200bUpdateAsync بدل SetAsync عند التعديل لأنه يقرأ آخر نسخة ويحدّثها بأمان ضد التعارض.",
      "احفظ عند خروج اللاعب بحدث PlayerRemoving، وأضف حفظاً دورياً كل بضع دقائق وحفظاً عند إغلاق السيرفر بـ ()\u200bgame:BindToClose — وإلا ضاع تقدم اللاعبين في آخر تحديث.",
      "تفصيلة ذهبية: لا تحفظ داخل الحلقة الرئيسية لكل اللاعبين دفعة واحدة، بل وزّع الحفظ، وتذكر أن للداتا ستور حدود طلبات (Budget) — لا تسرف.",
    ],
    code: `local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local store = DataStoreService:GetDataStore("PlayerData_v1")

local function loadData(player)
	local key = "data_" .. player.UserId
	for attempt = 1, 3 do
		local ok, result = pcall(function()
			return store:GetAsync(key)
		end)
		if ok then
			return result or { gold = 100, level = 1 }
		end
		task.wait(1)
	end
	return { gold = 100, level = 1 }  -- قيم افتراضية عند الفشل
end

local function saveData(player, data)
	local key = "data_" .. player.UserId
	for attempt = 1, 3 do
		local ok = pcall(function()
			store:UpdateAsync(key, function()
				return data
			end)
		end)
		if ok then return true end
		task.wait(1)
	end
	return false
end

Players.PlayerAdded:Connect(function(player)
	local data = loadData(player)
	print(player.Name, "بياناته:", data)
end)`,
    tags: ["حفظ", "داتا", "بيانات", "دايتا", "تخزين", "استور", "لود", "تحميل", "حفظ البيانات", "datastore", "datastores", "setasync", "getasync", "updateasync", "save", "بيانات اللاعب"],
  },
  {
    id: "tween-service",
    kind: "lesson",
    level: "متوسط",
    title: "TweenService: حركة ناعمة لكل شيء",
    summary: "تحريك الأجزاء والشفافية والألوان بسلاسة مع TweenInfo.",
    content: [
      "التوين يحرّك خصائص كائن من قيمتها الحالية إلى هدف خلال مدة محددة بمنحنى انسيابي — بدل القفزات المفاجئة. أنشئ وصف الحركة بـ ()\u200bTweenInfo.new(المدة، النمط، الاتجاه)، ثم ()\u200bTweenService:Create(الكائن، الوصف، جدول الخصائص الهدف) وأخيراً ()\u200bPlay.",
      "أنماط الحركة (EasingStyle) الشهيرة: Linear سرعة ثابتة، Quad و Cubic تسارع طبيعي، Bounce يرتد في النهاية، و Elastic يتأرجح. والاتجاهات: In يبدأ بطيئاً، Out ينتهي بطيئاً، InOut كلاهما.",
      "التوين يعمل على أي خاصية رقمية تقريباً: الموضع عبر CFrame، الشفافية، اللون، الحجم، وحتى خصائص الكاميرا والإضاءة — وليس فقط الأجزاء.",
      "تفصيلة: التوين لا يوقف الكود؛ لانتظار انتهائه استخدم الحدث Completed أو راقب خاصية PlaybackState. وللجزء المتحرك فيزيائياً يجب أن يكون Anchored.",
    ],
    code: `local TweenService = game:GetService("TweenService")
local part = workspace:WaitForChild("MagicDoor")

local info = TweenInfo.new(
	2,                       -- المدة بالثواني
	Enum.EasingStyle.Quad,   -- نمط الحركة
	Enum.EasingDirection.Out,
	0,                       -- عدد التكرارات (0 = مرة واحدة، -1 = للأبد)
	false                    -- عكس الاتجاه في التكرار؟
)

local goal = {
	Position = part.Position + Vector3.new(0, 10, 0),
}

local tween = TweenService:Create(part, info, goal)
tween.Completed:Connect(function()
	print("اكتملت الحركة!")
end)
tween:Play()`,
    tags: ["توين", "حركه", "تحريك", "انيميشن", "سلاسه", "انسياب", "انتقال", "نقل", "باب متحرك", "tween", "tweenservice", "animation", "move", "حركه سلسه", "تحريك جزء"],
  },
  {
    id: "runservice",
    kind: "lesson",
    level: "متوسط",
    title: "RunService: الكود الذي يعمل كل إطار",
    summary: "Heartbeat و RenderStepped و Stepped والفرق بينها ومتى تستخدم كلاً.",
    content: [
      "خدمة RunService تعطيك أحداثاً مرتبطة بدورة التحديث: Heartbeat بعد كل خطوة فيزيائية (سيرفر وكلينت)، و RenderStepped قبل رسم كل إطار (كلينت فقط)، و Stepped قبل الخطوة الفيزيائية.",
      "القاعدة العملية: منطق اللعبة العام على Heartbeat، وما يتعلق بالكاميرا والرؤية والتصويب على RenderStepped، ولا تستخدم RenderStepped على السيرفر إطلاقاً فهو غير موجود هناك.",
      "الحدث يمرر معامل دلتا (dt): الزمن المنقضي منذ الإطار السابق بالثواني. اضرب سرعتك في دلتا لتصبح الحركة مستقلة عن معدل الإطارات — نفس السرعة على جهاز ضعيف وقوي.",
      "تفصيلة: لا تضع منطقاً ثقيلاً في أحداث الإطار؛ إذا احتجت شيئاً كل ثانية استخدم حلقة بـ task.wait(1) بدل عد الإطارات — أرخص وأوضح.",
    ],
    code: `local RunService = game:GetService("RunService")

local rotationSpeed = 90  -- درجة في الثانية
local spinner = workspace:WaitForChild("Spinner")

-- دوران سلس مستقل عن معدل الإطارات
RunService.Heartbeat:Connect(function(deltaTime)
	spinner.CFrame = spinner.CFrame * CFrame.Angles(
		0, math.rad(rotationSpeed * deltaTime), 0
	)
end)

-- مثال كلينت: متابعة هدف بالكاميرا كل إطار
-- (في لوكال سكريبت فقط)
-- RunService.RenderStepped:Connect(function()
-- 	camera.CFrame = CFrame.lookAt(camera.CFrame.Position, target.Position)
-- end)`,
    tags: ["ران سيرفس", "اطار", "اطارات", "ابديت", "تحديث", "دلته", "حلقات", "دوران", "كل فريم", "runservice", "heartbeat", "renderstepped", "delta", "update", "فريم"],
  },
  {
    id: "gui",
    kind: "lesson",
    level: "مبتدئ",
    title: "واجهات المستخدم: ScreenGui والأزرار والنصوص",
    summary: "بناء واجهات بأزرار ونصوص وصناديق، مع UDim2 والتموضع.",
    content: [
      "الواجهة تعيش داخل ScreenGui تحت PlayerGui لكل لاعب. العناصر الأساسية: Frame صندوق، TextLabel نص، TextButton زر قابل للنقر، و ImageLabel صورة.",
      "الموضع والحجم يقاسان بـ UDim2: مكوّنان (مقياس، إزاحة) لكل محور. المقياس نسبة من حجم الشاشة (0.5 = المنتصف)، والإزاحة بكسلات ثابتة — اجمعهما لواجهة متجاوبة على كل الشاشات.",
      "ربط نقر الزر: زر.MouseButton1Click:Connect(دالة). في لعبة حقيقية، إرسال النقر للسيرفر بـ RemoteEvent هو الطريق الآمن لأي تأثير فعلي.",
      "تفصيلة: خاصية AnchorPoint تحدد نقطة التثبيت (0.5، 0.5 = المنتصف) — مع المقياس 0.5 يتمركز العنصر تماماً. وخاصية ResetOnSpawn تحدد هل تختفي الواجهة عند موت اللاعب.",
    ],
    code: `-- لوكال سكريبت داخل StarterPlayerScripts
local player = game:GetService("Players").LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

local screen = Instance.new("ScreenGui")
screen.Name = "ShopGui"
screen.ResetOnSpawn = false
screen.Parent = playerGui

local button = Instance.new("TextButton")
button.Size = UDim2.new(0, 220, 0, 60)
button.Position = UDim2.new(0.5, -110, 0.9, -30)
button.BackgroundColor3 = Color3.fromRGB(23, 184, 119)
button.TextColor3 = Color3.new(1, 1, 1)
button.Font = Enum.Font.GothamBold
button.TextSize = 22
button.Text = "افتح المتجر"
button.Parent = screen

local clicks = 0
button.MouseButton1Click:Connect(function()
	clicks += 1
	button.Text = "نقرات: " .. clicks
end)`,
    tags: ["واجهه", "واجهات", "زر", "ازرار", "شاشه", "قائمه", "جي يو اي", "يو دي اي ام", "نص علي الشاشه", "هيد", "gui", "screengui", "button", "textbutton", "udim2", "frame", "واجهة المستخدم"],
  },
  {
    id: "pathfinding",
    kind: "lesson",
    level: "متقدم",
    title: "PathfindingService: أعداء أذكياء يلاحقون اللاعب",
    summary: "حساب مسار وتخطي عقبات ووكيل الحركة للأعداء.",
    content: [
      "خدمة المسارات تحسب طريقاً بين نقطتين متجنباً العوائق: ()\u200bCreatePath ثم ()\u200bComputeAsync(من، إلى)، والناتج نقاط (Waypoints) تأمر العدو بالمشي إليها واحدة واحدة عبر ()\u200bHumanoid:MoveTo.",
      "لتخطي القفزات والعوائق مرر خيارات ()\u200bPathfindingAgentParameters مثل AgentCanJump و AgentCanClimb. تحقق من ()\u200bPath.Status — إن لم يكن Success فالمسار مسدود.",
      "النمط القياسي للعدو: حلقة دائمة كل نصف ثانية تبحث عن أقرب لاعب، تعيد حساب المسار، وتتحرك نقطة نقطة — مع إعادة حساب دورية لأن اللاعبين يتحركون.",
      "تفصيلة: أعداء كثيرون يعيدون الحساب كل إطار يخنقون السيرفر — اجعل إعادة الحساب كل 0.3-0.5 ثانية، ومسافة ملاحظة محدودة (لا تطارد من لا يراك).",
    ],
    code: `local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")

local zombie = workspace:WaitForChild("Zombie")
local humanoid = zombie:WaitForChild("Humanoid")
local root = zombie:WaitForChild("HumanoidRootPart")

local function nearestPlayer()
	local best, bestDist = nil, 120  -- مسافة الملاحظة
	for _, player in Players:GetPlayers() do
		local char = player.Character
		local targetRoot = char and char:FindFirstChild("HumanoidRootPart")
		if targetRoot then
			local dist = (targetRoot.Position - root.Position).Magnitude
			if dist < bestDist then
				best, bestDist = targetRoot, dist
			end
		end
	end
	return best
end

while true do
	local target = nearestPlayer()
	if target then
		local path = PathfindingService:CreatePath()
		path:ComputeAsync(root.Position, target.Position)
		if path.Status == Enum.PathStatus.Success then
			for _, waypoint in path:GetWaypoints() do
				humanoid:MoveTo(waypoint.Position)
				humanoid.MoveToFinished:Wait()
			end
		end
	end
	task.wait(0.4)
end`,
    tags: ["باث فايندنق", "مسار", "مسارات", "عدو", "اعداء", "ملاحقه", "مطارده", "زومبي", "ان بي سي", "ذكاء", "pathfinding", "npc", "enemy", "ai", "zombie", "waypoints", "مطاردة", "يتبع"],
  },
  {
    id: "collection-service",
    kind: "lesson",
    level: "متقدم",
    title: "CollectionService والوسوم: سكربت واحد بدل مئة",
    summary: "وسوم (Tags) تربط سلوكاً بكل الكائنات الموسومة حتى الجديدة.",
    content: [
      "بدل كتابة سكربت داخل كل عملة في الخريطة، ضع لها وسماً مثل \"Coin\" واكتب سكربتاً واحداً يتعامل مع كل الموسومين — هذا عمل CollectionService.",
      "أضف وسماً بـ ()\u200bAddTag(كائن، اسم)، واستعلم بـ ()\u200bHasTag، واحصل على كل الموسومين بـ ()\u200bGetTagged(اسم). ومن الاستوديو تضيف الوسوم عبر نافذة Tags دون كود.",
      "الحدثان السحريان: InstanceTagAdded يشتعل كلما وُسم كائن جديد (حتى أثناء تشغيل اللعبة)، و InstanceTagRemoved عند إزالة الوسم — بهذا تعمل وسومك على الموجود والمستقبلي معاً.",
      "تفصيلة تنظيمية: اجعل لكل وسم وحدة معالجة واحدة، وسماعات مثل \"Coin\" و \"Trap\" و \"QuestGiver\" — مشروعك يصبح أنظف بعشر مرات وأقل سكربتات.",
    ],
    code: `local CollectionService = game:GetService("CollectionService")

local function setupCoin(coin: BasePart)
	coin.Touched:Connect(function(hit)
		local player = game:GetService("Players"):GetPlayerFromCharacter(hit.Parent)
		if player and coin.Parent then
			print(player.Name .. " التقط عملة!")
			coin:Destroy()
		end
	end)
end

-- كل العملات الموجودة الآن
for _, coin in CollectionService:GetTagged("Coin") do
	setupCoin(coin :: BasePart)
end

-- وأي عملة تضاف لاحقاً
CollectionService:GetInstanceAddedSignal("Coin"):Connect(function(coin)
	setupCoin(coin :: BasePart)
end)`,
    tags: ["وسوم", "وسم", "تاق", "تاقات", "كولكشن", "تصنيف", "عملات", "اشياء مشتركه", "collection", "collectionservice", "tags", "addtag", "gettagged", "tag"],
  },
  {
    id: "attributes",
    kind: "lesson",
    level: "متوسط",
    title: "الخصائص المخصصة: Attributes بدل القيم المتناثرة",
    summary: "تخزين بيانات على الكائنات مباشرة ومراقبتها بالأحداث.",
    content: [
      "الخاصية المخصصة (Attribute) قيمة تعلقها على أي كائن مباشرة: جزء، موديل، حتى اللاعب نفسه. تقرأها وتكتبها بـ ()\u200bGetAttribute و ()\u200bSetAttribute وتظهر في نافذة Properties.",
      "أنواع مدعومة: أرقام، نصوص، منطقية، ألوان، متجهات وحتى مراجع لكائنات أخرى — مثالية لإعدادات لكل كائن: الضرر، السعر، مستوى الصعوبة.",
      "راقب التغير بحدث ()\u200bGetAttributeChangedSignal(اسم) أو على الكل بـ AttributeChanged — ممتاز لأنظمة تنظر للقيم دون استفتاء دائم.",
      "تفصيلة: الـ Attributes أسهل من إنشاء كائنات Value داخل كل شيء، لكن للبيانات الكبيرة المتغيرة بكثرة (حقيبة لاعب كاملة) يبقى الجدول في سكربت أو الداتا ستور أنسب.",
    ],
    code: `local weapon = workspace:WaitForChild("FireSword")

-- كتابة خصائص مخصصة
weapon:SetAttribute("Damage", 35)
weapon:SetAttribute("Element", "نار")
weapon:SetAttribute("Level", 5)

-- قراءة
local damage = weapon:GetAttribute("Damage")
print("الضرر:", damage)

-- مراقبة التغير
weapon:GetAttributeChangedSignal("Level"):Connect(function()
	local newLevel = weapon:GetAttribute("Level")
	print("ترقى السيف إلى المستوى " .. tostring(newLevel) .. "!")
end)

weapon:SetAttribute("Level", 6)  -- سيطلق الحدث أعلاه`,
    tags: ["اتريبيوت", "خصائص", "خاصيه", "سمات", "قيم مخصصه", "تعليق", "بيانات علي الكائن", "attributes", "setattribute", "getattribute", "attribute"],
  },
  {
    id: "security",
    kind: "lesson",
    level: "متقدم",
    title: "الأمان: كيف تحمي لعبتك من المخترقين",
    summary: "قاعدة لا تثق بالكلينت، الفحوصات على السيرفر، وأخطر الثغرات الشائعة.",
    content: [
      "القاعدة الأولى والأخيرة: الكلينت جهاز اللاعب وهو تحت سيطرته بالكامل. المخترق يعدل أي لوكال سكريبت ويرسل أي ريموت — لذلك كل قرار حساس (عملات، ضرر، شراء، انتقال) يجب أن يحسم على السيرفر.",
      "أخطر الثغرات الشائعة: الثقة بمعطيات الريموت دون تحقق (إرسال اسم سلاح غير موجود، كمية شراء سالبة)، وسكربتات تعطى اللاعب تنفذ أوامر عامة مثل \"افعل ما أقول\" — هذه الأخيرة كارثة.",
      "قائمة الفحص لكل طلب من لاعب: هل نوع المعطى صحيح؟ هل قيمته ضمن المدى المعقول؟ هل اللاعب يملك المتطلبات؟ هل المعدل معقول (لا 50 طلباً بالثانية)؟ ارفض بهدوء وسجل المشبوهين.",
      "تفصيلة: لا تخزن في اللوكال سكريبت أي منطق حساس حتى لو \"للحماية\" — كل كود كلينت مكشوف. وما ترسله للكلينت افترضه منشوراً للعالم.",
    ],
    code: `-- سيرفر: معالج طلب آمن مع كل طبقات التحقق
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local requestTeleport = ReplicatedStorage:WaitForChild("RequestTeleport")

local lastRequest = {}
local COOLDOWN = 3  -- ثوانٍ بين كل طلبين

requestTeleport.OnServerEvent:Connect(function(player, destinationName)
	-- فحص النوع
	if typeof(destinationName) ~= "string" then return end

	-- فحص المعدل (مكافحة الإغراق)
	local now = os.clock()
	if lastRequest[player] and now - lastRequest[player] < COOLDOWN then
		return
	end
	lastRequest[player] = now

	-- فحص أن الوجهة موجودة فعلاً في السيرفر
	local destination = workspace:FindFirstChild(destinationName)
	if destination and destination:IsA("BasePart") then
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if root then
			root.CFrame = destination.CFrame + Vector3.new(0, 3, 0)
		end
	end
end)`,
    tags: ["امان", "حمايه", "اختراق", "مخترق", "اكسبلويت", "ثغره", "تحقق", "سكيورتي", "غش", "سيرفر سايد", "security", "exploit", "hacker", "validation", "server authority", "حماية"],
  },
  {
    id: "tools",
    kind: "lesson",
    level: "متوسط",
    title: "الأدوات: صنع عدة يُمكن حملها",
    summary: "Tool و Handle و Activated وأحداث الحمل والتفعيل.",
    content: [
      "الأداة كائن Tool فيه جزء إجباري اسمه Handle — هذا ما يُمسك باليد. ضع الأداة في StarterPack ليحصل عليها كل لاعب عند التولد، أو في Backpack لاعب معين.",
      "أحداث الأداة: Activated عند النقر وهي محمولة (الفعل الأساسي مثل الضرب)، و Deactivated عند الإفلات، و Equipped عند الحمل و Unequipped عند الإنزال.",
      "لتحديد ما يضربه السيف استخدم حدث Touched على الـ Handle مع تفعيل مؤقت لحظة الضرب فقط، وعلامة لمنع إصابة نفس الهدف مرتين في الضربة الواحدة.",
      "تفصيلة: خصائص الأداة مثل CanBeDropped و RequiresHandle تتحكم بسلوكها، ويمكنك صنع أدوات بلا Handle للمؤثرات البرمجية فقط.",
    ],
    code: `-- سكربت داخل أداة فيها جزء اسمه Handle
local tool = script.Parent
local handle = tool:WaitForChild("Handle")
local DAMAGE = 25
local swinging = false
local hitTargets = {}

tool.Activated:Connect(function()
	swinging = true
	hitTargets = {}
	task.delay(0.5, function()
		swinging = false
	end)
end)

handle.Touched:Connect(function(hit)
	if not swinging then return end
	local humanoid = hit.Parent and hit.Parent:FindFirstChildOfClass("Humanoid")
	if humanoid and not hitTargets[humanoid] then
		hitTargets[humanoid] = true
		humanoid:TakeDamage(DAMAGE)
	end
end)`,
    tags: ["اداه", "ادوات", "سلاح", "سيف", "تول", "حمل", "ضرب", "ستارتر باك", "عدة", "tool", "tools", "handle", "activated", "sword", "weapon"],
  },
  {
    id: "sounds-lighting",
    kind: "lesson",
    level: "مبتدئ",
    title: "الصوت والإضاءة: أجواء تغمس اللاعب",
    summary: "Sound و Lighting وتغيير الجو العام للعبة.",
    content: [
      "الصوت كائن Sound فيه خاصية SoundId لملف من مكتبة روبلوكس، وخصائص Volume و Loop و PlaybackSpeed. شغله بـ ()\u200bPlay وأوقفه بـ ()\u200bStop، وللصوت المكاني ضع داخل جزء واستخدم خصائص التلاشي مع المسافة.",
      "لضمان الجاهزية قبل التشغيل انتظر خاصية IsLoaded أو حدث Loaded، وحمّل أصواتك المهمة مسبقاً عبر ()\u200bContentProvider.",
      "خدمة Lighting تتحكم بالمزاج: خاصية ClockTime ساعة اليوم (12 = ظهيرة، 0 = منتصف ليل)، و Brightness السطوع، و Ambient لون الظلال. أنماط البيئة مثل Skybox تضيف سماوات مذهلة.",
      "تفصيلة: تشغيل أصوات كثيرة دفعة واحدة يزعج — استخدم فواصل قصيرة وادمج المؤثرات المتشابهة، واضبط خصائص الـ Rolloff للصوت المكاني.",
    ],
    code: `local Lighting = game:GetService("Lighting")

-- صوت داخل جزء (موسيقى خلفية للعبة كلها)
local music = Instance.new("Sound")
music.SoundId = "rbxassetid://9046864499"
music.Volume = 0.4
music.Looped = true
music.Parent = workspace

music.Ended:Connect(function()
	print("انتهت المقطوعة")  -- لن يشتعل إذا كانت متكررة
end)
music:Play()

-- غروب شمس تدريجي
local tween = game:GetService("TweenService"):Create(
	Lighting,
	TweenInfo.new(30, Enum.EasingStyle.Linear),
	{ ClockTime = 19 }
)
tween:Play()`,
    tags: ["صوت", "اصوات", "موسيقي", "اضاءه", "نهار", "ليل", "غروب", "لايتينج", "ساوند", "اجواء", "sound", "lighting", "music", "clocktime", "مؤثرات"],
  },
];

/** مرجع سريع للقيم والأنواع الشائعة — يدخل في البحث والإجابات */
export const QUICK_REFERENCES: KnowledgeDoc[] = [
  {
    id: "ref-vectors",
    kind: "reference",
    level: "مبتدئ",
    title: "مرجع: المتجهات والألوان والإحداثيات",
    summary: "Vector3 و CFrame و Color3 و UDim2 — بناءات المواقع والألوان.",
    content: [
      "()Vector3.new(س، ص، ع) نقطة أو اتجاه في الفضاء الثلاثي. اجمع المتجهات للانزياح، وخذ ()\u200bMagnitude للمسافة بين نقطتين و ()\u200bUnit للاتجاه بلا طول.",
      "()CFrame.new(موقع) إطار كامل (موضع + تدوير)، و ()\u200bCFrame.lookAt(من، إلى) يجعل الكائن ينظر لهدف، و ()\u200bCFrame.Angles للتدوير بالراديان. أضف متجهاً إلى CFrame للانزياح النسبي.",
      "()Color3.fromRGB(ر، ج، ب) لون بقيم 0-255، و ()\u200bColor3.fromHSV للتحكم بالصبغة، و ()\u200bColor3.new بقيم 0-1.",
      "()UDim2.new(مقياسX، إزاحةX، مقياسY، إزاحةY) لمواقع الواجهات — المقياس نسبة من الشاشة والإزاحة بكسلات.",
    ],
    code: `-- المسافة بين نقطتين
local a = Vector3.new(0, 0, 0)
local b = Vector3.new(10, 0, 0)
print((b - a).Magnitude)  -- 10

-- اتجاه من نقطة لأخرى
local direction = (b - a).Unit

-- إطار ينظر نحو هدف
local look = CFrame.lookAt(a, b)

-- تدوير 90 درجة حول محور س
local rotated = CFrame.Angles(math.rad(90), 0, 0)

-- ألوان
local gold = Color3.fromRGB(245, 185, 66)
local mint = Color3.fromHex("#3DDC97")

-- موضع واجهة: منتصف الشاشة تماماً
local center = UDim2.new(0.5, 0, 0.5, 0)`,
    tags: ["فكتور", "فكتور3", "متجه", "سي فريم", "احداثيات", "لون", "الوان", "موضع", "تدوير", "اتجاه", "مسافه", "vector3", "cframe", "color3", "udim2", "position", "مسافة"],
  },
  {
    id: "ref-enum",
    kind: "reference",
    level: "مبتدئ",
    title: "مرجع: التعدادات Enum الشائعة",
    summary: "أشهر قيم Enum: الأنماط والخطوط وحالات الفيزياء.",
    content: [
      "التعدادات قوائم جاهزة من روبلوكس تصلها بـ ()\u200bEnum.اسم. أشهرها في الحركة: أنماط التوين ()\u200bEnum.EasingStyle واتجاهاته ()\u200bEnum.EasingDirection.",
      "للواجهات: خطوط النصوص ()\u200bEnum.Font مثل GothamBold، ومحاذاتها ()\u200bEnum.TextXAlignment.",
      "للفيزياء: أنواع التصادم ()\u200bEnum.CollisionBehavior، وحالات الهيومانويد ()\u200bEnum.HumanoidStateType مثل Seated و Freefall.",
      "تفصيلة: في المحرر عندما تكتب ()\u200bEnum. يظهر لك الإكمال التلقائي بكل الخيارات — راجعها قبل افتراض وجود قيمة.",
    ],
    code: `-- أشهر القيم التي ستستخدمها باستمرار
local style = Enum.EasingStyle.Bounce
local direction = Enum.EasingDirection.Out
local font = Enum.Font.GothamBold
local align = Enum.TextXAlignment.Center

-- حالات الشخصية
local state = Enum.HumanoidStateType.Ragdoll

-- اتجاهات المحاور الستة
local face = Enum.NormalId.Top

-- أنواع الإدخال
local input = Enum.UserInputType.MouseButton1`,
    tags: ["اينوم", "تعداد", "قوائم", "ستايل", "خط", "خطوط", "خطوط الكتابه", "حاله", "حالات", "enum", "easingstyle", "font", "values"],
  },
  {
    id: "ref-string-lib",
    kind: "reference",
    level: "متوسط",
    title: "مرجع: أنماط النصوص (Patterns) في لواو",
    summary: "string.gmatch و string.gsub وفئات الأحرف %a و %d و %s.",
    content: [
      "أنماط لواو نسخة مبسطة من التعابير النمطية: %d رقم، %a حرف، %s فراغ، %w حرف أو رقم، %p علامة ترقيم، و %x كل شيء ليس من الفئة (بحرف كبير). والنقطة أي حرف، و + تكرار مرة أو أكثر و * صفر أو أكثر و ? اختياري.",
      "()string.gmatch(نص، نمط) يمر على كل التطابقات واحدة واحدة — مثالية لتفكيك نص إلى كلمات.",
      "()string.gsub(نص، نمط، بديل) يستبدل كل التطابقات وترجع النص الجديد وعدد الاستبدالات.",
      "تفصيلة: للحروف الخاصة مثل القوس والنقطة ضع قبلها % لتصبح حرفية: %%( و %%.",
    ],
    code: `-- تفكيك جملة إلى كلمات
local sentence = "البرمجة فن حل المشكلات"
for word in string.gmatch(sentence, "%S+") do
	print("كلمة:", word)
end

-- استخراج كل الأرقام من نص
local mixed = "عندي 3 سيوف و 12 جرعة"
for number in string.gmatch(mixed, "%d+") do
	print("وجدنا رقماً:", number)
end

-- استبدال وتنظيف
local dirty = "  مرحبا   يا  عالم  "
local clean = string.gsub(dirty, "%s+", " ")
print(string.gsub(clean, "^%s*(.-)%s*$", "%1"))

-- هل النص يحتوي رقماً؟
print(string.find("غرفة42", "%d") ~= nil)  -- true`,
    tags: ["انماط", "باترن", "ريجكس", "بحث متقدم", "استبدال", "تفكيك", "قماتش", "جي سب", "patterns", "gmatch", "gsub", "regex"],
  },
  {
    id: "ref-table-lib",
    kind: "reference",
    level: "متوسط",
    title: "مرجع: دوال مكتبة table الكاملة",
    summary: "insert remove sort find move create pack unpack freeze clone.",
    content: [
      "أساسيات القوائم: ()\u200btable.insert و ()\u200btable.remove و ()\u200btable.sort (مع دالة مقارنة اختيارية للترتيب المخصص) و ()\u200btable.find.",
      "أدوات لواو الإضافية: ()\u200btable.create(حجم، قيمة) قائمة جاهزة الحجم، و ()\u200btable.move للنقل بين القوائم، و ()\u200btable.pack تجمع القيم المرجعة في جدول، و ()\u200btable.unpack تفكك الجدول إلى قيم.",
      "للحماية: ()\u200btable.freeze يجعل الجدول للقراءة فقط (أي كتابة ترفع خطأ)، و ()\u200btable.clone نسخة سطحية سريعة، و ()\u200btable.isfrozen للفحص.",
      "تفصيلة أداء: لقائمة تعرف حجمها مسبقاً أنشئها بـ ()\u200btable.create بدل الإضافة المتكررة — أسرع في الحلقات الضخمة.",
    ],
    code: `-- ترتيب مخصص: الأقدم مستوىً أولاً
local players = {
	{ name = "زيد", level = 20 },
	{ name = "سارة", level = 5 },
	{ name = "عمر", level = 12 },
}
table.sort(players, function(a, b)
	return a.level < b.level
end)

-- قائمة جاهزة الحجم
local grid = table.create(10, 0)  -- عشرة أصفار

-- تجميد الثوابت
local CONSTANTS = table.freeze({
	GRAVITY = 196,
	MAX_PLAYERS = 12,
})

-- pack / unpack مع الإرجاع المتعدد
local function multi() return 1, 2, 3 end
local packed = table.pack(multi())
print(packed.n)  -- 3
print(table.unpack(packed))  -- 1  2  3`,
    tags: ["تيببل", "مكتبه الجداول", "فرز", "ترتيب مخصص", "تجميد", "استنساخ", "باك", "انبك", "table.sort", "table.create", "table.freeze", "table.pack"],
  },
  {
    id: "ref-instance-create",
    kind: "reference",
    level: "مبتدئ",
    title: "مرجع: إنشاء الكائنات وتعديلها بالكود",
    summary: "Instance.new والخصائص الأساسية للأجزاء والصناديق.",
    content: [
      "()Instance.new(\"اسم النوع\") يصنع كائناً في الذاكرة دون أب بعد — اضبط خصائصه ثم ألحقه بالشجرة عبر خاصية Parent. أشهر الأنواع: Part و Model و Folder و RemoteEvent و Sound و ScreenGui.",
      "خصائص الجزء الأساسية: Name الاسم، Size الحجم، Position الموضع، Color اللون، Material الخامة، Anchored ثابت ضد الجاذبية، CanCollide يصطدم، Transparency الشفافية (0 مرئي، 1 مخفي).",
      "لتكرار كائن موجود: ()\u200bClone ينسخه مع خصائصه، و ()\u200bDestroy يدمره نهائياً (لا يمكن إرجاعه). و ()\u200bIsA يفحص النوع.",
      "تفصيلة: خاصية Archivable إذا كانت خطأ فلن يعمل Clone — الكائنات المصنوعة يدوياً في الاستوديو غالباً صالحة للنسخ.",
    ],
    code: `-- صناعة جزء مشع بالكامل بالكود
local part = Instance.new("Part")
part.Name = "Orb"
part.Shape = Enum.PartType.Ball
part.Size = Vector3.new(2, 2, 2)
part.Material = Enum.Material.Neon
part.Color = Color3.fromRGB(61, 220, 151)
part.Anchored = true
part.CanCollide = false
part.Position = Vector3.new(0, 10, 0)
part.Parent = workspace

-- فحص النوع قبل التعامل
if part:IsA("BasePart") then
	print("يمكن تحريكه فيزيائياً")
end

-- استنساخ وتدمير
local copy = part:Clone()
copy.Position += Vector3.new(5, 0, 0)
copy.Parent = workspace
task.delay(5, function()
	copy:Destroy()
end)`,
    tags: ["انشاء", "جزء", "بارت", "كائن جديد", "استنساخ", "تدمير", "خصائص", "لون", "حجم", "instance.new", "clone", "destroy", "part", "properties"],
  },
  {
    id: "ref-players-api",
    kind: "reference",
    level: "متوسط",
    title: "مرجع: أهم دوال خدمة Players",
    summary: "GetPlayers و GetPlayerFromCharacter و PlayerAdded و Kick.",
    content: [
      "()Players:GetPlayers() قائمة بكل اللاعبين المتصلين حالياً — يمر عليها في حلقة عند البث للجميع.",
      "()Players:GetPlayerFromCharacter(نموذج) ترجع اللاعب صاحب الشخصية — مفيدة جداً عند استقبال جزء لمسه في حدث ()\u200bTouched للتعرف على صاحب اللمسة.",
      "حدثا الدخول والخروج: PlayerAdded و PlayerRemoving — عليهما تُبنى أنظمة الترحيب والحفظ.",
      "()player:Kick(رسالة) يطرد لاعباً برسالة، و ()\u200bplayer:GetJoinData فيها تاريخ انضمامه ومكانه — مفيدة لتجارب الاستقبال.",
    ],
    code: `local Players = game:GetService("Players")

-- الترحيب بكل داخل وحفظ بيانات كل خارج
Players.PlayerAdded:Connect(function(player)
	print("أهلاً " .. player.Name .. "!")
	-- هنا تحمّل بياناته من الداتا ستور
end)

Players.PlayerRemoving:Connect(function(player)
	print("وداعاً " .. player.Name)
	-- هنا تحفظ بياناته
end)

-- من حدث لمس: من لمس الجزء؟
local function whoTouched(hit: BasePart)
	local character = hit.Parent
	return Players:GetPlayerFromCharacter(character)
end

-- بث رسالة لكل اللاعبين
for _, player in Players:GetPlayers() do
	print("إلى:", player.Name)
end`,
    tags: ["لاعبين", "خدمه اللاعبين", "دخول", "خروج", "طرد", "بث", "ترحيب", "لمن", "من لمس", "getplayers", "playeradded", "playerremoving", "getplayerfromcharacter", "kick"],
  },
];
