/**
 * DELULU GHOST VOICE SERVICE
 * ═══════════════════════════════════════════════════════════════
 * "Never-Die" Foreground Service für persistente Voice-Connections
 *
 * FEATURES:
 * - FOREGROUND_SERVICE_TYPE_MICROPHONE + CONNECTED_DEVICE
 * - Überlebt App-Wechsel (Instagram, TikTok, etc.)
 * - Dynamisches Audio Focus Management (Duck statt Kill)
 * - Sticky Notification mit Live-Status
 * - Phone Call Interrupt Handling
 * - Battery-optimiertes Buffer Management
 *
 * @author Delulu Engineering
 * @version 1.0.0
 */

package app.delulu.voice

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.media.*
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class GhostVoiceService : Service() {

    companion object {
        private const val TAG = "GhostVoice"

        // Notification Channel
        const val CHANNEL_ID = "delulu_ghost_voice"
        const val NOTIFICATION_ID = 8888

        // Actions
        const val ACTION_START = "app.delulu.voice.START"
        const val ACTION_STOP = "app.delulu.voice.STOP"
        const val ACTION_MUTE = "app.delulu.voice.MUTE"
        const val ACTION_UNMUTE = "app.delulu.voice.UNMUTE"

        // State Broadcasts
        const val BROADCAST_STATE_CHANGED = "app.delulu.voice.STATE_CHANGED"
        const val EXTRA_IS_ACTIVE = "is_active"
        const val EXTRA_IS_MUTED = "is_muted"
        const val EXTRA_PARTICIPANT_COUNT = "participant_count"
        const val EXTRA_SPEAKING_USER = "speaking_user"

        // Singleton reference for binding
        @Volatile
        private var instance: GhostVoiceService? = null

        fun getInstance(): GhostVoiceService? = instance
    }

    // ═══════════════════════════════════════
    // SERVICE LIFECYCLE
    // ═══════════════════════════════════════

    private var audioManager: AudioManager? = null
    private var audioFocusRequest: AudioFocusRequest? = null
    private var isActive = false
    private var isMuted = false
    private var participantCount = 0
    private var currentSpeaker: String? = null

    // Wakelock für CPU-intensive Voice Processing
    private var wakeLock: PowerManager.WakeLock? = null

    override fun onCreate() {
        super.onCreate()
        instance = this
        Log.d(TAG, "Ghost Voice Service created")

        audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        createNotificationChannel()
        acquireWakeLock()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d(TAG, "onStartCommand: ${intent?.action}")

        when (intent?.action) {
            ACTION_START -> startVoiceSession()
            ACTION_STOP -> stopVoiceSession()
            ACTION_MUTE -> setMuted(true)
            ACTION_UNMUTE -> setMuted(false)
        }

        // STICKY: Service wird nach Kill automatisch neu gestartet
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return GhostVoiceBinder()
    }

    override fun onDestroy() {
        Log.d(TAG, "Ghost Voice Service destroyed")
        releaseAudioFocus()
        releaseWakeLock()
        instance = null
        super.onDestroy()
    }

    // ═══════════════════════════════════════
    // VOICE SESSION MANAGEMENT
    // ═══════════════════════════════════════

    private fun startVoiceSession() {
        if (isActive) {
            Log.d(TAG, "Voice session already active")
            return
        }

        Log.d(TAG, "Starting Ghost Voice session...")

        // Request Audio Focus mit DUCK-Modus
        requestAudioFocus()

        // Start Foreground mit persistent Notification
        startForegroundWithNotification()

        isActive = true
        broadcastStateChange()
    }

    private fun stopVoiceSession() {
        Log.d(TAG, "Stopping Ghost Voice session...")

        isActive = false
        releaseAudioFocus()
        stopForeground(STOP_FOREGROUND_REMOVE)
        broadcastStateChange()

        stopSelf()
    }

    // ═══════════════════════════════════════
    // AUDIO FOCUS MANAGEMENT (THE MAGIC)
    // ═══════════════════════════════════════

    private fun requestAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val audioAttributes = AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build()

            audioFocusRequest = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
                .setAudioAttributes(audioAttributes)
                .setAcceptsDelayedFocusGain(true)
                .setWillPauseWhenDucked(false) // CRITICAL: Niemals pausieren!
                .setOnAudioFocusChangeListener(audioFocusChangeListener, Handler(Looper.getMainLooper()))
                .build()

            audioManager?.requestAudioFocus(audioFocusRequest!!)
            Log.d(TAG, "Audio focus requested with DUCK mode")
        } else {
            @Suppress("DEPRECATION")
            audioManager?.requestAudioFocus(
                audioFocusChangeListenerLegacy,
                AudioManager.STREAM_VOICE_CALL,
                AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
            )
        }
    }

    private fun releaseAudioFocus() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            audioFocusRequest?.let {
                audioManager?.abandonAudioFocusRequest(it)
            }
        } else {
            @Suppress("DEPRECATION")
            audioManager?.abandonAudioFocus(audioFocusChangeListenerLegacy)
        }
        Log.d(TAG, "Audio focus released")
    }

    /**
     * AUDIO FOCUS CHANGE LISTENER
     * ═══════════════════════════════════════
     * Hier passiert die Magie: Wir ducken, aber sterben nie!
     */
    private val audioFocusChangeListener = AudioManager.OnAudioFocusChangeListener { focusChange ->
        when (focusChange) {
            AudioManager.AUDIOFOCUS_GAIN -> {
                // Wir haben den Fokus (zurück) - volle Lautstärke
                Log.d(TAG, "Audio focus GAINED - restoring volume")
                setVoiceVolume(1.0f)
                updateNotification("Voice Chat aktiv", "Verbunden")
            }

            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT_CAN_DUCK -> {
                // DUCK MODE: Andere App spielt Audio (Reel, TikTok)
                // Wir werden leiser, aber NIEMALS pausiert!
                Log.d(TAG, "Audio focus DUCK - reducing volume to 30%")
                setVoiceVolume(0.3f)
                updateNotification("Voice Chat aktiv", "Im Hintergrund (leiser)")
            }

            AudioManager.AUDIOFOCUS_LOSS_TRANSIENT -> {
                // Kurzer Verlust (z.B. Notification Sound)
                // Wir muten temporär, aber Connection bleibt
                Log.d(TAG, "Audio focus TRANSIENT LOSS - temporary mute")
                setVoiceVolume(0.1f)
            }

            AudioManager.AUDIOFOCUS_LOSS -> {
                // Echter Verlust (Telefonanruf!)
                // Wir pausieren, aber CONNECTION BLEIBT
                Log.d(TAG, "Audio focus LOSS - phone call detected, pausing audio")
                handlePhoneCallInterrupt()
            }
        }
    }

    @Suppress("DEPRECATION")
    private val audioFocusChangeListenerLegacy = AudioManager.OnAudioFocusChangeListener { focusChange ->
        audioFocusChangeListener.onAudioFocusChange(focusChange)
    }

    // ═══════════════════════════════════════
    // PHONE CALL INTERRUPT HANDLING
    // ═══════════════════════════════════════

    private var wasActiveBeforeCall = false

    private fun handlePhoneCallInterrupt() {
        wasActiveBeforeCall = isActive && !isMuted

        if (wasActiveBeforeCall) {
            // Mute but keep connection alive
            setMuted(true)
            updateNotification("Voice Chat pausiert", "Telefonanruf aktiv")

            // Broadcast für UI Update
            broadcastStateChange()
        }
    }

    fun resumeAfterPhoneCall() {
        if (wasActiveBeforeCall) {
            Log.d(TAG, "Resuming after phone call")
            setMuted(false)
            requestAudioFocus()
            updateNotification("Voice Chat aktiv", "Verbunden")
            wasActiveBeforeCall = false
        }
    }

    // ═══════════════════════════════════════
    // VOLUME & MUTE CONTROL
    // ═══════════════════════════════════════

    private var currentVolume = 1.0f

    private fun setVoiceVolume(volume: Float) {
        currentVolume = volume
        // Bridge to WebRTC/Agora via JavaScript Interface
        broadcastVolumeChange(volume)
    }

    private fun setMuted(muted: Boolean) {
        isMuted = muted
        Log.d(TAG, "Muted: $muted")
        broadcastStateChange()

        updateNotification(
            if (muted) "Voice Chat stumm" else "Voice Chat aktiv",
            if (muted) "Mikrofon aus" else "Verbunden"
        )
    }

    // ═══════════════════════════════════════
    // FOREGROUND NOTIFICATION (STICKY)
    // ═══════════════════════════════════════

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Delulu Voice Chat",
                NotificationManager.IMPORTANCE_LOW // Low = keine Töne, aber sichtbar
            ).apply {
                description = "Zeigt aktive Voice-Verbindungen an"
                setShowBadge(false)
                lockscreenVisibility = Notification.VISIBILITY_PUBLIC
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun startForegroundWithNotification() {
        val notification = buildNotification("Voice Chat aktiv", "Verbunden")

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE or
                ServiceInfo.FOREGROUND_SERVICE_TYPE_CONNECTED_DEVICE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }

    private fun buildNotification(title: String, content: String): Notification {
        // Intent um App zu öffnen
        val openIntent = packageManager.getLaunchIntentForPackage(packageName)?.let {
            PendingIntent.getActivity(
                this, 0, it,
                PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
            )
        }

        // Mute/Unmute Action
        val muteIntent = Intent(this, GhostVoiceService::class.java).apply {
            action = if (isMuted) ACTION_UNMUTE else ACTION_MUTE
        }
        val mutePendingIntent = PendingIntent.getService(
            this, 1, muteIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        // Stop Action
        val stopIntent = Intent(this, GhostVoiceService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this, 2, stopIntent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle(title)
            .setContentText(content)
            .setSmallIcon(android.R.drawable.ic_btn_speak_now) // TODO: Custom icon
            .setOngoing(true)
            .setContentIntent(openIntent)
            .addAction(
                if (isMuted) android.R.drawable.ic_lock_silent_mode_off
                else android.R.drawable.ic_lock_silent_mode,
                if (isMuted) "Unmute" else "Mute",
                mutePendingIntent
            )
            .addAction(
                android.R.drawable.ic_menu_close_clear_cancel,
                "Beenden",
                stopPendingIntent
            )
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .build()
    }

    private fun updateNotification(title: String, content: String) {
        val notification = buildNotification(title, content)
        NotificationManagerCompat.from(this).notify(NOTIFICATION_ID, notification)
    }

    // ═══════════════════════════════════════
    // WAKELOCK (BATTERY OPTIMIZATION)
    // ═══════════════════════════════════════

    private fun acquireWakeLock() {
        val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "Delulu:GhostVoiceWakeLock"
        ).apply {
            // Max 4 Stunden, dann Auto-Release (Battery Safety)
            acquire(4 * 60 * 60 * 1000L)
        }
        Log.d(TAG, "WakeLock acquired (4h timeout)")
    }

    private fun releaseWakeLock() {
        wakeLock?.let {
            if (it.isHeld) {
                it.release()
                Log.d(TAG, "WakeLock released")
            }
        }
        wakeLock = null
    }

    // ═══════════════════════════════════════
    // STATE BROADCASTING (TO UI)
    // ═══════════════════════════════════════

    private fun broadcastStateChange() {
        val intent = Intent(BROADCAST_STATE_CHANGED).apply {
            putExtra(EXTRA_IS_ACTIVE, isActive)
            putExtra(EXTRA_IS_MUTED, isMuted)
            putExtra(EXTRA_PARTICIPANT_COUNT, participantCount)
            putExtra(EXTRA_SPEAKING_USER, currentSpeaker)
        }
        sendBroadcast(intent)
    }

    private fun broadcastVolumeChange(volume: Float) {
        val intent = Intent("app.delulu.voice.VOLUME_CHANGED").apply {
            putExtra("volume", volume)
        }
        sendBroadcast(intent)
    }

    // ═══════════════════════════════════════
    // BINDER FOR LOCAL BINDING
    // ═══════════════════════════════════════

    inner class GhostVoiceBinder : Binder() {
        fun getService(): GhostVoiceService = this@GhostVoiceService
    }

    // ═══════════════════════════════════════
    // PUBLIC API
    // ═══════════════════════════════════════

    fun updateParticipants(count: Int, speakingUser: String?) {
        participantCount = count
        currentSpeaker = speakingUser

        val statusText = when {
            speakingUser != null -> "$speakingUser spricht..."
            count > 1 -> "$count Teilnehmer"
            count == 1 -> "1 Teilnehmer"
            else -> "Verbunden"
        }

        updateNotification("Voice Chat aktiv", statusText)
        broadcastStateChange()
    }

    fun isVoiceActive(): Boolean = isActive
    fun isVoiceMuted(): Boolean = isMuted
}
