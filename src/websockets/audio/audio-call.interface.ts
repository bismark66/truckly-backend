/**
 * WebRTC Audio Call Signaling Interfaces
 * For driver-customer audio calls
 */

// RTCSessionDescription init structure
export interface RTCSessionDescriptionInit {
  type: 'offer' | 'answer';
  sdp: string;
}

// RTCIceCandidate init structure
export interface RTCIceCandidateInit {
  candidate: string;
  sdpMid?: string | null;
  sdpMLineIndex?: number | null;
  usernameFragment?: string | null;
}

// Active call session
export interface AudioCallSession {
  callerId: string;
  calleeId: string;
  offer: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  callerIceCandidates: RTCIceCandidateInit[];
  calleeIceCandidates: RTCIceCandidateInit[];
  status: 'pending' | 'accepted' | 'rejected' | 'ended';
  createdAt: string;
}
