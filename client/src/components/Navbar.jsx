import React from 'react';
import { 
  ShieldAlert, ShieldCheck, Cpu, DollarSign, UserCheck, 
  Layers, Headphones, LayoutDashboard, AlertTriangle, Activity, 
  CheckCircle2, Sparkles, User, RefreshCw
} from 'lucide-react';

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  currentUser, 
  onSwitchPersona, 
  riskScore, 
  isQuarantined,
  onRefreshData 
}) {
  const tabs = [
    { id: 'studio', label: 'استوديو تقييم النماذج (RLHF Studio)', icon: Cpu, roles: ['worker', 'admin'] },
    { id: 'projects', label: 'طوابير المشاريع (Queues)', icon: Layers, roles: ['worker', 'admin'] },
    { id: 'anti-abuse', label: 'رادار كشف الاحتيال المباشر (Anti-Abuse)', icon: ShieldAlert, roles: ['worker', 'reviewer', 'admin', 'support'] },
    { id: 'reviews', label: 'محطة مراجعة الجودة (Reviewer QA)', icon: UserCheck, roles: ['reviewer', 'admin'] },
    { id: 'earnings', label: 'المحفظة والأرباح (Ledger)', icon: DollarSign, roles: ['worker', 'admin'] },
    { id: 'support', label: 'خدمة العملاء وفض النزاعات (Support)', icon: Headphones, roles: ['worker', 'reviewer', 'admin', 'support'] },
    { id: 'admin', label: 'غرفة قيادة العمليات (Executive Admin)', icon: LayoutDashboard, roles: ['admin'] },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-[#060a14]/95 backdrop-blur-xl">
      {/* Top Telemetry & Role Switcher Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800/60 px-4 py-2 text-xs">
        {/* Left: Brand & Engine status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${isQuarantined ? 'bg-rose-400' : 'bg-cyan-400'} opacity-75`}></span>
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${isQuarantined ? 'bg-rose-500' : 'bg-cyan-500'}`}></span>
            </span>
            <span className="font-mono font-bold tracking-wider text-cyan-400">
              SYNAPSE<span className="text-white">.AI</span>
            </span>
            <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 font-mono text-[10px] text-indigo-300">
              RLHF ENTERPRISE v3.2
            </span>
          </div>

          <span className="hidden text-slate-700 sm:inline">|</span>

          {/* Anti-Abuse Risk Score Gauge */}
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-semibold">مقياس المخاطر الأمني:</span>
            <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
              isQuarantined || riskScore >= 75
                ? 'border border-rose-500/50 bg-rose-950/40 text-rose-300 animate-pulse'
                : riskScore >= 35
                ? 'border border-amber-500/50 bg-amber-950/40 text-amber-300'
                : 'border border-emerald-500/50 bg-emerald-950/40 text-emerald-300'
            }`}>
              {isQuarantined ? <ShieldAlert className="h-3 w-3" /> : <ShieldCheck className="h-3 w-3" />}
              <span>{riskScore}% {isQuarantined ? '(حظر مؤقت - QUARANTINED)' : riskScore < 30 ? '(آمن - SAFE)' : '(تحت المراقبة)'}</span>
            </div>
          </div>
        </div>

        {/* Right: Persona / Role Switcher */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefreshData}
            title="تحديث البيانات من السيرفر"
            className="rounded p-1 text-slate-400 hover:text-cyan-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>

          <span className="text-slate-400">التبديل بين الأدوار:</span>
          <div className="flex rounded-lg border border-slate-700/80 bg-slate-900 p-0.5">
            <button
              onClick={() => onSwitchPersona('worker')}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                currentUser.role === 'worker' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              مقيّم (Worker)
            </button>
            <button
              onClick={() => onSwitchPersona('reviewer')}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                currentUser.role === 'reviewer' ? 'bg-purple-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              مشرف جودة (Reviewer)
            </button>
            <button
              onClick={() => onSwitchPersona('support')}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                currentUser.role === 'support' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              خدمة العملاء (Support)
            </button>
            <button
              onClick={() => onSwitchPersona('admin')}
              className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-all ${
                currentUser.role === 'admin' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              مدير النظام (Admin)
            </button>
          </div>

          <div className="hidden items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 md:flex">
            <User className="h-3.5 w-3.5 text-cyan-400" />
            <span className="text-slate-200 font-bold">{currentUser.name.split(' ')[0]}</span>
            <span className="font-mono text-emerald-400 font-bold">${currentUser.hourly_rate}/hr</span>
          </div>
        </div>
      </div>

      {/* Tabs Bar */}
      <nav className="flex space-x-1 space-x-reverse overflow-x-auto px-4 py-2 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'border border-cyan-500/40 bg-cyan-950/40 text-cyan-300 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
