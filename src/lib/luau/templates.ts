import { GAME_TEMPLATES } from "./templates-games";
import type { CodeTemplate } from "./types";

/**
 * مولد الأكواد — قوالب أنظمة كاملة جاهزة للنسخ إلى روبلوكس ستوديو.
 * مكتوبة يدوياً ومفحوصة منطقياً، بدون أي مولد خارجي.
 */
export const BASE_TEMPLATES: CodeTemplate[] = [
  {
    id: "leaderstats",
    title: "نظام نقاط وذهب يظهر على الشاشة (Leaderstats)",
    description: "يضيف لكل لاعب لوحة إحصائيات فيها الذهب والنقاط، مع دوال جاهزة للزيادة.",
    keywords: ["نقاط", "نقطه", "ذهب", "عملات", "احصائيات", "شاشه اللاعب", "ليدر ستاتس", "سكور", "leaderstats", "coins", "gold", "points", "score", "stats"],
    placement: "ضع السكربت داخل ServerScriptService",
    scripts: [
      {
        name: "LeaderstatsManager",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Players = game:GetService("Players")

local function createStats(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"

	local gold = Instance.new("IntValue")
	gold.Name = "Gold"
	gold.Value = 0
	gold.Parent = stats

	local points = Instance.new("IntValue")
	points.Name = "Points"
	points.Value = 0
	points.Parent = stats

	stats.Parent = player
end

Players.PlayerAdded:Connect(createStats)

-- للاعبين الموجودين أصلاً قبل تشغيل السكربت
for _, player in Players:GetPlayers() do
	if not player:FindFirstChild("leaderstats") then
		createStats(player)
	end
end`,
      },
      {
        name: "CoinGiver (مثال منح ذهب)",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Players = game:GetService("Players")

-- مثال: امنح ذهباً عند لمس جزء اسمه GoldPart
local goldPart = workspace:WaitForChild("GoldPart")

goldPart.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then return end

	local stats = player:FindFirstChild("leaderstats")
	local gold = stats and stats:FindFirstChild("Gold")
	if gold then
		gold.Value += 10
	end
end)`,
      },
    ],
    notes: [
      "المجلد يجب أن يكون اسمه leaderstats بالضبط (بحروف صغيرة) ليظهر على الشاشة.",
      "لا تعدل القيم من لوكال سكريبت — التعديل دائماً على السيرفر وإلا يرى اللاعب نفسه فقط.",
      "للحفظ بين الجلسات اربط هذه القيم بنظام الداتا ستور.",
    ],
  },
  {
    id: "kill-brick",
    title: "فخ قاتل: جزء يقتل من يلمسه (Kill Brick)",
    description: "جزء لامس يقتل الشخصية فوراً، مع حماية من التكرار وتجاهل الأجسام غير الحية.",
    keywords: ["فخ", "يقتل", "قتل", "لافا", "حمم", "يلامس", "موت فوري", "kill brick", "killbrick", "lava", "trap", "damage part", "ليمس يقتل"],
    placement: "ضع السكربت داخل الجزء نفسه (Part) في Workspace",
    scripts: [
      {
        name: "KillBrick",
        location: "داخل الجزء (مثلاً جزء اسمه Lava)",
        scriptType: "Script",
        code: `local brick = script.Parent
local COOLDOWN = 1  -- ثانية حماية بين كل ضربة لنفس الشخصية

local recentlyHit = {}

brick.Touched:Connect(function(hit)
	local character = hit:FindFirstAncestorOfClass("Model")
	if not character then return end

	local humanoid = character:FindFirstChildOfClass("Humanoid")
	if not humanoid or humanoid.Health <= 0 then return end

	-- منع التكرار السريع لنفس الشخصية
	if recentlyHit[character] then return end
	recentlyHit[character] = true
	task.delay(COOLDOWN, function()
		recentlyHit[character] = nil
	end)

	humanoid.Health = 0
end)

-- مظهر الحمم البركانية
brick.Color = Color3.fromRGB(255, 80, 30)
brick.Material = Enum.Material.Neon`,
      },
    ],
    notes: [
      "حدث Touched قد يشتعل عدة مرات في الإطار الواحد — جدول الحماية ضروري.",
      "لضرر جزئي بدل القتل استبدل السطر الأخير بـ: ()\u200bhumanoid:TakeDamage(25).",
      "يمكن استخدام نفس الفكرة لمناطق ضرر مستمرة بإضافة حلقة داخلية.",
    ],
  },
  {
    id: "teleport-pad",
    title: "منصة انتقال فوري (Teleport Pad)",
    description: "منصة تنقل اللاعب لموقع آخر عند الوقوف عليها، مع فترة انتظار ومؤثر بصري.",
    keywords: ["انتقال", "تليبورت", "ينقل", "بوابة", "بوابه", "منصه", "سفر", "portal", "teleport", "teleporter", "pad", "warp"],
    placement: "أنشئ جزأين: PadA و PadB في Workspace، وضع السكربت داخل كل واحد",
    scripts: [
      {
        name: "TeleportPad",
        location: "داخل جزء المنصة",
        scriptType: "Script",
        code: `local pad = script.Parent
local destinationName = "PadB"  -- اسم المنصة الهدف
local COOLDOWN = 2

local lastUse = {}

pad.Touched:Connect(function(hit)
	local character = hit:FindFirstAncestorOfClass("Model")
	if not character then return end
	local root = character:FindFirstChild("HumanoidRootPart")
	if not root then return end

	local now = os.clock()
	if lastUse[character] and now - lastUse[character] < COOLDOWN then
		return
	end
	lastUse[character] = now

	local destination = workspace:FindFirstChild(destinationName)
	if destination and destination:IsA("BasePart") then
		-- انقل فوق المنصة الهدف بقليل لتفادي التصادم
		root.CFrame = destination.CFrame + Vector3.new(0, 4, 0)
	end
end)

-- لون مميز للمنصة
pad.Color = Color3.fromRGB(61, 220, 151)
pad.Material = Enum.Material.Neon`,
      },
    ],
    notes: [
      "غير destinationName لاسم المنصة المقابلة — واجعل في المنصة المقابلة سكربتاً مشابهاً بالاتجاه العكسي للانتقال الثنائي.",
      "فترة الانتظار تمنع حلقة انتقال لا نهائية بين المنصتين.",
      "لا تنقل من الكلينت أبداً — النقل الفعلي يجب أن يكون على السيرفر.",
    ],
  },
  {
    id: "datastore-full",
    title: "نظام حفظ بيانات كامل مع إعادة المحاولة",
    description: "يحفظ ذهب اللاعب ومستوىه عند الخروج ويحملها عند الدخول، مع حماية من الفشل وحفظ عند الإغلاق.",
    keywords: ["حفظ", "يحفظ", "تخزين", "داتا ستور", "بيانات اللاعب", "تقدم", "يسترجع", "datastore", "save", "load", "data save", "player data", "progress"],
    placement: "ضع السكربت داخل ServerScriptService",
    scripts: [
      {
        name: "PlayerDataStore",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")

local store = DataStoreService:GetDataStore("PlayerData_v1")
local playerData = {}  -- البيانات الحية أثناء الجلسة

local DEFAULT_DATA = { Gold = 100, Level = 1 }

local function withRetry(operation, attempts)
	for i = 1, attempts do
		local ok, result = pcall(operation)
		if ok then return true, result end
		warn("محاولة فاشلة رقم " .. i .. ": " .. tostring(result))
		task.wait(1)
	end
	return false, nil
end

local function loadData(player)
	local key = "player_" .. player.UserId
	local ok, data = withRetry(function()
		return store:GetAsync(key)
	end, 3)

	if ok and typeof(data) == "table" then
		playerData[player] = data
	else
		playerData[player] = table.clone(DEFAULT_DATA)
	end
end

local function saveData(player)
	local data = playerData[player]
	if not data then return end
	local key = "player_" .. player.UserId
	withRetry(function()
		store:UpdateAsync(key, function()
			return data
		end)
	end, 3)
end

Players.PlayerAdded:Connect(function(player)
	loadData(player)
	print(player.Name .. " — الذهب:", playerData[player].Gold)
end)

Players.PlayerRemoving:Connect(function(player)
	saveData(player)
	playerData[player] = nil
end)

-- حفظ الجميع عند إغلاق السيرفر (تحديث مثلاً)
game:BindToClose(function()
	for _, player in Players:GetPlayers() do
		saveData(player)
	end
	task.wait(2)
end)

-- منح ذهب (ادعُ هذه الدالة من أي مكان)
local module = {}
function module.addGold(player, amount)
	local data = playerData[player]
	if data then data.Gold += amount end
end

return module`,
      },
    ],
    notes: [
      "فعّل Studio Access to API Services من إعدادات اللعبة وإلا ستفشل الاستدعاءات في الاستوديو.",
      "استخدم أسماء مفاتيح مختلفة عند تغيير بنية البيانات (v1 إلى v2) للحفاظ على النسخ القديمة.",
      "الحد الأقصى لطلبات الداتا ستور محدود — لا تحفظ أكثر من مرة كل بضع ثوانٍ لكل لاعب.",
    ],
  },
  {
    id: "remote-shop",
    title: "متجر آمن بين الكلينت والسيرفر",
    description: "زر شراء على الشاشة يرسل طلباً للسيرفر، والسيرفر يتحقق من السعر والرصيد قبل الخصم.",
    keywords: ["متجر", "شراء", "يشتري", "بيع", "محل", "خصم", "سعر", "shop", "store", "buy", "purchase", "economy", "متجر داخل اللعبه"],
    placement: "ريموت في ReplicatedStorage + سكربت سيرفر + لوكال سكريبت",
    scripts: [
      {
        name: "أولاً: أنشئ RemoteEvent باسم BuyRequest في ReplicatedStorage",
        location: "ReplicatedStorage",
        scriptType: "Script",
        code: `-- أنشئه يدوياً من الاستوديو:
-- ReplicatedStorage > زر + > RemoteEvent > اسمه BuyRequest`,
      },
      {
        name: "ShopServer",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local Players = game:GetService("Players")

local buyRequest = ReplicatedStorage:WaitForChild("BuyRequest")

local SHOP = {
	sword = { price = 100, give = "سيف" },
	potion = { price = 25, give = "جرعة" },
}

local lastRequest = {}

buyRequest.OnServerEvent:Connect(function(player, itemId, quantity)
	-- تحقق من النوع والقيم
	if typeof(itemId) ~= "string" or typeof(quantity) ~= "number" then return end
	quantity = math.floor(math.clamp(quantity, 1, 10))

	local item = SHOP[itemId]
	if not item then
		warn(player.Name .. " حاول شراء عنصر غير موجود: " .. itemId)
		return
	end

	-- مكافحة الإغراق: طلب واحد كل ثانية
	local now = os.clock()
	if lastRequest[player] and now - lastRequest[player] < 1 then return end
	lastRequest[player] = now

	-- الرصيد: نفترض وجود leaderstats فيها Gold
	local stats = player:FindFirstChild("leaderstats")
	local gold = stats and stats:FindFirstChild("Gold")
	if not gold then return end

	local totalCost = item.price * quantity
	if gold.Value >= totalCost then
		gold.Value -= totalCost
		print(player.Name .. " اشترى " .. quantity .. " × " .. item.give)
		-- هنا أعطِ اللاعب العنصر (أداة، عدة، ترقية...)
	else
		warn(player.Name .. " لا يملك ما يكفي من الذهب")
	end
end)`,
      },
      {
        name: "ShopClient",
        location: "StarterPlayer > StarterPlayerScripts",
        scriptType: "LocalScript",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local buyRequest = ReplicatedStorage:WaitForChild("BuyRequest")

-- مثال: إرسال طلب شراء سيف واحد
-- عادة تربط هذا بزر واجهة (انظر درس الواجهات)
local function buy(itemId, quantity)
	buyRequest:FireServer(itemId, quantity or 1)
end

buy("sword", 1)`,
      },
    ],
    notes: [
      "كل المنطق المالي على السيرفر فقط — الكلينت يرسل الطلب ولا شيء غيره.",
      "حدّد الكمية دائماً بين 1 وحد أقصى لمنع الأرقام السالبة أو الضخمة.",
      "أضف واجهة أزرار من درس الواجهات واربط كل زر بدالة الشراء مع اسم العنصر.",
    ],
  },
  {
    id: "moving-platform",
    title: "منصة متحركة ذهاباً وإياباً (Tween)",
    description: "منصة تتحرك بسلاسة بين نقطتين للأبد — أساسية في ألعاب المنصات (Obby).",
    keywords: ["منصه متحركه", "تحريك منصه", "تتحرك", "ذهاب واياب", "اوبي", "obby", "moving platform", "platform", "tween platform", "حركه سلسه"],
    placement: "أنشئ جزأين: Platform (المتحرك) و MarkerA و MarkerB (نقطتان مرجعيتان)، والسكربت داخل المنصة",
    scripts: [
      {
        name: "MovingPlatform",
        location: "داخل الجزء المتحرك",
        scriptType: "Script",
        code: `local TweenService = game:GetService("TweenService")

local platform = script.Parent
local markerA = workspace:WaitForChild("MarkerA")
local markerB = workspace:WaitForChild("MarkerB")

local SPEED = 8  -- سرعة تقريبية بالدرجات في الثانية

platform.Anchored = true
platform.Position = markerA.Position

local function tweenTo(target)
	local distance = (target.Position - platform.Position).Magnitude
	local duration = distance / SPEED

	local info = TweenInfo.new(
		duration,
		Enum.EasingStyle.Sine,
		Enum.EasingDirection.InOut
	)
	local tween = TweenService:Create(platform, info, { Position = target.Position })
	tween:Play()
	return tween
end

-- حلقة للأبد: أ ثم ب ثم أ...
while true do
	local toB = tweenTo(markerB)
	toB.Completed:Wait()
	local toA = tweenTo(markerA)
	toA.Completed:Wait()
end`,
      },
    ],
    notes: [
      "اجعل النقطتين المرجعيتين شفافتين وغير قابلتين للتصادم (CanCollide = false).",
      "اللاعب يركب المنصة المتحركة تلقائياً لأنها جزء فيزيائي مرسخ.",
      "غير SPEED لتسريع أو إبطاء الحركة — المدة تُحسب من المسافة تلقائياً.",
    ],
  },
  {
    id: "npc-chaser",
    title: "زومبي ذكي يلاحق أقرب لاعب",
    description: "عدو بموديل كامل يبحث عن أقرب لاعب ضمن مسافة ملاحظة ويلاحقه بحساب المسارات.",
    keywords: ["زومبي", "عدو", "يلاحق", "يطارد", "يتبع", "ان بي سي", "وحش", "مطارده", "npc", "zombie", "enemy", "chase", "follow", "monster", "وحش يطارد"],
    placement: "أنشئ موديل باسم Zombie فيه جزء اسمه Humanoid وجزء اسمه HumanoidRootPart، وضع السكربت داخل الموديل",
    scripts: [
      {
        name: "ZombieBrain",
        location: "داخل موديل الزومبي",
        scriptType: "Script",
        code: `local PathfindingService = game:GetService("PathfindingService")
local Players = game:GetService("Players")

local zombie = script.Parent
local humanoid = zombie:WaitForChild("Humanoid")
local root = zombie:WaitForChild("HumanoidRootPart")

local DETECTION_RANGE = 80
local ATTACK_RANGE = 5
local ATTACK_DAMAGE = 15
local REPATH_INTERVAL = 0.45

humanoid.WalkSpeed = 12

local function getTarget()
	local best, bestDist = nil, DETECTION_RANGE
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local targetRoot = character and character:FindFirstChild("HumanoidRootPart")
		local targetHumanoid = character and character:FindFirstChildOfClass("Humanoid")
		if targetRoot and targetHumanoid and targetHumanoid.Health > 0 then
			local dist = (targetRoot.Position - root.Position).Magnitude
			if dist < bestDist then
				best, bestDist = character, dist
			end
		end
	end
	return best, bestDist
end

local function chaseTarget(target)
	local targetRoot = target:FindFirstChild("HumanoidRootPart")
	if not targetRoot then return end

	local path = PathfindingService:CreatePath({
		AgentCanJump = true,
		AgentRadius = 2,
	})
	local ok = pcall(function()
		path:ComputeAsync(root.Position, targetRoot.Position)
	end)
	if not ok or path.Status ~= Enum.PathStatus.Success then
		humanoid:MoveTo(targetRoot.Position)
		return
	end

	for _, waypoint in path:GetWaypoints() do
		if waypoint.Action == Enum.PathWaypointAction.Jump then
			humanoid.Jump = true
		end
		humanoid:MoveTo(waypoint.Position)
		humanoid.MoveToFinished:Wait()
	end
end

while humanoid.Health > 0 do
	local target, dist = getTarget()
	if target then
		if dist <= ATTACK_RANGE then
			local targetHumanoid = target:FindFirstChildOfClass("Humanoid")
			if targetHumanoid then
				targetHumanoid:TakeDamage(ATTACK_DAMAGE)
			end
			task.wait(1)
		else
			chaseTarget(target)
		end
	else
		task.wait(REPATH_INTERVAL)
	end
	task.wait(REPATH_INTERVAL)
end`,
      },
    ],
    notes: [
      "الموديل يحتاج كائن Humanoid وجزء HumanoidRootPart ليعمل معه نظام المسارات.",
      "اضبط DETECTION_RANGE و ATTACK_DAMAGE حسب صعوبة لعبتك.",
      "لأعداء كثيرين زد REPATH_INTERVAL إلى 0.6-0.8 لتخفيف الحمل على السيرفر.",
    ],
  },
  {
    id: "click-counter-gui",
    title: "واجهة عداد نقرات مع زر",
    description: "زر على الشاشة يزيد عداداً ويعرضه، مع تصميم جاهز — أساس أي واجهة تفاعلية.",
    keywords: ["زر", "واجهه", "عداد", "نقرات", "ضغط", "شاشه", "جي يو اي", "click", "button", "gui", "counter", "gui button", "زر علي الشاشه"],
    placement: "ضع اللوكال سكريبت داخل StarterPlayer > StarterPlayerScripts",
    scripts: [
      {
        name: "ClickCounterGui",
        location: "StarterPlayer > StarterPlayerScripts",
        scriptType: "LocalScript",
        code: `local Players = game:GetService("Players")
local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- الشاشة الأم
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "ClickCounterGui"
screenGui.ResetOnSpawn = false
screenGui.Parent = playerGui

-- حاوية أنيقة
local frame = Instance.new("Frame")
frame.Size = UDim2.new(0, 260, 0, 150)
frame.Position = UDim2.new(0.5, -130, 0.85, -75)
frame.BackgroundColor3 = Color3.fromRGB(16, 23, 20)
frame.BackgroundTransparency = 0.15
frame.Parent = screenGui

local corner = Instance.new("UICorner")
corner.CornerRadius = UDim.new(0, 14)
corner.Parent = frame

-- نص العنوان
local title = Instance.new("TextLabel")
title.Size = UDim2.new(1, 0, 0, 40)
title.BackgroundTransparency = 1
title.Text = "عداد النقرات"
title.TextColor3 = Color3.fromRGB(233, 242, 236)
title.TextSize = 20
title.Font = Enum.Font.GothamBold
title.Parent = frame

-- نص العداد
local counterLabel = Instance.new("TextLabel")
counterLabel.Size = UDim2.new(1, 0, 0, 44)
counterLabel.Position = UDim2.new(0, 0, 0, 40)
counterLabel.BackgroundTransparency = 1
counterLabel.Text = "0"
counterLabel.TextColor3 = Color3.fromRGB(61, 220, 151)
counterLabel.TextSize = 34
counterLabel.Font = Enum.Font.GothamBold
counterLabel.Parent = frame

-- الزر
local button = Instance.new("TextButton")
button.Size = UDim2.new(0, 200, 0, 44)
button.Position = UDim2.new(0.5, -100, 1, -56)
button.BackgroundColor3 = Color3.fromRGB(23, 184, 119)
button.Text = "انقرني!"
button.TextColor3 = Color3.new(1, 1, 1)
button.TextSize = 20
button.Font = Enum.Font.GothamBold
button.Parent = frame

local buttonCorner = Instance.new("UICorner")
buttonCorner.CornerRadius = UDim.new(0, 10)
buttonCorner.Parent = button

-- المنطق
local clicks = 0
button.MouseButton1Click:Connect(function()
	clicks += 1
	counterLabel.Text = tostring(clicks)

	-- تأثير بصري بسيط عند النقر
	button.BackgroundColor3 = Color3.fromRGB(245, 185, 66)
	task.delay(0.1, function()
		button.BackgroundColor3 = Color3.fromRGB(23, 184, 119)
	end)
end)`,
      },
    ],
    notes: [
      "لكي يؤثر النقر على بيانات حقيقية (ذهب، نقاط) أرسل الطلب للسيرفر بـ RemoteEvent — راجع قالب المتجر الآمن.",
      "غير مواقع UDim2 لنقل الواجهة لأي مكان على الشاشة.",
      "ResetOnSpawn = false تبقي الواجهة ظاهرة بعد الموت وإعادة التولد.",
    ],
  },
  {
    id: "sprint",
    title: "نظام ركض بالضغط على Shift",
    description: "يركض اللاعب أسرع أثناء الضغط على زر، مع استهلاك شريط طاقة يتجدد.",
    keywords: ["ركض", "يجري", "اسرع", "سبرنت", "زناد", "شيفت", "طاقه", "جري", "sprint", "run", "shift", "dash", "speed boost", "يجري بسرعه"],
    placement: "ضع اللوكال سكريبت داخل StarterPlayer > StarterCharacterScripts، وسكربت السيرفر للتحقق",
    scripts: [
      {
        name: "SprintClient",
        location: "StarterPlayer > StarterCharacterScripts",
        scriptType: "LocalScript",
        code: `local Players = game:GetService("Players")
local UserInputService = game:GetService("UserInputService")
local RunService = game:GetService("RunService")

local player = Players.LocalPlayer
local character = script.Parent
local humanoid = character:WaitForChild("Humanoid")

local WALK_SPEED = 16
local SPRINT_SPEED = 28
local MAX_STAMINA = 100
local DRAIN_PER_SECOND = 22
local REGEN_PER_SECOND = 15

local stamina = MAX_STAMINA
local sprinting = false

UserInputService.InputBegan:Connect(function(input, processed)
	if processed then return end
	if input.KeyCode == Enum.KeyCode.LeftShift then
		sprinting = true
	end
end)

UserInputService.InputEnded:Connect(function(input)
	if input.KeyCode == Enum.KeyCode.LeftShift then
		sprinting = false
	end
end)

RunService.Heartbeat:Connect(function(deltaTime)
	if sprinting and stamina > 0 and humanoid.MoveDirection.Magnitude > 0.1 then
		stamina = math.max(0, stamina - DRAIN_PER_SECOND * deltaTime)
		humanoid.WalkSpeed = SPRINT_SPEED
	else
		stamina = math.min(MAX_STAMINA, stamina + REGEN_PER_SECOND * deltaTime)
		humanoid.WalkSpeed = WALK_SPEED
	end
end)

print("نظام الركض جاهز — اضغط LeftShift للركض")`,
      },
    ],
    notes: [
      "في لعبة تنافسية، تحقق على السيرفر من سرعة اللاعب الفعلية واطرد من يتجاوز الحد الأقصى المنطقي.",
      "أضف شريط طاقة على الشاشة من قالب الواجهات ليرى اللاعب طاقته.",
      "يمكن ربط الركض بزر على الجوال عبر زر واجهة يرسل نفس الحالة.",
    ],
  },
  {
    id: "double-jump",
    title: "قفزة مزدوجة في الهواء",
    description: "يقفز اللاعب مرتين: قفزة أرضية وقفزة هوائية إضافية.",
    keywords: ["قفزه مزدوجه", "يقفز مرتين", "قفزتين", "دبل جمب", "في الهواء", "double jump", "air jump", "يقفز بالهواء"],
    placement: "ضع اللوكال سكريبت داخل StarterPlayer > StarterCharacterScripts",
    scripts: [
      {
        name: "DoubleJump",
        location: "StarterPlayer > StarterCharacterScripts",
        scriptType: "LocalScript",
        code: `local UserInputService = game:GetService("UserInputService")

local character = script.Parent
local humanoid = character:WaitForChild("Humanoid")

local canDoubleJump = false
local hasDoubleJumped = false
local DOUBLE_JUMP_POWER = 45

humanoid.StateChanged:Connect(function(_, newState)
	if newState == Enum.HumanoidStateType.Jumped then
		-- بعد القفزة الأولى نسمح بالمزدوجة بعد لحظة
		task.delay(0.15, function()
			canDoubleJump = true
		end)
	elseif newState == Enum.HumanoidStateType.Landed then
		canDoubleJump = false
		hasDoubleJumped = false
	end
end)

UserInputService.JumpRequest:Connect(function()
	if not canDoubleJump or hasDoubleJumped then return end
	hasDoubleJumped = true
	canDoubleJump = false

	humanoid:ChangeState(Enum.HumanoidStateType.Jumping)
	humanoid.JumpPower = DOUBLE_JUMP_POWER
	task.delay(0.3, function()
		humanoid.JumpPower = 50  -- أرجع القيمة الأصلية
	end)
end)`,
      },
    ],
    notes: [
      "حدث JumpRequest يُطلق عند أي إدخال قفز (مسافة، زر جوال) — لا حاجة لفحص الأزرار يدوياً.",
      "اضبط DOUBLE_JUMP_POWER لجعل القفزة الثانية أعلى أو أخفض من الأولى.",
      "لثلاث قفزات أو أكثر حول المتغيرات إلى عدّاد يقارن بحد أقصى.",
    ],
  },
  {
    id: "day-night",
    title: "دورة نهار وليل كاملة",
    description: "تدور الساعة في السماء تلقائياً من فجر إلى ليل، مع إمكانية ضبط سرعة اليوم.",
    keywords: ["نهار", "ليل", "دوره", "وقت", "شمس", "قمر", "ساعه", "يوم كامل", "غروب", "شروق", "day night", "daynight", "cycle", "time cycle", "ساعة اليوم"],
    placement: "ضع السكربت داخل ServerScriptService",
    scripts: [
      {
        name: "DayNightCycle",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Lighting = game:GetService("Lighting")
local RunService = game:GetService("RunService")

-- كم يستغرق اليوم الكامل بالثواني الحقيقية
local DAY_LENGTH_SECONDS = 240

local HOURS_PER_DAY = 24
local hoursPerSecond = HOURS_PER_DAY / DAY_LENGTH_SECONDS

RunService.Heartbeat:Connect(function(deltaTime)
	Lighting.ClockTime += hoursPerSecond * deltaTime
	if Lighting.ClockTime >= 24 then
		Lighting.ClockTime -= 24
	end
end)

-- ابدأ من الصباح
Lighting.ClockTime = 8
print("دورة النهار والليل تعمل — اليوم الكامل: " .. DAY_LENGTH_SECONDS .. " ثانية")`,
      },
    ],
    notes: [
      "غير DAY_LENGTH_SECONDS: روبلوكس الافتراضي يوم كامل بـ 1440 ثانية (24 دقيقة).",
      "أضف إنارة شوارع تربط بحدث تغير الساعة لتشتعل ليلاً فقط.",
      "لإيقاف الليل في منطقة معينة علق الوقت على قيمة ثابتة بدل الدورة.",
    ],
  },
  {
    id: "proximity-door",
    title: "باب يفتح بالاقتراب وينغلق بالابتعاد",
    description: "باب ينزلق للأعلى بسلاسة عندما يقترب لاعب، وينغلق عند ابتعاد الجميع.",
    keywords: ["باب", "يفتح", "ينغلق", "اقتراب", "ينزلق", "فتح تلقائي", "door", "opens", "proximity", "sliding door", "باب يفتح", "بوابة تفتح"],
    placement: "أنشئ جزءاً اسمه Door، وضع السكربت داخله",
    scripts: [
      {
        name: "ProximityDoor",
        location: "داخل جزء الباب",
        scriptType: "Script",
        code: `local TweenService = game:GetService("TweenService")
local Players = game:GetService("Players")

local door = script.Parent
local OPEN_RANGE = 12
local OPEN_HEIGHT = 8
local TWEEN_TIME = 0.8

door.Anchored = true
local closedCFrame = door.CFrame
local openCFrame = closedCFrame * CFrame.new(0, OPEN_HEIGHT, 0)
local isOpen = false

local function playersInRange()
	local count = 0
	for _, player in Players:GetPlayers() do
		local character = player.Character
		local root = character and character:FindFirstChild("HumanoidRootPart")
		if root and (root.Position - door.Position).Magnitude <= OPEN_RANGE then
			count += 1
		end
	end
	return count
end

local function setDoor(open)
	if isOpen == open then return end
	isOpen = open

	local info = TweenInfo.new(TWEEN_TIME, Enum.EasingStyle.Quad, Enum.EasingDirection.Out)
	local goal = { CFrame = open and openCFrame or closedCFrame }
	TweenService:Create(door, info, goal):Play()
end

while true do
	setDoor(playersInRange() > 0)
	task.wait(0.3)
end`,
      },
    ],
    notes: [
      "الباب يجب أن يكون مرسخاً (Anchored) وإلا سيسقط عند تحريكه.",
      "بدل الحلقة الدورية يمكنك استخدام ProximityPrompt لمنح اللاعب زر فتح يدوي.",
      "لأبواب تتطلب مفتاحاً أضف فحصاً لامتلاك اللاعب أداة أو خاصية قبل الفتح.",
    ],
  },
  {
    id: "collectible-coins",
    title: "عملات قابلة للالتقاط بالوسوم",
    description: "سكربت واحد يدير كل عملات الخريطة عبر وسم Coin — أضف عملة جديدة ويبدأ عملها فوراً.",
    keywords: ["عملات", "التقاط", "يجمع", "كوينز", "كنز", "اجمع", "collect", "coins", "pickup", "collectible", "عمله", "جمع العملات"],
    placement: "وسم كل أجزاء العملات بـ Coin، وضع السكربت في ServerScriptService",
    scripts: [
      {
        name: "CoinCollector",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local COIN_VALUE = 5
local RESPAWN_SECONDS = 15

local function giveCoins(player)
	local stats = player:FindFirstChild("leaderstats")
	local gold = stats and stats:FindFirstChild("Gold")
	if gold then
		gold.Value += COIN_VALUE
	end
end

local function setupCoin(coin)
	if not coin:IsA("BasePart") then return end
	coin.CanCollide = false

	local lastPosition = coin.CFrame

	coin.Touched:Connect(function(hit)
		if not coin.Parent then return end
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end

		local collectedFrame = coin
		collectedFrame.Parent = nil  -- أخفها فوراً
		giveCoins(player)

		-- أعد إظهارها بعد مدة
		task.delay(RESPAWN_SECONDS, function()
			collectedFrame.CFrame = lastPosition
			collectedFrame.Parent = workspace
		end)
	end)
end

for _, coin in CollectionService:GetTagged("Coin") do
	setupCoin(coin)
end

CollectionService:GetInstanceAddedSignal("Coin"):Connect(setupCoin)`,
      },
    ],
    notes: [
      "أضف الوسم من نافذة Tags في الاستوديو أو بالكود: ()\u200bCollectionService:AddTag(العملة، \"Coin\").",
      "اجعل العملات تدور بمظهر جميل عبر سكربت دوران بسيط على Heartbeat.",
      "لعملات نادرة أضف وسماً ثانياً مثل \"RareCoin\" وقيمة أعلى.",
    ],
  },
  {
    id: "health-regen",
    title: "تجدد الصحة تدريجياً بعد القتال",
    description: "تبدأ صحة اللاعب بالتجدد بعد ثوانٍ من آخر ضرر تلقاه — نظام شائع في ألعاب الأكشن.",
    keywords: ["تجدد", "صحه", "يسترجع صحه", "يشفى", "علاج", "جرعه", "regen", "heal", "health regen", "regeneration", "يتجدد", "علاج تلقائي"],
    placement: "ضع السكربت داخل StarterPlayer > StarterCharacterScripts",
    scripts: [
      {
        name: "HealthRegen",
        location: "StarterPlayer > StarterCharacterScripts",
        scriptType: "Script",
        code: `local character = script.Parent
local humanoid = character:WaitForChild("Humanoid")

local REGEN_DELAY = 5      -- ثوانٍ بعد آخر ضرر قبل بدء التجدد
local REGEN_RATE = 8       -- نقاط صحة في الثانية
local REGEN_CAP = 0.6      -- يتجدد حتى 60% فقط من الحد الأقصى

local lastDamageTime = os.clock()

humanoid.HealthChanged:Connect(function(newHealth)
	-- أي نقصان في الصحة = ضرر
	lastDamageTime = os.clock()
end)

while humanoid.Health > 0 do
	task.wait(0.25)

	local cap = humanoid.MaxHealth * REGEN_CAP
	local sinceDamage = os.clock() - lastDamageTime

	if sinceDamage >= REGEN_DELAY and humanoid.Health < cap then
		local step = REGEN_RATE * 0.25
		humanoid.Health = math.min(humanoid.Health + step, cap)
	end
end`,
      },
    ],
    notes: [
      "للتجدد الكامل حتى 100% غير REGEN_CAP إلى 1.",
      "لألعاب السيرفر الصارمة شغل هذا على السيرفر لا على الكلينت حتى لا يتلاعب اللاعبون.",
      "أضف مؤثر جزيئات خفيف أثناء التجدد ليحس اللاعب بالشفاء.",
    ],
  },
  {
    id: "chat-commands",
    title: "أوامر شات للمشرفين",
    description: "نظام أوامر بسيط: اكتب في الشات /heal و /speed و /kill لتنفيذ أوامر على نفسك أو غيرك.",
    keywords: ["اوامر", "شات", "تشات", "امر", "مشرف", "ادمن", "هيال", "سبيد", "chat commands", "commands", "admin", "امر في الشات", "اوامر الشات"],
    placement: "ضع السكربت داخل ServerScriptService",
    scripts: [
      {
        name: "ChatCommands",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Players = game:GetService("Players")

-- أسماء اللاعبين المسموح لهم استخدام الأوامر
local ADMINS = { "اسمك_هنا" }

local function isAdmin(player)
	return table.find(ADMINS, player.Name) ~= nil
end

local function getHumanoid(player)
	local character = player.Character
	return character and character:FindFirstChildOfClass("Humanoid")
end

local function handleCommand(player, message)
	if not isAdmin(player) then return end
	local humanoid = getHumanoid(player)
	if not humanoid then return end

	if message:lower():sub(1, 6) == "/heal " then
		humanoid.Health = humanoid.MaxHealth
	elseif message:lower():sub(1, 7) == "/speed " then
		local value = tonumber(message:sub(8))
		if value then
			humanoid.WalkSpeed = math.clamp(value, 8, 100)
		end
	elseif message:lower() == "/jump" then
		humanoid.Jump = true
	elseif message:lower() == "/kill" then
		humanoid.Health = 0
	end
end

Players.PlayerAdded:Connect(function(player)
	player.Chatted:Connect(function(message)
		handleCommand(player, message)
	end)
end)`,
      },
    ],
    notes: [
      "استبدل اسمك_هنا باسم حسابك في روبلوكس بالضبط.",
      "حدث Chatched يعمل مع شات النص الكلاسيكي — لأنظمة الشات الحديثة قد تحتاج ربطاً إضافياً.",
      "في لعبة حقيقية استخدم رتباً وصلاحيات بدل قائمة أسماء ثابتة.",
    ],
  },
  {
    id: "damage-zone",
    title: "منطقة ضرر مستمرة (Poison Zone)",
    description: "منطقة يؤذي الوقوف فيها اللاعب تدريجياً كل ثانية حتى يخرج منها.",
    keywords: ["منطقه ضرر", "سم", "مؤذيه", "تؤذي", "منطقه سامه", "غاز", "ضرر مستمر", "damage zone", "poison", "dot", "aoe damage", "منطقة مؤذية"],
    placement: "أنشئ جزءاً كبيراً شفافاً اسمه PoisonZone وضع السكربت داخله",
    scripts: [
      {
        name: "PoisonZone",
        location: "داخل جزء المنطقة",
        scriptType: "Script",
        code: `local zone = script.Parent

local DAMAGE_PER_TICK = 5
local TICK_SECONDS = 1

zone.CanCollide = false
zone.Transparency = 0.6
zone.Color = Color3.fromRGB(90, 200, 60)

local victims = {}

zone.Touched:Connect(function(hit)
	local character = hit:FindFirstAncestorOfClass("Model")
	local humanoid = character and character:FindFirstChildOfClass("Humanoid")
	if humanoid and humanoid.Health > 0 then
		victims[character] = true
	end
end)

zone.TouchEnded:Connect(function(hit)
	local character = hit:FindFirstAncestorOfClass("Model")
	if character then
		victims[character] = nil
	end
end)

-- حلقة الضرر الدوري
while true do
	for character, _ in victims do
		local humanoid = character:FindFirstChildOfClass("Humanoid")
		if humanoid and humanoid.Health > 0 and character.Parent then
			humanoid:TakeDamage(DAMAGE_PER_TICK)
		else
			victims[character] = nil
		end
	end
	task.wait(TICK_SECONDS)
end`,
      },
    ],
    notes: [
      "TouchEnded قد لا يشتعل دائماً عند الاختفاء المفاجئ — التنظيف داخل الحلقة يعالج ذلك.",
      "أضف مؤثر شاشة أخضر للضحايا عبر ريموت للكلينت ليعرفوا أنهم مسمومون.",
      "لمناطق شفاء بدل الضرر استبدل TakeDamage بزيادة الصحة مع حد أقصى.",
    ],
  },
];

/** كل الأنظمة: الأساسية + أنظمة الألعاب */
export const TEMPLATES: CodeTemplate[] = [...BASE_TEMPLATES, ...GAME_TEMPLATES];

export function getTemplate(id: string): CodeTemplate | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
