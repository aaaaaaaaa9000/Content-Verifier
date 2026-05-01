/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Search, AlertCircle, Loader2 } from 'lucide-react';
import { verifyContent } from './services/ai';

export default function App() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!content.trim()) {
      setError('يرجى إدخال محتوى للفحص أولاً.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult('');

    try {
      const verificationResult = await verifyContent(content);
      setResult(verificationResult);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-slate-50 overflow-hidden font-sans" dir="rtl">
      {/* Container matching Bento Grid's padding and gap */}
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] grid-rows-[auto_1fr] h-full gap-4 p-6 overflow-hidden">
        
        {/* Header */}
        <header className="col-span-full flex justify-between items-center border-b border-slate-700 pb-4 shrink-0">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-sky-400 tracking-tight">
            <span>صدق</span>
            <span className="font-light text-sm opacity-70 mt-1 text-slate-50">لفحص مصداقية المحتوى</span>
          </div>
          <div className="hidden sm:flex gap-6 text-sm">
            <span className="text-green-500 font-medium tracking-wide flex items-center gap-1">● محرك تحليل AI نشط</span>
            <span className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">المسودات</span>
            <span className="text-slate-400 hover:text-slate-300 cursor-pointer transition-colors">الاعدادات</span>
          </div>
        </header>

        {/* Input Region (Sidebar) */}
        <aside className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-4 lg:row-start-2 overflow-y-auto">
          <label className="text-sm font-semibold text-slate-50">أدخل النص المراد فحصه</label>
          <textarea
            className="w-full flex-1 min-h-[150px] lg:min-h-[400px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-50 text-sm resize-none focus:outline-none focus:border-sky-400 transition-colors placeholder:text-slate-500"
            placeholder="انسخ النص هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isLoading}
          />

          {error && (
            <div className="flex items-center gap-2 text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              <AlertCircle size={18} />
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={isLoading || !content.trim()}
            className="bg-sky-400/90 hover:bg-sky-400 text-slate-900 font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>جاري الفحص الدقيق...</span>
              </>
            ) : (
              <span>بدء الفحص النقدي</span>
            )}
          </button>
          <div className="text-xs text-slate-400 leading-relaxed">
            سيتم الفحص بناءً على المنهجية العلمية والتحقق من الأدلة والادعاءات بشكل محايد.
          </div>
        </aside>

        {/* Results Region */}
        <main className="lg:row-start-2 flex flex-col overflow-hidden h-full">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col h-full overflow-y-auto">
              <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-4 flex items-center gap-1.5 shrink-0">
                الخلاصة والنتيجة النهائية
              </div>
              {result ? (
                <div className="markdown-body prose prose-invert prose-slate max-w-none prose-h1:text-sky-400 prose-a:text-sky-400 prose-headings:text-slate-50 prose-td:border-slate-700 prose-th:border-slate-700 prose-th:bg-slate-900 prose-tr:even:bg-white/5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {result}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  أدخل نصاً في الحقل الجانبي واضغط على بدء الفحص لعرض النتائج هنا.
                </div>
              )}
            </div>
        </main>
      </div>
    </div>
  );
}
