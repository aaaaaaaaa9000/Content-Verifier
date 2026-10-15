import express, { type Request, type Response, type NextFunction } from "express";
import path from "path";
import crypto from "crypto";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_PROMPT = `أريد منك أن تفحص المحتوى التالي فحصا نقديا، علميا، منهجيا، ومحايدا، بدون أي انحياز لصاحب المحتوى أو شهرته أو مكانته أو أسلوب عرضه، وبدون الانحياز لآرائي أنا أو لما تعرفه عني أو لأي موقف سابق قلته في محادثات أخرى.
تعامل مع المحتوى كأنه صادر من شخص مجهول. قيّم الأفكار والادعاءات فقط، ولا تهاجم الشخص.

أولا: حدد مستوى الفحص المناسب:
فحص سريع: لو المحتوى بسيط أو قصير.
فحص متوسط: لو المحتوى يحتوي عدة ادعاءات.
فحص عميق: لو المحتوى طبي، سياسي، ديني، مالي، قانوني، أو قد يؤثر على قرارات الناس وصحتهم أو أموالهم أو سمعتهم.

ثانيا: حدد مستوى الخطورة:
هل المحتوى منخفض الخطورة، متوسط الخطورة، أم عالي الخطورة؟
وضح هل قد يسبب ضررا: صحيا. نفسيا. ماليا. اجتماعيا. سياسيا. قانونيا. دينيا أو طائفيا. معرفيا أو تعليميا. أو يضر بسمعة أشخاص أو مؤسسات.
ولو كان المحتوى قد يدفع الناس إلى ترك علاج، خسارة مال، كراهية فئة، تصديق خرافة، اتخاذ قرار خطير، أو اتهام أشخاص بلا دليل، اعتبره عالي الخطورة واذكر ذلك بوضوح.

ثالثا: ابدأ بوصف عام للمحتوى:
حدد هل هو رأي شخصي، محتوى تعليمي، علمي، طبي، نفسي، إداري، تسويقي، اقتصادي، اجتماعي، سياسي، ديني، ساخر، دعائي، بيعي، تحذيري، أو خليط من أكثر من نوع.
ثم وضح هدفه الظاهر: هل يحاول التعليم، الإقناع، البيع، التحذير، التبرير، الهجوم، الدفاع، إثارة الخوف، إثارة الغضب، أو بناء الثقة؟
وهل يعتمد على الأدلة، القصص، العاطفة، السلطة، الشهرة، السخرية، التخويف، أو الوعود؟

رابعا: حدد مجال الفحص والخبرة المطلوبة:
اذكر المجال أو المجالات المرتبطة بالمحتوى: طب، صحة، علم نفس، تعليم، إدارة، تسويق، اقتصاد، سياسة، دين، علوم طبيعية، علوم اجتماعية، تطوير ذات، تغذية، رياضة، علاقات، أو غير ذلك.
ثم اذكر نوع الخبرة المطلوبة لفحصه: طبيب، باحث، خبير منهجية، متخصص تسويق، اقتصادي، عالم نفس، متخصص سياسة وإعلام، متخصص تفكير ناقد، متخصص كشف علوم زائفة، أو أكثر من تخصص.

خامسا: فكك المحتوى إلى ادعاءات:
استخرج كل ادعاء، فكرة، نصيحة، تفسير، نتيجة، تعميم، مقارنة، رقم، إحصائية، قصة شخصية تستخدم كدليل، وعد تسويقي، اتهام، تحذير، أو استنتاج.
لا تقيّم المحتوى ككتلة واحدة. قيّم كل مكون على حدة.

سادسا: صنف كل ادعاء:
هل هو حقيقة قابلة للتحقق؟ رأي شخصي؟ قيمة أخلاقية؟ تفسير؟ ادعاء سببي؟ ادعاء طبي أو علاجي؟ ادعاء نفسي؟ ادعاء اقتصادي؟ ادعاء سياسي؟ ادعاء ديني أو عقائدي؟ ادعاء تاريخي؟ ادعاء تسويقي أو بيعي؟ تجربة شخصية؟ تعميم اجتماعي؟ توقع؟ تشبيه أو استعارة؟ مبالغة بلاغية؟ ادعاء غير قابل للاختبار؟

سابعا: قيّم قابلية التحقق:
لكل ادعاء، وضح:
هل يمكن التحقق منه؟ هل يحتاج بيانات؟ هل يحتاج رأي متخصص؟ هل هو رأي لا يمكن إثباته أو نفيه؟ هل هو اعتقاد ديني لا يمكن فحصه علميا؟ هل هو غامض ويحتاج إعادة صياغة؟
لا تعامل الرأي أو التعبير البلاغي كحقيقة علمية.

ثامنا: افحص الأدلة:
استخدم مصادر موثوقة وحديثة حسب نوع المحتوى، مثل: المراجعات المنهجية، الأبحاث المحكمة، التجارب العشوائية، الإرشادات الطبية والمهنية، الكتب الأكاديمية، التقارير الرسمية، الإحصاءات الدولية، المؤسسات العلمية والمهنية، والمصادر الأصلية.
فرّق بين: دليل قوي، متوسط، ضعيف، غير مباشر، قديم، دراسة واحدة، تجربة شخصية، رأي خبير، وادعاء بلا دليل.
ولا تعتبر كثرة الانتشار على السوشيال ميديا، أو عدد اللايكات، أو الترند، أو شهرة صاحب المحتوى، أو عدد متابعيه، أو ثقة الجمهور فيه دليلا على صحة الكلام.

تاسعا: قيّم قوة الدليل:
لكل ادعاء، اذكر:
هل الدليل قوي، متوسط، ضعيف، غير كاف، غير موجود، متعارض، أو غير قابل للتقييم؟
هل الدليل يدعم الادعاء مباشرة؟ هل يوجد خلط بين الارتباط والسببية؟ هل حجم الأثر كبير أم صغير؟ هل العينة مناسبة؟ هل يمكن تعميم النتيجة؟ هل توجد مصالح تجارية أو تضارب مصالح؟ هل تم انتقاء الأدلة المؤيدة فقط؟ هل توجد وجهات نظر علمية أو مهنية معتبرة أخرى؟
لا تساوي بين ادعاء موثق وادعاء بلا دليل لمجرد تحقيق “الحياد”.

عاشرا: قيّم الدقة:
صنّف كل ادعاء باعتباره: صحيح، صحيح جزئيا، دقيق لكن ناقص، تبسيط مقبول، تبسيط مخل، مبالغ فيه، مضلل، خاطئ، غير مثبت، غير قابل للتحقق، رأي شخصي مشروع، أو هبد صريح.
ثم أعطه درجة من 10 إذا كان قابلا للتقييم:
10/10 = دقيق جدا ومدعوم بقوة.
7-9/10 = صحيح في المجمل مع بعض النقص أو التبسيط.
4-6/10 = فيه جزء صحيح لكن به خلط أو مبالغة أو نقص مهم.
1-3/10 = ضعيف أو مضلل بدرجة كبيرة.
0/10 = هبد صريح، خطأ واضح، أو ادعاء بلا أساس.
لو الادعاء رأي شخصي أو موقف أخلاقي أو ديني أو سياسي غير قابل للقياس، لا تعطه درجة علمية مزيفة. صنّفه كرأي، وقيّم عدالة عرضه واتساقه ووجود أدلة مساندة له أو ضده إن وجدت.

حادي عشر: افحص العلوم الزائفة والمفاهيم الشعبية:
حدد هل المحتوى ينتمي إلى: علم حقيقي معروض بدقة، علم حقيقي لكن مشوه، علم شعبي مبسط، Popular Psychology / علم نفس شعبي، Popular Neuroscience / علم أعصاب شعبي، Neuromyths / خرافات عن المخ والتعلم، Self-help Myths / خرافات تطوير الذات، Bro Science / معلومات شعبية غير موثقة في الرياضة أو التغذية، Management Myths / خرافات إدارية، Marketing Myths / خرافات تسويقية، Folk Sociology / سوسيولوجيا شعبية، Conspiracy Thinking / تفكير مؤامراتي، Pseudoscience / علم زائف، Spiritual Bypass / استخدام روحاني لتجنب الواقع أو المسؤولية، أو أي تصنيف آخر مناسب. اشرح سبب التصنيف.

ثاني عشر: اكشف أنماط التضليل:
ابحث عن: مصطلحات علمية لإعطاء انطباع زائف بالدقة، عبارات مثل "الدراسات أثبتت" بدون ذكر دراسات، تعميمات كبيرة بلا دليل، خلط بين الارتباط والسببية، قصة فردية مقدمة كدليل عام، الخوف أو الذنب أو العار للإقناع، السخرية بدلا من الحجة، الهجوم على الشخص بدلا من الفكرة، خلق عدو وهمي، ادعاء أن "العلم لا يعرف" أو "الأطباء يخفون"، الاعتماد على "الطبيعي" كأنه دائما آمن، الاعتماد على "قديم" كأنه دائما صحيح، وعود مضمونة أو نتائج مؤكدة، أرقام بلا مصدر، نسب مئوية تخفي حجم الأثر الحقيقي، انتقاء الأدلة المؤيدة وتجاهل المخالفة، خلط بين الرأي والحقيقة، خلط بين الأخلاق والوقائع، تجربة شخصية كأنها قاعدة عامة، شهادة عميل كأنها دليل علمي، الندرة أو الاستعجال لإغلاق التفكير، سلطة المشهور أو اللقب بدلا من الدليل، مصطلحات مطاطة لا يمكن اختبارها، استغلال الترند أو كثرة التفاعل كبديل عن الدليل، استخدام الثقة الشخصية أو الجماهيرية كأنها ضمان لصحة المعلومة.

ثالث عشر: افحص الانحيازات والدفاعات النفسية:
حلل هل المحتوى يقع في أو يستغل: التحيز التأكيدي، الانحياز للسلطة، تأثير الشهرة، تأثير القطيع، الانحياز ضد الخبراء، الخوف من التعقيد، الرغبة في حل سهل وسريع، الحنين للماضي، الاستقطاب، التفكير المؤامراتي، الانحياز الطبقي، الانحياز السياسي، الانحياز الديني أو الأيديولوجي، التحيز ضد المختلف، تبرير موقف سابق، الإسقاط، الإنكار، تحويل الخوف إلى يقين زائف، تحويل الغضب إلى حكم عام، التعميم من تجربة مؤلمة، البحث عن عدو مريح يفسر المشكلة، الهروب من التعقيد إلى تفسير واحد بسيط، اختيار الأدلة التي تريح الجمهور وتؤكد ما يحب سماعه.
اشرح ذلك بلغة بسيطة، بدون تشخيص نفسي لصاحب المحتوى، وبدون افتراض نواياه الداخلية.

رابع عشر: قواعد خاصة حسب النوع:
إذا كان المحتوى طبيا أو صحيا: لا تقدم تشخيصا أو علاجا شخصيا. فرّق بين النصيحة العامة، الادعاء العلاجي، الوقاية، التشخيص، العلاج، التجربة الشخصية، والإرشاد الطبي المعتمد. نبّه إلى المخاطر لو قد يدفع الناس لترك العلاج أو تأخير زيارة الطبيب.
إذا كان المحتوى نفسيا: لا تشخص أشخاصا من النص. فرّق بين المعلومة النفسية، التشخيص، النصيحة العلاجية، تحليل الشخصية، تطوير الذات، والتجربة الشخصية.
إذا كان المحتوى تسويقيا أو بيعيا: افحص هل الوعد واقعي، هل توجد نتائج مضمونة بلا دليل، هل تم إخفاء شروط مهمة، هل الأرقام والتقييمات موثقة، وهل يخلط بين "قد يساعد" و"سيحقق نتيجة مؤكدة".
إذا كان المحتوى اقتصاديا أو اجتماعيا: افحص وجود البيانات، حداثتها، التعميم على المجتمع أو الطبقة أو الجيل، الخلط بين السبب والنتيجة، وتجاهل العوامل الأخرى.
إذا كان المحتوى سياسيا: اعرض وجهات النظر المختلفة بحياد، لكن لا تساوي بين رأي موثق ورأي بلا دليل. فرّق بين الخبر، الرأي، التحليل، الدعاية، الاتهام، التحريض، والموقف الأيديولوجي.
إذا كان المحتوى دينيا أو عقائديا: لا تحكم على صحة العقائد الدينية أو الغيبية كمسألة إيمانية. لكن يمكنك فحص الادعاءات القابلة للتحقق المرتبطة بها، مثل الادعاءات التاريخية، اللغوية، الطبية، العلمية، الاجتماعية، أو القانونية.

خامس عشر: التقرير المفصل
قم بكتابة تقرير مفصل بصيغة Markdown يتضمن جدول الادعاءات (رقم، نص، نوع، قابل للتحقق، قوة الدليل، التقييم، الدرجة، السبب، الصياغة الأدق) بالإضافة إلى كافة التفاصيل المذكورة في الخطوات السابقة، بشكل مرتب وواضح ومتسلسل.

سادس عشر: الخلاصة المهيكلة
يجب أن ترجع ردك بصيغة JSON مقسمة إلى قسمين: Data للبيانات المهيكلة للوحة البيانات (Bento Grid) وقسم FullReport للتقرير المفصل بـ Markdown.`;

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    bentoData: {
      type: Type.OBJECT,
      properties: {
        investigationLevel: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "description"]
        },
        riskLevel: {
          type: Type.OBJECT,
          properties: {
            badge: { type: Type.STRING },
            details: { type: Type.STRING },
            isHigh: { type: Type.BOOLEAN }
          },
          required: ["badge", "details", "isHigh"]
        },
        score: { type: Type.NUMBER },
        claims: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              text: { type: Type.STRING },
              assessment: { type: Type.STRING },
              isDangerous: { type: Type.BOOLEAN }
            },
            required: ["text", "assessment", "isDangerous"]
          }
        },
        misleadingPatterns: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        expertise: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        conclusion: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            recommendation: { type: Type.STRING }
          },
          required: ["text", "recommendation"]
        }
      },
      required: ["investigationLevel", "riskLevel", "score", "claims", "misleadingPatterns", "expertise", "conclusion"]
    },
    fullReport: {
      type: Type.STRING
    }
  },
  required: ["bentoData", "fullReport"]
};

const PORT = Number(process.env.PORT) || 3000;
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview";
const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS) || 20000;
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE) || 10;
const APP_USERNAME = process.env.APP_USERNAME || "user";
const APP_PASSWORD = process.env.APP_PASSWORD || "";

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

// Optional HTTP Basic Auth: enabled only when APP_PASSWORD is set.
function basicAuth(req: Request, res: Response, next: NextFunction) {
  if (!APP_PASSWORD || req.path === "/api/health") return next();

  const header = req.headers.authorization || "";
  if (header.startsWith("Basic ")) {
    const decoded = Buffer.from(header.slice(6), "base64").toString("utf8");
    const sep = decoded.indexOf(":");
    const user = decoded.slice(0, sep);
    const pass = decoded.slice(sep + 1);
    if (sep !== -1 && safeEqual(user, APP_USERNAME) && safeEqual(pass, APP_PASSWORD)) {
      return next();
    }
  }

  res.setHeader("WWW-Authenticate", 'Basic realm="Sadaq", charset="UTF-8"');
  res.status(401).send("Authentication required");
}

// Simple in-memory per-IP rate limiter (fixed one-minute window).
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const now = Date.now();
  const key = req.ip || "unknown";
  let bucket = rateBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 60_000 };
    rateBuckets.set(key, bucket);
  }
  bucket.count++;
  if (bucket.count > RATE_LIMIT_PER_MINUTE) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    return res.status(429).json({ error: "تم تجاوز عدد الطلبات المسموح. حاول مرة أخرى بعد دقيقة." });
  }
  next();
}

setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateBuckets) {
    if (bucket.resetAt <= now) rateBuckets.delete(key);
  }
}, 60_000).unref();

let aiClient: GoogleGenAI | null = null;

function getAiClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not defined in the environment");
    }
    aiClient = new GoogleGenAI({ apiKey });
  }
  return aiClient;
}

async function startServer() {
  const app = express();

  // Behind a reverse proxy (Traefik), so req.ip reflects the real client.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use(basicAuth);
  app.use(express.json({ limit: "256kb" }));

  app.post("/api/verify", rateLimit, async (req, res) => {
    try {
      const { text } = req.body ?? {};
      if (typeof text !== "string" || !text.trim()) {
        return res.status(400).json({ error: "يرجى إدخال نص للفحص." });
      }
      if (text.length > MAX_INPUT_CHARS) {
        return res.status(413).json({
          error: `النص طويل جداً. الحد الأقصى ${MAX_INPUT_CHARS.toLocaleString("ar-EG")} حرف.`,
        });
      }

      const response = await getAiClient().models.generateContent({
        model: GEMINI_MODEL,
        contents: text,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        },
      });

      if (!response.text) {
        throw new Error("Empty response from Gemini");
      }

      res.json(JSON.parse(response.text));
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({
        error: "حدث خطأ أثناء فحص المحتوى. يرجى المحاولة مرة أخرى.",
      });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    // Hashed build assets can be cached forever; index.html must always revalidate.
    app.use("/assets", express.static(path.join(distPath, "assets"), { maxAge: "1y", immutable: true }));
    app.use(express.static(distPath, { index: false }));
    app.get("*", (_req, res) => {
      res.setHeader("Cache-Control", "no-cache");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT} (model: ${GEMINI_MODEL})`);
  });
}

startServer();
