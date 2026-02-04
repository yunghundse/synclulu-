/**
 * NexusDashboard.tsx
 * 👑 SYNCLULU NEXUS - Admin Control Center
 *
 * Privates Dashboard für den Gründer:
 * - Live Moderation Feed
 * - Global Stats (Active Users, AI Actions, Stability)
 * - Override Functions
 * - Terminal-Style Design
 *
 * Route: /nexus-admin (versteckt)
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RotateCcw,
  Trash2,
  Eye,
  EyeOff,
  Terminal,
  Cpu,
  Wifi,
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import {
  subscribeToModerationLogs,
  getPendingReports,
  updateReportStatus,
  unbanUser,
  type ModerationLog,
  type SafetyReport,
} from '@/lib/safetySystem';
import { overrideAIDecision, getAIModerationStats } from '@/lib/aiModeration';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN UIDs (Hier deine UID eintragen!)
// ═══════════════════════════════════════════════════════════════════════════

const ADMIN_UIDS = [
  '3lonL4ruSPU53Vuwy1U9aLO4hLp2', // Ersetze mit deiner Firebase UID
  // Weitere Admins hier hinzufügen
];

// ═══════════════════════════════════════════════════════════════════════════
// METRIC CARD
// ═══════════════════════════════════════════════════════════════════════════

const MetricCard = memo(function MetricCard({
  label,
  value,
  icon: Icon,
  color = 'emerald',
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color?: 'emerald' | 'purple' | 'amber' | 'red';
  trend?: 'up' | 'down' | 'stable';
}) {
  const colors = {
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    amber: 'text-amber-400',
    red: 'text-red-400',
  };

  return (
    <div
      className="p-5 rounded-2xl"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.05)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon size={18} className={colors[color]} />
        {trend && (
          <span
            className={`text-[9px] font-bold ${
              trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-white/30'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">
        {label}
      </p>
      <p className={`text-2xl font-bold ${colors[color]}`}>{value}</p>
    </div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// LOG ENTRY
// ═══════════════════════════════════════════════════════════════════════════

const LogEntry = memo(function LogEntry({
  log,
  onOverride,
}: {
  log: ModerationLog;
  onOverride?: (id: string) => void;
}) {
  const actionColors: Record<string, string> = {
    warning: 'text-amber-400',
    mute: 'text-orange-400',
    shadow_ban: 'text-purple-400',
    temp_ban: 'text-red-400',
    permanent_ban: 'text-red-500',
    admin_override: 'text-blue-400',
    unban: 'text-emerald-400',
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-start gap-4 py-3 border-l-2 pl-4"
      style={{
        borderColor: log.isAiDecision ? 'rgba(168, 85, 247, 0.4)' : 'rgba(16, 185, 129, 0.4)',
      }}
    >
      <span className="text-[10px] text-white/20 font-mono w-20 flex-shrink-0">
        [{formatTime(log.createdAt)}]
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          {log.isAiDecision ? (
            <Cpu size={12} className="text-purple-400" />
          ) : (
            <Shield size={12} className="text-emerald-400" />
          )}
          <span className={`text-xs font-bold uppercase tracking-wider ${actionColors[log.action] || 'text-white'}`}>
            {log.action.replace('_', ' ')}
          </span>
        </div>
        <p className="text-[11px] text-white/50 truncate">{log.reason}</p>
        <p className="text-[9px] text-white/20 mt-1">
          User: {log.targetUserId?.slice(0, 8)}...
        </p>
      </div>

      {onOverride && log.isAiDecision && (
        <button
          onClick={() => onOverride(log.id)}
          className="text-[8px] font-bold uppercase tracking-wider text-white/20 hover:text-amber-400 transition-colors"
        >
          Override
        </button>
      )}
    </motion.div>
  );
});

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function NexusDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Auth Check - user.id statt user.uid (so speichert useAuth es)
  const userId = (user as any)?.id || (user as any)?.uid;
  const isAdmin = userId && ADMIN_UIDS.includes(userId);

  // State
  const [logs, setLogs] = useState<ModerationLog[]>([]);
  const [pendingReports, setPendingReports] = useState<SafetyReport[]>([]);
  const [activeUsers, setActiveUsers] = useState(0);
  const [aiStats, setAIStats] = useState({
    todayDecisions: 0,
    overrideRate: 0,
  });
  const [isConnected, setIsConnected] = useState(true);

  // Load data
  useEffect(() => {
    if (!isAdmin) return;

    // Subscribe to moderation logs
    const unsubLogs = subscribeToModerationLogs((newLogs) => {
      setLogs(newLogs);
    }, 100);

    // Subscribe to active users count
    const unsubUsers = onSnapshot(
      query(collection(db, 'users'), where('isOnline', '==', true)),
      (snapshot) => {
        setActiveUsers(snapshot.size);
      }
    );

    // Load pending reports
    getPendingReports(20).then(setPendingReports);

    // Load AI stats
    getAIModerationStats().then((stats) => {
      setAIStats({
        todayDecisions: stats.todayDecisions,
        overrideRate: Math.round(stats.overrideRate),
      });
    });

    // Connection check
    const interval = setInterval(() => {
      setIsConnected(navigator.onLine);
    }, 5000);

    return () => {
      unsubLogs();
      unsubUsers();
      clearInterval(interval);
    };
  }, [isAdmin]);

  // Handle Override
  const handleOverride = useCallback(async (logId: string) => {
    if (!userId) return;
    // In production: Show modal to select new action
    const confirmed = window.confirm('AI-Entscheidung aufheben?');
    if (confirmed) {
      await overrideAIDecision(logId, userId, 'dismiss');
      // Refresh logs
      getPendingReports(20).then(setPendingReports);
    }
  }, [userId]);

  // Access Denied
  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <Shield size={48} className="text-red-500/50 mx-auto mb-4" />
          <p className="text-sm font-bold text-red-400">ACCESS DENIED</p>
          <p className="text-[10px] text-white/30 mt-2">Unauthorized Access Attempt Logged</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 px-6 py-2 rounded-full text-xs font-bold text-white/50 border border-white/10"
          >
            Return to Base
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen p-6 font-mono"
      style={{ background: '#050505' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(16, 185, 129, 0.1)' }}
          >
            <Terminal size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xs font-black uppercase tracking-[0.3em] text-emerald-400">
              Synclulu Nexus
            </h1>
            <p className="text-[9px] text-white/30">ROOT_ACCESS // v1.0</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            />
            <span className="text-[9px] text-white/30">
              {isConnected ? 'CONNECTED' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active_Auren"
          value={activeUsers}
          icon={Users}
          color="emerald"
          trend="stable"
        />
        <MetricCard
          label="AI_Actions_Today"
          value={aiStats.todayDecisions}
          icon={Cpu}
          color="purple"
        />
        <MetricCard
          label="Pending_Reports"
          value={pendingReports.length}
          icon={AlertTriangle}
          color={pendingReports.length > 5 ? 'red' : 'amber'}
        />
        <MetricCard
          label="Override_Rate"
          value={`${aiStats.overrideRate}%`}
          icon={RotateCcw}
          color="emerald"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Live Moderation Feed */}
        <div
          className="rounded-2xl p-6 h-[60vh] overflow-hidden flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400/60">
              Neural-Moderation-Feed
            </h2>
            <Activity size={14} className="text-emerald-400/40" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            <AnimatePresence>
              {logs.length > 0 ? (
                logs.map((log) => (
                  <LogEntry key={log.id} log={log} onOverride={handleOverride} />
                ))
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className="text-xs text-white/20">Keine Aktivität</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pending Reports */}
        <div
          className="rounded-2xl p-6 h-[60vh] overflow-hidden flex flex-col"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(245, 158, 11, 0.1)',
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400/60">
              Pending_Reports
            </h2>
            <span className="text-[9px] font-bold text-amber-400/60">
              {pendingReports.length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
            {pendingReports.map((report) => (
              <div
                key={report.id}
                className="p-4 rounded-xl"
                style={{ background: 'rgba(255, 255, 255, 0.02)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    {report.reason.replace('_', ' ')}
                  </span>
                  <span className="text-[8px] text-white/20">
                    {report.createdAt.toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="text-[10px] text-white/40 mb-3 line-clamp-2">
                  {report.description || 'Keine Beschreibung'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateReportStatus(report.id, 'resolved', user?.uid)}
                    className="flex-1 py-2 rounded-lg text-[9px] font-bold text-emerald-400 hover:bg-emerald-400/10 transition-colors"
                  >
                    <CheckCircle size={12} className="inline mr-1" />
                    Resolve
                  </button>
                  <button
                    onClick={() => updateReportStatus(report.id, 'dismissed', user?.uid)}
                    className="flex-1 py-2 rounded-lg text-[9px] font-bold text-white/40 hover:bg-white/5 transition-colors"
                  >
                    <XCircle size={12} className="inline mr-1" />
                    Dismiss
                  </button>
                </div>
              </div>
            ))}

            {pendingReports.length === 0 && (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <CheckCircle size={24} className="text-emerald-400/30 mx-auto mb-2" />
                  <p className="text-xs text-white/20">Keine offenen Reports</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-6 left-6 right-6 flex justify-between items-center">
        <p className="text-[9px] text-white/20">
          SYNCLULU_NEXUS // ROOT_ACCESS_GRANTED
        </p>
        <div className="flex items-center gap-4">
          <Wifi size={12} className={isConnected ? 'text-emerald-400' : 'text-red-400'} />
          <span className="text-[9px] text-white/20">
            {new Date().toLocaleTimeString('de-DE')}
          </span>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
