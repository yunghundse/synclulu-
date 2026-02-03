/**
 * BLOCK USER MODAL
 * Modal to block/unblock a user from their profile
 */

import { useState } from 'react';
import { Shield, X, Loader2, AlertTriangle, Check, Unlock } from 'lucide-react';
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { BLOCK_REASONS, BlockReason } from '@/types';

interface BlockUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  displayName?: string;
  isCurrentlyBlocked: boolean;
}

const BlockUserModal: React.FC<BlockUserModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  displayName,
  isCurrentlyBlocked,
}) => {
  const { blockUser, unblockUser } = useBlockedUsers();
  const [selectedReason, setSelectedReason] = useState<BlockReason>('personal');
  const [customReason, setCustomReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleBlock = async () => {
    setIsLoading(true);
    const result = await blockUser(
      userId,
      selectedReason,
      selectedReason === 'other' ? customReason : undefined
    );
    setIsLoading(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }
  };

  const handleUnblock = async () => {
    setIsLoading(true);
    const result = await unblockUser(userId);
    setIsLoading(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    }
  };

  if (!isOpen) return null;

  const name = displayName || `@${username}`;

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 text-center animate-in zoom-in-95">
          <div className={`w-16 h-16 mx-auto rounded-full ${isCurrentlyBlocked ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center mb-4`}>
            {isCurrentlyBlocked ? (
              <Unlock size={28} className="text-green-500" />
            ) : (
              <Check size={28} className="text-red-500" />
            )}
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {isCurrentlyBlocked ? 'Entblockt!' : 'Blockiert!'}
          </h2>
          <p className="text-gray-500 text-sm">
            {isCurrentlyBlocked
              ? `${name} kann dich jetzt wieder kontaktieren.`
              : `${name} kann dich nicht mehr kontaktieren.`}
          </p>
        </div>
      </div>
    );
  }

  // Unblock mode
  if (isCurrentlyBlocked) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Nutzer entblocken</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center mb-4">
              <Unlock size={28} className="text-green-500" />
            </div>
            <p className="font-semibold text-gray-900 mb-2">{name}</p>
            <p className="text-sm text-gray-500">
              Nach dem Entblocken kann diese Person dich wieder kontaktieren und in Voice-Chats sehen.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
            >
              Abbrechen
            </button>
            <button
              onClick={handleUnblock}
              disabled={isLoading}
              className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <Unlock size={18} />
                  Entblocken
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Block mode
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-sm p-6 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Nutzer blockieren</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
          >
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <p className="text-gray-500 text-sm mb-4">
          <span className="font-semibold text-gray-900">{name}</span> wird dich nicht mehr kontaktieren können.
        </p>

        {/* Reason Selection */}
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Grund (optional)</p>
          <div className="space-y-2">
            {BLOCK_REASONS.map((reason) => (
              <button
                key={reason.id}
                onClick={() => setSelectedReason(reason.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                  selectedReason === reason.id
                    ? 'border-violet-500 bg-violet-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{reason.icon}</span>
                <span className="text-sm font-medium text-gray-700">{reason.label}</span>
                {selectedReason === reason.id && (
                  <Check size={16} className="text-violet-500 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom reason input */}
        {selectedReason === 'other' && (
          <div className="mb-4">
            <input
              type="text"
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="Grund eingeben (optional)"
              maxLength={100}
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-violet-500 focus:outline-none"
            />
          </div>
        )}

        {/* Warning */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-4">
          <div className="flex gap-2">
            <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Blockierte Personen erfahren nicht, dass sie blockiert wurden. Du kannst sie jederzeit wieder entblocken.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-semibold"
          >
            Abbrechen
          </button>
          <button
            onClick={handleBlock}
            disabled={isLoading}
            className="flex-1 py-3 bg-red-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Shield size={18} />
                Blockieren
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlockUserModal;
