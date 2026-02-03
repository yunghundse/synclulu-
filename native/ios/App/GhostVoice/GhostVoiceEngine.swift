/**
 * DELULU GHOST VOICE ENGINE (iOS)
 * ═══════════════════════════════════════════════════════════════
 * "Never-Die" Audio Session für persistente Voice-Connections
 *
 * FEATURES:
 * - AVAudioSessionCategoryPlayAndRecord mit .mixWithOthers
 * - Background Modes: Audio, AirPlay, PiP
 * - Remote Command Center Integration
 * - Phone Call Interrupt Handling
 * - Bluetooth & Speaker Support
 *
 * @author Delulu Engineering
 * @version 1.0.0
 */

import Foundation
import AVFoundation
import MediaPlayer
import UIKit
import CallKit

@objc class GhostVoiceEngine: NSObject {

    // ═══════════════════════════════════════
    // SINGLETON
    // ═══════════════════════════════════════

    @objc static let shared = GhostVoiceEngine()

    // ═══════════════════════════════════════
    // STATE
    // ═══════════════════════════════════════

    private var isActive = false
    private var isMuted = false
    private var wasActiveBeforeInterrupt = false
    private var currentVolume: Float = 1.0

    // Observers
    private var interruptionObserver: NSObjectProtocol?
    private var routeChangeObserver: NSObjectProtocol?

    // Delegates
    weak var delegate: GhostVoiceDelegate?

    // ═══════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════

    private override init() {
        super.init()
        setupNotificationObservers()
    }

    deinit {
        removeNotificationObservers()
    }

    // ═══════════════════════════════════════
    // AUDIO SESSION CONFIGURATION (THE MAGIC)
    // ═══════════════════════════════════════

    /**
     * Konfiguriert die Audio Session für persistentes Voice Chat
     *
     * KEY OPTIONS:
     * - .mixWithOthers: CRITICAL - Erlaubt Audio-Mix mit anderen Apps
     * - .allowBluetooth: Bluetooth Headsets
     * - .defaultToSpeaker: Fallback auf Lautsprecher
     * - .duckOthers: Andere Apps werden leiser (nicht gestoppt)
     */
    @objc func configureAudioSession() -> Bool {
        let session = AVAudioSession.sharedInstance()

        do {
            // ═══════════════════════════════════════
            // CATEGORY: PlayAndRecord
            // Erlaubt gleichzeitiges Aufnehmen und Abspielen
            // ═══════════════════════════════════════
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [
                    .mixWithOthers,        // CRITICAL: Nie andere Apps stoppen!
                    .allowBluetooth,       // Bluetooth Headset Support
                    .allowBluetoothA2DP,   // High-Quality Bluetooth
                    .defaultToSpeaker,     // Speaker als Default Output
                    .duckOthers            // Andere Apps werden leiser
                ]
            )

            // ═══════════════════════════════════════
            // PREFERRED SETTINGS
            // ═══════════════════════════════════════

            // Buffer Size für Low-Latency (256 Samples ≈ 5.8ms @ 44.1kHz)
            try session.setPreferredIOBufferDuration(0.005)

            // Sample Rate
            try session.setPreferredSampleRate(44100.0)

            // Aktivieren
            try session.setActive(true, options: .notifyOthersOnDeactivation)

            print("✅ [GhostVoice] Audio session configured successfully")
            print("   - Category: \(session.category.rawValue)")
            print("   - Mode: \(session.mode.rawValue)")
            print("   - Options: \(session.categoryOptions)")
            print("   - Sample Rate: \(session.sampleRate)")
            print("   - Buffer Duration: \(session.ioBufferDuration)")

            return true

        } catch {
            print("❌ [GhostVoice] Failed to configure audio session: \(error)")
            return false
        }
    }

    // ═══════════════════════════════════════
    // VOICE SESSION MANAGEMENT
    // ═══════════════════════════════════════

    @objc func startVoiceSession() {
        guard !isActive else {
            print("⚠️ [GhostVoice] Session already active")
            return
        }

        print("🚀 [GhostVoice] Starting voice session...")

        // Configure audio session
        guard configureAudioSession() else {
            delegate?.voiceSessionDidFail(error: "Audio configuration failed")
            return
        }

        // Setup Remote Command Center
        setupRemoteCommandCenter()

        // Setup Now Playing Info
        updateNowPlayingInfo()

        isActive = true
        delegate?.voiceSessionDidStart()

        print("✅ [GhostVoice] Voice session started")
    }

    @objc func stopVoiceSession() {
        print("🛑 [GhostVoice] Stopping voice session...")

        isActive = false

        // Clear Now Playing
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil

        // Deactivate audio session
        do {
            try AVAudioSession.sharedInstance().setActive(
                false,
                options: .notifyOthersOnDeactivation
            )
        } catch {
            print("⚠️ [GhostVoice] Failed to deactivate session: \(error)")
        }

        delegate?.voiceSessionDidStop()
        print("✅ [GhostVoice] Voice session stopped")
    }

    // ═══════════════════════════════════════
    // REMOTE COMMAND CENTER
    // Macht die App zum "Media Player" für das System
    // ═══════════════════════════════════════

    private func setupRemoteCommandCenter() {
        let commandCenter = MPRemoteCommandCenter.shared()

        // Play/Pause Toggle (für Control Center / Lock Screen)
        commandCenter.togglePlayPauseCommand.isEnabled = true
        commandCenter.togglePlayPauseCommand.addTarget { [weak self] _ in
            self?.toggleMute()
            return .success
        }

        // Play Command
        commandCenter.playCommand.isEnabled = true
        commandCenter.playCommand.addTarget { [weak self] _ in
            self?.setMuted(false)
            return .success
        }

        // Pause Command
        commandCenter.pauseCommand.isEnabled = true
        commandCenter.pauseCommand.addTarget { [weak self] _ in
            self?.setMuted(true)
            return .success
        }

        print("✅ [GhostVoice] Remote Command Center configured")
    }

    private func updateNowPlayingInfo() {
        var nowPlayingInfo = [String: Any]()

        nowPlayingInfo[MPMediaItemPropertyTitle] = "Delulu Voice Chat"
        nowPlayingInfo[MPMediaItemPropertyArtist] = isMuted ? "Stummgeschaltet" : "Aktiv"
        nowPlayingInfo[MPNowPlayingInfoPropertyPlaybackRate] = isMuted ? 0.0 : 1.0
        nowPlayingInfo[MPNowPlayingInfoPropertyIsLiveStream] = true

        // Optional: Custom artwork
        if let image = UIImage(named: "AppIcon") {
            let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
            nowPlayingInfo[MPMediaItemPropertyArtwork] = artwork
        }

        MPNowPlayingInfoCenter.default().nowPlayingInfo = nowPlayingInfo
    }

    // ═══════════════════════════════════════
    // MUTE CONTROL
    // ═══════════════════════════════════════

    @objc func setMuted(_ muted: Bool) {
        isMuted = muted
        updateNowPlayingInfo()
        delegate?.voiceMuteStateChanged(isMuted: muted)
        print("🔇 [GhostVoice] Muted: \(muted)")
    }

    @objc func toggleMute() {
        setMuted(!isMuted)
    }

    @objc func isMutedState() -> Bool {
        return isMuted
    }

    // ═══════════════════════════════════════
    // VOLUME CONTROL (DUCKING)
    // ═══════════════════════════════════════

    @objc func setVoiceVolume(_ volume: Float) {
        currentVolume = max(0.0, min(1.0, volume))
        delegate?.voiceVolumeChanged(volume: currentVolume)
        print("🔊 [GhostVoice] Volume: \(currentVolume)")
    }

    // ═══════════════════════════════════════
    // INTERRUPTION HANDLING
    // ═══════════════════════════════════════

    private func setupNotificationObservers() {
        let notificationCenter = NotificationCenter.default

        // Audio Session Interruption (Phone Calls, Siri, etc.)
        interruptionObserver = notificationCenter.addObserver(
            forName: AVAudioSession.interruptionNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleInterruption(notification)
        }

        // Route Change (Headphones plugged/unplugged)
        routeChangeObserver = notificationCenter.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            self?.handleRouteChange(notification)
        }

        print("✅ [GhostVoice] Notification observers registered")
    }

    private func removeNotificationObservers() {
        let notificationCenter = NotificationCenter.default

        if let observer = interruptionObserver {
            notificationCenter.removeObserver(observer)
        }
        if let observer = routeChangeObserver {
            notificationCenter.removeObserver(observer)
        }
    }

    /**
     * INTERRUPTION HANDLING
     * ═══════════════════════════════════════
     * Behandelt Phone Calls, Siri, etc.
     */
    private func handleInterruption(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }

        switch type {
        case .began:
            // ═══════════════════════════════════════
            // INTERRUPTION BEGAN (Phone Call Started)
            // ═══════════════════════════════════════
            print("⚠️ [GhostVoice] Interruption began (phone call?)")

            wasActiveBeforeInterrupt = isActive && !isMuted

            if wasActiveBeforeInterrupt {
                // Mute but keep connection
                setMuted(true)
                delegate?.voiceSessionInterrupted()
            }

        case .ended:
            // ═══════════════════════════════════════
            // INTERRUPTION ENDED (Phone Call Ended)
            // ═══════════════════════════════════════
            print("✅ [GhostVoice] Interruption ended")

            // Check if we should resume
            if let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)

                if options.contains(.shouldResume) && wasActiveBeforeInterrupt {
                    // Resume audio session
                    resumeAfterInterruption()
                }
            }

        @unknown default:
            break
        }
    }

    private func resumeAfterInterruption() {
        print("🔄 [GhostVoice] Resuming after interruption...")

        // Reconfigure and reactivate
        guard configureAudioSession() else {
            print("❌ [GhostVoice] Failed to resume after interruption")
            return
        }

        if wasActiveBeforeInterrupt {
            setMuted(false)
            delegate?.voiceSessionResumed()
        }

        wasActiveBeforeInterrupt = false
    }

    /**
     * ROUTE CHANGE HANDLING
     * ═══════════════════════════════════════
     * Behandelt Headphone Connect/Disconnect
     */
    private func handleRouteChange(_ notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }

        switch reason {
        case .newDeviceAvailable:
            print("🎧 [GhostVoice] New audio device connected")
            delegate?.audioRouteChanged(reason: "newDevice")

        case .oldDeviceUnavailable:
            print("🔌 [GhostVoice] Audio device disconnected")
            delegate?.audioRouteChanged(reason: "deviceRemoved")

            // Check if headphones were removed
            if let previousRoute = userInfo[AVAudioSessionRouteChangePreviousRouteKey] as? AVAudioSessionRouteDescription {
                for output in previousRoute.outputs {
                    if output.portType == .headphones || output.portType == .bluetoothA2DP {
                        // Headphones removed - might want to pause
                        print("⚠️ [GhostVoice] Headphones removed")
                    }
                }
            }

        case .categoryChange:
            print("🔄 [GhostVoice] Audio category changed")

        default:
            break
        }
    }

    // ═══════════════════════════════════════
    // STATE QUERIES
    // ═══════════════════════════════════════

    @objc func isVoiceActive() -> Bool {
        return isActive
    }

    @objc func getCurrentVolume() -> Float {
        return currentVolume
    }
}

// ═══════════════════════════════════════
// DELEGATE PROTOCOL
// ═══════════════════════════════════════

@objc protocol GhostVoiceDelegate: AnyObject {
    func voiceSessionDidStart()
    func voiceSessionDidStop()
    func voiceSessionDidFail(error: String)
    func voiceSessionInterrupted()
    func voiceSessionResumed()
    func voiceMuteStateChanged(isMuted: Bool)
    func voiceVolumeChanged(volume: Float)
    func audioRouteChanged(reason: String)
}
