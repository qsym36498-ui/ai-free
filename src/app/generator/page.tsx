import type { Metadata } from "next";
import TemplateCard from "@/components/TemplateCard";
import { TEMPLATES } from "@/lib/luau/templates";

export const metadata: Metadata = {
  title: "مولد الأكواد — عقل لواو",
  description: "أنظمة روبلوكس كاملة جاهزة للنسخ: نقاط، حفظ بيانات، أعداء، متاجر، أبواب والمزيد.",
};

export default function GeneratorPage() {
  return (
    <div className="bg-grid min-h-screen">
      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-8">
          <p className="mb-2 inline-block rounded-full border border-mint/40 bg-mint/10 px-3 py-1 text-xs font-bold text-mint">
            {TEMPLATES.length} نظاماً كاملاً مكتوباً يدوياً
          </p>
          <h1 className="mb-2 text-3xl font-bold text-fog">مولد الأكواد</h1>
          <p className="max-w-2xl leading-8 text-dim">
            كل نظام هنا سكربت كامل وجاهز: انسخه إلى المكان المكتوب فوقه في روبلوكس ستوديو
            واشتغل مباشرة. يمكنك أيضاً أن تطلب أي نظام من{" "}
            <span className="font-bold text-mint">المساعد الذكي</span> وسيفهم طلبك ويولده لك.
          </p>
        </div>

        <div className="space-y-4">
          {TEMPLATES.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </div>
    </div>
  );
}
