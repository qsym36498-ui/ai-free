import Link from "next/link";
import AutoTrainer from "@/components/AutoTrainer";
import CodeBlock from "@/components/CodeBlock";
import StatsBar from "@/components/StatsBar";

export const dynamic = "force-dynamic";

const HERO_CODE = `-- عقل لواو كتب هذا النظام بنفسه
local Players = game:GetService("Players")

Players.PlayerAdded:Connect(function(player)
	local stats = Instance.new("Folder")
	stats.Name = "leaderstats"

	local gold = Instance.new("IntValue")
	gold.Name = "Gold"
	gold.Value = 0
	gold.Parent = stats

	stats.Parent = player
	print(player.Name .. " جاهز للعب!")
end)`;

const FEATURES = [
  {
    icon: "⚡",
    title: "مولد أنظمة كاملة",
    text: "26 نظاماً جاهزاً: صيد سمك، زراعة، بيتات، تعدين، مهام، أسلحة، مركبات، حفظ بيانات، زومبي يلاحق، متجر آمن — كود كامل يُنسخ مباشرة إلى ستوديو.",
    href: "/generator",
  },
  {
    icon: "📚",
    title: "منهاج من الصفر للاحتراف",
    text: "دروس مكتوبة يدوياً بتفاصيلها الكبيرة والصغيرة: من المتغيرات حتى الميتا تيبل والأمان ضد المخترقين.",
    href: "/lessons",
  },
  {
    icon: "💬",
    title: "مساعد يفهم سؤالك",
    text: "اسأل بالعربية أو الإنجليزية — المحرك يفهم النية ويقرر: يولّد نظاماً، أو يبحث في المعرفة، أو يشرح درساً.",
    href: "/chat",
  },
  {
    icon: "🧠",
    title: "يبحث بالإنترنت ويتدرب من أجهزتكم",
    text: "حوّل جهازك لسيرفر تدريب فيقرأ بنفسه كتباً مجانية من الإنترنت (مرجع Lua، Programming in Lua، ويكي الكتب)، وكل معلومة تلصقها تدخل دماغه فوراً.",
    href: "/train",
  },
];

const TRAINING_STEPS = [
  {
    step: "01",
    title: "زوار يتدربون بأجهزتهم",
    text: "عند فتح الموقع يعالج جهازك مادة المعرفة محلياً (تقطيع وإحصاء وتجزئة) ويرسل البصمة — بلا تكلفة وبلا API.",
  },
  {
    step: "02",
    title: "لاعبون يطعمونه من الإنترنت",
    text: "ابحث عن أي معلومة لواو أو روبلوكس وألصقها في غرفة التدريب — تدخل فهرس البحث فوراً وتظهر في الإجابات.",
  },
  {
    step: "03",
    title: "النموذج يكبر ويتطور",
    text: "نقاط الخبرة تتراكم من كل مساهمة، والمستوى يرتفع من «نواة تتشكل» حتى «أسطورة البرمجة».",
  },
];

export default function Home() {
  return (
    <>
      <AutoTrainer />

      {/* البطل */}
      <section className="bg-glow-hero border-b border-line">
        <div className="bg-grid mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-2 lg:py-20">
          <div className="rise-in">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-mint/40 bg-mint/10 px-3.5 py-1.5 text-xs font-bold text-mint">
              <span className="h-1.5 w-1.5 rounded-full bg-mint pulse-dot" />
              مكتوب يدوياً 100% — بدون أي API خارجي
            </p>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-fog sm:text-5xl">
              ذكاء اصطناعي يبرمج
              <span className="text-mint"> روبلوكس </span>
              بلغة Luau
            </h1>
            <p className="mb-7 max-w-lg text-base leading-8 text-dim">
              درّبناه من الصفر على منهج كامل ودقة التفاصيل الكبيرة والصغيرة. يكتب أنظمة كاملة،
              يشرح المفاهيم، ويتعلم باستمرار من كل لاعب: من جهازه ومن المعلومات التي
              يحضرها له من الإنترنت.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/chat"
                className="rounded-lg bg-mint px-6 py-3 text-sm font-bold text-ink transition hover:bg-mintsoft"
              >
                افتح المساعد الذكي ←
              </Link>
              <Link
                href="/train"
                className="rounded-lg border border-line bg-panel px-6 py-3 text-sm font-bold text-fog transition hover:border-amber/60 hover:text-amber"
              >
                ساهم في تدريبه
              </Link>
            </div>
          </div>

          <div className="rise-in" style={{ animationDelay: "0.15s" }}>
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="font-mono text-xs text-dim" dir="ltr">
                &gt; اكتب لي نظام نقاط وذهب
              </p>
              <span className="rounded border border-mint/30 px-2 py-0.5 font-mono text-[10px] text-mint">
                generator
              </span>
            </div>
            <CodeBlock code={HERO_CODE} title="LeaderstatsManager.luau" />
          </div>
        </div>
      </section>

      {/* إحصاءات حية */}
      <section className="mx-auto max-w-6xl px-5 py-10">
        <StatsBar />
      </section>

      {/* الميزات */}
      <section className="mx-auto max-w-6xl px-5 py-8">
        <h2 className="mb-6 text-2xl font-bold text-fog">ماذا يوجد داخل عقل لواو؟</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group rounded-xl border border-line bg-panel p-5 transition hover:-translate-y-1 hover:border-mint/50"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-panel2 text-xl">
                {feature.icon}
              </span>
              <h3 className="mb-2 font-bold text-fog group-hover:text-mint">{feature.title}</h3>
              <p className="text-sm leading-7 text-dim">{feature.text}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* كيف يتدرب */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="rounded-2xl border border-line bg-panel p-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-fog">كيف يتدرب النموذج؟</h2>
              <p className="mt-1 text-sm text-dim">
                تدريب جماعي مجاني — كل من يفوت الموقع يساهم بشوي، ومع الوقت بيصير أذكى.
              </p>
            </div>
            <Link href="/train" className="text-sm font-bold text-amber hover:text-embersoft">
              جرّب التدريب الآن ←
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {TRAINING_STEPS.map((item) => (
              <div key={item.step} className="rounded-xl border border-linesoft bg-panel2 p-5">
                <p className="mb-2 font-mono text-2xl font-bold text-mint/60">{item.step}</p>
                <h3 className="mb-2 font-bold text-fog">{item.title}</h3>
                <p className="text-sm leading-7 text-dim">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* شريط دعوة */}
      <section className="mx-auto max-w-6xl px-5 pb-6">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-amber/30 bg-gradient-to-l from-amber/10 via-panel to-mint/10 px-6 py-10 text-center">
          <p className="font-mono text-xs text-dim" dir="ltr">
            -- model.train(you)
          </p>
          <h2 className="max-w-2xl text-2xl font-bold leading-relaxed text-fog">
            كل معلومة تضيفها من الإنترنت، وكل جلسة تدريب من جهازك،
            <span className="text-amber"> تجعله أذكى للجميع.</span>
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/lessons" className="rounded-lg border border-line bg-panel px-6 py-2.5 text-sm font-bold text-fog hover:border-mint/50">
              ابدأ الدروس من الصفر
            </Link>
            <Link href="/generator" className="rounded-lg bg-amber px-6 py-2.5 text-sm font-bold text-ink hover:bg-embersoft">
              ولّد نظاماً كاملاً
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
