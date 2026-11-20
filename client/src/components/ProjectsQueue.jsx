import React, { useState, useEffect } from 'react';
import { Layers, ArrowRight, DollarSign, CheckCircle, Lock, Award, BookOpen, Clock } from 'lucide-react';

export default function ProjectsQueue({ 
  onSelectProject, 
  currentUser 
}) {
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetch('/api/projects')
      .then(res => res.json())
      .then(data => {
        if (data.projects) setProjects(data.projects);
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-xs font-mono font-bold text-cyan-400">
              TASK QUEUES MARKETPLACE
            </span>
            <span className="text-xs text-slate-400">طوابير المهام المتاحة لمستواك الأكاديمي</span>
          </div>
          <h2 className="mt-1 text-xl font-bold text-white">طوابير ومشاريع تدريب النماذج (Active RLHF Queues)</h2>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-1.5 text-xs">
          <span className="text-slate-400">مستواك الحالي:</span>
          <span className="font-bold text-cyan-400">{currentUser.tier}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => {
          const isEligible = true; // allow all in demo
          const progressPct = (project.completed_tasks / project.total_tasks) * 100;

          return (
            <div 
              key={project.id}
              className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-900/60 p-5 backdrop-blur-md transition-all hover:border-cyan-500/40 hover:shadow-xl"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="rounded-md bg-cyan-500/10 px-2.5 py-0.5 font-mono text-xs font-bold text-cyan-400">
                    {project.domain}
                  </span>
                  <div className="flex items-center gap-1 font-mono text-emerald-400 font-bold text-base">
                    <span>${project.hourly_rate}</span>
                    <span className="text-xs text-slate-500">/hr</span>
                  </div>
                </div>

                <h3 className="mt-3 text-base font-bold text-white">{project.name}</h3>
                <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                  {project.description}
                </p>

                {/* Requirements */}
                <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-2.5 text-xs">
                  <span className="text-[10px] text-slate-500 block">المستوى المطلوب:</span>
                  <span className="font-bold text-slate-200">{project.required_tier}</span>
                </div>

                {/* Queue Capacity */}
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>المهام المنجزة: {project.completed_tasks}/{project.total_tasks}</span>
                    <span>{Math.round(progressPct)}%</span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                    <div 
                      className="h-full bg-cyan-400 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-800/60 pt-4">
                <button
                  onClick={() => onSelectProject(project.id)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-500 py-2.5 text-xs font-bold text-slate-950 transition-all hover:bg-cyan-400"
                >
                  <span>دخول الطابور والبدء فوراً</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
