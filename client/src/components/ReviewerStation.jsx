import React, { useState, useEffect } from 'react';
import { UserCheck, Star, CheckCircle2, XCircle, Clock, ShieldAlert, Sparkles, Send } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ReviewerStation({ currentUser }) {
  const [pendingList, setPendingList] = useState([]);
  const [selectedSub, setSelectedSub] = useState(null);
  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('تحليل ممتاز ومطابق لمعايير الـ Rubric بدقة، خصوصاً في تفصيل الـ Edge Cases.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/reviews/pending');
      const data = await res.json();
      if (data.submissions) {
        setPendingList(data.submissions);
        if (data.submissions.length > 0 && !selectedSub) {
          setSelectedSub(data.submissions[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleGrade = async (status) => {
    if (!selectedSub) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          submissionId: selectedSub.id,
          rating,
          feedback,
          status
        })
      });
      const data = await res.json();
      if (data.success) {
        if (status === 'approved') confetti({ particleCount: 60, spread: 60 });
        alert(status === 'approved' ? '✓ تم اعتماد التقييم وتحويل الأرباح للمقيم!' : '✕ تم رفض المهمة وتوجيه الملاحظات للمقيم.');
        setSelectedSub(null);
        fetchPending();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-xs font-mono font-bold text-purple-400">
              QA AUDIT PIPELINE
            </span>
            <span className="text-xs text-slate-400">محطة مراجعة وتقييم جودة المقيمين (Tier 2/3 Review)</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">محطة ضبط ومراجعة الجودة (Reviewer Station)</h2>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-purple-500/30 bg-purple-950/20 px-3.5 py-1.5 text-xs text-purple-300">
          <UserCheck className="h-4 w-4" />
          <span>المهام المعلقة في الطابور: <strong className="font-mono">{pendingList.length}</strong></span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Submissions Queue List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
            قائمة التقييمات المرفوعة بانتظار الاعتماد
          </h3>

          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {pendingList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                لا توجد تقييمات معلقة حالياً. تم الانتهاء من جميع المهام!
              </div>
            ) : (
              pendingList.map(sub => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSub(sub)}
                  className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                    selectedSub?.id === sub.id 
                      ? 'border-purple-500 bg-purple-950/30' 
                      : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-200">{sub.worker_name}</span>
                    <span className={`rounded px-1.5 py-0.2 font-mono text-[10px] ${
                      sub.risk_score > 30 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      Risk: {sub.risk_score}%
                    </span>
                  </div>
                  <p className="mt-1 font-bold text-cyan-400 line-clamp-1">{sub.task_title}</p>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>الوقت: {Math.floor(sub.time_spent_seconds / 60)} دقيقة</span>
                    <span>المفضل: {sub.preferred_model}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Detailed Reviewer Inspection Area (2 cols) */}
        <div className="lg:col-span-2">
          {selectedSub ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-purple-400">SUBMISSION ID: {selectedSub.id}</span>
                  <h3 className="text-base font-bold text-white">{selectedSub.task_title}</h3>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-slate-300">المقيم: {selectedSub.worker_name}</p>
                  <p className="text-[10px] text-slate-500">{new Date(selectedSub.submitted_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Justification Inspection */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                <span className="text-xs font-bold text-cyan-400">التبرير والتحليل المقدم من المقيم:</span>
                <p className="mt-2 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {selectedSub.justification}
                </p>
              </div>

              {/* Reviewer Action Bar */}
              <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300">تقييم جودة المقيم (Rating Stars):</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        key={st}
                        onClick={() => setRating(st)}
                        className={`p-1 transition-colors ${st <= rating ? 'text-amber-400' : 'text-slate-600'}`}
                      >
                        <Star className="h-5 w-5 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 block mb-1">ملاحظات المشرف وتوجيهات التحسين للمقيم:</label>
                  <textarea
                    rows={3}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    disabled={isSubmitting}
                    onClick={() => handleGrade('rejected')}
                    className="flex items-center gap-1.5 rounded-xl border border-rose-500/40 bg-rose-950/20 px-4 py-2 text-xs font-bold text-rose-300 hover:bg-rose-950/40"
                  >
                    <XCircle className="h-4 w-4" />
                    <span>رفض المهمة (Reject)</span>
                  </button>

                  <button
                    disabled={isSubmitting}
                    onClick={() => handleGrade('approved')}
                    className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>اعتماد المهمة وصرف الأرباح (Approve & Pay)</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-500">
              اختر مهمة من القائمة لمعاينتها واعتمادها
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
