import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "الخصوصية والمساهمة — عقل لواو",
  description:
    "شو ينرسل من جهازك بالظبط، وشو ما ينرسل، وكيف تسحب موافقتك على المساهمة في أي وقت.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12">
      <h1 className="mb-2 text-2xl font-bold text-fog">الخصوصية والمساهمة</h1>
      <p className="mb-8 text-sm leading-7 text-dim">
        هاد الموقع تجربة مفتوحة، ومن حقك تعرف بالظبط شو يصير على جهازك.
      </p>

      <section className="mb-6 rounded-xl border border-mint/30 bg-panel p-5">
        <h2 className="mb-2 text-lg font-bold text-mint">شو ينرسل من جهازك؟</h2>
        <ul className="list-inside list-disc space-y-1.5 text-sm leading-7 text-dim">
          <li>عدد الكلمات (التوكن) اللي عالجها جهازك.</li>
          <li>بصمة تحقّق رقمية (رقم مختصر) عن المادة اللي عالجها.</li>
          <li>مدة المعالجة بالمللي ثانية.</li>
          <li>
            معرّف عشوائي للجهاز، ينخلق بمتصفحك ومالو أي علاقة باسمك ولا بريدك — لو
            مسحت بيانات المتصفح ينخلق معرّف جديد.
          </li>
        </ul>
      </section>

      <section className="mb-6 rounded-xl border border-line bg-panel p-5">
        <h2 className="mb-2 text-lg font-bold text-fog">شو ما ينرسل؟</h2>
        <p className="text-sm leading-7 text-dim">
          ما منقرأ ملفاتك، ولا نصوصك، ولا محتوى دردشتك، ولا موقعك الجغرافي. المعالجة
          تصير على المادة العامة اللي الموقع نفسه بعتها لجهازك، مش على أي شي عندك.
        </p>
      </section>

      <section className="mb-6 rounded-xl border border-line bg-panel p-5">
        <h2 className="mb-2 text-lg font-bold text-fog">الموافقة قابلة للسحب</h2>
        <p className="mb-3 text-sm leading-7 text-dim">
          ما بيشتغل شي على جهازك إلا بعد ما توافق. ووضع «العقدة الدائم» بيوقف بضغطة
          زر من نفس المكان اللي شغّلته منه.
        </p>
        <p className="text-sm leading-7 text-dim">
          لسحب موافقتك: امسح بيانات الموقع من متصفحك (Site data)، ورح ينسألك من جديد.
        </p>
      </section>

      <section className="mb-8 rounded-xl border border-amber/30 bg-panel p-5">
        <h2 className="mb-2 text-lg font-bold text-amber">
          إذا ساهمت بمعرفة أو كتاب
        </h2>
        <p className="text-sm leading-7 text-dim">
          اللي تضيفه يصير ظاهر لكل الزوار ويدخل في نتائج البحث، فلا تضيف شي خاص فيك أو
          مملوك لغيرك. لا تنسخ كتب محمية بحقوق نشر — استخدم المصادر المجانية والمفتوحة
          والتوثيق الرسمي.
        </p>
      </section>

      <Link
        href="/"
        className="rounded-lg border border-line bg-panel2 px-4 py-2 text-sm text-fog transition hover:border-mint/50 hover:text-mint"
      >
        ← رجوع للرئيسية
      </Link>
    </div>
  );
}
