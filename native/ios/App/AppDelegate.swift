/**
 * DELULU APP DELEGATE (iOS)
 * ═══════════════════════════════════════════════════════════════
 * Main Application Delegate with Ghost Voice Integration
 *
 * BACKGROUND MODES REQUIRED (Info.plist):
 * - audio
 * - voip
 * - fetch
 * - remote-notification
 *
 * @author Delulu Engineering
 * @version 1.0.0
 */

import UIKit
import AVFoundation
import PushKit
import CallKit

@main
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    // ═══════════════════════════════════════
    // CALLKIT PROVIDER (für VoIP Push)
    // ═══════════════════════════════════════

    private var callKitProvider: CXProvider?
    private var voipRegistry: PKPushRegistry?

    // ═══════════════════════════════════════
    // APPLICATION LIFECYCLE
    // ═══════════════════════════════════════

    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
    ) -> Bool {

        print("🚀 [Delulu] Application launching...")

        // ═══════════════════════════════════════
        // 1. AUDIO SESSION PRE-CONFIGURATION
        // ═══════════════════════════════════════
        configureAudioSessionEarly()

        // ═══════════════════════════════════════
        // 2. CALLKIT SETUP (für echte Telefon-Integration)
        // ═══════════════════════════════════════
        setupCallKit()

        // ═══════════════════════════════════════
        // 3. VOIP PUSH REGISTRATION
        // ═══════════════════════════════════════
        setupVoIPPush()

        // ═══════════════════════════════════════
        // 4. BACKGROUND FETCH (optional)
        // ═══════════════════════════════════════
        UIApplication.shared.setMinimumBackgroundFetchInterval(
            UIApplication.backgroundFetchIntervalMinimum
        )

        print("✅ [Delulu] Application configured successfully")

        return true
    }

    // ═══════════════════════════════════════
    // AUDIO SESSION EARLY CONFIG
    // Muss VOR dem ersten Audio-Zugriff passieren
    // ═══════════════════════════════════════

    private func configureAudioSessionEarly() {
        let session = AVAudioSession.sharedInstance()

        do {
            // Set category even before voice starts
            // This "claims" the audio route early
            try session.setCategory(
                .playAndRecord,
                mode: .voiceChat,
                options: [
                    .mixWithOthers,
                    .allowBluetooth,
                    .allowBluetoothA2DP,
                    .defaultToSpeaker
                ]
            )

            print("✅ [Delulu] Early audio session configured")

        } catch {
            print("⚠️ [Delulu] Early audio config failed: \(error)")
        }
    }

    // ═══════════════════════════════════════
    // CALLKIT SETUP
    // Erlaubt native Telefon-Integration
    // ═══════════════════════════════════════

    private func setupCallKit() {
        let config = CXProviderConfiguration()
        config.supportsVideo = false
        config.maximumCallsPerCallGroup = 1
        config.supportedHandleTypes = [.generic]
        config.iconTemplateImageData = UIImage(named: "CallKitIcon")?.pngData()
        config.ringtoneSound = "delulu_ring.caf"

        callKitProvider = CXProvider(configuration: config)
        callKitProvider?.setDelegate(self, queue: .main)

        print("✅ [Delulu] CallKit configured")
    }

    // ═══════════════════════════════════════
    // VOIP PUSH SETUP
    // Weckt die App für eingehende Calls
    // ═══════════════════════════════════════

    private func setupVoIPPush() {
        voipRegistry = PKPushRegistry(queue: .main)
        voipRegistry?.delegate = self
        voipRegistry?.desiredPushTypes = [.voIP]

        print("✅ [Delulu] VoIP Push registered")
    }

    // ═══════════════════════════════════════
    // BACKGROUND FETCH
    // ═══════════════════════════════════════

    func application(
        _ application: UIApplication,
        performFetchWithCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        // Background sync logic here
        completionHandler(.noData)
    }

    // ═══════════════════════════════════════
    // APP STATE CHANGES
    // ═══════════════════════════════════════

    func applicationDidEnterBackground(_ application: UIApplication) {
        print("📱 [Delulu] Entered background")

        // Keep audio session active if voice is running
        if GhostVoiceEngine.shared.isVoiceActive() {
            // Start background task to keep alive
            beginBackgroundTask()
        }
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        print("📱 [Delulu] Will enter foreground")

        // Resume voice if it was active
        if GhostVoiceEngine.shared.isVoiceActive() {
            _ = GhostVoiceEngine.shared.configureAudioSession()
        }
    }

    // ═══════════════════════════════════════
    // BACKGROUND TASK
    // Hält die App am Leben
    // ═══════════════════════════════════════

    private var backgroundTaskId: UIBackgroundTaskIdentifier = .invalid

    private func beginBackgroundTask() {
        backgroundTaskId = UIApplication.shared.beginBackgroundTask(withName: "GhostVoice") {
            // Cleanup wenn Zeit abläuft
            self.endBackgroundTask()
        }

        print("🔄 [Delulu] Background task started: \(backgroundTaskId)")
    }

    private func endBackgroundTask() {
        if backgroundTaskId != .invalid {
            UIApplication.shared.endBackgroundTask(backgroundTaskId)
            backgroundTaskId = .invalid
            print("🔄 [Delulu] Background task ended")
        }
    }
}

// ═══════════════════════════════════════
// CALLKIT PROVIDER DELEGATE
// ═══════════════════════════════════════

extension AppDelegate: CXProviderDelegate {

    func providerDidReset(_ provider: CXProvider) {
        print("📞 [CallKit] Provider reset")
    }

    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        // Outgoing call
        print("📞 [CallKit] Start call action")

        // Configure audio session for call
        _ = GhostVoiceEngine.shared.configureAudioSession()

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        // Incoming call answered
        print("📞 [CallKit] Answer call action")

        _ = GhostVoiceEngine.shared.configureAudioSession()
        GhostVoiceEngine.shared.startVoiceSession()

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        // Call ended
        print("📞 [CallKit] End call action")

        GhostVoiceEngine.shared.stopVoiceSession()

        action.fulfill()
    }

    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        // Mute toggled
        print("📞 [CallKit] Mute action: \(action.isMuted)")

        GhostVoiceEngine.shared.setMuted(action.isMuted)

        action.fulfill()
    }

    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        print("📞 [CallKit] Audio session activated")
    }

    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        print("📞 [CallKit] Audio session deactivated")
    }
}

// ═══════════════════════════════════════
// VOIP PUSH DELEGATE
// ═══════════════════════════════════════

extension AppDelegate: PKPushRegistryDelegate {

    func pushRegistry(
        _ registry: PKPushRegistry,
        didUpdate pushCredentials: PKPushCredentials,
        for type: PKPushType
    ) {
        let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
        print("📱 [VoIP] Push token: \(token)")

        // Send token to your server
        // DeluluAPI.registerVoIPToken(token)
    }

    func pushRegistry(
        _ registry: PKPushRegistry,
        didReceiveIncomingPushWith payload: PKPushPayload,
        for type: PKPushType,
        completion: @escaping () -> Void
    ) {
        print("📱 [VoIP] Incoming push received")

        // Parse payload
        guard let callerName = payload.dictionaryPayload["callerName"] as? String,
              let callId = payload.dictionaryPayload["callId"] as? String else {
            completion()
            return
        }

        // Report incoming call to CallKit
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerName)
        update.localizedCallerName = callerName
        update.hasVideo = false

        let uuid = UUID(uuidString: callId) ?? UUID()

        callKitProvider?.reportNewIncomingCall(with: uuid, update: update) { error in
            if let error = error {
                print("❌ [VoIP] Failed to report call: \(error)")
            } else {
                print("✅ [VoIP] Incoming call reported")
            }
            completion()
        }
    }
}
