import React, { useState, useEffect } from 'react';
import { DollarSign, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, ShieldCheck, CreditCard } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function FinancialLedger({ currentUser }) {
  const [wallet, setWallet] = useState({ balance_pending: 180, balance_approved: 630, total_earned: 1850 });
  const [transactions, setTransactions] = useState([]);
  const [isCashoutOpen, setIsCashoutOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('200');
  const [cashoutMethod, setCashoutMethod] = useState('PayPal');
  const [destination, setDestination] = useState('mohamed@example.com');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchSummary = async () => {
    try {
      const res = await fetch('/api/earnings/summary', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (data.wallet) setWallet(data.wallet);
      if (data.transactions) setTransactions(data.transactions);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [currentUser]);

  const handleCashout = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const res = await fetch('/api/earnings/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          amount: Number(cashoutAmount),
          method: cashoutMethod,
          destination
        })
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 70, spread: 60 });
        alert(data.message);
        setIsCashoutOpen(false);
        fetchSummary();
      } else {
        alert(data.error || 'فشلت عملية السحب');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-xs font-mono font-bold text-emerald-400">
              TREASURY & FINANCIAL LEDGER
            </span>
            <span className="text-xs text-slate-400">محفظة الأرباح، الساعات المحاسبية، والسحب الفوري</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">سجل الأرباح والمحفظة المالية (Financial Hub)</h2>
        </div>

        <button
          onClick={() => setIsCashoutOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:opacity-95"
        >
          <CreditCard className="h-4 w-4" />
          <span>طلب سحب الأرباح (Instant Cashout)</span>
        </button>
      </div>

      {/* KPI Balances */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Approved Balance */}
        <div className="rounded-2xl border border-emerald-500/40 bg-emerald-950/20 p-5 backdrop-blur-md">
          <span className="text-xs font-semibold text-emerald-300">الرصيد المتاح للسحب الفوري (Available)</span>
          <div className="mt-2 font-mono text-3xl font-black text-emerald-400">
            ${wallet.balance_approved?.toFixed(2)}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">تمت مراجعته واعتماده من فريق الـ QA</p>
        </div>

        {/* Pending Review Balance */}
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-5 backdrop-blur-md">
          <span className="text-xs font-semibold text-amber-300">الرصيد المعلق قيد التدقيق (In QA Review)</span>
          <div className="mt-2 font-mono text-3xl font-black text-amber-400">
            ${wallet.balance_pending?.toFixed(2)}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">يتحول للرصيد المتاح فور اعتماد المشرف</p>
        </div>

        {/* Lifetime Earnings */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-md">
          <span className="text-xs font-semibold text-slate-400">إجمالي الأرباح الكلية (Lifetime Earnings)</span>
          <div className="mt-2 font-mono text-3xl font-black text-white">
            ${wallet.total_earned?.toFixed(2)}
          </div>
          <p className="mt-2 text-[11px] text-slate-400">معدل الساعة الحالي: ${wallet.hourly_rate}/hr</p>
        </div>
      </div>

      {/* Cashout Modal */}
      {isCashoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base">سحب الأرباح الفوري</h3>
            <p className="text-xs text-slate-400 mt-1">الرصيد المتاح: ${wallet.balance_approved?.toFixed(2)}</p>

            <form onSubmit={handleCashout} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">المبلغ المراد سحبه ($):</label>
                <input
                  type="number"
                  max={wallet.balance_approved}
                  min="10"
                  required
                  value={cashoutAmount}
                  onChange={e => setCashoutAmount(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white font-mono focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-300 block mb-1">وسيلة الدفع:</label>
                <select
                  value={cashoutMethod}
                  onChange={e => setCashoutMethod(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                >
                  <option value="PayPal">PayPal (فوري)</option>
                  <option value="AirTM">AirTM / Payoneer</option>
                  <option value="Crypto USDT">USDT / Crypto (TRC-20)</option>
                  <option value="Bank Wire">تحويل بنكي مباشر (Local Bank Wire)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">البريد الإلكتروني أو عنوان المحفظة:</label>
                <input
                  type="text"
                  required
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCashoutOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="rounded-lg bg-emerald-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-emerald-400"
                >
                  {isProcessing ? 'جاري التحويل...' : 'تأكيد السحب الآن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <h3 className="font-bold text-white text-sm mb-4">سجل العمليات المالية والتحويلات</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-3">المعاملة</th>
                <th className="pb-3">النوع</th>
                <th className="pb-3">المبلغ</th>
                <th className="pb-3">الحالة</th>
                <th className="pb-3">التاريخ والوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/30">
                  <td className="py-3 font-semibold text-white">{tx.description}</td>
                  <td className="py-3 text-slate-400">{tx.type}</td>
                  <td className={`py-3 font-mono font-bold ${tx.amount < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {tx.amount < 0 ? `-$${Math.abs(tx.amount).toFixed(2)}` : `+$${tx.amount.toFixed(2)}`}
                  </td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      tx.status === 'cleared' || tx.status === 'paid_out' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {tx.status}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-slate-500 text-[11px]">{new Date(tx.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
