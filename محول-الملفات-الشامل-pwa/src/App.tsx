/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search, Shield, Zap, WifiOff, Wifi, Layers, FileText, Image as ImageIcon,
  Code, Sparkles, CheckCircle2, ChevronLeft, ArrowRight, Heart,
  Smartphone, Filter, X, ExternalLink
} from 'lucide-react';
import { TOOLS_DATA, CATEGORIES_CONFIG } from './data/toolsData';
import { ToolItem, ToolCategory } from './types';
import { ToolIcon } from './components/ToolIcon';
import { ToolWorkspace } from './components/ToolWorkspace';
import { AdSpace } from './components/AdSpace';
import { PWAInstallButton } from './components/PWAInstallButton';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const isOnline = useOnlineStatus();
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Handle Hash Routing for Deep Linking & SEO
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#tool=')) {
        const toolId = hash.replace('#tool=', '');
        const found = TOOLS_DATA.find((t) => t.id === toolId);
        if (found) {
          setSelectedToolId(found.id);
          document.title = `${found.title} – محول الملفات الشامل PWA`;
        }
      } else {
        setSelectedToolId(null);
        document.title = 'محول الملفات الشامل PWA – 40 أداة تحويل سريعة ومحلية 100%';
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Filter tools based on search query & category
  const filteredTools = useMemo(() => {
    return TOOLS_DATA.filter((tool) => {
      const matchesCategory =
        activeCategory === 'all' || tool.category === activeCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        tool.title.toLowerCase().includes(q) ||
        tool.englishTitle.toLowerCase().includes(q) ||
        tool.shortDesc.toLowerCase().includes(q) ||
        tool.outputFormat.toLowerCase().includes(q) ||
        tool.keywords.some((kw) => kw.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const activeTool = useMemo(() => {
    return TOOLS_DATA.find((t) => t.id === selectedToolId) || null;
  }, [selectedToolId]);

  const handleSelectTool = (toolId: string) => {
    setSelectedToolId(toolId);
    window.location.hash = `tool=${toolId}`;
  };

  const handleBackToCatalog = () => {
    setSelectedToolId(null);
    window.location.hash = '';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-['Tajawal',sans-serif] selection:bg-blue-600 selection:text-white">
      {/* Topmost System & Network Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800/80 py-1.5 px-4 text-xs">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              منصة محلية Client-Side تعمل بمتصفحك
            </span>
            <span className="hidden md:inline-block text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              أمان تام: لا يتم رفع أي ملف لسيرفرات خارجية
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isOnline ? (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-500/20 text-[11px]">
                <Wifi className="w-3 h-3" />
                متصل
              </span>
            ) : (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/60 text-amber-400 border border-amber-500/30 text-[11px] font-bold">
                <WifiOff className="w-3 h-3" />
                أوفلاين (جاهز للعمل بدون إنترنت)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <nav className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          {/* Logo & Title */}
          <div
            onClick={handleBackToCatalog}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 p-0.5 shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layers className="w-6 h-6 text-blue-400 group-hover:text-white transition-colors" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-lg sm:text-xl text-white tracking-tight">
                  محول الملفات الشامل
                </span>
                <span className="px-2 py-0.5 text-[11px] font-black rounded-md bg-blue-600 text-white shadow-sm">
                  PWA
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                40 أداة تحويل سريعة ومحلية 100%
              </p>
            </div>
          </div>

          {/* Quick Header Actions: Install Button */}
          <div className="flex items-center gap-3">
            <PWAInstallButton />
          </div>
        </div>
      </nav>

      {/* <!-- Ad Space: Top Header --> */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <AdSpace slot="top-header" />
      </div>

      {/* Active Workspace Modal or Main Catalog View */}
      {activeTool ? (
        <main className="flex-1">
          <ToolWorkspace
            tool={activeTool}
            onBack={handleBackToCatalog}
            onSelectRelatedTool={handleSelectTool}
          />
        </main>
      ) : (
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-6 w-full">
          {/* Hero Banner Section */}
          <section className="text-center py-6 sm:py-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs sm:text-sm font-semibold mb-4">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>40 أداة تحويل سريعة ومحلية 100% بدون إنترنت</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight sm:leading-snug">
              محول الملفات الشامل <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">PWA</span>
            </h1>

            <p className="mt-3 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              منصة مجانية موجهة للطلاب، الموظفين، المحاسبين، المصممين والمطورين. تحويل آمن ومباشر داخل متصفحك دون إرسال ملفاتك لأي خادم.
            </p>

            {/* Quick Feature Badges */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                خصوصية مطلقة (محلي 100%)
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-blue-400" />
                يعمل أوفلاين كـ تطبيق PWA
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
                <CheckCircle2 className="w-4 h-4 text-purple-400" />
                بدون حدود للحجم أو تسجيل دخول
              </span>
            </div>

            {/* Search Bar */}
            <div className="mt-8 max-w-2xl mx-auto relative">
              <div className="relative flex items-center">
                <Search className="w-5 h-5 text-slate-400 absolute right-4 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بين 40 أداة (مثال: Word, PDF, HEIC, صور, Excel, JSON)..."
                  className="w-full bg-slate-900/90 border border-slate-700/80 hover:border-blue-500 focus:border-blue-500 rounded-2xl py-3.5 pr-12 pl-10 text-sm sm:text-base text-slate-100 placeholder-slate-500 shadow-xl focus:outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-4 text-slate-400 hover:text-white p-1"
                    aria-label="مسح البحث"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Category Filter Pills */}
          <section className="mb-8">
            <div className="flex items-center justify-start sm:justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES_CONFIG.map((cat) => {
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                        : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850 border border-slate-800'
                    }`}
                  >
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Tools Grid: 40 Tools */}
          <section className="mb-14">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-base font-bold text-slate-300 flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span>
                  {searchQuery
                    ? `نتائج البحث عن "${searchQuery}" (${filteredTools.length} أداة)`
                    : `الأدوات المتاحة (${filteredTools.length} أداة)`}
                </span>
              </h2>
              {filteredTools.length > 0 && (
                <span className="text-xs text-slate-500 font-mono">
                  جاهزة للتشغيل الفوري
                </span>
              )}
            </div>

            {filteredTools.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800">
                <Search className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-300">لم يتم العثور على أداة مطابقة</h3>
                <p className="text-xs text-slate-500 mt-1">جرب البحث بكلمات أخرى مثل "pdf" أو "صور" أو "json".</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('all');
                  }}
                  className="mt-4 px-4 py-2 text-xs font-semibold bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition"
                >
                  إعادة ضبط البحث
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool) => (
                  <div
                    key={tool.id}
                    onClick={() => handleSelectTool(tool.id)}
                    className="group bg-slate-900/70 hover:bg-slate-850 border border-slate-800/90 hover:border-blue-500/50 rounded-2xl p-5 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1 cursor-pointer flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Meta info & Icon */}
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-500 transition-colors shadow-sm">
                          <ToolIcon name={tool.iconName} className="w-5 h-5" />
                        </div>

                        {tool.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            {tool.badge}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-100 group-hover:text-blue-400 transition-colors mb-1">
                        {tool.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 mb-2 font-mono">
                        {tool.englishTitle}
                      </p>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {tool.shortDesc}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                      <span className="text-[11px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                        {tool.outputFormat}
                      </span>
                      <span className="text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-[-3px] transition-transform text-xs">
                        <span>فتح الأداة</span>
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick Category Summary Grid for SEO */}
          <section className="my-12 p-8 rounded-3xl bg-slate-900/40 border border-slate-800/80">
            <h2 className="text-xl font-bold text-white mb-6 text-right">
              تصنيفات الأدوات المتوفرة على المنصة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-blue-400">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">المستندات والطلاب والموظفين (14 أداة)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تحويل Word إلى PDF، دمج ملفات PDF، ضغط وتقسيم واستخراج النصوص، وتحويل جداول Excel إلى تقارير PDF جاهزة للطباعة.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-indigo-400">
                  <ImageIcon className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">الصور والوسائط (14 أداة)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تحويل صور الآيفون HEIC إلى JPG و PNG، ضغط الصور، تغيير المقاسات، تفريغ الخلفيات، وتحويل الصور إلى متجهات فيكتور SVG.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-2 mb-2 text-purple-400">
                  <Code className="w-5 h-5" />
                  <h3 className="font-bold text-white text-base">المطورون والبيانات (12 أداة)</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  تنسيق JSON و XML، تحويل CSV إلى JSON، تشفير وفك تشفير ملفات Base64، توليد الهاشات، وتوليد رموز QR Code التفاعلية.
                </p>
              </div>
            </div>
          </section>
        </main>
      )}

      {/* <!-- Ad Space: Footer Banner --> */}
      <div className="max-w-7xl mx-auto px-4 w-full">
        <AdSpace slot="footer-banner" />
      </div>

      {/* Footer */}
      <footer className="mt-auto bg-slate-950 border-t border-slate-800/80 py-8 px-4 text-right">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">محول الملفات الشامل PWA</span>
            <span>–</span>
            <span>جميع الحقوق محفوظة © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-emerald-400 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              أمان وخصوصية محلية 100%
            </span>
            <span>•</span>
            <span>يدعم التثبيت بدون متجر (PWA)</span>
            <span>•</span>
            <span>يعمل بدون إنترنت (Offline First)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
