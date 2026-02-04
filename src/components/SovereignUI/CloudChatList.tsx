/**
 * CloudChatList.tsx
 * Chat-Revolution mit Cloud-Avatar Integration
 *
 * Features:
 * - OLED-Black Design wie Home-Menü
 * - Wölkchen-Avatar mit Kaugummi-Animation
 * - Klick auf Avatar = Profil öffnen
 * - Klick auf Text = Chat öffnen
 * - Floating/Pulsing Animation
 * - Online-Status Indicator
 */

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Cloud } from 'lucide-react';

interface ChatFriend {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime?: string;
  isOnline?: boolean;
  unreadCount?: number;
}

interface CloudChatItemProps {
  friend: ChatFriend;
  onProfileClick: () => void;
  onChatClick: () => void;
  index: number;
}

export const CloudChatItem = memo(function CloudChatItem({
  friend,
  onProfileClick,
  onChatClick,
  index,
}: CloudChatItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="flex items-center gap-4 p-4 mb-3 rounded-2xl active:scale-[0.98] transition-transform"
      style={{
        background: 'rgba(255, 255, 255, 0.02)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
      }}
    >
      {/* Kaugummi-Wölkchen Avatar */}
      <motion.div
        onClick={(e) => {
          e.stopPropagation();
          onProfileClick();
        }}
        // Floating Animation
        animate={{
          y: [0, -4, 0],
          scale: [1, 1.03, 1],
        }}
        transition={{
          duration: 3 + index * 0.2, // Leicht versetzt für jeden
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-14 h-14 cursor-pointer flex-shrink-0"
      >
        {/* Glow Background */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: friend.isOnline
              ? 'radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)',
            filter: 'blur(8px)',
            transform: 'scale(1.3)',
          }}
          animate={{
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Avatar Image */}
        {friend.avatar ? (
          <motion.img
            src={friend.avatar}
            alt={friend.name}
            className="relative w-full h-full object-cover"
            style={{
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              border: `2px solid ${friend.isOnline ? 'rgba(34, 197, 94, 0.4)' : 'rgba(168, 85, 247, 0.3)'}`,
            }}
            // Subtle morph animation
            animate={{
              borderRadius: [
                '30% 70% 70% 30% / 30% 30% 70% 70%',
                '50% 50% 50% 50% / 50% 50% 50% 50%',
                '30% 70% 70% 30% / 30% 30% 70% 70%',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            whileHover={{
              scale: 1.1,
              borderRadius: '50%',
            }}
            whileTap={{
              scale: 0.95,
            }}
          />
        ) : (
          <motion.div
            className="relative w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.2))',
              borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
              border: '2px solid rgba(168, 85, 247, 0.3)',
            }}
            animate={{
              borderRadius: [
                '30% 70% 70% 30% / 30% 30% 70% 70%',
                '50% 50% 50% 50% / 50% 50% 50% 50%',
                '30% 70% 70% 30% / 30% 30% 70% 70%',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <span className="text-lg font-bold text-white">
              {friend.name.charAt(0).toUpperCase()}
            </span>
          </motion.div>
        )}

        {/* Cloud Icon */}
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(5, 5, 5, 0.9)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <Cloud size={10} className="text-violet-400" />
        </div>

        {/* Online Status */}
        {friend.isOnline && (
          <motion.div
            className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full"
            style={{
              background: '#22c55e',
              border: '2px solid #050505',
              boxShadow: '0 0 8px #22c55e',
            }}
            animate={{
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}
      </motion.div>

      {/* Chat Content - Click opens chat */}
      <div
        onClick={onChatClick}
        className="flex-1 min-w-0 cursor-pointer"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-white truncate">
            {friend.name}
          </h3>
          {friend.lastMessageTime && (
            <span className="text-[9px] text-white/30 flex-shrink-0 ml-2">
              {friend.lastMessageTime}
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/40 truncate">
          {friend.lastMessage}
        </p>
      </div>

      {/* Unread Badge */}
      {friend.unreadCount && friend.unreadCount > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            background: 'linear-gradient(135deg, #a855f7, #7c3aed)',
            boxShadow: '0 2px 10px rgba(168, 85, 247, 0.4)',
          }}
        >
          <span className="text-[10px] font-bold text-white">
            {friend.unreadCount > 9 ? '9+' : friend.unreadCount}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
});

// Full Chat List Component
interface CloudChatListProps {
  friends: ChatFriend[];
  onProfileClick: (id: string) => void;
  onChatClick: (id: string) => void;
  emptyMessage?: string;
}

export const CloudChatList = memo(function CloudChatList({
  friends,
  onProfileClick,
  onChatClick,
  emptyMessage = 'Noch keine Nachrichten',
}: CloudChatListProps) {
  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="text-5xl mb-4"
        >
          ☁️
        </motion.div>
        <p className="text-sm text-white/40 text-center">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {friends.map((friend, index) => (
        <CloudChatItem
          key={friend.id}
          friend={friend}
          onProfileClick={() => onProfileClick(friend.id)}
          onChatClick={() => onChatClick(friend.id)}
          index={index}
        />
      ))}
    </div>
  );
});

export default CloudChatList;
