import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { NebulaBadge } from '@/components/NebulaBadge';
import { useStore } from '@/lib/store';
import type { StarCategory, SocialPlatform, SocialMediaLink } from '@/types';
import { CREATOR_REQUIREMENTS } from '@/types';

type ApplicationStep = 'intro' | 'category' | 'social' | 'documents' | 'review' | 'submitted';
type ApplicationPath = 'vip' | 'community';

const StarsApplication: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useStore();

  // Determine application path
  const totalStarsReceived = (user as any)?.totalStarsReceived || 0;
  const level = (user as any)?.level || 1;
  const totalVoiceMinutes = (user as any)?.totalVoiceMinutes || 0;
  const positiveRatings = (user as any)?.positiveRatings || 0;
  const totalRatings = (user as any)?.totalRatings || 1;
  const positiveRatingsPercentage = Math.round((positiveRatings / totalRatings) * 100);

  const isEligibleCommunityCreator = useMemo(() =>
    totalStarsReceived >= CREATOR_REQUIREMENTS.starsRequired &&
    level >= CREATOR_REQUIREMENTS.levelRequired &&
    totalVoiceMinutes >= CREATOR_REQUIREMENTS.voiceMinutesRequired &&
    positiveRatingsPercentage >= CREATOR_REQUIREMENTS.minPositiveRatings,
  [totalStarsReceived, level, totalVoiceMinutes, positiveRatingsPercentage]);

  // Path from URL or auto-detect
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

  // ═══════════════════════════════════════
  // INTRO STEP
  // ═══════════════════════════════════════
  const renderIntro = () => (
    <div className="text-center px-4">
      {/* Path Selector - Show only if eligible for community */}
      {isEligibleCommunityCreator && (
        <div className="mb-6 p-1 bg-gray-800/50 rounded-xl flex">
          <button
            onClick={() => setApplicationPath('vip')}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              applicationPath === 'vip'
                ? 'bg-purple-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            VIP / Influencer
          </button>
          <button
            onClick={() => {
              setApplicationPath('community');
              setCategory('creator');
            }}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              applicationPath === 'community'
                ? 'bg-green-500 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Community Creator
          </button>
        </div>
      )}

      {/* Hero Badge Animation */}
      <div className="relative w-32 h-32 mx-auto mb-8">
        <div className={`absolute inset-0 rounded-full animate-pulse ${
          applicationPath === 'community'
            ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30'
            : 'bg-gradient-to-br from-purple-500/30 to-pink-500/30'
        }`} />
        <div className={`absolute inset-2 rounded-full flex items-center justify-center ${
          applicationPath === 'community'
            ? 'bg-gradient-to-br from-green-600 to-emerald-600'
            : 'bg-gradient-to-br from-purple-600 to-pink-600'
        }`}>
          {applicationPath === 'community' ? (
            <Award size={48} className="text-white" />
          ) : (
            <Sparkles size={48} className="text-white" />
          )}
        </div>
        {/* Orbiting stars */}
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-3 h-3 rounded-full ${
              applicationPath === 'community' ? 'bg-green-400' : 'bg-yellow-400'
            }`}
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 90}deg) translateX(60px) translateY(-50%)`,
              animation: `orbit 4s linear infinite ${i * 0.25}s`,
            }}
          />
        ))}
      </div>

      <h1 className="text-3xl font-bold text-white mb-3">
        {applicationPath === 'community' ? 'Community Creator' : 'Stars Programm'}
      </h1>
      <p className="text-gray-400 mb-8 max-w-sm mx-auto">
        {applicationPath === 'community' ? (
          <>Du hast dich durch dein Engagement qualifiziert! Werde jetzt offizieller Community Creator.</>
        ) : (
          <>Exklusiv für Persönlichkeiten des öffentlichen Lebens. Erhalte das Nebula Badge und erweiterte Features.</>
        )}
      </p>

      {/* Community Creator Stats */}
      {applicationPath === 'community' && (
        <div className="grid grid-cols-2 gap-2 mb-6 max-w-sm mx-auto">
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star size={14} className="text-amber-400" />
              <span className="text-lg font-bold text-white">{totalStarsReceived}</span>
            </div>
            <p className="text-[10px] text-gray-400">Sterne erhalten</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Mic size={14} className="text-blue-400" />
              <span className="text-lg font-bold text-white">{totalVoiceMinutes}</span>
            </div>
            <p className="text-[10px] text-gray-400">Voice-Minuten</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Users size={14} className="text-purple-400" />
              <span className="text-lg font-bold text-white">Lvl {level}</span>
            </div>
            <p className="text-[10px] text-gray-400">Dein Level</p>
          </div>
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle2 size={14} className="text-green-400" />
              <span className="text-lg font-bold text-white">{positiveRatingsPercentage}%</span>
            </div>
            <p className="text-[10px] text-gray-400">Positive Ratings</p>
          </div>
        </div>
      )}

      {/* Benefits */}
      <div className="space-y-3 mb-8 text-left max-w-sm mx-auto">
        {(applicationPath === 'community' ? [
          { icon: '🏆', text: 'Community Creator Badge' },
          { icon: '🎙️', text: 'Voice-Räume hosten' },
          { icon: '📅', text: 'Events planen & ankündigen' },
          { icon: '📊', text: 'Analytics Dashboard' },
          { icon: '⚡', text: 'Schnelle Verifizierung' },
        ] : [
          { icon: '✨', text: 'Verifiziertes Nebula Badge' },
          { icon: '🎙️', text: 'Erweiterte Moderationsrechte' },
          { icon: '📊', text: 'Detaillierte Analytics' },
          { icon: '🔝', text: 'Priorisierte Sichtbarkeit' },
          { icon: '🎤', text: 'Voice Lift Feature' },
        ]).map((benefit, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 p-3 rounded-xl ${
              applicationPath === 'community'
                ? 'bg-green-900/30 border border-green-500/20'
                : 'bg-gray-800/50'
            }`}
          >
            <span className="text-xl">{benefit.icon}</span>
            <span className="text-gray-300">{benefit.text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => setStep(applicationPath === 'community' ? 'social' : 'category')}
        className={`w-full py-4 rounded-xl text-white font-semibold text-lg hover:opacity-90 transition-opacity ${
          applicationPath === 'community'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}
      >
        {applicationPath === 'community' ? 'Weiter zur Bewerbung' : 'Jetzt bewerben'}
      </button>

      {applicationPath === 'community' && (
        <p className="text-xs text-green-400 mt-4 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} />
          Du erfüllst alle Voraussetzungen!
        </p>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Deine Daten werden vertraulich behandelt und nur zur Verifizierung verwendet.
      </p>

      <style>{`
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(60px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(60px) rotate(-360deg); }
        }
      `}</style>
    </div>
  );

  // ═══════════════════════════════════════
  // CATEGORY STEP
  // ═══════════════════════════════════════
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

  const renderCategory = () => (
    <div className="px-4">
      <h2 className="text-2xl font-bold text-white mb-2">Wähle deine Kategorie</h2>
      <p className="text-gray-400 mb-6">In welchem Bereich bist du aktiv?</p>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`p-4 rounded-xl text-left transition-all ${
              category === cat.value
                ? 'bg-purple-500/20 border-2 border-purple-500'
                : 'bg-gray-800/50 border-2 border-transparent hover:border-gray-700'
            }`}
          >
            <span className="text-2xl mb-2 block">{cat.emoji}</span>
            <p className="font-semibold text-white">{cat.label}</p>
            <p className="text-xs text-gray-400">{cat.desc}</p>
          </button>
        ))}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Erzähl uns mehr über dich
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Warum solltest du verifiziert werden? Was machst du?"
          className="w-full p-4 bg-gray-800/50 rounded-xl text-white placeholder-gray-500 resize-none h-32 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {/* Follower Count */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Geschätzte Follower-Anzahl (alle Plattformen)
        </label>
        <input
          type="number"
          value={followerCount}
          onChange={(e) => setFollowerCount(e.target.value)}
          placeholder="z.B. 50000"
          className="w-full p-4 bg-gray-800/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      <button
        onClick={() => setStep('social')}
        disabled={!category || !description || !followerCount}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Weiter
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // SOCIAL LINKS STEP
  // ═══════════════════════════════════════
  const PLATFORMS: { value: SocialPlatform; label: string; icon: React.ElementType; color: string }[] = [
    { value: 'instagram', label: 'Instagram', icon: Instagram, color: '#E4405F' },
    { value: 'tiktok', label: 'TikTok', icon: Music2, color: '#000000' },
    { value: 'youtube', label: 'YouTube', icon: Youtube, color: '#FF0000' },
    { value: 'twitter', label: 'X / Twitter', icon: Twitter, color: '#1DA1F2' },
    { value: 'linkedin', label: 'LinkedIn', icon: Linkedin, color: '#0A66C2' },
    { value: 'other', label: 'Andere', icon: Globe, color: '#6B7280' },
  ];

  const addSocialLink = (platform: SocialPlatform) => {
    if (!socialLinks.find(l => l.platform === platform)) {
      setSocialLinks([...socialLinks, { platform, url: '', username: '' }]);
    }
  };

  const updateSocialLink = (platform: SocialPlatform, field: 'url' | 'username', value: string) => {
    setSocialLinks(socialLinks.map(l =>
      l.platform === platform ? { ...l, [field]: value } : l
    ));
  };

  const removeSocialLink = (platform: SocialPlatform) => {
    setSocialLinks(socialLinks.filter(l => l.platform !== platform));
  };

  const renderSocial = () => (
    <div className="px-4">
      <h2 className="text-2xl font-bold text-white mb-2">Social Media Profile</h2>
      <p className="text-gray-400 mb-6">Verlinke deine verifizierten Profile</p>

      {/* Added Links */}
      <div className="space-y-3 mb-6">
        {socialLinks.map((link) => {
          const platform = PLATFORMS.find(p => p.value === link.platform)!;
          const Icon = platform.icon;
          return (
            <div
              key={link.platform}
              className="p-4 bg-gray-800/50 rounded-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={20} style={{ color: platform.color }} />
                  <span className="font-medium text-white">{platform.label}</span>
                </div>
                <button
                  onClick={() => removeSocialLink(link.platform)}
                  className="p-1 text-gray-500 hover:text-red-400"
                >
                  <X size={18} />
                </button>
              </div>
              <input
                type="text"
                value={link.username}
                onChange={(e) => updateSocialLink(link.platform, 'username', e.target.value)}
                placeholder="@username"
                className="w-full p-3 bg-gray-900/50 rounded-lg text-white placeholder-gray-500 text-sm mb-2 focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
              <input
                type="url"
                value={link.url}
                onChange={(e) => updateSocialLink(link.platform, 'url', e.target.value)}
                placeholder="https://..."
                className="w-full p-3 bg-gray-900/50 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          );
        })}
      </div>

      {/* Add Platform Buttons */}
      <p className="text-sm text-gray-400 mb-3">Plattform hinzufügen:</p>
      <div className="flex flex-wrap gap-2 mb-8">
        {PLATFORMS.filter(p => !socialLinks.find(l => l.platform === p.value)).map((platform) => {
          const Icon = platform.icon;
          return (
            <button
              key={platform.value}
              onClick={() => addSocialLink(platform.value)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-800/50 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
            >
              <Icon size={16} />
              <span className="text-sm">{platform.label}</span>
              <Plus size={14} />
            </button>
          );
        })}
      </div>

      <button
        onClick={() => setStep(applicationPath === 'community' ? 'review' : 'documents')}
        disabled={socialLinks.length === 0 || socialLinks.some(l => !l.url || !l.username)}
        className={`w-full py-4 rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${
          applicationPath === 'community'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}
      >
        {applicationPath === 'community' ? 'Zur Überprüfung' : 'Weiter'}
      </button>

      {applicationPath === 'community' && (
        <p className="text-xs text-green-400 text-center mt-3 flex items-center justify-center gap-1">
          <CheckCircle2 size={12} />
          Keine Dokumente erforderlich - du bist bereits verifiziert durch dein Engagement!
        </p>
      )}
    </div>
  );

  // ═══════════════════════════════════════
  // DOCUMENTS STEP
  // ═══════════════════════════════════════
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setDocuments([...documents, ...Array.from(files)]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const renderDocuments = () => (
    <div className="px-4">
      <h2 className="text-2xl font-bold text-white mb-2">Verifikations-Dokumente</h2>
      <p className="text-gray-400 mb-6">
        Hilf uns, deine Identität zu bestätigen. Alle Daten werden vertraulich behandelt.
      </p>

      {/* Document Types Info */}
      <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl mb-6">
        <p className="text-sm text-purple-300 font-medium mb-2">Akzeptierte Dokumente:</p>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• Screenshot deiner verifizierten Social Media Profile</li>
          <li>• Presseartikel oder Interviews über dich</li>
          <li>• Visitenkarte oder Firmennachweis</li>
          <li>• Ausweisdokument (wird nach Prüfung gelöscht)</li>
        </ul>
      </div>

      {/* Upload Area */}
      <label className="block mb-4">
        <div className="border-2 border-dashed border-gray-700 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 transition-colors">
          <Upload size={32} className="mx-auto mb-3 text-gray-500" />
          <p className="text-gray-400 mb-1">Dokumente hochladen</p>
          <p className="text-xs text-gray-500">PDF, JPG, PNG (max. 10MB)</p>
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
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {doc.type.includes('pdf') ? (
                  <FileText size={20} className="text-red-400" />
                ) : (
                  <Camera size={20} className="text-blue-400" />
                )}
                <span className="text-sm text-gray-300 truncate max-w-[200px]">
                  {doc.name}
                </span>
              </div>
              <button
                onClick={() => removeDocument(i)}
                className="p-1 text-gray-500 hover:text-red-400"
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => setStep('review')}
        disabled={documents.length === 0}
        className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Weiter zur Überprüfung
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // REVIEW STEP
  // ═══════════════════════════════════════
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setStep('submitted');
  };

  const renderReview = () => (
    <div className="px-4">
      {/* Community Creator Badge */}
      {applicationPath === 'community' && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3">
          <Award className="text-green-400" size={24} />
          <div>
            <p className="text-green-400 font-medium text-sm">Community Creator Bewerbung</p>
            <p className="text-gray-400 text-xs">Schnelle Verifizierung durch Engagement</p>
          </div>
        </div>
      )}

      <h2 className="text-2xl font-bold text-white mb-2">Überprüfe deine Angaben</h2>
      <p className="text-gray-400 mb-6">Stelle sicher, dass alles korrekt ist.</p>

      {/* Summary Cards */}
      <div className="space-y-4 mb-8">
        {/* Category */}
        <div className={`p-4 rounded-xl ${applicationPath === 'community' ? 'bg-green-900/30 border border-green-500/20' : 'bg-gray-800/50'}`}>
          <p className="text-xs text-gray-500 mb-1">Kategorie</p>
          <p className="text-white font-medium">
            {CATEGORIES.find(c => c.value === category)?.emoji}{' '}
            {CATEGORIES.find(c => c.value === category)?.label}
          </p>
        </div>

        {/* Description */}
        {description && (
          <div className={`p-4 rounded-xl ${applicationPath === 'community' ? 'bg-green-900/30 border border-green-500/20' : 'bg-gray-800/50'}`}>
            <p className="text-xs text-gray-500 mb-1">Beschreibung</p>
            <p className="text-gray-300 text-sm">{description}</p>
          </div>
        )}

        {/* Follower Count - Only for VIP path */}
        {applicationPath !== 'community' && followerCount && (
          <div className="p-4 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-1">Follower</p>
            <p className="text-white font-medium">
              {parseInt(followerCount).toLocaleString()}
            </p>
          </div>
        )}

        {/* Community Stats - Only for Community path */}
        {applicationPath === 'community' && (
          <div className="p-4 bg-green-900/30 border border-green-500/20 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">Deine Community-Statistiken</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Star size={14} className="text-amber-400" />
                <span className="text-sm text-gray-300">{totalStarsReceived} Sterne</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic size={14} className="text-blue-400" />
                <span className="text-sm text-gray-300">{totalVoiceMinutes} Min</span>
              </div>
              <div className="flex items-center gap-2">
                <Users size={14} className="text-purple-400" />
                <span className="text-sm text-gray-300">Level {level}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} className="text-green-400" />
                <span className="text-sm text-gray-300">{positiveRatingsPercentage}% Positiv</span>
              </div>
            </div>
          </div>
        )}

        {/* Social Links */}
        <div className={`p-4 rounded-xl ${applicationPath === 'community' ? 'bg-green-900/30 border border-green-500/20' : 'bg-gray-800/50'}`}>
          <p className="text-xs text-gray-500 mb-2">Social Media</p>
          <div className="space-y-2">
            {socialLinks.map((link) => {
              const platform = PLATFORMS.find(p => p.value === link.platform)!;
              const Icon = platform.icon;
              return (
                <div key={link.platform} className="flex items-center gap-2">
                  <Icon size={16} style={{ color: platform.color }} />
                  <span className="text-sm text-gray-300">@{link.username}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Documents - Only for VIP path */}
        {applicationPath !== 'community' && (
          <div className="p-4 bg-gray-800/50 rounded-xl">
            <p className="text-xs text-gray-500 mb-2">Dokumente</p>
            <p className="text-gray-300 text-sm">
              {documents.length} Datei(en) hochgeladen
            </p>
          </div>
        )}
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500 mb-4">
        Mit dem Absenden bestätigst du, dass alle Angaben wahrheitsgemäß sind
        und du unseren Nutzungsbedingungen zustimmst.
      </p>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting}
        className={`w-full py-4 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${
          applicationPath === 'community'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500'
            : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`}
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            Wird eingereicht...
          </>
        ) : (
          'Bewerbung einreichen'
        )}
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // SUBMITTED STEP
  // ═══════════════════════════════════════
  const renderSubmitted = () => (
    <div className="px-4 text-center">
      <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
        applicationPath === 'community' ? 'bg-green-500/20' : 'bg-green-500/20'
      }`}>
        {applicationPath === 'community' ? (
          <Award size={48} className="text-green-400" />
        ) : (
          <CheckCircle2 size={48} className="text-green-400" />
        )}
      </div>

      <h2 className="text-2xl font-bold text-white mb-3">
        {applicationPath === 'community' ? 'Community Creator Bewerbung eingereicht!' : 'Bewerbung eingereicht!'}
      </h2>
      <p className="text-gray-400 mb-8">
        {applicationPath === 'community' ? (
          <>Deine Bewerbung wird bevorzugt behandelt! Du erhältst innerhalb von 24 Stunden eine Antwort.</>
        ) : (
          <>Unser Team wird deine Bewerbung innerhalb von 2-5 Werktagen prüfen. Du erhältst eine Benachrichtigung, sobald eine Entscheidung getroffen wurde.</>
        )}
      </p>

      {/* Status Card */}
      <div className={`p-4 rounded-xl mb-8 ${
        applicationPath === 'community'
          ? 'bg-green-500/10 border border-green-500/30'
          : 'bg-amber-500/10 border border-amber-500/30'
      }`}>
        <div className="flex items-center gap-3">
          {applicationPath === 'community' ? (
            <CheckCircle2 size={20} className="text-green-400" />
          ) : (
            <AlertCircle size={20} className="text-amber-400" />
          )}
          <div className="text-left">
            <p className={`text-sm font-medium ${applicationPath === 'community' ? 'text-green-300' : 'text-amber-300'}`}>
              {applicationPath === 'community' ? 'Status: Bevorzugte Prüfung' : 'Status: In Prüfung'}
            </p>
            <p className="text-xs text-gray-400">
              Eingereicht am {new Date().toLocaleDateString('de-DE')}
            </p>
          </div>
        </div>
      </div>

      {/* Preview Badge */}
      <p className="text-sm text-gray-500 mb-3">So wird dein Badge aussehen:</p>
      <div className="flex justify-center mb-8">
        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${
          applicationPath === 'community'
            ? 'bg-green-900/30 border border-green-500/20'
            : 'bg-gray-800/50'
        }`}>
          <NebulaBadge tier="nebula" size="lg" showLabel />
        </div>
      </div>

      <button
        onClick={() => navigate('/')}
        className={`w-full py-4 rounded-xl text-white font-semibold transition-colors ${
          applicationPath === 'community'
            ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:opacity-90'
            : 'bg-gray-800 hover:bg-gray-700'
        }`}
      >
        Zurück zur App
      </button>
    </div>
  );

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  const renderStep = () => {
    switch (step) {
      case 'intro': return renderIntro();
      case 'category': return renderCategory();
      case 'social': return renderSocial();
      case 'documents': return renderDocuments();
      case 'review': return renderReview();
      case 'submitted': return renderSubmitted();
    }
  };

  const getProgress = () => {
    const steps: ApplicationStep[] = ['intro', 'category', 'social', 'documents', 'review', 'submitted'];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-8">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="flex items-center justify-between p-4">
          <button
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
            className="p-2 -m-2 text-gray-400 hover:text-white"
          >
            <ArrowLeft size={24} />
          </button>
          <span className="text-sm text-gray-500">
            {step !== 'intro' && step !== 'submitted' && `Schritt ${['category', 'social', 'documents', 'review'].indexOf(step) + 1}/4`}
          </span>
          <div className="w-8" />
        </div>

        {/* Progress Bar */}
        {step !== 'intro' && step !== 'submitted' && (
          <div className="h-1 bg-gray-800">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
              style={{ width: `${getProgress()}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="pt-6">
        {renderStep()}
      </div>
    </div>
  );
};

export default StarsApplication;
