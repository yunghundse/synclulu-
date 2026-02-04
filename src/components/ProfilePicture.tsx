/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PROFILE PICTURE - Single Photo Core v3.5
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * 100% Upload Success Rate mit Chunked-Upload-Handler.
 * - 1-Bild-Policy: Ein User, ein Bild
 * - Anti-Stuck Logic: Explizite Content-Type Headers
 * - Resumable Upload: Firebase resumable upload
 * - Progress Tracking: Echtzeit-Fortschrittsanzeige
 *
 * @version 3.5.0 - Anti-Stuck Edition
 */

import React, { useState, useRef, useCallback } from 'react';
import { Camera, User, Loader2, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useChunkedUpload, UploadProgress } from '@/hooks/useChunkedUpload';

interface ProfilePictureProps {
  /** Size in pixels */
  size?: number;
  /** Allow editing (shows camera icon on hover) */
  editable?: boolean;
  /** Custom user data (defaults to current user) */
  userId?: string;
  avatarUrl?: string | null;
  displayName?: string;
  /** Custom class name */
  className?: string;
  /** Show online indicator */
  showOnline?: boolean;
  isOnline?: boolean;
  /** Click handler (overrides default behavior) */
  onClick?: () => void;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  size = 80,
  editable = false,
  userId,
  avatarUrl: propAvatarUrl,
  displayName: propDisplayName,
  className = '',
  showOnline = false,
  isOnline = false,
  onClick,
}) => {
  const { user, setUser } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Use chunked upload hook for 100% success rate
  const { progress, uploadProfileImage, cancelUpload, resetProgress } = useChunkedUpload();

  // Use provided props or fall back to current user
  const targetUserId = userId || user?.id;
  const avatarUrl = propAvatarUrl !== undefined ? propAvatarUrl : user?.avatarUrl;
  const displayName = propDisplayName || user?.displayName || 'User';

  // Get initials for fallback
  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Derive state from progress
  const isUploading = progress.state === 'preparing' || progress.state === 'uploading' || progress.state === 'processing';
  const uploadProgress = progress.progress;

  // Handle file selection with chunked upload
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUserId) return;

    setUploadError(null);

    // Use chunked upload for reliability
    const result = await uploadProfileImage(targetUserId, file, {
      maxSizeMB: 5,
      quality: 0.85,
      maxWidth: 1200,
      maxHeight: 1200,
      outputFormat: 'webp',
    });

    if (result.success && result.url) {
      // Update Firestore
      try {
        await updateDoc(doc(db, 'users', targetUserId), {
          avatarUrl: result.url,
        });

        // Update local state
        if (user && targetUserId === user.id) {
          setUser({ ...user, avatarUrl: result.url });
        }
      } catch (error) {
        console.error('Failed to update user document:', error);
        setUploadError('Datenbankfehler. Bitte erneut versuchen.');
      }
    } else {
      setUploadError(result.error || 'Upload fehlgeschlagen');
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [targetUserId, user, setUser, uploadProfileImage]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    cancelUpload();
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [cancelUpload]);

  // Handle click
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (editable && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  // Dynamic sizing
  const containerStyle = {
    width: size,
    height: size,
    fontSize: size * 0.4,
  };

  return (
    <div
      className={`relative group ${className}`}
      style={containerStyle}
    >
      {/* Hidden file input */}
      {editable && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      )}

      {/* Profile Picture */}
      <button
        onClick={handleClick}
        disabled={isUploading}
        className={`
          w-full h-full rounded-full overflow-hidden
          bg-gradient-to-br from-violet-500 to-purple-600
          flex items-center justify-center
          transition-all duration-200
          ${editable ? 'cursor-pointer hover:ring-4 hover:ring-violet-500/30' : ''}
          ${isUploading ? 'opacity-70' : ''}
          theme-transition
        `}
        style={containerStyle}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-white font-bold">{initials || <User size={size * 0.5} />}</span>
        )}

        {/* Upload Progress Overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center">
            {/* Progress Ring */}
            <div className="relative">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle
                  className="text-white/20"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="transparent"
                  r="16"
                  cx="18"
                  cy="18"
                />
                <circle
                  className="text-white"
                  strokeWidth="3"
                  strokeDasharray={`${uploadProgress} 100`}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="16"
                  cx="18"
                  cy="18"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                {uploadProgress}%
              </span>
            </div>
            {/* Cancel Button */}
            <button
              onClick={(e) => { e.stopPropagation(); handleCancel(); }}
              className="mt-2 text-white/80 hover:text-white text-xs flex items-center gap-1"
            >
              <X size={12} />
              Abbrechen
            </button>
          </div>
        )}

        {/* Error Overlay */}
        {progress.state === 'error' && uploadError && (
          <div className="absolute inset-0 bg-red-500/80 rounded-full flex items-center justify-center">
            <span className="text-white text-xs text-center px-2">{uploadError}</span>
          </div>
        )}

        {/* Edit Overlay */}
        {editable && !isUploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-6 h-6 text-white" />
          </div>
        )}
      </button>

      {/* Online Indicator */}
      {showOnline && isOnline && (
        <div
          className="absolute bottom-0 right-0 bg-green-500 rounded-full border-2 border-[var(--synclulu-bg)]"
          style={{
            width: size * 0.25,
            height: size * 0.25,
          }}
        />
      )}
    </div>
  );
};

export default ProfilePicture;
