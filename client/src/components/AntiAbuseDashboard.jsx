import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, Activity, AlertTriangle, 
  Terminal, Lock, Unlock, RefreshCw, Zap, Eye, CheckCircle2
} from 'lucide-react';

export default function AntiAbuseDashboard({ 
  currentUser, 
  riskScore, 
  isQuarantined,
  onSimulateAbuse,
  onResetRiskScore 
}) {
  const [feed, setFeed] = useState([]);
  const [stats, setStats] = useState({ totalLogs: 14, quarantinedCount: 1 });
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/abuse/feed');
      const data = await res.json();
      if (data.logs) setFeed(data.logs);
      if (data.totalLogs) setStats({ totalLogs: data.totalLogs, quarantinedCount: data.quarantinedCount });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [riskScore]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-bold text-rose-400">
              SENTINEL AI — ANTI-FRAUD ENGINE
            </span>
            <span className="text-xs text-slate-400">نظام الرصد السيبراني والحماية من الاحتيال وروبوتات الـ LLM</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">مركز مراقبة النزاهة وكشف الغش (Anti-Abuse Core)</h2>
        </div>

        <button
          onClick={fetchFeed}
          className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>تحديث السجل الحي</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        {/* Risk Gauge */}
        <div className={`rounded-2xl border p-4 ${
          isQuarantined || riskScore >= 75 ? 'border-rose-500/50 bg-rose-950/20' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <span className="text-xs text-slate-400">مقياس المخاطر اللحظي للمستخدم</span>
          <div className={`mt-2 font-mono text-3xl font-black ${
            isQuarantined || riskScore >= 75 ? 'text-rose-400' : riskScore >= 35 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            {riskScore}%
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div 
              className={`h-full transition-all duration-500 ${
                isQuarantined || riskScore >= 75 ? 'bg-rose-500' : riskScore >= 35 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${riskScore}%` }}
            />
          </div>
        </div>

        {/* Account Status */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">الحالة الأمنية للحساب</span>
          <div className="mt-2 flex items-center gap-2">
            {isQuarantined ? (
              <span className="flex items-center gap-1 rounded-md bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-300">
                <Lock className="h-3.5 w-3.5" /> محظور مؤقتاً (Quarantined)
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> سليم ونشط (Active)
              </span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {isQuarantined ? 'تم تجميد سحب الأرباح والمهام' : 'صلاحية كاملة لجميع الطوابير'}
          </p>
        </div>

        {/* Total Captured Incidents */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">إجمالي الأحداث المشبوهة المرصودة</span>
          <div className="mt-2 font-mono text-3xl font-black text-white">{stats.totalLogs}</div>
          <p className="mt-2 text-[11px] text-slate-500">عمليات لصق، تسارع كتابة، وتبديل نوافذ</p>
        </div>

        {/* Global Platform Quarantine */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">الحسابات المحظورة في المنصة</span>
          <div className="mt-2 font-mono text-3xl font-black text-rose-400">{stats.quarantinedCount}</div>
          <p className="mt-2 text-[11px] text-slate-500">تم حظرهم آلياً بواسطة Sentinel AI</p>
        </div>
      </div>

      {/* Interactive Anti-Fraud Test Simulator */}
      <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-5 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">معمل تجربة خوارزميات كشف الغش (Interactive Fraud Simulator)</h3>
          </div>
          <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
            TEST BENCH
          </span>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          يمكنك النقر على أي من الأزرار التالية لتجربة رد فعل خوارزميات الحماية اللحظية على الخادم وكيف تؤثر على الـ Risk Score والحظر الآلي:
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <button
            onClick={() => onSimulateAbuse('clipboard_paste_detected', { length: 420, source: 'External Clipboard Injection' })}
            className="flex items-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-950/20 px-3 py-2 text-xs font-bold text-amber-300 hover:bg-amber-950/40"
          >
            <span>محاكاة لصق خارجي (+12% خطورة)</span>
          </button>

          <button
            onClick={() => onSimulateAbuse('rapid_cadence_burst', { wpm: 260, detectedCadenceMs: 22 })}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/20 px-3 py-2 text-xs font-bold text-purple-300 hover:bg-purple-950/40"
          >
            <span>محاكاة كتابة روبوتية سريعة (+15% خطورة)</span>
          </button>

          <button
            onClick={() => onSimulateAbuse('llm_suspicion_signature', { phrases: ['as an AI language model', 'in summary delve into'] })}
            className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/20 px-3 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/40"
          >
            <span>محاكاة نص ChatGPT (+25% خطورة)</span>
          </button>

          <button
            onClick={() => onSimulateAbuse('tab_blur_idle', { durationSeconds: 180 })}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
          >
            <span>محاكاة تبديل النوافذ والخمول (+5% خطورة)</span>
          </button>

          <button
            onClick={onResetRiskScore}
            className="flex items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/30 px-3.5 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-950/50"
          >
            <Unlock className="h-3.5 w-3.5" />
            <span>إلغاء الحظر وتصفير المخاطر (Admin Reset)</span>
          </button>
        </div>
      </div>

      {/* Real-time Telemetry Event Feed */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-bold text-white text-sm mb-4">السجل الحي للأحداث الأمنية (Live Incident Stream)</h3>
        
        <div className="space-y-2.5 max-h-96 overflow-y-auto">
          {feed.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              لا توجد بلاغات أمنية مسجلة حتى الآن.
            </div>
          ) : (
            feed.map((log) => (
              <div 
                key={log.id}
                className="flex flex-col justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs sm:flex-row sm:items-center"
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    log.event_type.includes('llm') || log.risk_delta >= 20 ? 'bg-rose-500/20 text-rose-400' :
                    log.event_type.includes('paste') ? 'bg-amber-500/20 text-amber-400' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{log.event_type}</span>
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.2 font-mono text-[10px] text-rose-300">
                        +{log.risk_delta}% Risk
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      المستخدم: <strong className="text-slate-300">{log.user_name}</strong> | المهمة: {log.task_id}
                    </span>
                  </div>
                </div>

                <div className="text-left font-mono text-[10px] text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
