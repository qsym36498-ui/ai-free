/**
 * عند إقلاع السيرفر: يُشغَّل المدرّب التلقائي مرة واحدة لا تتطلب أي ضغطة من اللاعب.
 * كل التدريب على حساب مالك الخادم (Qwen) وليس على جهاز الزائر.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAutoTrainer } = await import("@/lib/luau/autoTrainer");
    startAutoTrainer();
  }
}