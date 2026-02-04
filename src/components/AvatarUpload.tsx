/**
 * synclulu AVATAR UPLOAD v2.0
 * "Back to Basics - High Performance"
 *
 * FEATURES:
 * - Drag & Drop support
 * - Image cropping
 * - Preview before upload
 * - High-res compression (max 500KB)
 * - Multi-layer caching
 *
 * @design Apple Photos Style
 * @version 2.0.0
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { storage, db } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { colors } from '@/lib/theme';
import {
  Camera, Upload, X, Check, RotateCw, ZoomIn, ZoomOut,
  Image as ImageIcon, Trash2, Sparkles
} from 'lucide-react';

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface AvatarUploadProps {
  currentAvatar?: string;
  onUploadComplete?: (url: string) => void;
  onClose?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

interface CropArea {
  x: number;
  y: number;
  size: number;
}

// ═══════════════════════════════════════
// IMAGE COMPRESSION
// ═══════════════════════════════════════

const compressImage = async (
  file: File,
  maxSizeKB: number = 500,
  maxDimension: number = 800
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      // Scale down if needed
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height / width) * maxDimension;
          width = maxDimension;
        } else {
          width = (width / height) * maxDimension;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Try different quality levels
      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Compression failed'));
              return;
            }

            const sizeKB = blob.size / 1024;

            if (sizeKB > maxSizeKB && quality > 0.1) {
              quality -= 0.1;
              tryCompress();
            } else {
              resolve(blob);
            }
          },
          'image/jpeg',
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => reject(new Error('Image load failed'));
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
};

// ═══════════════════════════════════════
// CROP CANVAS COMPONENT
// ═══════════════════════════════════════

interface CropCanvasProps {
  imageSrc: string;
  cropArea: CropArea;
  onCropChange: (area: CropArea) => void;
  zoom: number;
  rotation: number;
}

const CropCanvas: React.FC<CropCanvasProps> = ({
  imageSrc,
  cropArea,
  onCropChange,
  zoom,
  rotation,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const maxX = rect.width - cropArea.size;
    const maxY = rect.height - cropArea.size;

    const newX = Math.max(0, Math.min(e.clientX - dragStart.x, maxX));
    const newY = Math.max(0, Math.min(e.clientY - dragStart.y, maxY));

    onCropChange({ ...cropArea, x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden cursor-move"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Image */}
      <img
        src={imageSrc}
        alt="Crop preview"
        className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        style={{
          transform: `scale(${zoom}) rotate(${rotation}deg)`,
          transition: 'transform 0.2s ease',
        }}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 pointer-events-none" />

      {/* Crop circle */}
      <div
        className="absolute rounded-full border-2 border-white shadow-xl cursor-move"
        style={{
          left: cropArea.x,
          top: cropArea.y,
          width: cropArea.size,
          height: cropArea.size,
          background: 'transparent',
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6)',
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Grid lines */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30">
          {[...Array(9)].map((_, i) => (
            <div key={i} className="border border-white/30" />
          ))}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════
// MAIN AVATAR UPLOAD COMPONENT
// ═══════════════════════════════════════

const AvatarUpload: React.FC<AvatarUploadProps> = ({
  currentAvatar,
  onUploadComplete,
  onClose,
  size = 'lg',
}) => {
  const { user, setUser } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropArea, setCropArea] = useState<CropArea>({ x: 50, y: 50, size: 200 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Size configs
  const sizeConfig = {
    sm: { container: 'w-24 h-24', icon: 20 },
    md: { container: 'w-32 h-32', icon: 24 },
    lg: { container: 'w-40 h-40', icon: 32 },
  };

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Bitte wähle ein Bild aus');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('Maximale Dateigröße: 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError('');
    setCropArea({ x: 50, y: 50, size: 200 });
    setZoom(1);
    setRotation(0);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile || !user?.id) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Compress image
      setUploadProgress(20);
      const compressedBlob = await compressImage(selectedFile);
      setUploadProgress(50);

      // Upload to Firebase Storage
      const fileName = `avatars/${user.id}/${Date.now()}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, compressedBlob);
      setUploadProgress(80);

      // Get download URL
      const downloadUrl = await getDownloadURL(storageRef);

      // Update user document
      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl: downloadUrl,
        avatar: downloadUrl,
        updatedAt: new Date(),
      });

      // Update local state
      setUser({ ...user, avatarUrl: downloadUrl, avatar: downloadUrl });

      // Cache locally
      localStorage.setItem(`synclulu_avatar_${user.id}`, downloadUrl);
      sessionStorage.setItem('synclulu_current_avatar', downloadUrl);

      setUploadProgress(100);

      // Callback
      onUploadComplete?.(downloadUrl);

      // Haptic feedback
      if ('vibrate' in navigator) navigator.vibrate([20, 50, 20]);

      // Reset after short delay
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);

    } catch (err) {
      console.error('[AvatarUpload] Error:', err);
      setError('Upload fehlgeschlagen. Bitte versuche es erneut.');
      setIsUploading(false);
    }
  };

  // Handle remove
  const handleRemove = async () => {
    if (!user?.id) return;

    try {
      await updateDoc(doc(db, 'users', user.id), {
        avatarUrl: null,
        avatar: null,
      });

      setUser({ ...user, avatarUrl: null, avatar: null });
      localStorage.removeItem(`synclulu_avatar_${user.id}`);
      sessionStorage.removeItem('synclulu_current_avatar');

      onUploadComplete?.('');
    } catch (err) {
      console.error('[AvatarUpload] Remove error:', err);
    }
  };

  // Cleanup preview URL
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  return (
    <div
      className="rounded-3xl p-6 border"
      style={{
        background: colors.dark.bg.secondary,
        borderColor: colors.dark.border.default,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-white">Profilbild ändern</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* NO FILE SELECTED - SHOW UPLOAD AREA */}
      {/* ═══════════════════════════════════════ */}
      {!previewUrl && (
        <div
          className={`
            relative rounded-2xl border-2 border-dashed p-8 text-center transition-all
            ${isDragOver
              ? 'border-purple-500 bg-purple-500/10'
              : 'border-white/20 hover:border-white/40'
            }
          `}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
        >
          {/* Current avatar preview */}
          <div className={`${sizeConfig[size].container} mx-auto mb-4 rounded-full overflow-hidden bg-white/10`}>
            {currentAvatar ? (
              <img src={currentAvatar} alt="Current" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera size={sizeConfig[size].icon} className="text-gray-500" />
              </div>
            )}
          </div>

          <p className="text-white font-medium mb-2">
            {isDragOver ? 'Hier ablegen' : 'Bild hierher ziehen'}
          </p>
          <p className="text-gray-500 text-sm mb-4">oder</p>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 rounded-xl bg-purple-500 text-white font-semibold flex items-center justify-center gap-2 mx-auto hover:bg-purple-600 transition-colors"
          >
            <Upload size={18} />
            Datei auswählen
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          <p className="text-gray-500 text-xs mt-4">
            JPG, PNG oder GIF • Max 10MB
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════ */}
      {/* FILE SELECTED - SHOW CROP/PREVIEW */}
      {/* ═══════════════════════════════════════ */}
      {previewUrl && (
        <div className="space-y-4">
          {/* Crop area */}
          <CropCanvas
            imageSrc={previewUrl}
            cropArea={cropArea}
            onCropChange={setCropArea}
            zoom={zoom}
            rotation={rotation}
          />

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.1))}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ZoomOut size={18} className="text-white" />
            </button>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-32 accent-purple-500"
            />
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.1))}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ZoomIn size={18} className="text-white" />
            </button>
            <button
              onClick={() => setRotation((rotation + 90) % 360)}
              className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <RotateCw size={18} className="text-white" />
            </button>
          </div>

          {/* Progress bar */}
          {isUploading && (
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              disabled={isUploading}
              className="flex-1 py-3 rounded-xl bg-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/20 disabled:opacity-50 transition-colors"
            >
              <X size={18} />
              Abbrechen
            </button>
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {isUploading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : uploadProgress === 100 ? (
                <>
                  <Check size={18} />
                  Gespeichert!
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Speichern
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Remove button */}
      {currentAvatar && !previewUrl && (
        <button
          onClick={handleRemove}
          className="w-full mt-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 transition-colors"
        >
          <Trash2 size={16} />
          Profilbild entfernen
        </button>
      )}
    </div>
  );
};

export default AvatarUpload;
