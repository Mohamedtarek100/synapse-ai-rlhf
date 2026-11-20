import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, ShieldAlert, Cpu, DollarSign, 
  Plus, CheckCircle, Lock, Unlock, RefreshCw 
} from 'lucide-react';

export default function AdminControlRoom({ onResetUserRisk }) {
  const [data, setData] = useState(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // New Project Form
  const [pName, setPName] = useState('');
  const [pDomain, setPDomain] = useState('Code Generation');
  const [pRate, setPRate] = useState('50');
  const [pDesc, setPDesc] = useState('');

  const fetchMetrics = async () => {
    try {
      const res = await fetch('/api/admin/metrics');
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!pName.trim()) return;
    try {
      const res = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pName,
          domain: pDomain,
          hourly_rate: Number(pRate),
          description: pDesc
        })
      });
      const resData = await res.json();
      if (resData.success) {
        alert('تم إنشاء طابور المشروع الجديد وحفظه في قاعدة البيانات!');
        setIsCreatingProject(false);
        setPName('');
        setPDesc('');
        fetchMetrics();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (!data) return <div className="p-8 text-center text-xs text-slate-500">جاري تحميل إحصائيات النظام...</div>;

  const { metrics, usersList, recentAbuse } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-rose-500/40 bg-rose-500/10 px-2 py-0.5 text-xs font-mono font-bold text-rose-400">
              OPERATIONS CONTROL ROOM
            </span>
            <span className="text-xs text-slate-400">الإدارة المركزية لتدريب النماذج، الرقابة، والمحاسبة</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">غرفة قيادة العمليات المركزية (Executive Admin Hub)</h2>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setIsCreatingProject(true)}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
          >
            <Plus className="h-4 w-4" />
            <span>إضافة طابور مشروع جديد</span>
          </button>
          <button
            onClick={fetchMetrics}
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <span className="text-xs text-slate-400">المقيمين النشطين (Active Workers)</span>
          <div className="mt-2 font-mono text-3xl font-black text-cyan-400">{metrics.activeWorkers}</div>
          <p className="mt-2 text-[11px] text-slate-500">إجمالي الحسابات: {metrics.totalUsers}</p>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-4">
          <span className="text-xs text-slate-400">الحسابات المحظورة (Quarantined)</span>
          <div className="mt-2 font-mono text-3xl font-black text-rose-400">{metrics.quarantinedUsers}</div>
          <p className="mt-2 text-[11px] text-slate-500">تجاوزوا مقياس الخطر &gt;= 75%</p>
        </div>

        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4">
          <span className="text-xs text-slate-400">إجمالي الأرباح المصروفة للمقيمين</span>
          <div className="mt-2 font-mono text-3xl font-black text-emerald-400">${metrics.totalPaid.toFixed(2)}</div>
          <p className="mt-2 text-[11px] text-slate-500">سحوبات PayPal والتحويل البنكي</p>
        </div>

        <div className="rounded-2xl border border-purple-500/30 bg-purple-950/20 p-4">
          <span className="text-xs text-slate-400">مهام بانتظار اعتماد الجودة (Pending QA)</span>
          <div className="mt-2 font-mono text-3xl font-black text-purple-400">{metrics.pendingReviews}</div>
          <p className="mt-2 text-[11px] text-slate-500">من أصل {metrics.totalTasks} مهمة</p>
        </div>
      </div>

      {/* Create Project Modal */}
      {isCreatingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base">إنشاء طابور مشروع جديد (New RLHF Queue)</h3>
            <form onSubmit={handleCreateProject} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">اسم المشروع:</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={e => setPName(e.target.value)}
                  placeholder="e.g. Project Phoenix: Rust Systems RLHF"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">المجال الأكاديمي (Domain):</label>
                <select
                  value={pDomain}
                  onChange={e => setPDomain(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                >
                  <option value="Code Generation">برمجيات وخوارزميات (Code Generation)</option>
                  <option value="Reasoning & Math">رياضيات واستدلال منطقي (Reasoning)</option>
                  <option value="Safety & Red Teaming">أمان واختبار اختراق (Red Teaming)</option>
                  <option value="Creative & Factuality">تحقق من الحقائق (Factuality)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">سعر الساعة للمقيم ($/hr):</label>
                <input
                  type="number"
                  required
                  value={pRate}
                  onChange={e => setPRate(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">وصف المشروع ومعايير التقييم:</label>
                <textarea
                  rows={3}
                  value={pDesc}
                  onChange={e => setPDesc(e.target.value)}
                  placeholder="اشرح طبيعة المهام والمعايير المطلوبة من المقيمين..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreatingProject(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-cyan-400"
                >
                  حفظ في قاعدة البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users & Accounts Ledger */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-bold text-white text-sm mb-4">سجل المقيمين والمشرفين (Users Database)</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3">المستخدم</th>
                <th className="pb-3">الدور الأكاديمي</th>
                <th className="pb-3">المستوى (Tier)</th>
                <th className="pb-3">سعر الساعة</th>
                <th className="pb-3">مقياس المخاطر</th>
                <th className="pb-3">الحالة الأمنية</th>
                <th className="pb-3 text-center">إجراءات الإدارة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {usersList.map(u => (
                <tr key={u.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-white">
                    {u.name}
                    <span className="block text-[10px] text-slate-500 font-mono">{u.email}</span>
                  </td>
                  <td className="py-3 text-cyan-400 font-bold">{u.role}</td>
                  <td className="py-3 text-slate-300">{u.tier}</td>
                  <td className="py-3 font-mono text-emerald-400">${u.hourly_rate}/hr</td>
                  <td className="py-3 font-mono">
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                      u.risk_score >= 75 ? 'bg-rose-500/20 text-rose-300' :
                      u.risk_score >= 35 ? 'bg-amber-500/20 text-amber-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {u.risk_score}%
                    </span>
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      u.status === 'quarantined' ? 'bg-rose-500/30 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3 text-center">
                    {u.status === 'quarantined' ? (
                      <button
                        onClick={() => onResetUserRisk(u.id)}
                        className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/30"
                      >
                        إلغاء الحظر وتصفير الخطر
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-500">حساب سليم</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
