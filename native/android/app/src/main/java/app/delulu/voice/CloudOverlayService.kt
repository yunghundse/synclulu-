/**
 * DELULU CLOUD OVERLAY SERVICE
 * ═══════════════════════════════════════════════════════════════
 * Das "Wölkchen" - System-Overlay das über anderen Apps schwebt
 *
 * FEATURES:
 * - SYSTEM_ALERT_WINDOW Permission für Overlay
 * - Pulsiert wenn jemand spricht
 * - Drag & Drop positionierbar
 * - Tap öffnet Delulu App
 * - Zeigt aktive Teilnehmer
 *
 * @author Delulu Engineering
 * @version 1.0.0
 */

package app.delulu.voice

import android.animation.ValueAnimator
import android.annotation.SuppressLint
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.IBinder
import android.util.Log
import android.view.*
import android.view.animation.AccelerateDecelerateInterpolator
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.TextView
import kotlin.math.abs

class CloudOverlayService : Service() {

    companion object {
        private const val TAG = "CloudOverlay"

        const val ACTION_SHOW = "app.delulu.voice.overlay.SHOW"
        const val ACTION_HIDE = "app.delulu.voice.overlay.HIDE"
        const val ACTION_UPDATE = "app.delulu.voice.overlay.UPDATE"

        const val EXTRA_PARTICIPANT_COUNT = "participant_count"
        const val EXTRA_IS_SPEAKING = "is_speaking"
        const val EXTRA_SPEAKER_NAME = "speaker_name"
    }

    private var windowManager: WindowManager? = null
    private var overlayView: View? = null
    private var layoutParams: WindowManager.LayoutParams? = null

    // UI Elements
    private var cloudContainer: FrameLayout? = null
    private var cloudIcon: ImageView? = null
    private var participantBadge: TextView? = null

    // Animation
    private var pulseAnimator: ValueAnimator? = null
    private var isSpeaking = false

    // Touch handling
    private var initialX = 0
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager
        registerStateReceiver()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_SHOW -> showOverlay()
            ACTION_HIDE -> hideOverlay()
            ACTION_UPDATE -> {
                val count = intent.getIntExtra(EXTRA_PARTICIPANT_COUNT, 0)
                val speaking = intent.getBooleanExtra(EXTRA_IS_SPEAKING, false)
                val speakerName = intent.getStringExtra(EXTRA_SPEAKER_NAME)
                updateOverlay(count, speaking, speakerName)
            }
        }
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        hideOverlay()
        unregisterStateReceiver()
        super.onDestroy()
    }

    // ═══════════════════════════════════════
    // OVERLAY CREATION
    // ═══════════════════════════════════════

    @SuppressLint("ClickableViewAccessibility")
    private fun showOverlay() {
        if (overlayView != null) return

        // Create layout params for overlay
        val overlayType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        layoutParams = WindowManager.LayoutParams(
            dpToPx(72),  // Width
            dpToPx(72),  // Height
            overlayType,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.START
            x = dpToPx(16)
            y = dpToPx(100)
        }

        // Create the cloud view
        overlayView = createCloudView()

        // Add touch listener for drag
        overlayView?.setOnTouchListener(touchListener)

        // Add to window
        try {
            windowManager?.addView(overlayView, layoutParams)
            startPulseAnimation()
            Log.d(TAG, "Cloud overlay shown")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to show overlay: ${e.message}")
        }
    }

    private fun hideOverlay() {
        pulseAnimator?.cancel()

        overlayView?.let {
            try {
                windowManager?.removeView(it)
            } catch (e: Exception) {
                Log.e(TAG, "Failed to remove overlay: ${e.message}")
            }
        }
        overlayView = null
        Log.d(TAG, "Cloud overlay hidden")
    }

    // ═══════════════════════════════════════
    // CLOUD VIEW DESIGN
    // ═══════════════════════════════════════

    @SuppressLint("SetTextI18n")
    private fun createCloudView(): View {
        cloudContainer = FrameLayout(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT
            )
        }

        // Cloud background (gradient circle)
        val cloudBackground = View(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                dpToPx(64),
                dpToPx(64)
            ).apply {
                gravity = Gravity.CENTER
            }

            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                colors = intArrayOf(
                    Color.parseColor("#8B5CF6"), // Purple
                    Color.parseColor("#A855F7")  // Lighter purple
                )
                gradientType = GradientDrawable.RADIAL_GRADIENT
                gradientRadius = dpToPx(32).toFloat()
            }

            // Shadow
            elevation = dpToPx(8).toFloat()
        }

        // Cloud icon (wölkchen)
        cloudIcon = ImageView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                dpToPx(32),
                dpToPx(32)
            ).apply {
                gravity = Gravity.CENTER
            }
            setImageResource(android.R.drawable.ic_btn_speak_now)
            setColorFilter(Color.WHITE, PorterDuff.Mode.SRC_IN)
        }

        // Participant badge
        participantBadge = TextView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                dpToPx(20),
                dpToPx(20)
            ).apply {
                gravity = Gravity.TOP or Gravity.END
                setMargins(0, dpToPx(2), dpToPx(2), 0)
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#EF4444")) // Red
            }
            text = "0"
            textSize = 10f
            setTextColor(Color.WHITE)
            gravity = Gravity.CENTER
            visibility = View.GONE
        }

        cloudContainer?.apply {
            addView(cloudBackground)
            addView(cloudIcon)
            addView(participantBadge)
        }

        return cloudContainer!!
    }

    // ═══════════════════════════════════════
    // PULSE ANIMATION (WHEN SPEAKING)
    // ═══════════════════════════════════════

    private fun startPulseAnimation() {
        pulseAnimator = ValueAnimator.ofFloat(1f, 1.15f, 1f).apply {
            duration = 800
            repeatCount = ValueAnimator.INFINITE
            interpolator = AccelerateDecelerateInterpolator()
            addUpdateListener { animator ->
                val scale = animator.animatedValue as Float
                if (isSpeaking) {
                    overlayView?.scaleX = scale
                    overlayView?.scaleY = scale
                } else {
                    overlayView?.scaleX = 1f
                    overlayView?.scaleY = 1f
                }
            }
            start()
        }
    }

    // ═══════════════════════════════════════
    // TOUCH HANDLING (DRAG & TAP)
    // ═══════════════════════════════════════

    private val touchListener = View.OnTouchListener { _, event ->
        when (event.action) {
            MotionEvent.ACTION_DOWN -> {
                initialX = layoutParams?.x ?: 0
                initialY = layoutParams?.y ?: 0
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                true
            }

            MotionEvent.ACTION_MOVE -> {
                layoutParams?.x = initialX + (event.rawX - initialTouchX).toInt()
                layoutParams?.y = initialY + (event.rawY - initialTouchY).toInt()
                windowManager?.updateViewLayout(overlayView, layoutParams)
                true
            }

            MotionEvent.ACTION_UP -> {
                val deltaX = abs(event.rawX - initialTouchX)
                val deltaY = abs(event.rawY - initialTouchY)

                // If minimal movement, treat as tap
                if (deltaX < 10 && deltaY < 10) {
                    openDeluluApp()
                }
                true
            }

            else -> false
        }
    }

    private fun openDeluluApp() {
        val intent = packageManager.getLaunchIntentForPackage(packageName)?.apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            addFlags(Intent.FLAG_ACTIVITY_REORDER_TO_FRONT)
        }
        intent?.let { startActivity(it) }
    }

    // ═══════════════════════════════════════
    // STATE UPDATES
    // ═══════════════════════════════════════

    @SuppressLint("SetTextI18n")
    private fun updateOverlay(participantCount: Int, speaking: Boolean, speakerName: String?) {
        isSpeaking = speaking

        participantBadge?.apply {
            if (participantCount > 0) {
                text = participantCount.toString()
                visibility = View.VISIBLE
            } else {
                visibility = View.GONE
            }
        }

        // Update cloud color based on speaking state
        val cloudBg = (cloudContainer?.getChildAt(0) as? View)?.background as? GradientDrawable
        if (speaking) {
            cloudBg?.colors = intArrayOf(
                Color.parseColor("#10B981"), // Green
                Color.parseColor("#34D399")
            )
        } else {
            cloudBg?.colors = intArrayOf(
                Color.parseColor("#8B5CF6"),
                Color.parseColor("#A855F7")
            )
        }
    }

    // ═══════════════════════════════════════
    // STATE RECEIVER
    // ═══════════════════════════════════════

    private val stateReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                GhostVoiceService.BROADCAST_STATE_CHANGED -> {
                    val isActive = intent.getBooleanExtra(GhostVoiceService.EXTRA_IS_ACTIVE, false)
                    val participantCount = intent.getIntExtra(GhostVoiceService.EXTRA_PARTICIPANT_COUNT, 0)
                    val speakingUser = intent.getStringExtra(GhostVoiceService.EXTRA_SPEAKING_USER)

                    if (isActive) {
                        updateOverlay(participantCount, speakingUser != null, speakingUser)
                    } else {
                        hideOverlay()
                    }
                }
            }
        }
    }

    private fun registerStateReceiver() {
        val filter = IntentFilter(GhostVoiceService.BROADCAST_STATE_CHANGED)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(stateReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
        } else {
            registerReceiver(stateReceiver, filter)
        }
    }

    private fun unregisterStateReceiver() {
        try {
            unregisterReceiver(stateReceiver)
        } catch (e: Exception) {
            // Not registered
        }
    }

    // ═══════════════════════════════════════
    // UTILS
    // ═══════════════════════════════════════

    private fun dpToPx(dp: Int): Int {
        return (dp * resources.displayMetrics.density).toInt()
    }
}
