import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import {
  AudioCallSession,
  RTCSessionDescriptionInit,
  RTCIceCandidateInit,
} from './audio-call.interface';

/**
 * WebRTC Audio Call Signaling Gateway
 * Handles signaling for peer-to-peer audio calls between drivers and customers
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
})
@Injectable()
export class AudioCallGateway {
  @WebSocketServer()
  server: Server;

  // Active call sessions (in production, consider using Redis for persistence)
  private activeCalls: Map<string, AudioCallSession> = new Map();

  /**
   * Generate a unique call ID from caller and callee IDs
   */
  private getCallId(callerId: string, calleeId: string): string {
    return [callerId, calleeId].sort().join('-');
  }

  /**
   * Find an active call involving a socket ID
   */
  private findCallBySocketId(socketId: string): AudioCallSession | undefined {
    for (const call of this.activeCalls.values()) {
      if (call.callerId === socketId || call.calleeId === socketId) {
        return call;
      }
    }
    return undefined;
  }

  /**
   * Initiate an audio call to another user
   * Client emits: { to: string, offer: RTCSessionDescriptionInit }
   */
  @SubscribeMessage('callUser')
  handleCallUser(
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[AudioCall] ${client.id} calling ${data.to}`);

    const callId = this.getCallId(client.id, data.to);

    // Create new call session
    const callSession: AudioCallSession = {
      callerId: client.id,
      calleeId: data.to,
      offer: data.offer,
      callerIceCandidates: [],
      calleeIceCandidates: [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.activeCalls.set(callId, callSession);

    // Notify the callee of incoming call
    this.server.to(data.to).emit('incomingCall', {
      from: client.id,
      offer: data.offer,
    });

    return { event: 'callInitiated', data: { to: data.to } };
  }

  /**
   * Answer an incoming call
   * Client emits: { to: string, answer: RTCSessionDescriptionInit }
   */
  @SubscribeMessage('answerCall')
  handleAnswerCall(
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[AudioCall] ${client.id} answered call from ${data.to}`);

    const callId = this.getCallId(client.id, data.to);
    const callSession = this.activeCalls.get(callId);

    if (!callSession) {
      return { event: 'error', data: { message: 'Call not found' } };
    }

    // Update call session with answer
    callSession.answer = data.answer;
    callSession.status = 'accepted';

    // Send any pending ICE candidates from caller to callee
    if (callSession.callerIceCandidates.length > 0) {
      this.server.to(client.id).emit('existingIceCandidates', {
        candidates: callSession.callerIceCandidates,
      });
    }

    // Notify the caller that call was answered
    this.server.to(data.to).emit('callAnswered', {
      from: client.id,
      answer: data.answer,
    });

    // Send any pending ICE candidates from callee to caller
    if (callSession.calleeIceCandidates.length > 0) {
      this.server.to(data.to).emit('existingIceCandidates', {
        candidates: callSession.calleeIceCandidates,
      });
    }

    return { event: 'answerSent', data: { to: data.to } };
  }

  /**
   * Reject an incoming call
   * Client emits: { to: string }
   */
  @SubscribeMessage('rejectCall')
  handleRejectCall(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[AudioCall] ${client.id} rejected call from ${data.to}`);

    const callId = this.getCallId(client.id, data.to);
    const callSession = this.activeCalls.get(callId);

    if (callSession) {
      callSession.status = 'rejected';
      this.activeCalls.delete(callId);
    }

    // Notify the caller that call was rejected
    this.server.to(data.to).emit('callRejected', {
      from: client.id,
    });

    return { event: 'callRejected', data: { to: data.to } };
  }

  /**
   * Send ICE candidate to peer
   * Client emits: { to: string, candidate: RTCIceCandidateInit }
   */
  @SubscribeMessage('iceCandidate')
  handleIceCandidate(
    @MessageBody() data: { to: string; candidate: RTCIceCandidateInit },
    @ConnectedSocket() client: Socket,
  ) {
    const callId = this.getCallId(client.id, data.to);
    const callSession = this.activeCalls.get(callId);

    if (callSession) {
      // Store the ICE candidate in the appropriate array
      if (client.id === callSession.callerId) {
        callSession.callerIceCandidates.push(data.candidate);
      } else {
        callSession.calleeIceCandidates.push(data.candidate);
      }
    }

    // Forward the ICE candidate to the peer
    this.server.to(data.to).emit('newIceCandidate', {
      from: client.id,
      candidate: data.candidate,
    });

    return { event: 'iceCandidateSent' };
  }

  /**
   * End an active call
   * Client emits: { to: string }
   */
  @SubscribeMessage('endCall')
  handleEndCall(
    @MessageBody() data: { to: string },
    @ConnectedSocket() client: Socket,
  ) {
    console.log(`[AudioCall] ${client.id} ended call with ${data.to}`);

    const callId = this.getCallId(client.id, data.to);
    this.activeCalls.delete(callId);

    // Notify the peer that call ended
    this.server.to(data.to).emit('callEnded', {
      from: client.id,
    });

    return { event: 'callEnded', data: { to: data.to } };
  }

  /**
   * Handle client disconnect - clean up any active calls
   */
  handleDisconnect(client: Socket) {
    const call = this.findCallBySocketId(client.id);
    if (call) {
      const peerId =
        call.callerId === client.id ? call.calleeId : call.callerId;
      this.server.to(peerId).emit('callEnded', {
        from: client.id,
        reason: 'disconnected',
      });

      const callId = this.getCallId(call.callerId, call.calleeId);
      this.activeCalls.delete(callId);
    }
  }
}
