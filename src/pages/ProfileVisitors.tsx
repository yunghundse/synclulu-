/**
 * ProfileVisitors.tsx
 * 👁️ Shows all profile visitors from the last hour
 *
 * @version 1.0.0 - Sovereign Edition
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Eye,
  Crown,
  Clock,
  Users,
  Loader2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getProfileVisitors, ProfileVisit } from '../lib/profileVisitService';

const FOUNDER_UID = 'MIbamchs82Ve7y0ecX2TpPyymbw1';

export default function ProfileVisitors() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<ProfileVisit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchVisitors = async () => {
      setLoading(true);
      try {
        // Only fetch visitors from the last hour
        const data = await getProfileVisitors(user.id, {
          lastHourOnly: true,
          maxResults: 50,
        });
        setVisitors(data);
      } catch (error) {
        console.error('Error fetching visitors:', error);
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVisitors();
  }, [user?.id]);

  const formatTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);

    if (mins < 1) return 'Gerade eben';
    if (mins < 60) return `Vor ${mins} Min`;
    return 'Vor über 1h';
  };

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}
      >
        <div className="text-center">
          <Loader2 size={32} className="animate-spin text-violet-400 mx-auto mb-4" />
          <p className="text-white/40 text-sm">Lade Besucher...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen safe-top safe-bottom pb-24"
      style={{ background: 'linear-gradient(180deg, #050505 0%, #0a0a0a 100%)' }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(5, 5, 5, 0.92)',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        }}
      >
        <div className="px-5 py-4 flex items-center gap-4">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <ArrowLeft size={20} className="text-white/60" />
          </motion.button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Eye size={18} className="text-violet-400" />
              Profilbesucher
            </h1>
            <p className="text-[11px] text-white/40 flex items-center gap-1">
              <Clock size={10} />
              Letzte Stunde
            </p>
          </div>
          <div
            className="px-3 py-1.5 rounded-full"
            style={{
              background: 'rgba(139, 92, 246, 0.15)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <span className="text-xs font-bold text-violet-400">
              {visitors.length}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        {visitors.length === 0 ? (
          // Zero-State
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <motion.div
              className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05))',
                border: '1px solid rgba(139, 92, 246, 0.2)',
              }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Users size={32} className="text-violet-400/50" />
            </motion.div>
            <h3 className="text-lg font-bold text-white mb-2">
              Keine Besucher
            </h3>
            <p className="text-sm text-white/50 max-w-[250px] mx-auto">
              In der letzten Stunde hat niemand dein Profil besucht. Teile dein Profil um mehr Aufmerksamkeit zu bekommen!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {visitors.map((visitor, index) => (
                <motion.button
                  key={visitor.id}
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: index * 0.05 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(`/user/${visitor.visitorId}`)}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01))',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  {/* Avatar */}
                  <div className="relative">
                    <div
                      className="w-14 h-14 rounded-full overflow-hidden"
                      style={{
                        border: visitor.visitorData?.isFounder
                          ? '2px solid #fbbf24'
                          : '2px solid rgba(139, 92, 246, 0.3)',
                      }}
                    >
                      {visitor.visitorData?.photoURL ? (
                        <img
                          src={visitor.visitorData.photoURL}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: 'rgba(139, 92, 246, 0.2)' }}
                        >
                          <span className="text-lg font-bold text-white/70">
                            {(visitor.visitorData?.displayName ||
                              visitor.visitorData?.username ||
                              '?'
                            )[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {visitor.visitorData?.isFounder && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                          boxShadow: '0 2px 8px rgba(251, 191, 36, 0.4)',
                        }}
                      >
                        <Crown size={10} className="text-black" />
                      </motion.div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate flex items-center gap-2">
                      {visitor.visitorData?.displayName ||
                        visitor.visitorData?.username ||
                        'Unbekannter Besucher'}
                    </p>
                    <p className="text-xs text-white/40">
                      @{visitor.visitorData?.username || 'user'}
                    </p>
                  </div>

                  {/* Time */}
                  <div className="text-right">
                    <span
                      className="text-[10px] font-medium px-2 py-1 rounded-full"
                      style={{
                        background: 'rgba(139, 92, 246, 0.1)',
                        color: 'rgba(139, 92, 246, 0.8)',
                      }}
                    >
                      {formatTime(visitor.visitedAt)}
                    </span>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
