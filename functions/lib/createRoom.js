"use strict";
/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * FLUID NEBULA - CREATE ROOM CLOUD FUNCTION
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Optimized room creation with:
 * - Smooth-Join: Auto-fusion with nearby rooms
 * - Ghost Mode: Founder bypass for GPS requirements
 * - Atomic Transactions: Prevents race conditions
 * - Edge-optimized distance calculation
 *
 * @version 13.0.0
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGhostRoom = exports.cleanupStaleRooms = exports.createRoom = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
// ═══════════════════════════════════════════════════════════════════════════════
// FOUNDER IDS
// ═══════════════════════════════════════════════════════════════════════════════
const FOUNDER_IDS = [
    'MIbamchs82Ve7y0ecX2TpPyymbw1', // Jan
];
function isFounder(uid) {
    return FOUNDER_IDS.includes(uid);
}
// ═══════════════════════════════════════════════════════════════════════════════
// DISTANCE CALCULATION (Haversine)
// ═══════════════════════════════════════════════════════════════════════════════
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
// ═══════════════════════════════════════════════════════════════════════════════
// SMOOTH-JOIN: Find nearby room for auto-fusion
// ═══════════════════════════════════════════════════════════════════════════════
async function findNearbyRoom(location, type, isAnonymous) {
    var _a;
    const MERGE_RADIUS = 100; // meters
    const roomsSnapshot = await db
        .collection('rooms')
        .where('isActive', '==', true)
        .where('type', '==', type)
        .where('isAnonymous', '==', isAnonymous)
        .get();
    for (const doc of roomsSnapshot.docs) {
        const data = doc.data();
        // Skip full rooms
        if ((((_a = data.participants) === null || _a === void 0 ? void 0 : _a.length) || 0) >= (data.maxParticipants || 8)) {
            continue;
        }
        // Skip rooms without location
        if (!data.location)
            continue;
        // Check distance
        const distance = calculateDistance(location.lat, location.lng, data.location.latitude, data.location.longitude);
        if (distance <= MERGE_RADIUS) {
            functions.logger.info(`[Smooth-Join] Found nearby room: ${doc.id} (${distance.toFixed(0)}m away)`);
            return doc;
        }
    }
    return null;
}
// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CLOUD FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════
exports.createRoom = functions
    .region('europe-west1') // Closer to German users
    .https.onCall(async (data, context) => {
    // Auth check
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Nicht eingeloggt');
    }
    const uid = context.auth.uid;
    const isFounderUser = isFounder(uid);
    // Validate request
    if (!data.name || data.name.trim().length === 0) {
        throw new functions.https.HttpsError('invalid-argument', 'Name erforderlich');
    }
    // Ghost mode validation
    if (data.isGhostMode && !isFounderUser) {
        throw new functions.https.HttpsError('permission-denied', 'Ghost-Modus nur für Founder');
    }
    // Location validation (unless ghost mode)
    if (!data.isGhostMode && !data.location) {
        functions.logger.warn(`[CreateRoom] No location provided by user ${uid}`);
        // We allow creation without location for now, but log it
    }
    try {
        // ═══════════════════════════════════════════════════════════════════
        // SMOOTH-JOIN: Check for nearby rooms first
        // ═══════════════════════════════════════════════════════════════════
        if (data.location && !data.isGhostMode) {
            const nearbyRoom = await findNearbyRoom(data.location, data.type, data.isAnonymous);
            if (nearbyRoom) {
                // Auto-join existing room instead of creating new
                const roomRef = nearbyRoom.ref;
                await db.runTransaction(async (transaction) => {
                    const roomSnap = await transaction.get(roomRef);
                    if (!roomSnap.exists) {
                        throw new Error('Room disappeared');
                    }
                    const roomData = roomSnap.data();
                    const participants = roomData.participants || [];
                    // Check if already in room
                    const alreadyIn = participants.some((p) => p.oderId === uid);
                    if (alreadyIn) {
                        return; // Already there, just return
                    }
                    // Check capacity again (in transaction)
                    if (participants.length >= (roomData.maxParticipants || 8)) {
                        throw new Error('Room became full');
                    }
                    // Add participant
                    const newParticipant = {
                        oderId: uid,
                        username: data.creatorUsername,
                        displayName: data.isAnonymous ? 'Wanderer' : data.creatorDisplayName,
                        isSpeaking: false,
                        isMuted: true,
                        isAnonymous: data.isAnonymous,
                        level: data.creatorLevel,
                        joinedAt: admin.firestore.Timestamp.now(),
                        lastActiveAt: admin.firestore.Timestamp.now(),
                        connectionState: 'connected',
                    };
                    transaction.update(roomRef, {
                        participants: [...participants, newParticipant],
                    });
                });
                functions.logger.info(`[Smooth-Join] User ${uid} merged into room ${nearbyRoom.id}`);
                return {
                    success: true,
                    roomId: nearbyRoom.id,
                    action: 'merged',
                    message: 'Du wurdest automatisch mit einem nahegelegenen Wölkchen verbunden!',
                };
            }
        }
        // ═══════════════════════════════════════════════════════════════════
        // CREATE NEW ROOM
        // ═══════════════════════════════════════════════════════════════════
        const roomData = {
            name: data.name.trim(),
            type: data.type,
            isAnonymous: data.isAnonymous,
            participants: [{
                    oderId: uid,
                    username: data.creatorUsername,
                    displayName: data.isAnonymous ? 'Wanderer' : data.creatorDisplayName,
                    isSpeaking: false,
                    isMuted: true,
                    isAnonymous: data.isAnonymous,
                    level: data.creatorLevel,
                    joinedAt: admin.firestore.Timestamp.now(),
                    lastActiveAt: admin.firestore.Timestamp.now(),
                    connectionState: 'connected',
                }],
            maxParticipants: 8,
            xpMultiplier: data.regionName ? 2 : 1,
            isActive: true,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            createdBy: uid,
            isGhostRoom: data.isGhostMode || false,
        };
        // Add location if provided
        if (data.location) {
            roomData.location = new admin.firestore.GeoPoint(data.location.lat, data.location.lng);
        }
        if (data.regionName) {
            roomData.regionName = data.regionName;
        }
        const docRef = await db.collection('rooms').add(roomData);
        functions.logger.info(`[CreateRoom] New room created: ${docRef.id} by ${uid}`);
        return {
            success: true,
            roomId: docRef.id,
            action: 'created',
            message: 'Wölkchen erfolgreich erstellt!',
        };
    }
    catch (error) {
        functions.logger.error('[CreateRoom] Error:', error);
        throw new functions.https.HttpsError('internal', error.message || 'Fehler beim Erstellen');
    }
});
// ═══════════════════════════════════════════════════════════════════════════════
// CLEANUP STALE ROOMS (Scheduled Function)
// ═══════════════════════════════════════════════════════════════════════════════
exports.cleanupStaleRooms = functions
    .region('europe-west1')
    .pubsub.schedule('every 5 minutes')
    .onRun(async () => {
    const STALE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const roomsSnapshot = await db
        .collection('rooms')
        .where('isActive', '==', true)
        .get();
    let deletedCount = 0;
    let cleanedCount = 0;
    for (const roomDoc of roomsSnapshot.docs) {
        const data = roomDoc.data();
        const participants = data.participants || [];
        // Filter out stale participants
        const activeParticipants = participants.filter((p) => {
            var _a, _b;
            const lastActive = ((_b = (_a = p.lastActiveAt) === null || _a === void 0 ? void 0 : _a.toMillis) === null || _b === void 0 ? void 0 : _b.call(_a)) || 0;
            return now - lastActive < STALE_THRESHOLD;
        });
        if (activeParticipants.length === 0) {
            // Delete empty room
            await roomDoc.ref.delete();
            deletedCount++;
            functions.logger.info(`[Cleanup] Deleted empty room: ${roomDoc.id}`);
        }
        else if (activeParticipants.length < participants.length) {
            // Update with only active participants
            await roomDoc.ref.update({ participants: activeParticipants });
            cleanedCount++;
            functions.logger.info(`[Cleanup] Cleaned ${participants.length - activeParticipants.length} stale participants from: ${roomDoc.id}`);
        }
    }
    functions.logger.info(`[Cleanup] Complete: ${deletedCount} rooms deleted, ${cleanedCount} rooms cleaned`);
    return null;
});
// ═══════════════════════════════════════════════════════════════════════════════
// GHOST ROOM CREATION (Founder Only)
// ═══════════════════════════════════════════════════════════════════════════════
exports.createGhostRoom = functions
    .region('europe-west1')
    .https.onCall(async (data, context) => {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Nicht eingeloggt');
    }
    const uid = context.auth.uid;
    if (!isFounder(uid)) {
        throw new functions.https.HttpsError('permission-denied', '👻 Ghost-Modus nur für Founder!');
    }
    functions.logger.info(`[GhostRoom] Founder ${uid} creating ghost room`);
    const roomData = {
        name: ((_a = data.name) === null || _a === void 0 ? void 0 : _a.trim()) || 'Ghost Wölkchen',
        type: data.type || 'public',
        isAnonymous: data.isAnonymous || false,
        participants: [{
                oderId: uid,
                username: data.creatorUsername || 'Founder',
                displayName: data.isAnonymous ? 'Wanderer' : (data.creatorDisplayName || 'Founder'),
                isSpeaking: false,
                isMuted: true,
                isAnonymous: data.isAnonymous || false,
                level: data.creatorLevel || 99,
                joinedAt: admin.firestore.Timestamp.now(),
                lastActiveAt: admin.firestore.Timestamp.now(),
                connectionState: 'connected',
            }],
        maxParticipants: 8,
        xpMultiplier: 3, // Ghost rooms have 3x XP!
        isActive: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        createdBy: uid,
        isGhostRoom: true,
    };
    const docRef = await db.collection('rooms').add(roomData);
    functions.logger.info(`[GhostRoom] Created: ${docRef.id}`);
    return {
        success: true,
        roomId: docRef.id,
        action: 'ghost_created',
        message: '👻 Ghost Wölkchen erstellt! (3x XP Bonus)',
    };
});
//# sourceMappingURL=createRoom.js.map