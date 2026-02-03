import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  Bell,
  Edit2,
  Trash2,
  Radio,
  Mic,
  MessageCircle,
  Music,
  Sparkles,
  X,
  Check,
  Gamepad2,
  GraduationCap,
  Briefcase,
  Coffee,
  Video,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { ScheduledEvent, EventCategory } from '@/types';

// Mock scheduled events
const MOCK_SCHEDULED_EVENTS: ScheduledEvent[] = [
  {
    id: '1',
    hostId: 'user1',
    hostUsername: 'max_official',
    hostDisplayName: 'Max Mustermann',
    hostTier: 'supernova',
    title: 'Abend Q&A mit der Community',
    description: 'Ich beantworte eure Fragen zu meinem neuen Projekt und mehr!',
    category: 'qa',
    scheduledAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    estimatedDuration: 60,
    interestedCount: 234,
    status: 'scheduled',
  },
  {
    id: '2',
    hostId: 'user1',
    hostUsername: 'max_official',
    hostDisplayName: 'Max Mustermann',
    hostTier: 'supernova',
    title: 'Wochenend-Chill & Music',
    description: 'Entspannter Samstag mit guter Musik und netten Gesprächen',
    category: 'music',
    scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 2 days from now
    estimatedDuration: 120,
    interestedCount: 89,
    status: 'scheduled',
  },
];

const CATEGORY_CONFIG: Record<EventCategory, { icon: React.ElementType; label: string; color: string }> = {
  qa: { icon: Mic, label: 'Q&A', color: 'text-purple-400' },
  talk: { icon: MessageCircle, label: 'Talk', color: 'text-blue-400' },
  interview: { icon: Video, label: 'Interview', color: 'text-orange-400' },
  music: { icon: Music, label: 'Musik', color: 'text-pink-400' },
  gaming: { icon: Gamepad2, label: 'Gaming', color: 'text-green-400' },
  education: { icon: GraduationCap, label: 'Bildung', color: 'text-indigo-400' },
  business: { icon: Briefcase, label: 'Business', color: 'text-yellow-400' },
  casual: { icon: Coffee, label: 'Casual', color: 'text-cyan-400' },
  other: { icon: Sparkles, label: 'Sonstiges', color: 'text-gray-400' },
};

export default function StarsSchedule() {
  const navigate = useNavigate();
  const { isVerifiedStar } = useStore();

  const [events, setEvents] = useState<ScheduledEvent[]>(MOCK_SCHEDULED_EVENTS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);

  // Redirect if not verified star
  if (!isVerifiedStar) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nur für verifizierte Stars</h2>
          <p className="text-gray-400 mb-6">
            Event-Planung ist nur für verifizierte Creator verfügbar.
          </p>
          <button
            onClick={() => navigate('/stars/apply')}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium"
          >
            Star werden
          </button>
        </div>
      </div>
    );
  }

  const formatEventTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `In ${days} Tag${days > 1 ? 'en' : ''}`;
    } else if (hours > 0) {
      return `In ${hours} Stunde${hours > 1 ? 'n' : ''}`;
    } else {
      const minutes = Math.floor(diff / (1000 * 60));
      return `In ${minutes} Minute${minutes > 1 ? 'n' : ''}`;
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
  };

  const handleGoLive = (_event: ScheduledEvent) => {
    // Navigate to the live room (could use _event.id to start specific room)
    navigate('/discover');
  };

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Event-Planung</h1>
              <p className="text-xs text-gray-400">Plane deine nächsten Sessions</p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-400">{events.length}</div>
          <div className="text-xs text-gray-400">Geplant</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-pink-400">
            {events.reduce((sum, e) => sum + e.interestedCount, 0)}
          </div>
          <div className="text-xs text-gray-400">Interessiert</div>
        </div>
        <div className="bg-white/5 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-cyan-400">
            {events.filter(e => {
              const diff = new Date(e.scheduledAt).getTime() - Date.now();
              return diff < 24 * 60 * 60 * 1000 && diff > 0;
            }).length}
          </div>
          <div className="text-xs text-gray-400">Heute</div>
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="p-4 space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-400" />
          Geplante Events
        </h2>

        {events.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="font-bold mb-2">Keine Events geplant</h3>
            <p className="text-gray-400 text-sm mb-4">
              Plane dein erstes Event, damit deine Follower wissen, wann du live gehst!
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium"
            >
              Event erstellen
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => {
              const CategoryIcon = CATEGORY_CONFIG[event.category].icon;
              const isStartingSoon = new Date(event.scheduledAt).getTime() - Date.now() < 30 * 60 * 1000;

              return (
                <div
                  key={event.id}
                  className={`bg-white/5 rounded-2xl p-4 border ${
                    isStartingSoon ? 'border-purple-500/50' : 'border-transparent'
                  }`}
                >
                  {/* Event Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${CATEGORY_CONFIG[event.category].color}`}>
                        <CategoryIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold">{event.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span className={CATEGORY_CONFIG[event.category].color}>
                            {CATEGORY_CONFIG[event.category].label}
                          </span>
                          <span>•</span>
                          <span>{event.estimatedDuration} Min</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingEvent(event)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400" />
                      </button>
                      <button
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  {event.description && (
                    <p className="text-sm text-gray-400 mb-3">{event.description}</p>
                  )}

                  {/* Time & Interested */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span className={isStartingSoon ? 'text-purple-400 font-medium' : 'text-gray-400'}>
                          {formatEventTime(new Date(event.scheduledAt))}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Bell className="w-4 h-4 text-pink-400" />
                        <span className="text-gray-400">{event.interestedCount} interessiert</span>
                      </div>
                    </div>

                    {isStartingSoon && (
                      <button
                        onClick={() => handleGoLive(event)}
                        className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-medium flex items-center gap-2"
                      >
                        <Radio className="w-4 h-4" />
                        Jetzt starten
                      </button>
                    )}
                  </div>

                  {/* Starting Soon Indicator */}
                  {isStartingSoon && (
                    <div className="mt-3 px-3 py-2 bg-purple-500/20 rounded-xl flex items-center gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                      <span className="text-sm text-purple-300">Event startet bald!</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <div className="p-4">
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-500/20">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            Tipps für bessere Events
          </h3>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Plane Events mindestens 24h im Voraus
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Füge eine aussagekräftige Beschreibung hinzu
            </li>
            <li className="flex items-start gap-2">
              <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              Wähle Zeiten, wenn deine Follower aktiv sind
            </li>
          </ul>
        </div>
      </div>

      {/* Create Event Modal */}
      {showCreateModal && (
        <CreateEventModal
          onClose={() => setShowCreateModal(false)}
          onSave={(event) => {
            setEvents([...events, event]);
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Edit Event Modal */}
      {editingEvent && (
        <CreateEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={(updatedEvent) => {
            setEvents(events.map(e => e.id === updatedEvent.id ? updatedEvent : e));
            setEditingEvent(null);
          }}
        />
      )}
    </div>
  );
}

// Create/Edit Event Modal
function CreateEventModal({
  event,
  onClose,
  onSave,
}: {
  event?: ScheduledEvent;
  onClose: () => void;
  onSave: (event: ScheduledEvent) => void;
}) {
  const { user, starProfile } = useStore();

  const [title, setTitle] = useState(event?.title || '');
  const [description, setDescription] = useState(event?.description || '');
  const [category, setCategory] = useState<EventCategory>(event?.category || 'talk');
  const [date, setDate] = useState(
    event?.scheduledAt
      ? new Date(event.scheduledAt).toISOString().split('T')[0]
      : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [time, setTime] = useState(
    event?.scheduledAt
      ? new Date(event.scheduledAt).toTimeString().slice(0, 5)
      : '19:00'
  );
  const [duration, setDuration] = useState(event?.estimatedDuration || 60);

  const handleSave = () => {
    if (!title.trim()) return;

    const scheduledAt = new Date(`${date}T${time}:00`);

    const newEvent: ScheduledEvent = {
      id: event?.id || `event-${Date.now()}`,
      hostId: user?.id || '',
      hostUsername: user?.username || '',
      hostDisplayName: user?.displayName || user?.username || '',
      hostAvatar: user?.avatar,
      hostTier: starProfile?.nebulaTier || 'nebula',
      title,
      description,
      category,
      scheduledAt,
      estimatedDuration: duration,
      interestedCount: event?.interestedCount || 0,
      status: 'scheduled',
    };

    onSave(newEvent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-3xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-gray-900 p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {event ? 'Event bearbeiten' : 'Neues Event'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">Titel *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Abend Q&A mit der Community"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              maxLength={50}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">{title.length}/50</div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Beschreibung</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Worum geht es in deinem Event?"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500 resize-none h-24"
              maxLength={200}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">{description.length}/200</div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium mb-2">Kategorie</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(CATEGORY_CONFIG) as [EventCategory, typeof CATEGORY_CONFIG.talk][]).map(
                ([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setCategory(key)}
                      className={`p-3 rounded-xl border text-sm flex flex-col items-center gap-1 transition-all ${
                        category === key
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <span>{config.label}</span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-2">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Uhrzeit</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium mb-2">Geplante Dauer</label>
            <div className="flex gap-2">
              {[30, 60, 90, 120].map((d) => (
                <button
                  key={d}
                  onClick={() => setDuration(d)}
                  className={`flex-1 py-3 rounded-xl border text-sm transition-all ${
                    duration === d
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {d} Min
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <div className="text-xs text-gray-500 mb-2">Vorschau für Follower</div>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center ${CATEGORY_CONFIG[category].color}`}>
                {(() => {
                  const Icon = CATEGORY_CONFIG[category].icon;
                  return <Icon className="w-5 h-5" />;
                })()}
              </div>
              <div>
                <div className="font-medium">{title || 'Event Titel'}</div>
                <div className="text-xs text-gray-400">
                  {new Date(`${date}T${time}`).toLocaleDateString('de-DE', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} • {duration} Min
                </div>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {event ? 'Änderungen speichern' : 'Event erstellen'}
          </button>
        </div>
      </div>
    </div>
  );
}
