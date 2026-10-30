import React, { useState } from 'react';
import { Download, CheckCircle2, Share2, PlusSquare, X, Smartphone } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, show a nice badge or nothing
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" />
        <span>تطبيق PWA مثبت ومفعل</span>
      </div>
    );
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all duration-200 cursor-pointer"
        title="تثبيت التطبيق على جهازك للعمل بدون إنترنت وبسرعة فائقة"
      >
        <Download className="w-4 h-4 animate-bounce" />
        <span>تثبيت التطبيق (PWA)</span>
      </button>
    );
  }

  // iOS Safari flow (beforeinstallprompt is not supported by WebKit)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-2 text-xs font-semibold text-blue-300 transition-all cursor-pointer"
        >
          <Smartphone className="w-4 h-4 text-blue-400" />
          <span>تثبيت على آيفون / آيباد</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-right animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white">طريقة التثبيت على نظام iOS (Safari)</h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
                <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                  <div>
                    اضغط على زر <strong className="text-blue-400 font-semibold inline-flex items-center gap-1">المشاركة (Share) <Share2 className="w-3.5 h-3.5 inline" /></strong> في شريط متصفح سفاري السفلي.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    مرر لأسفل القائمة واختر <strong className="text-blue-400 font-semibold inline-flex items-center gap-1">إضافة إلى الصفحة الرئيسية (Add to Home Screen) <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    اضغط على <strong>إضافة (Add)</strong> في أعلى الزاوية. سيظهر التطبيق كأيقونة مستقلة تعمل بدون إنترنت وبسرعة فائقة.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-6 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-500 transition shadow-lg shadow-blue-600/30"
              >
                فهمت ذلك، إغلاق
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers with ambient prompt instructions or already installable
  return (
    <button
      onClick={() => {
        alert('لتثبيت التطبيق على جهازك:\n- على الحاسوب: اضغط على أيقونة التثبيت (➕) في شريط عنوان المتصفح.\n- على الهواتف: افتح القائمة واختر "إضافة إلى الشاشة الرئيسية".');
      }}
      className="flex items-center gap-1.5 rounded-xl border border-slate-700/80 bg-slate-800/70 hover:bg-slate-700/80 px-3.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all cursor-pointer"
    >
      <Download className="w-3.5 h-3.5 text-blue-400" />
      <span>تثبيت PWA</span>
    </button>
  );
};
