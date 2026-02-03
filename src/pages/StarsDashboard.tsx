import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Star,
  Clock,
  TrendingUp,
  Calendar,
  Mic,
  BarChart3,
  Crown,
  Play,
  Download,
  Share2,
  Sparkles,
  Hand,
  Volume2,
  Eye,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { NebulaBadge, StarCategoryBadge } from '@/components/NebulaBadge';
import type { StarAnalytics, TopSupporter, NebulaTier } from '@/types';

type AnalyticsPeriod = 'day' | 'week' | 'month' | 'all_time';

const StarsDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { starProfile, user, isVerifiedStar } = useStore();
  const [period, setPeriod] = useState<AnalyticsPeriod>('week');

  // Check if user is a verified star - must come from actual verification process
  // NOT from automatic founder status or mock data
  const hasVerifiedStarStatus = isVerifiedStar && starProfile && starProfile.verifiedAt;

  // If not a verified star, show the application/verification required screen
  if (!hasVerifiedStarStatus) {
    return (
      <div className="min-h-screen bg-gray-950 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -m-2 text-gray-400 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-lg font-bold text-white">Stars Dashboard</h1>
            <div className="w-10" />
          </div>
        </div>

        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
          {/* Lock Icon */}
          <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mb-6 border border-purple-500/30">
            <Crown size={48} className="text-purple-400" />
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 text-center">
            Verifizierung erforderlich
          </h2>

          <p className="text-gray-400 text-center mb-8 max-w-sm">
            Um das Stars Dashboard nutzen zu können, musst du dich erst als Creator verifizieren lassen.
            Nach erfolgreicher Prüfung erhältst du Zugang zu allen Star-Features.
          </p>

          {/* Application Status or Apply Button */}
          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => navigate('/stars/apply')}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"
            >
              <Sparkles size={20} />
              Als Creator bewerben
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="w-full py-3 bg-gray-800/50 rounded-xl text-gray-400 font-medium border border-gray-700"
            >
              Zurück zu Einstellungen
            </button>
          </div>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30 max-w-sm">
            <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
              <TrendingUp size={16} />
              Wie werde ich Creator?
            </h3>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Erfülle die Mindestanforderungen</li>
              <li>• Reiche deine Bewerbung ein</li>
              <li>• Warte auf die Prüfung durch unser Team</li>
              <li>• Nach Freischaltung: Voller Zugang!</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Real analytics data from database (0 if empty/not set)
  const analytics: StarAnalytics = {
    userId: user?.id || '',
    period,
    totalListeners: starProfile?.totalListeners || 0,
    uniqueListeners: (starProfile as any)?.uniqueListeners || 0,
    averageListenDuration: (starProfile as any)?.averageListenDuration || 0,
    peakConcurrentListeners: (starProfile as any)?.peakConcurrentListeners || 0,
    totalStarsReceived: starProfile?.totalStarsReceived || 0,
    starsValue: ((starProfile?.totalStarsReceived || 0) * 0.10), // 0.10€ per star
    totalChatMessages: (starProfile as any)?.totalChatMessages || 0,
    averageEngagementRate: (starProfile as any)?.averageEngagementRate || 0,
    eventsHosted: starProfile?.totalEventsHosted || 0,
    totalEventDuration: (starProfile as any)?.totalEventDuration || 0,
    averageEventDuration: (starProfile as any)?.averageEventDuration || 0,
    newFollowers: (starProfile as any)?.newFollowers || 0,
    followerGrowthRate: (starProfile as any)?.followerGrowthRate || 0,
    topSupporters: (starProfile as any)?.topSupporters || [],
    listenerLocations: (starProfile as any)?.listenerLocations || [],
    listenerAgeGroups: (starProfile as any)?.listenerAgeGroups || [],
  };

  // Real profile from database (with safe defaults)
  const profile = {
    userId: starProfile?.userId || user?.id || '',
    username: starProfile?.username || user?.username || '',
    displayName: starProfile?.displayName || user?.displayName || '',
    avatar: starProfile?.avatar || (user as any)?.avatarUrl,
    verifiedAt: starProfile?.verifiedAt || null,
    category: starProfile?.category || ('creator' as const),
    nebulaTier: starProfile?.nebulaTier || ('nebula' as NebulaTier),
    totalListeners: starProfile?.totalListeners || 0,
    totalStarsReceived: starProfile?.totalStarsReceived || 0,
    totalEventsHosted: starProfile?.totalEventsHosted || 0,
    averageEventRating: starProfile?.averageEventRating || 0,
    isLive: starProfile?.isLive || false,
    permissions: starProfile?.permissions || {
      canMuteParticipants: false,
      canRemoveParticipants: false,
      canManageHandRaise: false,
      canPinMessages: false,
      canStartRecording: false,
      canVoiceLiftUsers: false,
      maxVoiceLiftSlots: 0,
      canCreatePublicEvents: false,
      canScheduleEvents: false,
      maxEventCapacity: 0,
      canChargeForEvents: false,
      hasAdvancedAnalytics: false,
      canExportData: false,
      canReportFastTrack: false,
      hasModeratorSupport: false,
    },
  };

  const periodLabels: Record<AnalyticsPeriod, string> = {
    day: 'Heute',
    week: 'Diese Woche',
    month: 'Diesen Monat',
    all_time: 'Gesamt',
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -m-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-lg font-bold text-white">Stars Dashboard</h1>
          <button className="p-2 -m-2 text-gray-400 hover:text-white">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Profile Header */}
        <div className="relative bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-6 border border-purple-500/30">
          {/* Aura Effect */}
          <div className="absolute inset-0 rounded-2xl overflow-hidden">
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.4), transparent 50%)',
              }}
            />
          </div>

          <div className="relative flex items-start gap-4">
            {/* Avatar */}
            <div className="relative">
              <div
                className="w-20 h-20 rounded-full bg-cover bg-center border-3"
                style={{
                  backgroundImage: profile.avatar
                    ? `url(${profile.avatar})`
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderColor: '#F59E0B',
                  boxShadow: '0 0 30px rgba(245, 158, 11, 0.5)',
                }}
              />
              <div className="absolute -bottom-1 -right-1">
                <NebulaBadge tier={profile.nebulaTier} size="lg" />
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">@{profile.username}</h2>
              </div>
              <p className="text-gray-400 mb-2">{profile.displayName}</p>
              <StarCategoryBadge category={profile.category} />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="relative grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-700/50">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.totalListeners.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Zuhörer</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-400">{profile.totalStarsReceived.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Sterne</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{profile.totalEventsHosted}</p>
              <p className="text-xs text-gray-400">Events</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/stars/event/new')}
            className="flex items-center justify-center gap-2 p-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white font-semibold"
          >
            <Play size={20} />
            Event starten
          </button>
          <button
            onClick={() => navigate('/stars/schedule')}
            className="flex items-center justify-center gap-2 p-4 bg-gray-800/50 rounded-xl text-gray-300 font-medium border border-gray-700"
          >
            <Calendar size={20} />
            Planen
          </button>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
          {(['day', 'week', 'month', 'all_time'] as AnalyticsPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                period === p
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={<Users className="text-blue-400" />}
            label="Zuhörer"
            value={analytics.totalListeners.toLocaleString()}
            subvalue={`${analytics.uniqueListeners.toLocaleString()} unique`}
            trend={+12.5}
          />
          <StatCard
            icon={<Star className="text-amber-400" />}
            label="Sterne"
            value={analytics.totalStarsReceived.toLocaleString()}
            subvalue={`€${analytics.starsValue.toFixed(2)}`}
            trend={+8.3}
          />
          <StatCard
            icon={<Clock className="text-green-400" />}
            label="Ø Hördauer"
            value={`${analytics.averageListenDuration}m`}
            subvalue="pro Session"
            trend={+3.2}
          />
          <StatCard
            icon={<TrendingUp className="text-purple-400" />}
            label="Engagement"
            value={`${analytics.averageEngagementRate}%`}
            subvalue="Interaktionsrate"
            trend={+5.1}
          />
          <StatCard
            icon={<Eye className="text-pink-400" />}
            label="Peak"
            value={analytics.peakConcurrentListeners.toLocaleString()}
            subvalue="gleichzeitig"
          />
          <StatCard
            icon={<TrendingUp className="text-cyan-400" />}
            label="Wachstum"
            value={`+${analytics.newFollowers.toLocaleString()}`}
            subvalue={`${analytics.followerGrowthRate}% ↑`}
            trend={analytics.followerGrowthRate}
          />
        </div>

        {/* Top Supporters */}
        <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Crown size={18} className="text-amber-400" />
              Top Supporter
            </h3>
            <button className="text-sm text-purple-400">Alle anzeigen</button>
          </div>

          <div className="space-y-3">
            {analytics.topSupporters.slice(0, 5).map((supporter, index) => (
              <SupporterRow key={supporter.userId} supporter={supporter} rank={index + 1} />
            ))}
          </div>
        </div>

        {/* Permissions Overview */}
        <div className="bg-gray-800/30 rounded-2xl p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Sparkles size={18} className="text-purple-400" />
              Deine Star-Features
            </h3>
            <NebulaBadge tier={profile.nebulaTier} size="sm" showLabel />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <PermissionItem
              icon={<Volume2 size={16} />}
              label="Stummschalten"
              enabled={profile.permissions.canMuteParticipants}
            />
            <PermissionItem
              icon={<Hand size={16} />}
              label="Hand-Management"
              enabled={profile.permissions.canManageHandRaise}
            />
            <PermissionItem
              icon={<Sparkles size={16} />}
              label="Voice Lift"
              enabled={profile.permissions.canVoiceLiftUsers}
              extra={`${profile.permissions.maxVoiceLiftSlots} Slots`}
            />
            <PermissionItem
              icon={<Mic size={16} />}
              label="Aufnahme"
              enabled={profile.permissions.canStartRecording}
            />
            <PermissionItem
              icon={<Users size={16} />}
              label="Kapazität"
              enabled={true}
              extra={`${profile.permissions.maxEventCapacity}`}
            />
            <PermissionItem
              icon={<BarChart3 size={16} />}
              label="Analytics"
              enabled={profile.permissions.hasAdvancedAnalytics}
            />
          </div>
        </div>

        {/* Export Button */}
        {profile.permissions.canExportData && (
          <button className="w-full flex items-center justify-center gap-2 p-4 bg-gray-800/50 rounded-xl text-gray-300 border border-gray-700 hover:bg-gray-700/50 transition-colors">
            <Download size={20} />
            Analytics exportieren (CSV)
          </button>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// STAT CARD COMPONENT
// ═══════════════════════════════════════

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subvalue?: string;
  trend?: number;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, subvalue, trend }) => (
  <div className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <p className="text-2xl font-bold text-white">{value}</p>
    <div className="flex items-center justify-between mt-1">
      {subvalue && <span className="text-xs text-gray-500">{subvalue}</span>}
      {trend !== undefined && (
        <span className={`text-xs font-medium ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
          {trend >= 0 ? '+' : ''}{trend.toFixed(1)}%
        </span>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════
// SUPPORTER ROW COMPONENT
// ═══════════════════════════════════════

interface SupporterRowProps {
  supporter: TopSupporter;
  rank: number;
}

const SupporterRow: React.FC<SupporterRowProps> = ({ supporter, rank }) => {
  const rankColors = ['text-amber-400', 'text-gray-400', 'text-orange-400'];

  return (
    <div className="flex items-center gap-3">
      <span className={`w-6 text-center font-bold ${rankColors[rank - 1] || 'text-gray-500'}`}>
        {rank}
      </span>
      <div
        className="w-10 h-10 rounded-full bg-cover bg-center"
        style={{
          backgroundImage: supporter.avatar
            ? `url(${supporter.avatar})`
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">@{supporter.username}</p>
        <p className="text-xs text-gray-500">{supporter.eventsAttended} Events besucht</p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-amber-400 flex items-center gap-1">
          <Star size={14} />
          {supporter.starsGiven}
        </p>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// PERMISSION ITEM COMPONENT
// ═══════════════════════════════════════

interface PermissionItemProps {
  icon: React.ReactNode;
  label: string;
  enabled: boolean;
  extra?: string;
}

const PermissionItem: React.FC<PermissionItemProps> = ({ icon, label, enabled, extra }) => (
  <div
    className={`flex items-center gap-2 p-2 rounded-lg ${
      enabled ? 'bg-purple-500/10 text-purple-300' : 'bg-gray-800/30 text-gray-500'
    }`}
  >
    {icon}
    <span className="text-xs">{label}</span>
    {extra && <span className="text-[10px] ml-auto opacity-70">{extra}</span>}
  </div>
);

export default StarsDashboard;
