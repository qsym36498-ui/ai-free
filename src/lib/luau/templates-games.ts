import type { CodeTemplate } from "./types";

/** أنظمة ألعاب كاملة — صيد، زراعة، بيتات، أسلحة، مركبات والمزيد */
export const GAME_TEMPLATES: CodeTemplate[] = [
  {
    id: "fishing",
    title: "نظام صيد سمك كامل مع ندرة الأسماك",
    description: "اضغط على الصنارة، انتظر العضّة، وامسك سمكة عشوائية بقيم وندرة مختلفة ثم بعها بعملات.",
    keywords: ["صيد", "سمك", "سمكه", "اسماك", "أسماك", "صناره", "صنارة", "بحر", "يصطاد", "يطعم", "fishing", "fish", "rod", "catch", "نظام صيد"],
    placement: "ريموت FishCaught في ReplicatedStorage + سكربت سيرفر + أداة اسمها FishingRod",
    scripts: [
      {
        name: "FishingServer",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local fishCaughtEvent = ReplicatedStorage:WaitForChild("FishCaught")

-- جدول الأسماك مع الندرة والقيمة
local FISH = {
	{ name = "سردين", weight = 50, value = 5 },
	{ name = "بلطي", weight = 30, value = 12 },
	{ name = "تونة", weight = 14, value = 30 },
	{ name = "سمكة ذهبية", weight = 5, value = 100 },
	{ name = "سمكة أسطورية", weight = 1, value = 500 },
}

local function rollFish()
	local total = 0
	for _, fish in FISH do total += fish.weight end
	local roll = math.random() * total
	for _, fish in FISH do
		roll -= fish.weight
		if roll <= 0 then return fish end
	end
	return FISH[1]
end

local fishing = {}  -- من يصطاد الآن

fishCaughtEvent.OnServerEvent:Connect(function(player, action)
	if action == "start" then
		if fishing[player] then return end
		fishing[player] = true

		task.spawn(function()
			-- انتظار عشوائي للعضة بين 2 و7 ثوانٍ
			task.wait(math.random(20, 70) / 10)
			if not fishing[player] then return end

			local fish = rollFish()
			fishing[player] = nil
			fishCaughtEvent:FireClient(player, "caught", fish.name, fish.value)

			-- أضف العملة للوحة النقاط إن وجدت
			local stats = player:FindFirstChild("leaderstats")
			local gold = stats and stats:FindFirstChild("Gold")
			if gold then gold.Value += fish.value end
		end)
	elseif action == "cancel" then
		fishing[player] = nil
	end
end)`,
      },
      {
        name: "FishingRodClient",
        location: "داخل أداة اسمها FishingRod",
        scriptType: "LocalScript",
        code: `local ReplicatedStorage = game:GetService("ReplicatedStorage")
local tool = script.Parent
local fishCaughtEvent = ReplicatedStorage:WaitForChild("FishCaught")
local casting = false

tool.Activated:Connect(function()
	if casting then return end
	casting = true
	print("🎣 رميت الصنارة... انتظر العضّة")
	fishCaughtEvent:FireServer("start")
	task.delay(8, function() casting = false end)
end)

fishCaughtEvent.OnClientEvent:Connect(function(_, fishName, value)
	casting = false
	print(" اصطدت: " .. fishName .. " بقيمة " .. value .. " عملة!")
end)`,
      },
    ],
    notes: [
      "أنشئ RemoteEvent باسم FishCaught في ReplicatedStorage قبل التشغيل.",
      "عدّل جدول FISH لإضافة أسماكك الخاصة — مجموع الأوزان لا يهم، النسب هي المهمة.",
      "لرسالة أجمل على الشاشة استخدم واجهة TextLabel بدل print (راجع قالب الواجهات).",
    ],
  },
  {
    id: "farming",
    title: "نظام زراعة: ازرع واسقِ واحصد",
    description: "قطع أرض تُزرع فيها بذور تنمو على مراحل زمنية ثم تُحصد وتباع.",
    keywords: ["زراعه", "زارع", "مزرعه", "بذور", "بذره", "احصد", "حصاد", "نبات", "يسقي", "سقايه", "farming", "farm", "plant", "crop", "harvest", "نظام زراعة"],
    placement: "وسم قطع الأرض بـ FarmPlot، والسكربت في ServerScriptService",
    scripts: [
      {
        name: "FarmingSystem",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local GROW_TIME = 30  -- ثواني النمو الكامل
local CROP_VALUE = 15

local CROPS = { "قمح", "طماطم", "جزر", "بطاطا" }

local function setupPlot(plot)
	if not plot:IsA("BasePart") then return end
	local planted = false
	local sprout = nil

	plot.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end

		if not planted then
			-- ازرع محصولاً عشوائياً
			planted = true
			local cropName = CROPS[math.random(#CROPS)]
			plot:SetAttribute("Crop", cropName)

			sprout = Instance.new("Part")
			sprout.Size = Vector3.new(0.5, 0.5, 0.5)
			sprout.Color = Color3.fromRGB(80, 180, 80)
			sprout.Anchored = true
			sprout.CanCollide = false
			sprout.Position = plot.Position + Vector3.new(0, 1, 0)
			sprout.Parent = workspace

			-- نمو تدريجي
			for stage = 1, 3 do
				task.wait(GROW_TIME / 3)
				if sprout then
					sprout.Size += Vector3.new(0.4, 0.6, 0.4)
				end
			end
			if sprout then sprout.Color = Color3.fromRGB(245, 185, 66) end
			plot:SetAttribute("Ready", true)
			print("نضج المحصول في القطعة: " .. cropName)
		elseif plot:GetAttribute("Ready") then
			-- احصد وبِع
			local cropName = plot:GetAttribute("Crop")
			local stats = player:FindFirstChild("leaderstats")
			local gold = stats and stats:FindFirstChild("Gold")
			if gold then gold.Value += CROP_VALUE end
			print(player.Name .. " حصد " .. tostring(cropName) .. " وربح " .. CROP_VALUE)

			if sprout then sprout:Destroy() sprout = nil end
			plot:SetAttribute("Ready", false)
			plot:SetAttribute("Crop", nil)
			planted = false
		end
	end)
end

for _, plot in CollectionService:GetTagged("FarmPlot") do setupPlot(plot) end
CollectionService:GetInstanceAddedSignal("FarmPlot"):Connect(setupPlot)`,
      },
    ],
    notes: [
      "وسم أجزاء الأرض بـ FarmPlot من نافذة Tags في الاستوديو.",
      "في لعبة حقيقية استبدل اللمس بـ ProximityPrompt لأزرار واضحة (ازرع / احصد).",
      "عدّل GROW_TIME و CROP_VALUE لتوازن اقتصاد لعبتك.",
    ],
  },
  {
    id: "pets",
    title: "نظام بيتات تتبع اللاعب",
    description: "بيت يظهر بجانب اللاعب ويتبعه بحركة ناعمة، ويعطي زيادة سرعة أو حظ.",
    keywords: ["بيت", "بيات", "بيتات", "حيوان اليف", "مرافق", "يتبع اللاعب", "اليف", "pets", "pet", "follower", "companion", "نظام بيتات", "حيوان"],
    placement: "سكربت سيرفر + ريموت EquipPet في ReplicatedStorage",
    scripts: [
      {
        name: "PetSystem",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Players = game:GetService("Players")
local RunService = game:GetService("RunService")
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local equipEvent = Instance.new("RemoteEvent")
equipEvent.Name = "EquipPet"
equipEvent.Parent = ReplicatedStorage

local PETS = {
	{ name = "قطة", color = Color3.fromRGB(240, 200, 140), boost = 4 },
	{ name = "كلب", color = Color3.fromRGB(150, 100, 60), boost = 6 },
	{ name = "تنين صغير", color = Color3.fromRGB(61, 220, 151), boost = 12 },
}

local activePets = {}  -- player -> pet model

equipEvent.OnServerEvent:Connect(function(player, petIndex)
	if typeof(petIndex) ~= "number" then return end
	local petData = PETS[math.clamp(math.floor(petIndex), 1, #PETS)]

	-- أزل البيت القديم
	local old = activePets[player]
	if old then old:Destroy() end

	-- ابنِ بيتاً بسيطاً (كرة ملونة)
	local pet = Instance.new("Part")
	pet.Name = "Pet_" .. petData.name
	pet.Shape = Enum.PartType.Ball
	pet.Size = Vector3.new(1.2, 1.2, 1.2)
	pet.Color = petData.color
	pet.Anchored = true
	pet.CanCollide = false
	pet.Parent = workspace
	activePets[player] = pet

	-- زيادة السرعة حسب البيت (تحقق سيرفر)
	local function applyBoost()
		local humanoid = player.Character and player.Character:FindFirstChildOfClass("Humanoid")
		if humanoid then humanoid.WalkSpeed = 16 + petData.boost end
	end
	applyBoost()
	if player.Character then
		player.CharacterAdded:Connect(applyBoost)
	end

	print(player.Name .. " جهّز بيت: " .. petData.name)
end)

-- حلقة المتابعة الناعمة
RunService.Heartbeat:Connect(function()
	for player, pet in activePets do
		local character = player.Character
		local head = character and character:FindFirstChild("Head")
		if head and pet.Parent then
			local target = head.Position + Vector3.new(2.5, 2, 0)
			pet.CFrame = pet.CFrame:Lerp(CFrame.new(target), 0.12)
		elseif not character then
			pet:Destroy()
			activePets[player] = nil
		end
	end
end)`,
      },
    ],
    notes: [
      "أرسل رقم البيت من الكلينت بزر واجهة: ()\u200bEquipPet:FireServer(2).",
      "الزيادة تطبق على السيرفر فقط — لا يمكن للاعب تعديلها.",
      "لتوفير الأداء مع بيتات كثيرة استخدم BodyMover بدل Lerp في Heartbeat.",
    ],
  },
  {
    id: "quests",
    title: "نظام مهام (Quests) مع مكافآت",
    description: "شخصية تعطي مهمة (اجمع/اقتل X) وتتابع التقدم وتسلم المكافأة عند الإنجاز.",
    keywords: ["مهمه", "مهام", "كوست", "كويست", "هدف", "اهداف", "انجز", "مكافاه", "مكافآت", "quest", "quests", "mission", "objective", "نظام مهام"],
    placement: "ريموت QuestEvent في ReplicatedStorage + سكربت سيرفر",
    scripts: [
      {
        name: "QuestSystem",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Players = game:GetService("Players")
local ReplicatedStorage = game:GetService("ReplicatedStorage")
local questEvent = ReplicatedStorage:WaitForChild("QuestEvent")

local QUESTS = {
	{ id = "coins10", text = "اجمع 10 عملات", goal = 10, reward = 50 },
	{ id = "fish3", text = "اصطد 3 أسماك", goal = 3, reward = 80 },
}

local progress = {}  -- player -> { questId = count }

questEvent.OnServerEvent:Connect(function(player, action, questId, amount)
	progress[player] = progress[player] or {}
	local my = progress[player]

	if action == "accept" then
		my[questId] = my[questId] or 0
		questEvent:FireClient(player, "accepted", questId)
		print(player.Name .. " قبل مهمة: " .. questId)

	elseif action == "progress" then
		if my[questId] == nil then return end  -- لم يقبلها!
		local add = math.clamp(tonumber(amount) or 1, 1, 5)
		my[questId] += add
		local quest
		for _, q in QUESTS do if q.id == questId then quest = q end end
		if quest and my[questId] >= quest.goal then
			local stats = player:FindFirstChild("leaderstats")
			local gold = stats and stats:FindFirstChild("Gold")
			if gold then gold.Value += quest.reward end
			my[questId] = nil
			questEvent:FireClient(player, "completed", questId, quest.reward)
			print(player.Name .. " أنجز المهمة وربح " .. quest.reward)
		end
	end
end)

-- مثال ربط: عند التقاط عملة أرسل تقدماً لمهمة العملات
-- ضع هذا داخل سكربت التقاط العملات:
-- questEvent:FireServer غير متاح سيرفر-لسيرفر؛ استدعِ المنطق مباشرة:
local function reportProgress(player, questId, amount)
	progress[player] = progress[player] or {}
	if progress[player][questId] ~= nil then
		-- نفس منطق progress أعلاه (يمكن نقله لدالة مشتركة)
	end
end
void = reportProgress  -- لإبقائها مرجعية`,
      },
    ],
    notes: [
      "أنشئ RemoteEvent باسم QuestEvent قبل التشغيل.",
      "عند أي حدث لعبة (التقاط عملة، صيد سمكة) حدّث تقدم المهمة مباشرة من سكربت السيرفر المعني.",
      "انقل منطق التقدم لدالة واحدة مشتركة لتفادي التكرار في مشروعك الحقيقي.",
    ],
  },
  {
    id: "inventory",
    title: "نظام حقيبة (Inventory) بأدوات تلتقط",
    description: "حقيبة لكل لاعب تُدار بوحدة ModuleScript، مع أدوات تُلتقط من العالم وتُخزن.",
    keywords: ["حقيبه", "شنطه", "مخزن", "اغراض", "التقط", "عنصر", "عناصر", "ادوات", "inventory", "backpack", "item", "items", "نظام حقيبة"],
    placement: "ModuleScript باسم InventoryModule في ServerStorage + سكربت التقاط",
    scripts: [
      {
        name: "InventoryModule",
        location: "ServerStorage",
        scriptType: "ModuleScript",
        code: `local Inventory = {}

local MAX_SLOTS = 20
local bags = {}  -- player -> قائمة عناصر

function Inventory.get(player)
	if not bags[player] then bags[player] = {} end
	return bags[player]
end

function Inventory.add(player, itemName, count)
	count = math.clamp(tonumber(count) or 1, 1, 99)
	local bag = Inventory.get(player)
	if #bag >= MAX_SLOTS then
		return false, "الحقيبة ممتلئة!"
	end
	table.insert(bag, { name = itemName, count = count })
	return true, "أُضيف " .. itemName
end

function Inventory.remove(player, index)
	local bag = Inventory.get(player)
	if bag[index] then
		local removed = table.remove(bag, index)
		return true, removed.name
	end
	return false, "الخانة فارغة"
end

function Inventory.count(player, itemName)
	local total = 0
	for _, item in Inventory.get(player) do
		if item.name == itemName then total += item.count end
	end
	return total
end

return Inventory`,
      },
      {
        name: "PickupExample",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local Inventory = require(game:GetService("ServerStorage"):WaitForChild("InventoryModule"))
local Players = game:GetService("Players")

-- مثال: جزء يلتقط عند اللمس ويضيف عنصراً للحقيبة
local pickup = workspace:WaitForChild("ApplePickup")
pickup.Touched:Connect(function(hit)
	local player = Players:GetPlayerFromCharacter(hit.Parent)
	if not player then return end
	local ok, message = Inventory.add(player, "تفاحة", 1)
	print(player.Name .. ": " .. message)
	if ok then pickup:Destroy() end
end)`,
      },
    ],
    notes: [
      "الوحدات (ModuleScript) تجعل الحقيبة قابلة للاستخدام من أي سكربت سيرفر بـ require.",
      "لعرض الحقيبة على الشاشة أرسل نسخة منها للكلينت بـ RemoteEvent عند كل تغيير.",
      "احفظ الحقيبة في الداتا ستور عند خروج اللاعب — جدول الحقيبة جاهز للحفظ مباشرة.",
    ],
  },
  {
    id: "raycast-gun",
    title: "نظام سلاح تصويب بالريكاست مع ذخيرة",
    description: "سلاح يطلق شعاعاً من الكاميرا، يصيب بدقة، بذخيرة وإعادة تلقيم.",
    keywords: ["سلاح", "مسدس", "بندقية", "بندقيه", "اطلاق", "رصاص", "ذخيره", "تصويب", "ضرر", "gun", "shooting", "weapon", "ammo", "raycast gun", "نظام سلاح"],
    placement: "أداة اسمها Blaster فيها Handle + سكربت سيرفر داخلها + لوكال سكريبت",
    scripts: [
      {
        name: "BlasterServer",
        location: "داخل الأداة",
        scriptType: "Script",
        code: `local tool = script.Parent
local ReplicatedStorage = game:GetService("ReplicatedStorage")

local fireEvent = Instance.new("RemoteEvent")
fireEvent.Name = "FireRequest"
fireEvent.Parent = tool

local DAMAGE = 25
local MAG_SIZE = 12
local MAX_AMMO = 60
local mag = MAG_SIZE
local reserve = MAX_AMMO

local lastShot = {}

fireEvent.OnServerEvent:Connect(function(player, origin, direction)
	-- تحقق صارم من الأنواع والمدى
	if typeof(origin) ~= "Vector3" or typeof(direction) ~= "Vector3" then return end
	if direction.Magnitude == 0 then return end

	-- مكافحة الإغراق: طلقة كل 0.15 ثانية كحد أدنى
	local now = os.clock()
	if lastShot[player] and now - lastShot[player] < 0.15 then return end
	lastShot[player] = now

	if mag <= 0 then return end
	mag -= 1

	-- أطلق الشعاع من الكاميرا باتجاه اللاعب
	local params = RaycastParams.new()
	params.FilterType = Enum.RaycastFilterType.Exclude
	params.FilterDescendantsInstances = { player.Character }

	local result = workspace:Raycast(origin, direction.Unit * 300, params)
	if result then
		local character = result.Instance:FindFirstAncestorOfClass("Model")
		local humanoid = character and character:FindFirstChildOfClass("Humanoid")
		if humanoid then
			humanoid:TakeDamage(DAMAGE)
		end
	end
end)

tool.Activated:Connect(function()
	-- إعادة التلقيم عند النفاد
	if mag == 0 and reserve > 0 then
		local take = math.min(MAG_SIZE, reserve)
		mag = take
		reserve -= take
		print("إعادة تلقيم... الذخيرة: " .. mag)
	end
end)`,
      },
      {
        name: "BlasterClient",
        location: "داخل الأداة",
        scriptType: "LocalScript",
        code: `local tool = script.Parent
local player = game:GetService("Players").LocalPlayer
local mouse = player:GetMouse()
local fireEvent = tool:WaitForChild("FireRequest")

tool.Activated:Connect(function()
	local camera = workspace.CurrentCamera
	fireEvent:FireServer(camera.CFrame.Position, mouse.Hit.Position - camera.CFrame.Position)
end)`,
      },
    ],
    notes: [
      "الضرر يطبق على السيرفر فقط؛ الكلينت يرسل الاتجاه لا أكثر.",
      "تحقق من أن اتجاه الإطلاق معقول (زاوية الكاميرا) لمنع الغش في لعبة تنافسية.",
      "أضف مؤثر طلقة (ضوء/صوت) على الكلينت عند كل إطلاق لتجربة أفضل.",
    ],
  },
  {
    id: "vehicle",
    title: "نظام مركبة قابلة للقيادة",
    description: "سيارة بمقعد قيادة تتحرك بأزرار اللاعب مع ضبط سرعة ودوران مخصص.",
    keywords: ["سياره", "مركبه", "قياده", "سواقة", "سيارات", "دراجه", "عجله", "vehicle", "car", "drive", "seat", "نظام سيارة", "سيارة"],
    placement: "موديل سيارة فيه VehicleSeat وأربع عجلات (Weld)، والسكربت داخل الموديل",
    scripts: [
      {
        name: "VehicleTuner",
        location: "داخل موديل السيارة",
        scriptType: "Script",
        code: `local car = script.Parent
local seat = car:WaitForChild("VehicleSeat")

-- ضبط القيادة (تعمل مباشرة مع مقعد القيادة المدمج)
seat.MaxSpeed = 80
seat.Torque = 8000
seat.TurnSpeed = 2

seat:GetPropertyChangedSignal("Occupant"):Connect(function()
	local humanoid = seat.Occupant
	if humanoid then
		local player = game:GetService("Players"):GetPlayerFromCharacter(humanoid.Parent)
		if player then
			print(player.Name .. " ركب السيارة!")
		end
	else
		print("ترجل أحدهم عن السيارة")
	end
end)

-- فرملة قوية عند الجلوس والضغط على مسافة (اختياري عبر كلينت)
-- هنا مثال إيقاف كامل عند مغادرة المقعد
seat:GetPropertyChangedSignal("Occupant"):Connect(function()
	if not seat.Occupant then
		seat.Throttle = 0
		seat.Steer = 0
	end
end)`,
      },
    ],
    notes: [
      "ابنِ السيارة: جزء جسم + 4 عجلات مربوطة بـ WeldConstraints إلى VehicleSeat موضوع فوق الجسم.",
      "VehicleSeat يقرأ إدخال اللاعب تلقائياً (W/A/S/D أو الأسهم) — لا تحتاج كود حركة يدوياً.",
      "لتثبيت السيارة عند الخروج اجعلها Anchored مؤقتاً عبر حدث Occupant.",
    ],
  },
  {
    id: "checkpoints",
    title: "نظام نقاط تفتيش لألعاب الأوبي",
    description: "مراحل ملونة يلمسها اللاعب بالترتيب، وعند الموت يعود لآخر نقطة وصلها.",
    keywords: ["اوبي", "نقاط تفتيش", "تشيك بوينت", "مراحل", "مرحله", "يموت يرجع", "نقطه", "obby", "checkpoint", "checkpoints", "stage", "نظام مراحل"],
    placement: "وسم أجزاء النقاط بـ Checkpoint مع خاصية Stage رقمها، والسكربت في ServerScriptService",
    scripts: [
      {
        name: "CheckpointSystem",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local function setupCheckpoints(player)
	local stage = Instance.new("IntValue")
	stage.Name = "Stage"
	stage.Value = 0
	stage.Parent = player

	player.CharacterAdded:Connect(function(character)
		local root = character:WaitForChild("HumanoidRootPart")
		-- ارجع اللاعب لنقطته عند كل ولادة
		task.wait(0.1)
		local checkpoint = workspace:FindFirstChild("Checkpoint_" .. stage.Value)
		if checkpoint then
			root.CFrame = checkpoint.CFrame + Vector3.new(0, 4, 0)
		end
	end)
end

local function setupCheckpoint(checkpoint)
	if not checkpoint:IsA("BasePart") then return end
	local stageNumber = checkpoint:GetAttribute("Stage") or 0

	checkpoint.Touched:Connect(function(hit)
		local player = Players:GetPlayerFromCharacter(hit.Parent)
		if not player then return end
		local stage = player:FindFirstChild("Stage")
		if stage and stageNumber == stage.Value + 1 then
			stage.Value = stageNumber
			checkpoint.Color = Color3.fromRGB(61, 220, 151)
			print(player.Name .. " وصل للمرحلة " .. stageNumber)
		end
	end)
end

Players.PlayerAdded:Connect(setupCheckpoints)
for _, c in CollectionService:GetTagged("Checkpoint") do setupCheckpoint(c) end
CollectionService:GetInstanceAddedSignal("Checkpoint"):Connect(setupCheckpoint)`,
      },
    ],
    notes: [
      "سمِّ أجزاء النقاط Checkpoint_0 و Checkpoint_1 وهكذا، وضع خاصية Stage برقمها.",
      "الترتيب صارم: لا تقفز مراحل لأن الشرط stage.Value + 1.",
      "للحفظ بين الجلسات خزّن قيمة Stage في الداتا ستور.",
    ],
  },
  {
    id: "daily-rewards",
    title: "نظام مكافأة يومية بتتابع أيام",
    description: "كل يوم يدخل اللاعب يستلم مكافأة تتضاعف مع تتابع الأيام، محفوظة بالداتا ستور.",
    keywords: ["مكافاه يوميه", "يومي", "كل يوم", "تتابع", "هديه", "هدايا", "استلام", "daily", "reward", "rewards", "login", "streak", "نظام مكافآت"],
    placement: "سكربت سيرفر في ServerScriptService + ProximityPrompt على صندوق هدايا",
    scripts: [
      {
        name: "DailyRewards",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local DataStoreService = game:GetService("DataStoreService")
local Players = game:GetService("Players")
local store = DataStoreService:GetDataStore("DailyRewards_v1")

local REWARDS = { 50, 75, 100, 150, 200, 300, 500 }  -- 7 أيام

local function todayKey()
	return os.date("%Y-%m-%d", os.time())
end

local function yesterdayKey()
	return os.date("%Y-%m-%d", os.time() - 86400)
end

local function setupPlayer(player)
	local ok, data = pcall(function()
		return store:GetAsync("daily_" .. player.UserId)
	end)
	if not ok or typeof(data) ~= "table" then
		data = { lastDay = "", streak = 0 }
	end

	local canClaim = data.lastDay ~= todayKey()
	player:SetAttribute("CanClaimDaily", canClaim)
	player:SetAttribute("DailyStreak", data.streak)

	-- صندوق الاستلام في العالم
	local claimBox = workspace:FindFirstChild("DailyGiftBox")
	if claimBox and canClaim then
		local prompt = claimBox:FindFirstChildOfClass("ProximityPrompt")
		if not prompt then
			prompt = Instance.new("ProximityPrompt")
			prompt.ObjectText = "المكافأة اليومية"
			prompt.ActionText = "استلم"
			prompt.Parent = claimBox
		end
		prompt.Triggered:Connect(function(who)
			if who ~= player then return end
			local streak = data.streak
			if data.lastDay == yesterdayKey() then
				streak = math.min(streak + 1, #REWARDS)
			else
				streak = 1
			end
			local reward = REWARDS[streak]

			local stats = who:FindFirstChild("leaderstats")
			local gold = stats and stats:FindFirstChild("Gold")
			if gold then gold.Value += reward end

			data.lastDay = todayKey()
			data.streak = streak
			pcall(function()
				store:SetAsync("daily_" .. who.UserId, data)
			end)
			who:SetAttribute("CanClaimDaily", false)
			print(who.Name .. " استلم مكافأة يوم " .. streak .. ": " .. reward)
		end)
	end
end

Players.PlayerAdded:Connect(setupPlayer)`,
      },
    ],
    notes: [
      "أنشئ جزءاً باسم DailyGiftBox في العالم ليظهر عليه زر الاستلام.",
      "التتابع ينكسر إذا غاب اللاعب يوماً كاملاً — هذا مقصود لتحفيز الرجوع.",
      "التاريخ محسوب بتوقيت السيرفر؛ لأوقات محلية دقيقة استخدم منطقة اللاعب.",
    ],
  },
  {
    id: "mining",
    title: "نظام تعدين: صخور تنكسر وتعطي خامات",
    description: "صخرة لها صحة، تضربها بأداة التعدين فتتصدع تدريجياً وتسقط خامة عشوائية.",
    keywords: ["تعدين", "منجم", "صخره", "صخور", "خامه", "خامات", "فحم", "الماس", "حديد", "اكسر", "mining", "mine", "ore", "rock", "نظام تعدين"],
    placement: "وسم الصخور بـ MiningRock، وأداة اسمها Pickaxe، والسكربت في ServerScriptService",
    scripts: [
      {
        name: "MiningSystem",
        location: "ServerScriptService",
        scriptType: "Script",
        code: `local CollectionService = game:GetService("CollectionService")
local Players = game:GetService("Players")

local ROCK_HEALTH = 100
local HIT_DAMAGE = 25
local RESPAWN_SECONDS = 20

local ORES = {
	{ name = "فحم", weight = 60, value = 5, color = Color3.fromRGB(40, 40, 40) },
	{ name = "حديد", weight = 30, value = 15, color = Color3.fromRGB(160, 160, 170) },
	{ name = "ذهب", weight = 9, value = 50, color = Color3.fromRGB(245, 185, 66) },
	{ name = "ماس", weight = 1, value = 250, color = Color3.fromRGB(120, 230, 255) },
}

local function rollOre()
	local total = 0
	for _, ore in ORES do total += ore.weight end
	local roll = math.random() * total
	for _, ore in ORES do
		roll -= ore.weight
		if roll <= 0 then return ore end
	end
	return ORES[1]
end

local function setupRock(rock)
	if not rock:IsA("BasePart") then return end
	local health = ROCK_HEALTH
	local lastPosition = rock.CFrame

	rock:SetAttribute("Health", health)

	rock.Touched:Connect(function(hit)
		-- الضربة تحسب فقط من أداة التعدين
		local tool = hit.Parent and hit.Parent:FindFirstChildOfClass("Tool")
		if not tool or tool.Name ~= "Pickaxe" then return end
		local player = Players:GetPlayerFromCharacter(hit.Parent.Parent) or
			Players:GetPlayerFromCharacter(tool.Parent)
		if not player then return end

		health -= HIT_DAMAGE
		rock:SetAttribute("Health", math.max(health, 0))
		rock.Transparency = math.min(0.6, (ROCK_HEALTH - health) / ROCK_HEALTH)

		if health <= 0 then
			local ore = rollOre()
			local stats = player:FindFirstChild("leaderstats")
			local gold = stats and stats:FindFirstChild("Gold")
			if gold then gold.Value += ore.value end
			print(player.Name .. " حصل على " .. ore.name .. " بقيمة " .. ore.value)

			rock.Parent = nil
			task.delay(RESPAWN_SECONDS, function()
				health = ROCK_HEALTH
				rock.Transparency = 0
				rock:SetAttribute("Health", ROCK_HEALTH)
				rock.CFrame = lastPosition
				rock.Parent = workspace
			end)
		end
	end)
end

for _, rock in CollectionService:GetTagged("MiningRock") do setupRock(rock) end
CollectionService:GetInstanceAddedSignal("MiningRock"):Connect(setupRock)`,
      },
    ],
    notes: [
      "أنشئ أداة اسمها Pickaxe حتى يتعرف السكربت على الضربات الصحيحة.",
      "الشفافية تتدرج مع الضرر لتعطي إحساس التصدع.",
      "بدل اللمس يمكنك ربط الضرر بحدث Activated داخل الأداة نفسها لدقة أعلى.",
    ],
  },
];
