/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { AlertCircle, Loader2, FileText, LayoutGrid, Download, ExternalLink, Globe } from 'lucide-react';
import { verifyContent, VerificationResponse, Source } from './services/ai';

const MAX_INPUT_CHARS = 20000;

function SearchSuggestions({ html }: { html: string }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const resize = () => {
    const doc = frameRef.current?.contentDocument;
    if (doc && frameRef.current) {
      frameRef.current.style.height = `${doc.documentElement.scrollHeight}px`;
    }
  };

  // Rendered as provided by Google, isolated in a sandboxed frame; links open in a new tab.
  return (
    <iframe
      ref={frameRef}
      title="اقتراحات بحث Google"
      srcDoc={`<base target="_blank">${html}`}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox"
      onLoad={resize}
      className="w-full border-0 rounded-lg"
      style={{ height: 60, colorScheme: 'normal' }}
    />
  );
}

function SourcesList({ sources }: { sources: Source[] }) {
  return (
    <ol className="space-y-1.5">
      {sources.map((source, idx) => (
        <li key={source.url}>
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-slate-200 hover:text-sky-400 transition-colors"
          >
            <span className="text-xs text-slate-500 w-5 shrink-0" dir="ltr">{idx + 1}.</span>
            <span className="truncate" dir="ltr">{source.title}</span>
            <ExternalLink size={12} className="shrink-0 opacity-60" />
          </a>
        </li>
      ))}
    </ol>
  );
}

function SourcesCard({ result }: { result: VerificationResponse }) {
  const sources = result.sources ?? [];
  return (
    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-3">
      <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold flex items-center gap-1.5">
        <Globe size={14} />
        المصادر المستخدمة في التحقق
        {sources.length > 0 && (
          <span className="font-normal border border-white/10 px-2 py-0.5 rounded-full mr-1">{sources.length} مصدر</span>
        )}
      </div>
      {sources.length > 0 ? (
        <SourcesList sources={sources} />
      ) : (
        <p className="text-sm text-slate-400">لم يتم الاعتماد على مصادر من البحث في هذا الفحص.</p>
      )}
      {result.searchSuggestionsHtml && <SearchSuggestions html={result.searchSuggestionsHtml} />}
    </div>
  );
}

export default function App() {
  const [content, setContent] = useState('');
  const [result, setResult] = useState<VerificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'bento' | 'report'>('bento');
  const resultsRef = useRef<HTMLElement>(null);

  const handleVerify = async () => {
    if (!content.trim()) {
      setError('يرجى إدخال محتوى للفحص أولاً.');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);

    try {
      const verificationResult = await verifyContent(content);
      setResult(verificationResult);
      setViewMode('bento');
      if (window.matchMedia('(max-width: 1023px)').matches) {
        requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ غير متوقع');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    if (!result) return;
    
    const sources = result.sources ?? [];
    const sourcesSection = sources.length
      ? `\n\n## المصادر\n\n${sources.map((s, i) => `${i + 1}. [${s.title}](${s.url})`).join('\n')}\n`
      : '';
    const blob = new Blob([result.fullReport + sourcesSection], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sadaq-report-${new Date().getTime()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen lg:h-screen flex flex-col bg-slate-900 text-slate-50 lg:overflow-hidden font-sans" dir="rtl">
      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] lg:grid-rows-[auto_1fr] lg:h-full gap-4 p-4 md:p-6 lg:overflow-hidden">
        
        {/* Header */}
        <header className="col-span-full flex justify-between items-center border-b border-slate-700 pb-4 shrink-0">
          <div className="flex items-center gap-2 text-2xl font-extrabold text-sky-400 tracking-tight">
            <span>صدق</span>
            <span className="font-light text-sm opacity-70 mt-1 text-slate-50">لفحص مصداقية المحتوى</span>
          </div>
          <div className="hidden sm:flex gap-6 text-sm">
            <span className="text-green-500 font-medium tracking-wide flex items-center gap-1">● محرك تحليل AI نشط</span>
          </div>
        </header>

        {/* Input Region (Sidebar) */}
        <aside className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col gap-4 lg:row-start-2 lg:overflow-y-auto">
          <label className="text-sm font-semibold text-slate-50">أدخل النص المراد فحصه</label>
          <textarea
            className="w-full flex-1 min-h-[150px] lg:min-h-[400px] bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-slate-50 text-sm resize-none focus:outline-none focus:border-sky-400 transition-colors placeholder:text-slate-500"
            placeholder="انسخ النص هنا..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX_INPUT_CHARS}
            disabled={isLoading}
          />
          <div className="text-xs text-slate-500 -mt-2 text-left" dir="ltr">
            {content.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
          </div>

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
                <span>جاري البحث والتحقق من المصادر...</span>
              </>
            ) : (
              <span>بدء الفحص النقدي</span>
            )}
          </button>
          <div className="text-xs text-slate-400 leading-relaxed">
            سيتم الفحص بناءً على المنهجية العلمية والبحث في Google للتحقق من الأدلة والادعاءات بشكل محايد. قد يستغرق الفحص حتى دقيقة.
          </div>
        </aside>

        {/* Results Region */}
        <main ref={resultsRef} className="lg:row-start-2 flex flex-col lg:overflow-hidden lg:h-full scroll-mt-4">
            {result ? (
              <div className="flex flex-col lg:h-full lg:overflow-hidden">
                <div className="flex items-center gap-2 mb-4 shrink-0 px-1">
                  <button 
                    onClick={() => setViewMode('bento')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'bento' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                  >
                    <LayoutGrid size={16} />
                    لوحة الملخص
                  </button>
                  <button 
                    onClick={() => setViewMode('report')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${viewMode === 'report' ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'}`}
                  >
                    <FileText size={16} />
                    التقرير المفصل
                  </button>
                  <button 
                    onClick={handleExport}
                    className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 mr-auto"
                    title="تصدير التقرير"
                  >
                    <Download size={16} />
                    تصدير
                  </button>
                </div>

                <div className="flex-1 lg:overflow-y-auto pr-1 pb-6 custom-scrollbar">
                  {viewMode === 'bento' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                      
                      {/* Level */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col col-span-1">
                        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-3">مستوى الفحص</div>
                        <div className="text-xl lg:text-2xl font-bold mt-auto text-sky-400">{result.bentoData.investigationLevel.title}</div>
                        <div className="text-xs text-slate-300 mt-2">{result.bentoData.investigationLevel.description}</div>
                      </div>

                      {/* Risk */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col col-span-1">
                        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-3">مستوى الخطورة</div>
                        <div className="mt-auto">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold inline-block ${result.bentoData.riskLevel.isHigh ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-amber-500/20 text-amber-500 border border-amber-500/50'}`}>
                            {result.bentoData.riskLevel.badge}
                          </span>
                          <p className={`text-xs mt-2 font-medium ${result.bentoData.riskLevel.isHigh ? 'text-red-400' : 'text-amber-400'}`}>
                            {result.bentoData.riskLevel.details}
                          </p>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col col-span-1">
                        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-1">الدرجة العامة</div>
                        <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center text-xl font-extrabold my-2 ${result.bentoData.score >= 7 ? 'border-green-500 text-green-400' : result.bentoData.score >= 4 ? 'border-amber-500 text-amber-400' : 'border-red-500 text-red-400'}`}>
                          {result.bentoData.score}
                        </div>
                        <div className="text-xs text-slate-400 mt-auto">من أصل 10 نقاط مصداقية</div>
                      </div>

                      {/* Claims */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col md:col-span-2">
                        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-4">تفكيك الادعاءات <span className="font-normal border border-white/10 px-2 py-0.5 rounded-full ml-1">{result.bentoData.claims.length} ادعاءات مستخرجة</span></div>
                        <div className="space-y-1">
                          {result.bentoData.claims.map((claim, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-white/5 text-sm last:border-0 items-start gap-1 sm:gap-4">
                              <span className="flex-1 text-slate-200">{idx + 1}. {claim.text}</span>
                              <span className={`text-xs font-semibold sm:max-w-[45%] ${claim.isDangerous ? 'text-red-400' : 'text-sky-400'}`}>{claim.assessment}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-4 col-span-1">
                          {/* Misleading Patterns */}
                          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col flex-1">
                            <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-3">أنماط التضليل المكتشفة</div>
                            <div className="flex flex-wrap gap-1.5 mt-auto">
                              {result.bentoData.misleadingPatterns.length > 0 ? result.bentoData.misleadingPatterns.map((pattern, idx) => (
                                <span key={idx} className="text-[11px] py-1 px-2.5 bg-white/10 rounded-md text-slate-200 border border-white/5">
                                  {pattern}
                                </span>
                              )) : <span className="text-sm text-slate-400">لا يوجد</span>}
                            </div>
                          </div>

                          {/* Expertise */}
                          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col flex-1">
                            <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-3">الخبرة المطلوبة للفحص</div>
                            <div className="mt-auto space-y-2">
                              {result.bentoData.expertise.map((exp, idx) => (
                                <p key={idx} className="text-sm font-medium text-slate-200">{exp}</p>
                              ))}
                            </div>
                          </div>
                      </div>

                      {/* Conclusion */}
                      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col md:col-span-3">
                        <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-3">الخلاصة والنتيجة النهائية</div>
                        <div className="text-sm leading-relaxed text-slate-200">
                          {result.bentoData.conclusion.text}
                        </div>
                        <div className="mt-4 text-sm font-semibold text-sky-400">
                          ● {result.bentoData.conclusion.recommendation}
                        </div>
                      </div>

                      <div className="md:col-span-2 lg:col-span-3">
                        <SourcesCard result={result} />
                      </div>

                    </div>
                  ) : (
                    <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 lg:p-10">
                      <div className="markdown-body prose prose-invert prose-slate max-w-none prose-h1:text-sky-400 prose-a:text-sky-400 prose-headings:text-slate-50 prose-td:border-slate-700 prose-th:border-slate-700 prose-th:bg-slate-900 prose-tr:even:bg-white/5 rtl text-sm lg:text-base leading-loose">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />,
                            table: ({ node, ...props }) => (
                              <div className="overflow-x-auto">
                                <table {...props} />
                              </div>
                            ),
                          }}
                        >
                          {result.fullReport}
                        </ReactMarkdown>
                      </div>
                      <div className="mt-8">
                        <SourcesCard result={result} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 flex flex-col min-h-[200px] lg:h-full lg:overflow-y-auto">
                <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold mb-4 flex items-center gap-1.5 shrink-0">
                  الخلاصة والنتيجة النهائية
                </div>
                <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">
                  أدخل نصاً في الحقل الجانبي واضغط على بدء الفحص لعرض النتائج هنا.
                </div>
              </div>
            )}
        </main>
      </div>
    </div>
  );
}
