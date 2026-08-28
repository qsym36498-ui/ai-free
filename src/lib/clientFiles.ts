/**
 * قراءة ملفات الكتب على جهاز اللاعب نفسه (فلسفة الموقع: جهازك هو السيرفر).
 * الـ PDF يُستخرج في المتصفح والنتيجة تُرسل نصاً نظيفاً فقط.
 */

export async function fileToText(file: File): Promise<string> {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  if (!isPdf) {
    return await file.text();
  }
  return extractPdfInBrowser(file);
}

async function extractPdfInBrowser(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // الـ worker ملف ثابت من /public — بدون أي حزم معقد
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;

  try {
    let text = "";
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      try {
        const page = await doc.getPage(pageNumber);
        const content = await page.getTextContent();
        text += content.items.map((item: { str?: unknown }) => (typeof item?.str === "string" ? item.str : "")).join(" ") + "\n";
      } catch {
        // صفحة صورة أو تالفة (مثل صفحات الإهداء) — نتخطاها
      }
    }
    return text;
  } finally {
    try {
      await (doc as { destroy: () => Promise<void> }).destroy();
    } catch {
      /* نتجاهل */
    }
  }
}
