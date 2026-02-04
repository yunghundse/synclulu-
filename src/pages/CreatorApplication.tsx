/**
 * CreatorApplication.tsx
 * 🎨 CREATOR APPLICATION - Sovereign Design Edition
 *
 * Features:
 * - Sovereign-Look mit Glass-Morphism
 * - Kachel-basiertes Layout
 * - Smooth Animations
 * - OLED-optimiert (#050505)
 *
 * @version 2.0.0 - Social-Nexus Edition
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Upload,
  Instagram,
  Youtube,
  Twitter,
  Music2,
  Linkedin,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Plus,
  X,
  FileText,
  Camera,
  Award,
  Users,
  Mic,
  Star,
  Crown,
  ChevronRight,
} from 'lucide-react';
import { NebulaBadge } from '@/components/NebulaBadge';
import { useStore } from '@/lib/store';
import type { StarCategory, SocialPlatform, SocialMediaLink } from '@/types';
import { CREATOR_REQUIREMENTS } from '@/types';

type ApplicationStep = 'intro' | 'category' | 'social' | 'documents' | 'review' | 'submitted';
type ApplicationPath = 'vip' | 'community';

// ═══════════════════════════════════════════════════════════════
// SOVEREIGN PANEL COMPONENTS
// ═══════════════════════════════════════════════════════════════

const SovereignPanel = ({
  children,
  className = '',
  gradient = false,
  glow = false,
  glowColor = '#a855f7',
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  glow?: boolean;
  glowColor?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`rounded-2xl overflow-hidden ${className}`}
    style={{
      background: gradient
        ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(168, 85, 247, 0.05))'
        : 'rgba(255, 255, 255, 0.02)',
      border: `1px solid ${gradient ? 'rgba(168, 85, 247, 0.2)' : 'rgba(255, 255, 255, 0.05)'}`,
      boxShadow: glow ? `0 0 40px ${glowColor}20` : 'none',
    }}
  >
    {children}
  </motion.div>
);

const SovereignButton = ({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  icon,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success';
  fullWidth?: boolean;
  icon?: React.ReactNode;
}) => {
  const backgrounds = {
    primary: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    secondary: 'rgba(255, 255, 255, 0.05)',
    success: 'linear-gradient(135deg, #22c55e, #16a34a)',
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`py-4 px-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all ${
        fullWidth ? 'w-full' : ''
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      style={{
        background: backgrounds[variant],
        boxShadow: variant !== 'secondary' ? '0 4px 20px rgba(168, 85, 247, 0.3)' : 'none',
      }}
    >
      {icon}
      {children}
    </motion.button>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

const CreatorApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useStore();

  // User Stats
  const totalStarsReceived = (user as any)?.totalStarsReceived || 0;
  const level = (user as any)?.level || 1;
  const totalVoiceMinutes = (user as any)?.totalVoiceMinutes || 0;
  const positiveRatings = (user as any)?.positiveRatings || 0;
  const totalRatings = (user as any)?.totalRatings || 1;
  const positiveRatingsPercentage = Math.round((positiveRatings / totalRatings) * 100);

  const isEligibleCommunityCreator = useMemo(
    () =>
      totalStarsReceived >= CREATOR_REQUIREMENTS.starsRequired &&
      level >= CREATOR_REQUIREMENTS.levelRequired &&
      totalVoiceMinutes >= CREATOR_REQUIREMENTS.voiceMinutesRequired &&
      positiveRatingsPercentage >= CREATOR_REQUIREMENTS.minPositiveRatings,
    [totalStarsReceived, level, totalVoiceMinutes, positiveRatingsPercentage]
  );

  const pathFromUrl = searchParams.get('path') as ApplicationPath | null;
  const [applicationPath, setApplicationPath] = useState<ApplicationPath>(
    pathFromUrl === 'community' && isEligibleCommunityCreator ? 'community' : 'vip'
  );

  const [step, setStep] = useState<ApplicationStep>('intro');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [category, setCategory] = useState<StarCategory | null>(
    applicationPath === 'community' ? 'creator' : null
  );
  const [description, setDescription] = useState('');
  const [followerCount, setFollowerCount] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([]);
  const [documents, setDocuments] = useState<File[]>([]);

  const accentColor = applicationPath === 'community' ? '#22c55e' : '#a855f7';

  // ═══════════════════════════════════════════════════════════════
  // CATEGORIES
  // ═══════════════════════════════════════════════════════════════
  const CATEGORIES: { value: StarCategory; label: string; emoji: string; desc: string }[] = [
    { value: 'influencer', label: 'Influencer', emoji: '📱', desc: 'Social Media Creator' },
    { value: 'entrepreneur', label: 'Unternehmer', emoji: '💼', desc: 'Gründer & Business' },
    { value: 'artist', label: 'Künstler', emoji: '🎨', desc: 'Bildende Kunst' },
    { value: 'musician', label: 'Musiker', emoji: '🎵', desc: 'Musik & Audio' },
    { value: 'athlete', label: 'Sportler', emoji: '⚽', desc: 'Profisport' },
    { value: 'actor', label: 'Schauspieler', emoji: '🎭', desc: 'Film & Theater' },
    { value: 'creator', label: 'Creator', emoji: '✨', desc: 'Content Creator' },
    { value: 'journalist', label: 'Journalist', emoji: '📰', desc: 'Medien & Presse' },
    { value: 'scientist', label: 'Wissenschaftler', emoji: '🔬', desc: 'Forschung & Bildung' },
    { value: 'other', label: 'Andere', emoji: '⭐', desc: 'Persönlichkeit' },
  ];

  // ═══════════════════════════════════════════════════════════════
  // PLATFORMS
  // ═══════════════════════════════════════════════════════════════
  const PLATFORMS: { value: SocialPlatform; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
    { value: 'tiktok', label: 'TikTok', icon: Music2, color: '#000000' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
    { value: 'twitter', label: 'X / Twitter', icon: Twitter, color: '#1DA1F2' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { value: 'other', label: 'Andere', icon: Globe, color: '#6B7280' },
  ];

  const addSocialLink = (platform: SocialPlatform) => {
    if (!socialLinks.find((l) => l.platform === platform)) {
      setSocialLinks([...socialLinks, { platform, url: '', username: '' }]);
    }
  };

  const updateSocialLink = (platform: SocialPlatform, field: 'url' | 'username', value: string) => {
    setSocialLinks(socialLinks.map((l) => (l.platform === platform ? { ...l, [field]: value } : l)));
  };

  const removeSocialLink = (platform: SocialPlatform) => {
    setSocialLinks(socialLinks.filter((l) => l.platform !== platform));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDocuments([...documents, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setStep('submitted');
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER INTRO
  // ═══════════════════════════════════════════════════════════════
  const renderIntro = () => (
    <div className="px-5 text-center">
      {/* Path Selector */}
      {isEligibleCommunityCreator && (
        <div
          className="mb-6 p-1 rounded-xl flex"
          style={{ background: 'rgba(255, 255, 255, 0.05)' }}
        >
          <button
            onClick={() => setApplicationPath('vip')}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
              applicationPath === 'vip' ? 'text-white' : 'text-white/40'
            }`}
            style={{
              background: applicationPath === 'vip' ? 'linear-gradient(135deg, #a855f7, #7c3aed)' : 'transparent',
            }}
          >
            VIP / Influencer
          </button>
          <button
            onClick={() => {
              setApplicationPath('community');
              setCategory('creator');
            }}
            className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${
              applicationPath === 'community' ? 'text-white' : 'text-white/40'
            }`}
            style={{
              background: applicationPath === 'community' ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'transparent',
            }}
          >
            Community Creator
          </button>
        </div>
      )}

      {/* Hero Badge */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <div
          className="absolute inset-2 rounded-full flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}80)` }}
        >
          {applicationPath === 'community' ? (
            <Award size={48} className="text-white" />
          ) : (
            <Crown size={48} className="text-white" />
          )}
        </div>
      </div>

      <h1 className="text-3xl font-black text-white mb-3">
        {applicationPath === 'community' ? 'Community Creator' : 'Creator werden'}
      </h1>
      <p className="text-white/50 mb-8 max-w-sm mx-auto text-sm">
        {applicationPath === 'community'
          ? 'Du hast dich durch dein Engagement qualifiziert!'
          : 'Exklusiv für Persönlichkeiten des öffentlichen Lebens.'}
      </p>

      {/* Stats for Community */}
      {applicationPath === 'community' && (
        <div className="grid grid-cols-2 gap-3 mb-6 max-w-sm mx-auto">
          {[
            { icon: Star, value: totalStarsReceived, label: 'Sterne', color: '#fbbf24' },
            { icon: Mic, value: totalVoiceMinutes, label: 'Voice-Min', color: '#3b82f6' },
            { icon: Users, value: `Lvl ${level}`, label: 'Level', color: '#a855f7' },
            { icon: CheckCircle2, value: `${positiveRatingsPercentage}%`, label: 'Positiv', color: '#22c55e' },
          ].map((stat, i) => (
            <SovereignPanel key={i} gradient>
              <div className="p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <stat.icon size={14} style={{ color: stat.color }} />
                  <span className="text-lg font-black text-white">{stat.value}</span>
                </div>
                <p className="text-[10px] text-white/40">{stat.label}</p>
              </div>
            </SovereignPanel>
          ))}
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-2 mb-8 text-left max-w-sm mx-auto">
        {(applicationPath === 'community'
          ? [
              { icon: '🏆', text: 'Community Creator Badge' },
              { icon: '🎙️', text: 'Voice-Räume hosten' },
              { icon: '📊', text: 'Analytics Dashboard' },
            ]
          : [
              { icon: '✨', text: 'Verifiziertes Badge' },
              { icon: '🎙️', text: 'Erweiterte Moderationsrechte' },
              { icon: '📊', text: 'Detaillierte Analytics' },
            ]
        ).map((benefit, i) => (
          <SovereignPanel key={i} gradient>
            <div className="flex items-center gap-3 p-3">
              <span className="text-xl">{benefit.icon}</span>
              <span className="text-sm text-white/80">{benefit.text}</span>
            </div>
          </SovereignPanel>
        ))}
      </div>

      <SovereignButton
        onClick={() => setStep(applicationPath === 'community' ? 'social' : 'category')}
        variant={applicationPath === 'community' ? 'success' : 'primary'}
      >
        {applicationPath === 'community' ? 'Weiter zur Bewerbung' : 'Jetzt bewerben'}
      </SovereignButton>

      {applicationPath === 'community' && (
        <p className="text-xs text-emerald-400 mt-4 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} />
          Du erfüllst alle Voraussetzungen!
        </p>
      )}
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER CATEGORY
  // ═══════════════════════════════════════════════════════════════
  const renderCategory = () => (
    <div className="px-5">
      <h2 className="text-2xl font-black text-white mb-2">Wähle deine Kategorie</h2>
      <p className="text-white/50 mb-6 text-sm">In welchem Bereich bist du aktiv?</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <motion.button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="p-4 rounded-xl text-left transition-all"
            style={{
              background:
                category === cat.value
                  ? 'linear-gradient(135deg, rgba(168, 85, 247, 0.2), rgba(168, 85, 247, 0.1))'
                  : 'rgba(255, 255, 255, 0.02)',
              border: `2px solid ${category === cat.value ? '#a855f7' : 'rgba(255, 255, 255, 0.05)'}`,
            }}
          >
            <span className="text-2xl mb-2 block">{cat.emoji}</span>
            <p className="font-bold text-white text-sm">{cat.label}</p>
            <p className="text-[10px] text-white/40">{cat.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* Description */}
      <div className="mb-4">
        <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">
          Erzähl uns mehr über dich
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Warum solltest du verifiziert werden?"
          className="w-full p-4 rounded-xl text-white placeholder-white/30 resize-none h-28 text-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            outline: 'none',
          }}
        />
      </div>

      {/* Follower Count */}
      <div className="mb-6">
        <label className="block text-xs font-bold text-white/50 mb-2 uppercase tracking-wider">
          Geschätzte Follower-Anzahl
        </label>
        <input
          type="number"
          value={followerCount}
          onChange={(e) => setFollowerCount(e.target.value)}
          placeholder="z.B. 50000"
          className="w-full p-4 rounded-xl text-white placeholder-white/30 text-sm"
          style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            outline: 'none',
          }}
        />
      </div>

      <SovereignButton
        onClick={() => setStep('social')}
        disabled={!category || !description || !followerCount}
      >
        Weiter
      </SovereignButton>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER SOCIAL
  // ═══════════════════════════════════════════════════════════════
  const renderSocial = () => (
    <div className="px-5">
      <h2 className="text-2xl font-black text-white mb-2">Social Media Profile</h2>
      <p className="text-white/50 mb-6 text-sm">Verlinke deine verifizierten Profile</p>

      {/* Added Links */}
      <div className="space-y-3 mb-6">
        {socialLinks.map((link) => {
          const platform = PLATFORMS.find((p) => p.value === link.platform)!;
          const Icon = platform.icon;
          return (
            <SovereignPanel key={link.platform}>
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon size={18} style={{ color: platform.color }} />
                    <span className="font-bold text-white text-sm">{platform.label}</span>
                  </div>
                  <button onClick={() => removeSocialLink(link.platform)}>
                    <X size={16} className="text-white/40" />
                  </button>
                </div>
                <input
                  type="text"
                  value={link.username}
                  onChange={(e) => updateSocialLink(link.platform, 'username', e.target.value)}
                  placeholder="@username"
                  className="w-full p-3 rounded-lg text-white placeholder-white/30 text-sm mb-2"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', outline: 'none' }}
                />
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => updateSocialLink(link.platform, 'url', e.target.value)}
                  placeholder="https://..."
                  className="w-full p-3 rounded-lg text-white placeholder-white/30 text-sm"
                  style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', outline: 'none' }}
                />
              </div>
            </SovereignPanel>
          );
        })}
      </div>

      {/* Add Platform Buttons */}
      <p className="text-xs font-bold text-white/40 mb-3 uppercase tracking-wider">Plattform hinzufügen</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {PLATFORMS.filter((p) => !socialLinks.find((l) => l.platform === p.value)).map((platform) => {
          const Icon = platform.icon;
          return (
            <motion.button
              key={platform.value}
              onClick={() => addSocialLink(platform.value)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
              style={{ background: 'rgba(255, 255, 255, 0.05)' }}
            >
              <Icon size={14} style={{ color: platform.color }} />
              <span className="text-white/60">{platform.label}</span>
              <Plus size={12} className="text-white/40" />
            </motion.button>
          );
        })}
      </div>

      <SovereignButton
        onClick={() => setStep(applicationPath === 'community' ? 'review' : 'documents')}
        disabled={socialLinks.length === 0 || socialLinks.some((l) => !l.url || !l.username)}
        variant={applicationPath === 'community' ? 'success' : 'primary'}
      >
        {applicationPath === 'community' ? 'Zur Überprüfung' : 'Weiter'}
      </SovereignButton>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER DOCUMENTS
  // ═══════════════════════════════════════════════════════════════
  const renderDocuments = () => (
    <div className="px-5">
      <h2 className="text-2xl font-black text-white mb-2">Verifikations-Dokumente</h2>
      <p className="text-white/50 mb-6 text-sm">Hilf uns, deine Identität zu bestätigen.</p>

      <SovereignPanel gradient className="mb-6">
        <div className="p-4">
          <p className="text-xs font-bold text-purple-300 mb-2">Akzeptierte Dokumente:</p>
          <ul className="text-xs text-white/50 space-y-1">
            <li>• Screenshot deiner verifizierten Social Media Profile</li>
            <li>• Presseartikel oder Interviews</li>
            <li>• Visitenkarte oder Firmennachweis</li>
          </ul>
        </div>
      </SovereignPanel>

      {/* Upload Area */}
      <label className="block mb-4">
        <div
          className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors"
          style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}
        >
          <Upload size={32} className="mx-auto mb-3 text-purple-400" />
          <p className="text-white/60 text-sm mb-1">Dokumente hochladen</p>
          <p className="text-xs text-white/30">PDF, JPG, PNG (max. 10MB)</p>
        </div>
        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {/* Uploaded Files */}
      {documents.length > 0 && (
        <div className="space-y-2 mb-6">
          {documents.map((doc, i) => (
            <SovereignPanel key={i}>
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                  {doc.type.includes('pdf') ? (
                    <FileText size={18} className="text-red-400" />
                  ) : (
                    <Camera size={18} className="text-blue-400" />
                  )}
                  <span className="text-sm text-white/70 truncate max-w-[200px]">{doc.name}</span>
                </div>
                <button onClick={() => removeDocument(i)}>
                  <X size={16} className="text-white/40" />
                </button>
              </div>
            </SovereignPanel>
          ))}
        </div>
      )}

      <SovereignButton onClick={() => setStep('review')} disabled={documents.length === 0}>
        Weiter zur Überprüfung
      </SovereignButton>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER REVIEW
  // ═══════════════════════════════════════════════════════════════
  const renderReview = () => (
    <div className="px-5">
      {applicationPath === 'community' && (
        <SovereignPanel gradient glow glowColor="#22c55e" className="mb-4">
          <div className="flex items-center gap-3 p-4">
            <Award className="text-emerald-400" size={24} />
            <div>
              <p className="text-emerald-400 font-bold text-sm">Community Creator Bewerbung</p>
              <p className="text-white/40 text-xs">Schnelle Verifizierung</p>
            </div>
          </div>
        </SovereignPanel>
      )}

      <h2 className="text-2xl font-black text-white mb-6">Überprüfe deine Angaben</h2>

      <div className="space-y-3 mb-8">
        <SovereignPanel gradient={applicationPath === 'community'}>
          <div className="p-4">
            <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Kategorie</p>
            <p className="text-white font-bold">
              {CATEGORIES.find((c) => c.value === category)?.emoji}{' '}
              {CATEGORIES.find((c) => c.value === category)?.label}
            </p>
          </div>
        </SovereignPanel>

        <SovereignPanel gradient={applicationPath === 'community'}>
          <div className="p-4">
            <p className="text-[10px] text-white/40 mb-1 uppercase tracking-wider">Social Media</p>
            <div className="space-y-1">
              {socialLinks.map((link) => {
                const platform = PLATFORMS.find((p) => p.value === link.platform)!;
                const Icon = platform.icon;
                return (
                  <div key={link.platform} className="flex items-center gap-2">
                    <Icon size={14} style={{ color: platform.color }} />
                    <span className="text-sm text-white/70">@{link.username}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </SovereignPanel>
      </div>

      <p className="text-xs text-white/40 mb-4 text-center">
        Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind.
      </p>

      <SovereignButton
        onClick={handleSubmit}
        disabled={isSubmitting}
        variant={applicationPath === 'community' ? 'success' : 'primary'}
        icon={isSubmitting ? <Loader2 size={18} className="animate-spin" /> : undefined}
      >
        {isSubmitting ? 'Wird eingereicht...' : 'Bewerbung einreichen'}
      </SovereignButton>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER SUBMITTED
  // ═══════════════════════════════════════════════════════════════
  const renderSubmitted = () => (
    <div className="px-5 text-center">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{ background: `${accentColor}20` }}
      >
        <CheckCircle2 size={48} style={{ color: accentColor }} />
      </motion.div>

      <h2 className="text-2xl font-black text-white mb-3">Bewerbung eingereicht!</h2>
      <p className="text-white/50 mb-8 text-sm">
        {applicationPath === 'community'
          ? 'Du erhältst innerhalb von 24 Stunden eine Antwort.'
          : 'Unser Team prüft deine Bewerbung innerhalb von 2-5 Werktagen.'}
      </p>

      <SovereignPanel gradient glow glowColor={accentColor} className="mb-8">
        <div className="flex items-center gap-3 p-4">
          <CheckCircle2 size={20} style={{ color: accentColor }} />
          <div className="text-left">
            <p className="text-sm font-bold" style={{ color: accentColor }}>
              Status: {applicationPath === 'community' ? 'Bevorzugte Prüfung' : 'In Prüfung'}
            </p>
            <p className="text-xs text-white/40">Eingereicht am {new Date().toLocaleDateString('de-DE')}</p>
          </div>
        </div>
      </SovereignPanel>

      <SovereignButton onClick={() => navigate('/')} variant="secondary">
        Zurück zur App
      </SovereignButton>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════
  // RENDER STEP
  // ═══════════════════════════════════════════════════════════════
  const renderStep = () => {
    switch (step) {
      case 'intro':
        return renderIntro();
      case 'category':
        return renderCategory();
      case 'social':
        return renderSocial();
      case 'documents':
        return renderDocuments();
      case 'review':
        return renderReview();
      case 'submitted':
        return renderSubmitted();
    }
  };

  const getProgress = () => {
    const steps: ApplicationStep[] = ['intro', 'category', 'social', 'documents', 'review', 'submitted'];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  };

  return (
    <div className="min-h-screen pb-28" style={{ background: '#050505' }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10"
        style={{ background: 'rgba(5, 5, 5, 0.95)', backdropFilter: 'blur(10px)' }}
      >
        <div className="flex items-center justify-between p-4">
          <motion.button
            onClick={() => {
              if (step === 'intro' || step === 'submitted') {
                navigate(-1);
              } else {
                const steps: ApplicationStep[] = ['intro', 'category', 'social', 'documents', 'review'];
                const currentIndex = steps.indexOf(step);
                if (currentIndex > 0) {
                  setStep(steps[currentIndex - 1]);
                }
              }
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(255, 255, 255, 0.05)' }}
          >
            <ArrowLeft size={20} className="text-white/70" />
          </motion.button>
          <span className="text-sm text-white/40">
            {step !== 'intro' && step !== 'submitted' && `Schritt ${['category', 'social', 'documents', 'review'].indexOf(step) + 1}/4`}
          </span>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        {step !== 'intro' && step !== 'submitted' && (
          <div className="h-1" style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
            <motion.div
              className="h-full"
              style={{ background: `linear-gradient(90deg, ${accentColor}, ${accentColor}80)` }}
              initial={{ width: 0 }}
              animate={{ width: `${getProgress()}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CreatorApplication;
