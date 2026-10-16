# صدق — فاحص مصداقية المحتوى

تطبيق يفحص النصوص فحصاً نقدياً ومنهجياً باستخدام Gemini مع البحث في Google للتحقق من الادعاءات، ويعرض لوحة ملخص وتقريراً مفصلاً بالمصادر قابلاً للتصدير.

## طريقة الفحص

لما يكون البحث مفعّل (`ENABLE_SEARCH=true`) الفحص بيتم على خطوتين:
1. الموديل بيبحث في Google عن الادعاءات القابلة للتحقق ويكتب التقرير المفصل، وبنجمع روابط المصادر الفعلية من نتائج البحث.
2. طلب سريع تاني بيستخرج بيانات لوحة الملخص من التقرير.

الخطوتين ضروريين لأن بعض موديلات Gemini (زي `gemini-3.8-flash`) بتتجاهل البحث لو اتطلب منها رد JSON بمخطط ثابت في نفس الطلب.

**التكلفة:** موديلات Gemini 3 وأحدث ليها 5,000 بحث مجاني في الشهر لكل مشروع، وبعدها البحث بيتحاسب لكل استعلام بحث. الفحص الواحد ممكن يعمل أكتر من بحث.

## التشغيل محلياً

**المتطلبات:** Node.js 22+

1. `npm install`
2. انسخ `.env.example` إلى `.env` وضع قيمة `GEMINI_API_KEY`
3. `npm run dev` ثم افتح http://localhost:3000

## متغيرات البيئة

| المتغير | الافتراضي | الوصف |
|---|---|---|
| `GEMINI_API_KEY` | — | مطلوب |
| `GEMINI_MODEL` | `gemini-3.8-flash` | الموديل المستخدم |
| `APP_USERNAME` / `APP_PASSWORD` | `user` / فارغ | حماية بكلمة مرور (Basic Auth) — تُفعَّل فقط لو `APP_PASSWORD` له قيمة |
| `ENABLE_SEARCH` | `true` | التحقق من الادعاءات بالبحث في Google |
| `RATE_LIMIT_PER_MINUTE` | `10` | أقصى عدد فحوصات لكل IP في الدقيقة |
| `MAX_INPUT_CHARS` | `20000` | أقصى طول للنص |
| `PORT` | `3000` | منفذ السيرفر |
| `APP_DOMAIN` | `sadaq.aaaaaaaaa9000.cloud` | الدومين في راوتر Traefik |

## النشر على السيرفر (Portainer + Traefik)

1. Portainer → Stacks → Add stack → **Repository**
2. Repository URL: `https://github.com/aaaaaaaaa9000/Content-Verifier`، Compose path: `docker-compose.yml`
3. أضف متغيرات البيئة: `GEMINI_API_KEY`, `APP_PASSWORD` (و`APP_DOMAIN` لو عايز دومين مختلف)
4. Deploy — Traefik هيطلع شهادة SSL تلقائياً.

أو بدون Portainer: `docker compose up -d --build` (يتطلب وجود شبكة `automation-stack_automation-network`).

فحص الصحة: `GET /api/health`
