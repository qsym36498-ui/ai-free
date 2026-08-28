import type { Metadata } from "next";
import AITrainer from "@/components/AITrainer";
import BookAdder from "@/components/BookAdder";
import BooksLibrary from "@/components/BooksLibrary";
import KnowledgeForm from "@/components/KnowledgeForm";
import LanguageAdder from "@/components/LanguageAdder";
import NetworkDashboard from "@/components/NetworkDashboard";
import StatsBar from "@/components/StatsBar";
import TrainLab from "@/components/TrainLab";

export const metadata: Metadata = {
  title: "غرفة التدريب — عقل لواو",
  description:
    "حوّل جهازك لعقدة تدريب، علّم النموذج من الكتب والإنترنت، وأكد أو اعترض على معارف اللاعبين.",
};

export default function TrainPage() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 inline-block rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-bold text-amber">
            تدريب موزع مجاني + تدريب بالذكاء الاصطناعي (Qwen)
          </p>
          <h1 className="mb-2 text-3xl font-bold text-fog">غرفة التدريب</h1>
          <p className="max-w-3xl leading-8 text-dim">
            هنا يكبر عقل لواو: كل جهاز لاعب هو سيرفر تدريب محتمل، وكل معلومة من كتاب أو
            موقع تدخل فهرس بحثه فوراً، واللاعبون يوثقون الصحيح وينقضون الخطأ. إضافة إلى
            ذلك، يولّد الذكاء الاصطناعي (Qwen) دروساً كاملة تملأ قاعدة المعرفة بالتدريب
            المكثف — فتصبح الأداة أذكى مع كل موسم تدريب.
          </p>
        </div>

        <div className="mb-8">
          <StatsBar detailed />
        </div>

        <div className="mb-8">
          <AITrainer />
        </div>

        <div className="mb-8 grid gap-6 lg:grid-cols-2">
          <TrainLab />
        </div>

        <div className="mb-8">
          <LanguageAdder />
        </div>

        <div className="mb-8">
          <BookAdder />
        </div>

        <div className="mb-8">
          <NetworkDashboard />
        </div>

        <div className="mb-8">
          <KnowledgeForm />
        </div>

        <div className="mb-8">
          <BooksLibrary />
        </div>

        <div className="rounded-xl border border-line bg-panel p-6 text-sm leading-8 text-dim">
          <h3 className="mb-2 font-bold text-fog">ماذا يحدث تقنياً؟</h3>
          <p>
            في جلسات الجهاز: يحمّل متصفحك نص قاعدة المعرفة، يقطعه إلى كلمات، يبني خريطة
            تكرارات ويحسب بصمة تجزئة متدحرجة (FNV-1a)، ثم يرسل العدد والبصمة فقط — كل
            المعالجة على جهازك. في وضع العقدة: يكرر الجهاز الجلسات تلقائياً ما دامت الصفحة
            مفتوحة ويحدّث عداداته في لوحة الشبكة. في نظام التوثيق: كل تأكيد يرفع وزن
            المعلومة في البحث 1.5+ ضعف، وكل اعتراض ينقصه — والمعلومة تحتاج تأييدَ لاعبين
            اثنين على الأقل لتصبح موثقة. هكذا يصبح النموذج أذكى مع كل زائر، مجاناً وبلا أي
            خدمة خارجية.
          </p>
        </div>
      </div>
    </div>
  );
}
