import type { Metadata } from "next";
import ChatPanel from "@/components/ChatPanel";

export const metadata: Metadata = {
  title: "المساعد الذكي — عقل لواو",
  description: "اسأل عن أي شيء في برمجة روبلوكس بلغة لواو — يولّد أكواداً ويشرح الدروس.",
};

export default function ChatPage() {
  return (
    <div className="bg-grid min-h-[calc(100vh-64px)]">
      <div className="mx-auto max-w-6xl px-5 pt-6">
        <h1 className="text-xl font-bold text-fog">المساعد الذكي</h1>
        <p className="text-sm text-dim">
          اسأل بالعربية أو الإنجليزية — يفهم النية ويولّد نظاماً أو يشرح أو يبحث في المعرفة.
        </p>
      </div>
      <ChatPanel />
    </div>
  );
}
