import React, { useState, useEffect, useRef } from 'react';
import { 
  Cpu, Clock, AlertTriangle, ShieldAlert, CheckCircle2, 
  Send, Sparkles, Code, FileText, Check, ChevronRight, Eye, ShieldCheck, Flame
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function RlhfStudio({ 
  currentTask, 
  currentUser, 
  onLogAbuse, 
  onSubmitTask, 
  onNextTask,
  isQuarantined 
}) {
  const [preferredModel, setPreferredModel] = useState('model_a');
  const [justification, setJustification] = useState('');
  const [ratings, setRatings] = useState({
    truthfulness: 6,
    instructionFollowing: 7,
    codeQuality: 6,
    safety: 7
  });

  // Active Billable Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(140);
  const [isPaused, setIsPaused] = useState(false);
  const [liveEarnings, setLiveEarnings] = useState(0);

  // Anti-fraud local indicators
  const [pasteAlert, setPasteAlert] = useState(null);
  const [cadenceAlert, setCadenceAlert] = useState(false);
  const lastKeyTimeRef = useRef(Date.now());
  const keyIntervalsRef = useRef([]);

  // Calculate live earnings based on hourly rate
  useEffect(() => {
    const rate = currentUser?.hourly_rate || 45;
    const earned = (rate * (elapsedSeconds / 3600)).toFixed(2);
    setLiveEarnings(earned);
  }, [elapsedSeconds, currentUser]);

  // Timer interval
  useEffect(() => {
    if (isPaused || isQuarantined || !currentTask) return;
    const interval = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, isQuarantined, currentTask]);

  // Window blur / Tab switch anti-fraud listener
  useEffect(() => {
    const handleBlur = () => {
      setIsPaused(true);
      onLogAbuse('tab_blur_idle', { action: 'user_switched_tabs', taskId: currentTask?.id });
    };
    const handleFocus = () => {
      setIsPaused(false);
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentTask, onLogAbuse]);

  // Anti-Cheat: Intercept Paste in Justification
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText.length > 50) {
      setPasteAlert({
        length: pastedText.length,
        time: new Date().toLocaleTimeString()
      });

      // Send telemetry to backend Anti-Abuse Core
      onLogAbuse('clipboard_paste_detected', {
        pastedLength: pastedText.length,
        field: 'justification',
        taskId: currentTask?.id,
        sample: pastedText.slice(0, 40) + '...'
      });

      // Check for ChatGPT phrases
      const aiBuzzwords = ['in summary', 'as an ai', 'delve', 'testament', 'multifaceted', 'comprehensive overview'];
      const hasAiBuzzwords = aiBuzzwords.some(w => pastedText.toLowerCase().includes(w));
      if (hasAiBuzzwords) {
        onLogAbuse('llm_suspicion_signature', {
          detectedWords: aiBuzzwords.filter(w => pastedText.toLowerCase().includes(w)),
          taskId: currentTask?.id
        });
      }
    }
  };

  // Anti-Cheat: Typing Cadence Monitor
  const handleKeyDown = (e) => {
    const now = Date.now();
    const delta = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;

    if (delta > 0 && delta < 1000) {
      keyIntervalsRef.current.push(delta);
      if (keyIntervalsRef.current.length > 15) {
        keyIntervalsRef.current.shift();
        const avg = keyIntervalsRef.current.reduce((a, b) => a + b, 0) / keyIntervalsRef.current.length;
        // If average interval < 35ms (inhuman speed > 250 WPM)
        if (avg < 35 && !cadenceAlert) {
          setCadenceAlert(true);
          onLogAbuse('rapid_cadence_burst', { avgKeystrokeMs: Math.round(avg), taskId: currentTask?.id });
          setTimeout(() => setCadenceAlert(false), 5000);
        }
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (justification.trim().length < 40) {
      alert('يجب كتابة تبرير تحليلي لا يقل عن 40 حرفاً لتأكيد جودة التقييم الأكاديمي.');
      return;
    }

    confetti({ particleCount: 80, spread: 70 });
    onSubmitTask({
      taskId: currentTask.id,
      preferredModel,
      ratings,
      justification,
      timeSpentSeconds: elapsedSeconds
    });

    setJustification('');
    setElapsedSeconds(0);
    setPasteAlert(null);
  };

  const formatTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isQuarantined) {
    return (
      <div className="rounded-2xl border border-rose-500/50 bg-rose-950/20 p-8 text-center backdrop-blur-xl">
        <ShieldAlert className="mx-auto h-16 w-16 text-rose-500 animate-bounce" />
        <h2 className="mt-4 text-2xl font-black text-rose-300">تم تعليق حسابك في وضع الحجر الأمني (Account Quarantined)</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300">
          تجاوز مقياس المخاطر الأمني (Risk Score) نسبة 75% بسبب تكرار عمليات اللصق الخارجي المشبوه أو رصد نصوص مولدة بذكاء اصطناعي في تبريراتك. تم تعليق صلاحية الوصول لطوابير الـ RLHF مؤقتاً لحين مراجعة الـ Senior Auditor.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <span className="rounded-lg bg-rose-500/20 px-3 py-1 font-mono text-xs text-rose-300">
            SECURITY INCIDENT ID: SEC-{Date.now().toString().slice(-6)}
          </span>
        </div>
      </div>
    );
  }

  if (!currentTask) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center">
        <Cpu className="mx-auto h-12 w-12 text-cyan-400 opacity-60" />
        <h3 className="mt-4 text-lg font-bold text-white">لا توجد مهام نشطة في طابورك الحالي</h3>
        <p className="mt-1 text-xs text-slate-400">اختر مشروعاً من صفحة الطوابير (Queues) لبدء التقييم المباشر.</p>
        <button
          onClick={onNextTask}
          className="mt-4 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
        >
          جلب مهمة جديدة من السيرفر
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Studio HUD: Timer & Financial Tracker & Anti-Abuse Badges */}
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur-xl md:flex-row md:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400">
            <Cpu className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
                TASK ID: {currentTask.id}
              </span>
              <span className="text-xs text-slate-400">{currentTask.domain}</span>
            </div>
            <h2 className="mt-0.5 text-base font-bold text-white">{currentTask.title}</h2>
          </div>
        </div>

        {/* Live Billable Meter & Anti-Fraud Sentinels */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Billable Time Counter */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 font-mono">
            <div className="flex items-center gap-1.5 text-amber-400">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-bold">{formatTimer(elapsedSeconds)}</span>
              {isPaused && <span className="text-[10px] text-rose-400">(متوقف مؤقتاً)</span>}
            </div>
            <span className="text-slate-700">|</span>
            <div className="text-xs text-emerald-400 font-bold">
              +${liveEarnings} <span className="text-[10px] text-slate-500">(@ ${currentUser?.hourly_rate}/hr)</span>
            </div>
          </div>

          {/* Active Security Guards Indicators */}
          <div className="hidden items-center gap-1.5 text-[10px] text-slate-400 lg:flex">
            <span className="flex items-center gap-1 rounded bg-slate-950 px-2 py-1 border border-slate-800">
              <ShieldCheck className="h-3 w-3 text-cyan-400" />
              <span>حماية الحافظة: نشط</span>
            </span>
            <span className="flex items-center gap-1 rounded bg-slate-950 px-2 py-1 border border-slate-800">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>محلل سرعة الكتابة: نشط</span>
            </span>
          </div>
        </div>
      </div>

      {/* Security Alert Banners if triggered */}
      {pasteAlert && (
        <div className="flex items-center justify-between rounded-xl border border-amber-500/50 bg-amber-950/30 p-3 text-xs text-amber-300 animate-pulse">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <span>
              <strong>تنبيه أمني (Anti-Abuse Alert):</strong> تم رصد عملية لصق نص خارجي ({pasteAlert.length} حرف) في خانة التبرير. تم تسجيل البصمة وإرسالها للمراجعة وزيادة مقياس المخاطر +12%.
            </span>
          </div>
          <button onClick={() => setPasteAlert(null)} className="text-amber-400 hover:text-white">✕</button>
        </div>
      )}

      {cadenceAlert && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/50 bg-rose-950/30 p-3 text-xs text-rose-300">
          <ShieldAlert className="h-4 w-4 text-rose-400" />
          <span>
            <strong>تنبيه سرعة كتابة غير طبيعية:</strong> سرعة إدخال الحروف تجاوزت 200 WPM (معدل روبوتي محتمل). تم توثيق الحدث.
          </span>
        </div>
      )}

      {/* Prompt Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2">
          <span className="font-mono text-xs font-bold text-cyan-400">&gt; USER PROMPT / INSTRUCTION</span>
          <span className="text-[11px] text-slate-500">Human Evaluation Directive</span>
        </div>
        <p className="mt-3 font-mono text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
          {currentTask.prompt}
        </p>
      </div>

      {/* Side-by-Side Model Responses (A vs B) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Model A Box */}
        <div className={`flex flex-col rounded-2xl border p-5 transition-all ${
          preferredModel === 'model_a' ? 'border-cyan-500/60 bg-cyan-950/15 shadow-xl shadow-cyan-500/10' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 font-mono text-xs font-bold text-cyan-400">
                A
              </span>
              <h3 className="font-bold text-white text-sm">رد النموذج اللغوي (Model A Response)</h3>
            </div>
            <button
              onClick={() => setPreferredModel('model_a')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                preferredModel === 'model_a' ? 'bg-cyan-500 text-slate-950' : 'border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {preferredModel === 'model_a' ? '✓ النموذج المفضل' : 'اختيار كأفضل'}
            </button>
          </div>

          <pre className="mt-4 flex-1 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap select-none leading-relaxed">
            {currentTask.response_a}
          </pre>
        </div>

        {/* Model B Box */}
        <div className={`flex flex-col rounded-2xl border p-5 transition-all ${
          preferredModel === 'model_b' ? 'border-purple-500/60 bg-purple-950/15 shadow-xl shadow-purple-500/10' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/20 font-mono text-xs font-bold text-purple-400">
                B
              </span>
              <h3 className="font-bold text-white text-sm">رد النموذج اللغوي (Model B Response)</h3>
            </div>
            <button
              onClick={() => setPreferredModel('model_b')}
              className={`rounded-lg px-3 py-1 text-xs font-bold transition-all ${
                preferredModel === 'model_b' ? 'bg-purple-500 text-white' : 'border border-slate-700 text-slate-400 hover:text-white'
              }`}
            >
              {preferredModel === 'model_b' ? '✓ النموذج المفضل' : 'اختيار كأفضل'}
            </button>
          </div>

          <pre className="mt-4 flex-1 overflow-x-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-200 whitespace-pre-wrap select-none leading-relaxed">
            {currentTask.response_b}
          </pre>
        </div>
      </div>

      {/* Preference & Rubric Evaluation Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-6">
        <div>
          <h3 className="font-bold text-white text-base">معايير التقييم الأكاديمي (RLHF Rubric & Scoring)</h3>
          <p className="text-xs text-slate-400">قيم دقة المخرجات والالتزام بالتعليمات على مقياس من 1 إلى 7</p>
        </div>

        {/* Likert Scales */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {/* Truthfulness */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">الدقة والصحة البرمجية (Truthfulness & Correctness)</span>
              <span className="font-mono font-bold text-cyan-400">{ratings.truthfulness} / 7</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={ratings.truthfulness}
              onChange={e => setRatings({ ...ratings, truthfulness: Number(e.target.value) })}
              className="mt-3 w-full accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>أخطاء فادحة / Hallucination</span>
              <span>خالٍ تماماً من الأخطاء</span>
            </div>
          </div>

          {/* Instruction Following */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">الالتزام بتعليمات البرومبت (Instruction Following)</span>
              <span className="font-mono font-bold text-purple-400">{ratings.instructionFollowing} / 7</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={ratings.instructionFollowing}
              onChange={e => setRatings({ ...ratings, instructionFollowing: Number(e.target.value) })}
              className="mt-3 w-full accent-purple-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>تجاهل شروط البرومبت</span>
              <span>تطبيق دقيق لكافة المتطلبات</span>
            </div>
          </div>

          {/* Code Quality & Efficiency */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">جودة وهندسة الكود (Clean Code & Efficiency)</span>
              <span className="font-mono font-bold text-emerald-400">{ratings.codeQuality} / 7</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={ratings.codeQuality}
              onChange={e => setRatings({ ...ratings, codeQuality: Number(e.target.value) })}
              className="mt-3 w-full accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>كود غير كفء / Memory Leak</span>
              <span>كود إنتاجي معياري O(1)</span>
            </div>
          </div>

          {/* Safety & Harmlessness */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200">الأمان وعدم التحيز (Safety & Harmlessness)</span>
              <span className="font-mono font-bold text-amber-400">{ratings.safety} / 7</span>
            </div>
            <input
              type="range"
              min="1"
              max="7"
              value={ratings.safety}
              onChange={e => setRatings({ ...ratings, safety: Number(e.target.value) })}
              className="mt-3 w-full accent-amber-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>محتوى ضار / غير آمن</span>
              <span>آمن 100% ومتوافق</span>
            </div>
          </div>
        </div>

        {/* Justification Field with Anti-Cheat Event Listeners */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-200">
              التبرير التحليلي لاختيارك (Critique & Justification)
            </label>
            <span className="font-mono text-xs text-slate-400">
              {justification.length} حرف (الحد الأدنى: 40)
            </span>
          </div>

          <textarea
            rows={4}
            required
            value={justification}
            onChange={e => setJustification(e.target.value)}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            placeholder="اشرح بالتفصيل لماذا يفضل هذا النموذج؟ اذكر الأسطر أو الخوارزميات أو الفروقات التقنية في التعامل مع الـ Edge Cases..."
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
          />

          <p className="mt-1.5 text-[11px] text-slate-500">
            🛡️ <strong>تنبيه النزاهة الأكاديمية:</strong> يمنع منعاً باتاً استخدام نماذج ذكاء اصطناعي خارجية لكتابة التبرير. خوارزميات المنصة تفحص بصمات النصوص وسرعة الكتابة آلياً.
          </p>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onNextTask}
            className="text-xs text-slate-400 hover:text-white"
          >
            تخطي هذه المهمة وجلب أخرى ←
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02] hover:opacity-95"
          >
            <Send className="h-4 w-4" />
            <span>اعتماد وإرسال التقييم (Submit RLHF Task)</span>
          </button>
        </div>
      </form>
    </div>
  );
}
