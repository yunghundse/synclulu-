/**
 * synclulu NEW LOCKED CONTENT
 * Create "Secret Bubbles" - locked content for monetization
 */

import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/lib/store';
import {
  ArrowLeft, Upload, Lock, Image, Type, Video,
  Coins, Users, Crown, X, Check, Loader2, Sparkles
} from 'lucide-react';
import { createLockedContent, UnlockMethod } from '@/lib/lockSystem';
import { CURRENCY_CONFIG } from '@/lib/creatorSystem';
import { uploadImage } from '@/lib/imageUploader';

type ContentType = 'text' | 'image' | 'video';

const NewLockedContent = () => {
  const navigate = useNavigate();
  const { user } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [contentType, setContentType] = useState<ContentType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [unlockCost, setUnlockCost] = useState(CURRENCY_CONFIG.unlockCost);
  const [requiresInvites, setRequiresInvites] = useState(1);
  const [unlockMethods, setUnlockMethods] = useState<UnlockMethod[]>(['coins', 'referral']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleUnlockMethod = (method: UnlockMethod) => {
    if (unlockMethods.includes(method)) {
      if (unlockMethods.length > 1) {
        setUnlockMethods(unlockMethods.filter(m => m !== method));
      }
    } else {
      setUnlockMethods([...unlockMethods, method]);
    }
  };

  const handleSubmit = async () => {
    if (!user?.id) return;

    // Validation
    if (!title.trim()) {
      setError('Bitte gib einen Titel ein');
      return;
    }

    if (contentType === 'text' && !content.trim()) {
      setError('Bitte gib den Content ein');
      return;
    }

    if (contentType === 'image' && !imageFile) {
      setError('Bitte wähle ein Bild aus');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let finalContent = content;
      let thumbnailUrl: string | undefined;

      // Upload image if selected
      if (contentType === 'image' && imageFile) {
        const uploadResult = await uploadImage(imageFile, user.id, 'lockedContent');
        if (uploadResult.success && uploadResult.url) {
          finalContent = uploadResult.url;
          thumbnailUrl = uploadResult.thumbnailUrl;
        } else {
          throw new Error(uploadResult.error || 'Bild-Upload fehlgeschlagen');
        }
      }

      // Create locked content
      const contentId = await createLockedContent(
        user.id,
        user.username || 'Anonym',
        {
          title: title.trim(),
          content: finalContent,
          previewText: previewText.trim() || undefined,
          thumbnailUrl,
          type: contentType as any,
          unlockCost,
          unlockMethods,
          requiresInvites,
          isActive: true,
        }
      );

      if (contentId) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/creator/dashboard');
        }, 2000);
      } else {
        throw new Error('Fehler beim Erstellen');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    }

    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto bg-green-500/20 rounded-full flex items-center justify-center mb-4">
            <Check size={40} className="text-green-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Secret Bubble erstellt!</h2>
          <p className="text-white/60">Wird zum Dashboard weitergeleitet...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-purple-900/50 to-transparent">
        <div className="px-4 py-6 safe-top">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Secret Bubble erstellen</h1>
              <p className="text-sm text-white/60">Exklusiver Content für deine Fans</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Content Type Selection */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">Content-Typ</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { type: 'text' as ContentType, icon: Type, label: 'Text' },
              { type: 'image' as ContentType, icon: Image, label: 'Bild' },
              { type: 'video' as ContentType, icon: Video, label: 'Video', disabled: true },
            ].map(({ type, icon: Icon, label, disabled }) => (
              <button
                key={type}
                onClick={() => !disabled && setContentType(type)}
                disabled={disabled}
                className={`p-4 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  contentType === type
                    ? 'bg-purple-500 text-white'
                    : disabled
                    ? 'bg-white/5 text-white/30 cursor-not-allowed'
                    : 'bg-white/10 text-white/70 hover:bg-white/15'
                }`}
              >
                <Icon size={24} />
                <span className="text-sm font-medium">{label}</span>
                {disabled && <span className="text-xs">Bald</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">Titel</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. Exklusives Behind-the-Scenes"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
            maxLength={100}
          />
        </div>

        {/* Content Input */}
        {contentType === 'text' && (
          <>
            <div>
              <label className="text-sm text-white/60 mb-2 block">Geheimer Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Der Content, der nach dem Entsperren sichtbar wird..."
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 min-h-[150px] resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-white/40 mt-1">{content.length}/2000</p>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-2 block">Preview-Text (optional)</label>
              <input
                type="text"
                value={previewText}
                onChange={(e) => setPreviewText(e.target.value)}
                placeholder="Kurzer Teaser, der verschwommen angezeigt wird"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
                maxLength={200}
              />
            </div>
          </>
        )}

        {contentType === 'image' && (
          <div>
            <label className="text-sm text-white/60 mb-2 block">Bild auswählen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />

            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full aspect-video object-cover rounded-xl"
                />
                <button
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-video bg-white/5 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-3 hover:border-purple-500 transition-colors"
              >
                <Upload size={40} className="text-white/40" />
                <span className="text-white/60">Bild hochladen</span>
              </button>
            )}
          </div>
        )}

        {/* Unlock Methods */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">Entsperr-Methoden</label>
          <div className="space-y-3">
            <button
              onClick={() => toggleUnlockMethod('coins')}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                unlockMethods.includes('coins')
                  ? 'bg-amber-500/20 border-2 border-amber-500/50'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <Coins size={20} className="text-amber-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Mit Coins</p>
                <p className="text-sm text-white/60">User zahlen synclulu Coins</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                unlockMethods.includes('coins') ? 'bg-amber-500' : 'bg-white/20'
              }`}>
                {unlockMethods.includes('coins') && <Check size={14} />}
              </div>
            </button>

            <button
              onClick={() => toggleUnlockMethod('referral')}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                unlockMethods.includes('referral')
                  ? 'bg-green-500/20 border-2 border-green-500/50'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Users size={20} className="text-green-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Mit Einladung</p>
                <p className="text-sm text-white/60">Gratis durch Freunde einladen</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                unlockMethods.includes('referral') ? 'bg-green-500' : 'bg-white/20'
              }`}>
                {unlockMethods.includes('referral') && <Check size={14} />}
              </div>
            </button>

            <button
              onClick={() => toggleUnlockMethod('premium')}
              className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all ${
                unlockMethods.includes('premium')
                  ? 'bg-purple-500/20 border-2 border-purple-500/50'
                  : 'bg-white/5 border-2 border-transparent'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Crown size={20} className="text-purple-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Für Premium</p>
                <p className="text-sm text-white/60">Premium-User haben Zugang</p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                unlockMethods.includes('premium') ? 'bg-purple-500' : 'bg-white/20'
              }`}>
                {unlockMethods.includes('premium') && <Check size={14} />}
              </div>
            </button>
          </div>
        </div>

        {/* Coin Cost */}
        {unlockMethods.includes('coins') && (
          <div>
            <label className="text-sm text-white/60 mb-2 block">Coin-Preis</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="500"
                step="10"
                value={unlockCost}
                onChange={(e) => setUnlockCost(Number(e.target.value))}
                className="flex-1 accent-amber-500"
              />
              <div className="w-24 px-4 py-2 bg-amber-500/20 rounded-xl text-center">
                <span className="font-bold text-amber-400">💎 {unlockCost}</span>
              </div>
            </div>
          </div>
        )}

        {/* Referral Requirement */}
        {unlockMethods.includes('referral') && (
          <div>
            <label className="text-sm text-white/60 mb-2 block">Benötigte Einladungen</label>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 5].map((num) => (
                <button
                  key={num}
                  onClick={() => setRequiresInvites(num)}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
                    requiresInvites === num
                      ? 'bg-green-500 text-white'
                      : 'bg-white/10 text-white/70'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400">
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl flex items-center justify-center gap-3 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Wird erstellt...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Secret Bubble erstellen
            </>
          )}
        </button>

        {/* Info */}
        <div className="p-4 bg-white/5 rounded-xl">
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Lock size={16} className="text-purple-400" />
            So funktioniert's
          </h3>
          <ul className="text-sm text-white/60 space-y-2">
            <li>• Dein Content wird mit Blur-Effekt angezeigt</li>
            <li>• User können mit Coins oder Einladungen entsperren</li>
            <li>• Du verdienst bei jedem Unlock basierend auf deinem Creator-Tier</li>
            <li>• Premium-User haben kostenlosen Zugang (wenn aktiviert)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NewLockedContent;
