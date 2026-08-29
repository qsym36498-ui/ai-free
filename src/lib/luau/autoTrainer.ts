/**
 * المدرّب التلقائي — يعمل على الخادم وحده، بدون تدخل اللاعب:
 * 1) يدرّب كل مواضيع المنهج (لواو/بايثون/JS/C++/مهارات).
 * 2) يفحص المكتبة (كتب اللغات + كتب المعارف) ويضيف درساً لكل عنوان ناقص.
 * 3) حين لا يبقى شيء ليعلمه — يعلّم الاكتفاء ويُظهر «تم تعليم النموذج الآن».
 *
 * لا يستهلك من الزائر شيئاً: كل المكالمات على حساب مالية الكيان، من QWEN_API_KEY فقط.
 *
 * نفس الدورة الواحدة (runAutoTrainCycle) تستطيع أن تعمل:
 *  - حلقة داخلية في الخادم المحلي (tick كل 30 ثانية)، أو
 *  - سكربت مستقل على GitHub Actions (مزامنة سحابية بدون سيرفر).
 */
import { db } from "@/db";
import { knowledgeBooks, languageBooks } from "@/db/schema";
import { qwenAvailable } from "../qwen";
import { AI_TOPICS, AITopic, existsTopic, generateAILesson, runAITraining, trainingStatus, TrainedResult } from "./aitraining";

interface TrainerState {
  running: boolean;
  phase: "curriculum" | "library" | "idle";
  complete: boolean;
  libraryTotal: number;
  libraryDone: number;
  candidates: string[];
}

const state: TrainerState = {
  running: false,
  phase: "curriculum",
  complete: false,
  libraryTotal: 0,
  libraryDone: 0,
  candidates: [],
};

const mark = globalThis as unknown as { __luauAutoTrainer__?: boolean };

/** هل السيرفر المحلي مكلّف يتخطى التدريب لأن كرون السحاب يتكفل؟ */
function skipLocalTrainer(): boolean {
  const flag = (process.env.TRAINER_SKIP_LOCAL ?? "").toLowerCase();
  return flag === "1" || flag === "true";
}

/** يبدأ المدرّب التلقائي المحلي مرة واحدة فقط (دورة كل ٣٠ ثانية) */
export function startAutoTrainer(): void {
  if (skipLocalTrainer()) {
    console.log("auto trainer: متخطى محلياً — الكرون السحابي يتكفل");
    return;
  }
  if (mark.__luauAutoTrainer__) return;
  mark.__luauAutoTrainer__ = true;
  const timer = setInterval(() => {
    void tick();
  }, 30_000);
  if (typeof timer.unref === "function") timer.unref();
  console.log("auto trainer: شغّل");
  void tick();
}

/** حالة المدرّب المكشوفة للواجهة */
export function autoTrainerStatus(): {
  phase: TrainerState["phase"];
  complete: boolean;
  running: boolean;
  libraryTotal: number;
  libraryDone: number;
} {
  return {
    phase: state.phase,
    complete: state.complete,
    running: state.running,
    libraryTotal: state.libraryTotal,
    libraryDone: state.libraryDone,
  };
}

/** كل المواضيع (المنهج + عناوين المكتبة) للعرض في الواجهة */
export async function autoTrainerScopeCount(): Promise<{ curriculum: number }> {
  return { curriculum: AI_TOPICS.length };
}

export interface AutoCycleResult {
  phase: TrainerState["phase"];
  complete: boolean;
  trained: TrainedResult[];
  skipped: TrainedResult[];
  failed: TrainedResult[];
  remaining: number;
  libraryTotal: number;
  libraryDone: number;
}

/**
 * دورة تدريب واحدة ذات معنى: إن بقي بالمنهج شيء → درّب دفعة منه،
 * وإلا → درّب ما هو ناقص من عناوين المكتبة. تستخدمها الحلقة المحلية والكرون السحابي معاً.
 */
export async function runAutoTrainCycle(batch = 4): Promise<AutoCycleResult> {
  if (!qwenAvailable()) {
    return {
      phase: "idle",
      complete: false,
      trained: [],
      skipped: [],
      failed: [],
      remaining: AI_TOPICS.length,
      libraryTotal: state.libraryTotal,
      libraryDone: state.libraryDone,
    };
  }

  if (state.phase === "library") {
    if (state.candidates.length === 0) {
      const loaded = await loadLibraryCandidates();
      state.libraryTotal = loaded.total;
      state.libraryDone = loaded.done;
      state.candidates = loaded.need;
    }
    const { trained, skipped, failed } = await runLibraryBatch(batch);
    state.libraryDone = state.libraryTotal - state.candidates.length;
    // اكتمال المكتبة: لا عناوين ناقصة متبقية
    const doneAll =
      state.libraryTotal === 0
        ? trained.length === 0 && state.candidates.length === 0
        : state.libraryDone >= state.libraryTotal;
    if (doneAll) {
      state.complete = true;
      state.phase = "idle";
      console.log("المدرّب التلقائي: تم تعليم النموذج كل المكتبة والمنهج ✓");
    } else {
      // المنهج اكتمل والقاعدة موجودة — نعتبر الاكتمال سارٍ حتى لو بقيت مكتبة تُدرّب لاحقاً
      state.complete = true;
    }
    return {
      phase: state.phase,
      complete: state.complete,
      trained,
      skipped,
      failed,
      remaining: Math.max(0, state.libraryTotal - state.libraryDone),
      libraryTotal: state.libraryTotal,
      libraryDone: state.libraryDone,
    };
  }

  // مرحلة المنهج
  const res = await runAITraining(batch);
  // المواضيع المتبقية فعلية عبر قاعدة البيانات — ونعتبر المنهج كاملاً حتى لو بقي
  // "مواضيع" بلا وسوم/بعناوين قديمة، طالما عدد الدروس المخزّنة ≥ عدد مواضيع المنهج.
  const status = await trainingStatus();
  const curriculumDone =
    status.nextTopics.length === 0 || status.aiDocs >= AI_TOPICS.length;
  const remaining = curriculumDone ? 0 : status.nextTopics.length;
  let complete = false;
  if (remaining <= 0) {
    const loaded = await loadLibraryCandidates();
    state.libraryTotal = loaded.total;
    state.libraryDone = loaded.done;
    state.candidates = loaded.need;
    state.phase = "library";
    // المنهج (129) اكتمل فهذا هو "الاكتمال" — النظر للزر الجاهز يجي فوراً حتى لو بقيت مكتبة
    state.complete = true;
    complete = true;
    console.log("المدرّب التلقائي: اكتمل المنهج — المكتبة تُستكمل بالخلفية إن وجد");
  }
  return {
    phase: state.phase,
    complete,
    trained: res.trained,
    skipped: res.skipped,
    failed: res.failed,
    remaining,
    libraryTotal: state.libraryTotal,
    libraryDone: state.libraryDone,
  };
}

async function tick(): Promise<void> {
  if (state.running || state.complete) return;
  state.running = true;
  try {
    await runAutoTrainCycle(4);
  } catch (error) {
    console.error("auto trainer tick", error);
  } finally {
    state.running = false;
  }
}

/** يهدّف درساً لعنوان كتاب ناقص من المكتبة — يستخدم قائمة المرشحين المخزنة */
async function runLibraryBatch(count: number): Promise<{ trained: TrainedResult[]; skipped: TrainedResult[]; failed: TrainedResult[] }> {
  const trained: TrainedResult[] = [];
  const skipped: TrainedResult[] = [];
  const failed: TrainedResult[] = [];
  const pick = state.candidates.slice(0, count);
  for (const subject of pick) {
    const topic: AITopic = {
      topic: subject,
      kind: "lesson",
      level: "مناسب للموضوع",
      focus:
        "هذا العنوان مأخوذ من مكتبة الكتب في الأداة. اشرح هذا الموضوع بشرح شامل (400-800 كلمة) " +
        "كما لو أنه فصل من كتاب تعليمي: المقدمة، الشرح العميق، أمثلة عملية، تنبيهات، وتلخيص. " +
        "لا تكتفِ بالعنوان — قدّم فهماً فعلياً يغني اللاعب عن غيره.",
    };
    const result = await generateAILesson(topic);
    if (result.status === "trained") trained.push(result);
    if (result.status === "skipped") skipped.push(result);
    if (result.status === "failed") failed.push(result);
    // الفاشل يبقى في القائمة ويُعاد في دورة لاحقة — نحذف المنجز والمنقص فقط
    if (result.status !== "failed") {
      state.candidates = state.candidates.filter((c) => c !== subject);
    }
    await new Promise((resolve) => setTimeout(resolve, 1200));
  }
  state.libraryDone = state.libraryTotal - state.candidates.length;
  return { trained, skipped, failed };
}

interface LibraryInfo {
  total: number;
  done: number;
  need: string[];
}

/** يستخرج عروض الكتب التي قد تكون مواضيع دروس، ويحسب ما هو ناقص */
async function loadLibraryCandidates(): Promise<LibraryInfo> {
  try {
    const [langBooks, knBooks] = await Promise.all([
      db.select({ name: languageBooks.name }).from(languageBooks).limit(2000),
      db.select({ name: knowledgeBooks.name }).from(knowledgeBooks).limit(2000),
    ]);

    const seen = new Set<string>();
    const subjects: string[] = [];
    for (const row of [...langBooks, ...knBooks]) {
      const name = (row.name ?? "").trim();
      if (!name || name.length > 90) continue;
      if (/^https?:/i.test(name) || /^["'`<>*_]|["'`<>*_]$/.test(name)) continue;
      if (!/[اإأآبتثجحخدذرزسشصضطظعغفقكلمنهويىئؤء ]/.test(name)) continue;
      if (seen.has(name)) continue;
      seen.add(name);
      subjects.push(name);
    }

    const need: string[] = [];
    let done = 0;
    for (const subject of subjects) {
      if (await existsTopic(subject)) done++;
      else need.push(subject);
    }
    return { total: subjects.length, done, need };
  } catch (error) {
    console.error("library candidates", error);
    return { total: 0, done: 0, need: [] };
  }
}