import React, { useState } from 'react';
import { Megaphone, Info } from 'lucide-react';

interface AdSpaceProps {
  slot: 'top-header' | 'sidebar' | 'in-content' | 'footer-banner';
  label?: string;
  className?: string;
}

export const AdSpace: React.FC<AdSpaceProps> = ({ slot, label, className = '' }) => {
  const [showDemoAd, setShowDemoAd] = useState(true);

  if (slot === 'top-header') {
    return (
      <div className={`w-full my-4 flex flex-col items-center justify-center ${className}`}>
        {/* <!-- Ad Space: Top Header Leaderboard (728x90 / Responsive) --> */}
        {/* Paste Google AdSense <ins class="adsbygoogle" ...></ins> code here */}
        <div className="w-full max-w-4xl bg-slate-900/60 border border-dashed border-slate-700/80 rounded-xl p-3 text-center relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1 px-2 border-b border-slate-800/60 pb-1">
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Megaphone className="w-3 h-3 text-blue-400" />
              مساحة إعلانية علوية (Top Header 728x90)
            </span>
            <span className="text-[10px] text-slate-400">إعلان تجريبي / Ad Slot</span>
          </div>

          {showDemoAd ? (
            <div className="py-3 px-4 bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-purple-950/40 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                  <span className="text-blue-400 text-lg font-bold">⚡</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">استضف مشاريعك وتطبيقاتك بسرعة فائقة ومجاناً</h4>
                  <p className="text-xs text-slate-400">سيرفرات سحابية فائقة الأداء لحفظ وتحويل الملفات وأمان البيانات.</p>
                </div>
              </div>
              <button
                type="button"
                className="px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shrink-0"
              >
                تعرّف على العرض
              </button>
            </div>
          ) : (
            <div className="py-4 text-xs text-slate-500 font-mono">
              &lt;!-- Google AdSense Slot Active --&gt;
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slot === 'in-content') {
    return (
      <div className={`w-full my-6 flex flex-col items-center ${className}`}>
        {/* <!-- Ad Space: In-Content Converter Slot (Rectangle 300x250 or Responsive) --> */}
        {/* Paste Google AdSense <ins class="adsbygoogle" ...></ins> code here */}
        <div className="w-full bg-slate-900/50 border border-dashed border-slate-700/80 rounded-xl p-3 text-center">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-2 px-1">
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Megaphone className="w-3 h-3 text-amber-400" />
              مساحة إعلانية داخل أداة التحويل (In-Content Slot)
            </span>
            <button
              type="button"
              onClick={() => setShowDemoAd(!showDemoAd)}
              className="text-[10px] text-slate-400 hover:text-slate-300 underline"
            >
              {showDemoAd ? 'معاينة شفرة الإعلان' : 'معاينة الإعلان'}
            </button>
          </div>

          {showDemoAd ? (
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-lg border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-right">
                <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded mb-1">
                  شريك مميز
                </span>
                <p className="text-sm font-semibold text-slate-200">
                  حلول أرشفة وتخزين السحاب المشفرة للمؤسسات والمهنيين
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  احمِ مستنداتك وصورك بحماية تشفير عسكرية 256-bit بدون قيود.
                </p>
              </div>
              <a
                href="#learn-more"
                onClick={(e) => e.preventDefault()}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition shrink-0"
              >
                زيارة الموقع
              </a>
            </div>
          ) : (
            <div className="py-6 text-xs text-slate-500 font-mono bg-slate-950/60 rounded-lg p-4 text-left dir-ltr">
              &lt;!-- Ad Space: In-Content Converter Slot --&gt;<br />
              &lt;ins class="adsbygoogle" style="display:block" data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" ...&gt;&lt;/ins&gt;
            </div>
          )}
        </div>
      </div>
    );
  }

  if (slot === 'sidebar') {
    return (
      <div className={`w-full my-4 ${className}`}>
        {/* <!-- Ad Space: Sidebar Skyscraper / Box (300x250) --> */}
        {/* Paste Google AdSense code here */}
        <div className="w-full bg-slate-900/60 border border-dashed border-slate-700/70 rounded-xl p-3 text-center">
          <div className="flex items-center justify-between text-[10px] text-slate-500 mb-2">
            <span className="flex items-center gap-1 font-mono">
              <Megaphone className="w-3 h-3 text-emerald-400" />
              إعلان جانبي (Sidebar 300x250)
            </span>
          </div>
          <div className="py-4 px-3 bg-emerald-950/20 border border-emerald-500/20 rounded-lg text-right">
            <p className="text-xs font-bold text-emerald-300 mb-1">دورات التميز في تحليل البيانات وOffice</p>
            <p className="text-[11px] text-slate-400 mb-2">احترف دوال Excel المتقدمة والتقارير التنفيذية مع شهادة معتمدة.</p>
            <button
              type="button"
              className="w-full py-1.5 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition"
            >
              سجّل الآن بخصم 50%
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Footer Banner
  return (
    <div className={`w-full mt-8 mb-4 flex flex-col items-center ${className}`}>
      {/* <!-- Ad Space: Footer Banner (728x90) --> */}
      <div className="w-full max-w-4xl bg-slate-900/40 border border-dashed border-slate-800 rounded-xl p-2.5 text-center">
        <div className="text-[10px] text-slate-500 mb-1 flex items-center justify-center gap-1">
          <span>مساحة إعلانية سفلية (Footer Banner) — [Ad Space: Footer Banner]</span>
        </div>
        <div className="py-2 text-xs text-slate-400">
          هل ترغب بالإعلان على محول الملفات الشامل؟ المنصة تخدم آلاف الطلاب والمحاسبين والمطورين يومياً.
        </div>
      </div>
    </div>
  );
};
