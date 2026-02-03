/**
 * DELULU IMAGE UPLOADER
 * Firebase Storage Integration for Profile & Content Images
 */

import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// ═══════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════

export const IMAGE_CONFIG = {
  maxFileSizeMB: 5,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  profilePicture: {
    maxWidth: 500,
    maxHeight: 500,
    quality: 0.85,
    folder: 'profile-pictures',
  },
  headerImage: {
    maxWidth: 1200,
    maxHeight: 400,
    quality: 0.85,
    folder: 'header-images',
  },
  lockedContent: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.9,
    folder: 'locked-content',
  },
  thumbnails: {
    width: 200,
    height: 200,
    quality: 0.6,
    blur: 20,
    folder: 'thumbnails',
  },
};

export type ImageType = 'profilePicture' | 'headerImage' | 'lockedContent';

export interface UploadResult {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  error?: string;
}

// ═══════════════════════════════════════
// IMAGE PROCESSING
// ═══════════════════════════════════════

/**
 * Compress and resize image
 */
export const processImage = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate new dimensions
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }

      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Resize
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to process image'));
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Create blurred thumbnail for locked content preview
 */
export const createBlurredThumbnail = async (
  file: File,
  width: number = IMAGE_CONFIG.thumbnails.width,
  height: number = IMAGE_CONFIG.thumbnails.height,
  blur: number = IMAGE_CONFIG.thumbnails.blur
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Calculate crop to center
      const aspectRatio = width / height;
      let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

      if (img.width / img.height > aspectRatio) {
        sWidth = img.height * aspectRatio;
        sx = (img.width - sWidth) / 2;
      } else {
        sHeight = img.width / aspectRatio;
        sy = (img.height - sHeight) / 2;
      }

      canvas.width = width;
      canvas.height = height;

      // Apply blur
      if (ctx) {
        ctx.filter = `blur(${blur}px)`;
        ctx.drawImage(img, sx, sy, sWidth, sHeight, -blur, -blur, width + blur * 2, height + blur * 2);
      }

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create thumbnail'));
          }
        },
        'image/jpeg',
        IMAGE_CONFIG.thumbnails.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

// ═══════════════════════════════════════
// UPLOAD FUNCTIONS
// ═══════════════════════════════════════

/**
 * Upload image to Firebase Storage
 */
export const uploadImage = async (
  file: File,
  userId: string,
  type: ImageType
): Promise<UploadResult> => {
  try {
    // Validate file type
    if (!IMAGE_CONFIG.allowedTypes.includes(file.type)) {
      return { success: false, error: 'Ungültiger Dateityp. Erlaubt: JPG, PNG, GIF, WebP' };
    }

    // Validate file size
    if (file.size > IMAGE_CONFIG.maxFileSizeBytes) {
      return { success: false, error: `Datei zu groß. Maximum: ${IMAGE_CONFIG.maxFileSizeMB}MB` };
    }

    const config = IMAGE_CONFIG[type];
    const storage = getStorage();

    // Process image
    const processedBlob = await processImage(
      file,
      config.maxWidth,
      config.maxHeight,
      config.quality
    );

    // Generate unique filename
    const timestamp = Date.now();
    const extension = 'jpg';
    const filename = `${userId}_${timestamp}.${extension}`;
    const path = `${config.folder}/${filename}`;

    // Upload to Firebase Storage
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, processedBlob);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    // Create thumbnail for locked content
    let thumbnailUrl: string | undefined;
    if (type === 'lockedContent') {
      const thumbnailBlob = await createBlurredThumbnail(file);
      const thumbnailPath = `${IMAGE_CONFIG.thumbnails.folder}/${filename}`;
      const thumbnailRef = ref(storage, thumbnailPath);
      await uploadBytes(thumbnailRef, thumbnailBlob);
      thumbnailUrl = await getDownloadURL(thumbnailRef);
    }

    return { success: true, url, thumbnailUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { success: false, error: 'Upload fehlgeschlagen. Bitte versuche es erneut.' };
  }
};

/**
 * Upload and update profile picture
 */
export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<UploadResult> => {
  const result = await uploadImage(file, userId, 'profilePicture');

  if (result.success && result.url) {
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      avatarUrl: result.url,
      customAvatar: true,
    });
  }

  return result;
};

/**
 * Upload and update header image
 */
export const uploadHeaderImage = async (
  file: File,
  userId: string
): Promise<UploadResult> => {
  const result = await uploadImage(file, userId, 'headerImage');

  if (result.success && result.url) {
    // Update user document
    await updateDoc(doc(db, 'users', userId), {
      headerImageUrl: result.url,
    });
  }

  return result;
};

/**
 * Delete image from Firebase Storage
 */
export const deleteImage = async (imageUrl: string): Promise<boolean> => {
  try {
    const storage = getStorage();
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Delete error:', error);
    return false;
  }
};

// ═══════════════════════════════════════
// FILE PICKER HELPER
// ═══════════════════════════════════════

/**
 * Open file picker and get selected image
 */
export const pickImage = (): Promise<File | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = IMAGE_CONFIG.allowedTypes.join(',');
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      resolve(files?.[0] || null);
    };
    input.click();
  });
};

/**
 * Convert file to base64 for preview
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default {
  IMAGE_CONFIG,
  processImage,
  createBlurredThumbnail,
  uploadImage,
  uploadProfilePicture,
  uploadHeaderImage,
  deleteImage,
  pickImage,
  fileToBase64,
};
