/**
 * synclulu DIGITAL OPERATING SYSTEM
 * Referral Section Component - 5 Exclusive Invite Links
 */

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import {
  Gift,
  Link,
  Copy,
  Share2,
  Check,
  Users,
  Zap,
  Crown,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import {
  initializeUserReferrals,
  getUserReferrals,
  getReferralStats,
  copyReferralLink,
  shareReferralLink,
  UserReferralData,
} from '@/lib/referralSystem';

const ReferralSection = () => {
  const { user } = useStore();
  const [referralData, setReferralData] = useState<UserReferralData | null>(null);
  const [stats, setStats] = useState({
    totalLinks: 5,
    usedLinks: 0,
    availableLinks: 5,
    totalReferrals: 0,
    xpEarned: 0,
    premiumDaysEarned: 0,
  });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAllLinks, setShowAllLinks] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, [user?.id]);

  const loadReferralData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      let data = await getUserReferrals(user.id);

      if (!data) {
        data = await initializeUserReferrals(user.id);
      }

      setReferralData(data);

      const statsData = await getReferralStats(user.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async (code: string) => {
    const success = await copyReferralLink(code);
    if (success) {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    }
  };

  const handleShareLink = async (code: string) => {
    await shareReferralLink(code, user?.username || 'Ein Freund');
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-20 bg-white/10 rounded" />
      </div>
    );
  }

  const availableLinks = referralData?.links.filter(l => l.isActive && !l.usedBy) || [];
  const usedLinks = referralData?.links.filter(l => l.usedBy !== null) || [];
  const displayLinks = showAllLinks ? availableLinks : availableLinks.slice(0, 2);

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-purple-600 via-violet-600 to-pink-600 rounded-2xl p-6 text-white relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-pink-500/20 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Referral System</h2>
              <p className="text-white/80 text-sm">Lade Freunde ein & erhalte Belohnungen</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Users size={16} />
                <span className="text-2xl font-bold">{stats.totalReferrals}</span>
              </div>
              <p className="text-xs text-white/70">Eingeladen</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap size={16} className="text-yellow-300" />
                <span className="text-2xl font-bold">{stats.xpEarned}</span>
              </div>
              <p className="text-xs text-white/70">XP verdient</p>
            </div>

            <div className="bg-white/10 backdrop-blur-xl rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Link size={16} />
                <span className="text-2xl font-bold">{stats.availableLinks}</span>
              </div>
              <p className="text-xs text-white/70">Verfügbar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Info */}
      <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Sparkles size={20} className="text-amber-500" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-200 mb-1">Belohnungen pro Einladung</h3>
            <div className="space-y-1 text-sm text-amber-100/80">
              <p className="flex items-center gap-2">
                <Zap size={14} className="text-amber-400" />
                <span>+500 XP für dich</span>
              </p>
              <p className="flex items-center gap-2">
                <Crown size={14} className="text-amber-400" />
                <span>+7 Tage Premium</span>
              </p>
              <p className="flex items-center gap-2">
                <Gift size={14} className="text-amber-400" />
                <span>+250 XP für deinen Freund</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Links */}
      <div className="bg-white/5 rounded-2xl p-4">
        <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
          <Link size={18} className="text-purple-400" />
          Deine exklusiven Links ({stats.availableLinks}/{stats.totalLinks})
        </h3>

        <div className="space-y-2">
          {displayLinks.length === 0 ? (
            <div className="text-center py-6 text-white/50">
              <Gift size={32} className="mx-auto mb-2 opacity-50" />
              <p>Alle Links wurden verwendet!</p>
              <p className="text-sm">Danke fürs Teilen 💜</p>
            </div>
          ) : (
            displayLinks.map((link, index) => (
              <div
                key={link.id}
                className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white/60 mb-0.5">Link #{index + 1}</p>
                  <p className="font-mono text-white font-medium truncate">
                    {link.code}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyLink(link.code)}
                    className={`p-2.5 rounded-xl transition-all ${
                      copiedCode === link.code
                        ? 'bg-green-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                    }`}
                  >
                    {copiedCode === link.code ? <Check size={18} /> : <Copy size={18} />}
                  </button>

                  <button
                    onClick={() => handleShareLink(link.code)}
                    className="p-2.5 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors"
                  >
                    <Share2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}

          {availableLinks.length > 2 && !showAllLinks && (
            <button
              onClick={() => setShowAllLinks(true)}
              className="w-full py-3 text-center text-purple-400 hover:text-purple-300 text-sm flex items-center justify-center gap-1"
            >
              Alle {availableLinks.length} Links anzeigen
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Used Links */}
      {usedLinks.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-4">
          <h3 className="font-semibold text-white/60 mb-3 flex items-center gap-2">
            <Check size={18} className="text-green-400" />
            Verwendete Links ({usedLinks.length})
          </h3>

          <div className="space-y-2">
            {usedLinks.map((link, index) => (
              <div
                key={link.id}
                className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-center gap-3"
              >
                <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Check size={16} className="text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-white/60 text-sm line-through">
                    {link.code}
                  </p>
                  <p className="text-xs text-green-400">
                    Verwendet {link.usedAt ? new Date(link.usedAt).toLocaleDateString('de-DE') : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referred By */}
      {referralData?.referredBy && (
        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
              <Users size={20} className="text-green-400" />
            </div>
            <div>
              <p className="text-sm text-green-400">Du wurdest eingeladen mit:</p>
              <p className="font-mono text-white font-medium">{referralData.referredByCode}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralSection;
