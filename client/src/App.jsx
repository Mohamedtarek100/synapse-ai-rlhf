import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import RlhfStudio from './components/RlhfStudio';
import ProjectsQueue from './components/ProjectsQueue';
import AntiAbuseDashboard from './components/AntiAbuseDashboard';
import ReviewerStation from './components/ReviewerStation';
import FinancialLedger from './components/FinancialLedger';
import SupportHelpdesk from './components/SupportHelpdesk';
import AdminControlRoom from './components/AdminControlRoom';

export default function App() {
  const [currentUser, setCurrentUser] = useState({
    id: 'usr_worker',
    name: 'محمد طارق',
    role: 'worker',
    tier: 'Tier 2 - CS & Code Specialist',
    hourly_rate: 45.0,
    risk_score: 8,
    status: 'active'
  });

  const [currentTab, setCurrentTab] = useState('studio');
  const [currentTask, setCurrentTask] = useState(null);
  const [riskScore, setRiskScore] = useState(8);
  const [isQuarantined, setIsQuarantined] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Current User & Next Task
  const loadUserData = async () => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { 'x-user-id': currentUser.id }
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setRiskScore(data.user.risk_score);
        setIsQuarantined(data.user.status === 'quarantined');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadNextTask = async (projectId = null) => {
    try {
      const url = projectId ? `/api/tasks/next?projectId=${projectId}` : '/api/tasks/next';
      const res = await fetch(url, {
        headers: { 'x-user-id': currentUser.id }
      });
      if (res.status === 403) {
        setIsQuarantined(true);
        return;
      }
      const data = await res.json();
      if (data.task) {
        setCurrentTask(data.task);
      } else {
        setCurrentTask(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadUserData();
    loadNextTask();
  }, [currentUser.id]);

  // Switch persona (worker, reviewer, support, admin)
  const handleSwitchPersona = async (role) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setRiskScore(data.user.risk_score);
        setIsQuarantined(data.user.status === 'quarantined');
        // Auto navigate to relevant view
        if (role === 'reviewer') setCurrentTab('reviews');
        else if (role === 'support') setCurrentTab('support');
        else if (role === 'admin') setCurrentTab('admin');
        else setCurrentTab('studio');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Log Anti-Abuse Event in real-time
  const handleLogAbuse = async (eventType, details) => {
    try {
      const res = await fetch('/api/abuse/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          eventType,
          details,
          taskId: currentTask?.id
        })
      });
      const data = await res.json();
      if (data.success) {
        setRiskScore(data.riskScore);
        if (data.quarantined) {
          setIsQuarantined(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Task Evaluation
  const handleSubmitTask = async (subData) => {
    try {
      const res = await fetch('/api/tasks/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': currentUser.id
        },
        body: JSON.stringify({
          ...subData,
          riskScore
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`✓ تم إرسال التقييم بنجاح! تم إضافة $${data.earned.toFixed(2)} إلى رصيدك المعلق قيد المراجعة.`);
        loadUserData();
        loadNextTask();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Admin Reset Risk Score
  const handleResetUserRisk = async (targetId = currentUser.id) => {
    try {
      const res = await fetch('/api/abuse/resolve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetId, newStatus: 'active', newRiskScore: 5 })
      });
      const data = await res.json();
      if (data.success) {
        setIsQuarantined(false);
        setRiskScore(5);
        loadUserData();
        alert('تم فك الحظر وتصفير المخاطر بنجاح!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-300">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        currentUser={currentUser}
        onSwitchPersona={handleSwitchPersona}
        riskScore={riskScore}
        isQuarantined={isQuarantined}
        onRefreshData={() => {
          loadUserData();
          loadNextTask();
        }}
      />

      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'studio' && (
          <RlhfStudio
            currentTask={currentTask}
            currentUser={currentUser}
            onLogAbuse={handleLogAbuse}
            onSubmitTask={handleSubmitTask}
            onNextTask={() => loadNextTask()}
            isQuarantined={isQuarantined}
          />
        )}

        {currentTab === 'projects' && (
          <ProjectsQueue
            currentUser={currentUser}
            onSelectProject={(pId) => {
              loadNextTask(pId);
              setCurrentTab('studio');
            }}
          />
        )}

        {currentTab === 'anti-abuse' && (
          <AntiAbuseDashboard
            currentUser={currentUser}
            riskScore={riskScore}
            isQuarantined={isQuarantined}
            onSimulateAbuse={handleLogAbuse}
            onResetRiskScore={() => handleResetUserRisk(currentUser.id)}
          />
        )}

        {currentTab === 'reviews' && (
          <ReviewerStation
            currentUser={currentUser}
          />
        )}

        {currentTab === 'earnings' && (
          <FinancialLedger
            currentUser={currentUser}
          />
        )}

        {currentTab === 'support' && (
          <SupportHelpdesk
            currentUser={currentUser}
          />
        )}

        {currentTab === 'admin' && (
          <AdminControlRoom
            onResetUserRisk={handleResetUserRisk}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#060a14] py-4 px-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold">SYNAPSE-AI ENTERPRISE</span>
            <span>• Next-Gen Scalable RLHF & Human-in-the-Loop Architecture</span>
          </div>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span>BACKEND: http://localhost:5000</span>
            <span>DB: Native SQLite ACID</span>
            <span>SENTINEL: REAL-TIME</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
