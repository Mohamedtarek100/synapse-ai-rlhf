import React, { useState, useEffect } from 'react';
import { Headphones, Plus, MessageSquare, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

export default function SupportHelpdesk({ currentUser }) {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);

  // New ticket state
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('Unfair Review Dispute');
  const [priority, setPriority] = useState('high');
  const [initialMessage, setInitialMessage] = useState('');

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/support/tickets', {
        headers: {
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        }
      });
      const data = await res.json();
      if (data.tickets) {
        setTickets(data.tickets);
        if (data.tickets.length > 0 && !selectedTicket) {
          loadTicketDetails(data.tickets[0].id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadTicketDetails = async (id) => {
    try {
      const res = await fetch(`/api/support/tickets/${id}`);
      const data = await res.json();
      if (data.ticket) setSelectedTicket(data.ticket);
      if (data.messages) setMessages(data.messages);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [currentUser]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;
    try {
      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id,
          'x-user-role': currentUser.role
        },
        body: JSON.stringify({ message: replyText.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        loadTicketDetails(selectedTicket.id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !initialMessage.trim()) return;
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({ subject, category, priority, initialMessage })
      });
      const data = await res.json();
      if (data.success) {
        alert('تم فتح تذكرة الدعم بنجاح وسيتم الرد عليك في غضون دقائق!');
        setIsNewTicketOpen(false);
        setSubject('');
        setInitialMessage('');
        fetchTickets();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      await fetch(`/api/support/tickets/${selectedTicket.id}/resolve`, { method: 'POST' });
      alert('تم إغلاق التذكرة بنجاح.');
      loadTicketDetails(selectedTicket.id);
      fetchTickets();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-xs font-mono font-bold text-cyan-400">
              DISPUTES & SUPPORT HELPDESK
            </span>
            <span className="text-xs text-slate-400">مركز حل النزاعات، استئناف المراجعات، ومساعدة المقيمين</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">خدمة العملاء وفض النزاعات الأكاديمية (Support Desk)</h2>
        </div>

        <button
          onClick={() => setIsNewTicketOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400"
        >
          <Plus className="h-4 w-4" />
          <span>فتح تذكرة دعم / نزاع جديدة</span>
        </button>
      </div>

      {/* New Ticket Modal */}
      {isNewTicketOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <h3 className="font-bold text-white text-base">فتح تذكرة جديدة لمكتب الدعم وفض النزاعات</h3>
            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="text-slate-300 block mb-1">موضوع التذكرة:</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. اعتراض على تقييم مراجعة لمهمة C++ أو استفسار سحب..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">التصنيف:</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="Unfair Review Dispute">اعتراض على تقييم مراجعة (Dispute)</option>
                    <option value="Payment Issue">مشكلة دفع أو سحب أرباح</option>
                    <option value="Platform Bug">خلل تقني في المنصة</option>
                    <option value="Queue Access Request">طلب فتح طابور برمجيات متقدم</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 block mb-1">درجة الأهمية:</label>
                  <select
                    value={priority}
                    onChange={e => setPriority(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-white focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="high">مرتفعة (High)</option>
                    <option value="medium">متوسطة (Medium)</option>
                    <option value="low">عادية (Low)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">تفاصيل المشكلة والرسالة:</label>
                <textarea
                  rows={4}
                  required
                  value={initialMessage}
                  onChange={e => setInitialMessage(e.target.value)}
                  placeholder="اشرح المشكلة بدقة مع ذكر رقم المهمة أو تفاصيل الخصم..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTicketOpen(false)}
                  className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-cyan-500 px-4 py-1.5 font-bold text-slate-950 hover:bg-cyan-400"
                >
                  إرسال التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Grid: Tickets list + Thread */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Tickets List */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
          <h3 className="font-bold text-white text-xs border-b border-slate-800 pb-2">
            سجل التذاكر النشطة ({tickets.length})
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {tickets.map(tkt => (
              <div
                key={tkt.id}
                onClick={() => loadTicketDetails(tkt.id)}
                className={`cursor-pointer rounded-xl border p-3 text-xs transition-all ${
                  selectedTicket?.id === tkt.id
                    ? 'border-cyan-500 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 line-clamp-1">{tkt.subject}</span>
                  <span className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold ${
                    tkt.status === 'resolved' ? 'bg-emerald-500/20 text-emerald-300' :
                    tkt.status === 'in_review' ? 'bg-purple-500/20 text-purple-300' :
                    'bg-amber-500/20 text-amber-300'
                  }`}>
                    {tkt.status}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                  <span>{tkt.category}</span>
                  <span className="font-mono text-slate-500">{new Date(tkt.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Ticket Thread (2 cols) */}
        <div className="lg:col-span-2">
          {selectedTicket ? (
            <div className="flex flex-col h-[550px] rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              {/* Thread Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400">TICKET: {selectedTicket.id}</span>
                  <h3 className="text-sm font-bold text-white">{selectedTicket.subject}</h3>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={handleResolveTicket}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-1 text-xs font-semibold text-emerald-300 hover:bg-emerald-950/40"
                    >
                      إغلاق التذكرة كـ محلولة ✓
                    </button>
                  )}
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[85%] rounded-xl p-3 text-xs ${
                      msg.sender_role === 'support' || msg.sender_role === 'admin'
                        ? 'mr-auto bg-purple-950/40 border border-purple-500/30 text-purple-100'
                        : 'ml-auto bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 text-[10px] mb-1 font-bold">
                      <span className={msg.sender_role === 'support' ? 'text-purple-300' : 'text-cyan-400'}>
                        {msg.sender_role === 'support' ? 'مكتب الدعم الفني (Support Lead)' : 'المقيم (Worker)'}
                      </span>
                      <span className="font-mono text-slate-400">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-3 border-t border-slate-800">
                <input
                  type="text"
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="اكتب ردك أو استفسارك هنا..."
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-500 px-4 py-2 font-bold text-slate-950 hover:bg-cyan-400 flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>إرسال</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-12 text-center text-xs text-slate-500">
              اختر تذكرة لمعاينة المحادثة
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
