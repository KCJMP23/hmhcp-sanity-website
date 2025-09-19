/**
 * WebRTC Manager for Peer-to-Peer Communication
 * 
 * Enables direct peer-to-peer communication for healthcare collaboration
 * Supports video, audio, and data channels with HIPAA compliance
 */

import { logger } from '@/lib/logger'
import { wsCompression } from './websocket-compression'

export interface RTCConfiguration {
  iceServers: RTCIceServer[]
  enableVideo: boolean
  enableAudio: boolean
  enableDataChannel: boolean
  videoConstraints?: MediaStreamConstraints['video']
  audioConstraints?: MediaStreamConstraints['audio']
  hipaaCompliant: boolean
}

export interface PeerConnection {
  peerId: string
  connection: RTCPeerConnection
  dataChannel?: RTCDataChannel
  localStream?: MediaStream
  remoteStream?: MediaStream
  connectionState: RTCPeerConnectionState
  iceConnectionState: RTCIceConnectionState
  signalingState: RTCSignalingState
  stats: PeerConnectionStats
}

export interface PeerConnectionStats {
  bytesReceived: number
  bytesSent: number
  packetsLost: number
  roundTripTime: number
  jitter: number
  videoWidth?: number
  videoHeight?: number
  audioLevel?: number
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'disconnect'
  from: string
  to: string
  data: any
  timestamp: Date
}

export class WebRTCManager {
  private configuration: RTCConfiguration
  private peers: Map<string, PeerConnection> = new Map()
  private localStream: MediaStream | null = null
  private signalingCallback: ((message: SignalingMessage) => void) | null = null
  private eventHandlers: Map<string, Function[]> = new Map()
  private statsInterval: NodeJS.Timeout | null = null
  private encryptionKey: CryptoKey | null = null

  constructor(config: Partial<RTCConfiguration> = {}) {
    this.configuration = {
      iceServers: config.iceServers || [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ],
      enableVideo: config.enableVideo !== false,
      enableAudio: config.enableAudio !== false,
      enableDataChannel: config.enableDataChannel !== false,
      videoConstraints: config.videoConstraints || {
        width: { min: 640, ideal: 1280, max: 1920 },
        height: { min: 480, ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 60 }
      },
      audioConstraints: config.audioConstraints || {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      hipaaCompliant: config.hipaaCompliant !== false
    }

    if (this.configuration.hipaaCompliant) {
      this.initializeEncryption()
    }

    this.startStatsCollection()
  }

  /**
   * Initialize encryption for HIPAA compliance
   */
  private async initializeEncryption(): Promise<void> {
    try {
      this.encryptionKey = await crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
      )
      logger.info('WebRTC encryption initialized for HIPAA compliance')
    } catch (error) {
      logger.error('Failed to initialize WebRTC encryption', { error })
    }
  }

  /**
   * Initialize local media stream
   */
  async initializeLocalStream(): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {}
      
      if (this.configuration.enableVideo) {
        constraints.video = this.configuration.videoConstraints
      }
      
      if (this.configuration.enableAudio) {
        constraints.audio = this.configuration.audioConstraints
      }

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints)
      
      logger.info('Local media stream initialized', {
        videoTracks: this.localStream.getVideoTracks().length,
        audioTracks: this.localStream.getAudioTracks().length
      })

      this.emit('localStreamReady', this.localStream)
      
      return this.localStream
    } catch (error) {
      logger.error('Failed to initialize local stream', { error })
      throw error
    }
  }

  /**
   * Create a peer connection
   */
  async createPeerConnection(peerId: string, isInitiator: boolean = false): Promise<PeerConnection> {
    try {
      // Check if connection already exists
      if (this.peers.has(peerId)) {
        logger.warn('Peer connection already exists', { peerId })
        return this.peers.get(peerId)!
      }

      const connection = new RTCPeerConnection({
        iceServers: this.configuration.iceServers,
        iceTransportPolicy: 'all',
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
      })

      const peer: PeerConnection = {
        peerId,
        connection,
        connectionState: connection.connectionState,
        iceConnectionState: connection.iceConnectionState,
        signalingState: connection.signalingState,
        stats: {
          bytesReceived: 0,
          bytesSent: 0,
          packetsLost: 0,
          roundTripTime: 0,
          jitter: 0
        }
      }

      // Add local stream if available
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          connection.addTrack(track, this.localStream!)
        })
        peer.localStream = this.localStream
      }

      // Set up data channel
      if (this.configuration.enableDataChannel && isInitiator) {
        const dataChannel = connection.createDataChannel('data', {
          ordered: true,
          maxRetransmits: 3
        })
        
        this.setupDataChannel(dataChannel, peer)
        peer.dataChannel = dataChannel
      }

      // Set up event handlers
      this.setupPeerConnectionHandlers(connection, peer)

      this.peers.set(peerId, peer)
      
      logger.info('Peer connection created', { peerId, isInitiator })
      
      return peer
    } catch (error) {
      logger.error('Failed to create peer connection', { peerId, error })
      throw error
    }
  }

  /**
   * Set up peer connection event handlers
   */
  private setupPeerConnectionHandlers(connection: RTCPeerConnection, peer: PeerConnection): void {
    // ICE candidate handler
    connection.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          from: 'self',
          to: peer.peerId,
          data: event.candidate,
          timestamp: new Date()
        })
      }
    }

    // Track handler for remote streams
    connection.ontrack = (event) => {
      logger.info('Remote track received', { 
        peerId: peer.peerId,
        kind: event.track.kind 
      })
      
      if (!peer.remoteStream) {
        peer.remoteStream = new MediaStream()
      }
      
      peer.remoteStream.addTrack(event.track)
      this.emit('remoteStreamReady', { peerId: peer.peerId, stream: peer.remoteStream })
    }

    // Data channel handler
    connection.ondatachannel = (event) => {
      logger.info('Data channel received', { peerId: peer.peerId })
      this.setupDataChannel(event.channel, peer)
      peer.dataChannel = event.channel
    }

    // Connection state changes
    connection.onconnectionstatechange = () => {
      peer.connectionState = connection.connectionState
      logger.info('Connection state changed', { 
        peerId: peer.peerId,
        state: connection.connectionState 
      })
      
      this.emit('connectionStateChange', { 
        peerId: peer.peerId,
        state: connection.connectionState 
      })

      if (connection.connectionState === 'failed' || connection.connectionState === 'disconnected') {
        this.handlePeerDisconnection(peer.peerId)
      }
    }

    // ICE connection state changes
    connection.oniceconnectionstatechange = () => {
      peer.iceConnectionState = connection.iceConnectionState
      logger.info('ICE connection state changed', { 
        peerId: peer.peerId,
        state: connection.iceConnectionState 
      })
    }

    // Signaling state changes
    connection.onsignalingstatechange = () => {
      peer.signalingState = connection.signalingState
      logger.debug('Signaling state changed', { 
        peerId: peer.peerId,
        state: connection.signalingState 
      })
    }
  }

  /**
   * Set up data channel handlers
   */
  private setupDataChannel(channel: RTCDataChannel, peer: PeerConnection): void {
    channel.onopen = () => {
      logger.info('Data channel opened', { peerId: peer.peerId })
      this.emit('dataChannelOpen', { peerId: peer.peerId })
    }

    channel.onclose = () => {
      logger.info('Data channel closed', { peerId: peer.peerId })
      this.emit('dataChannelClose', { peerId: peer.peerId })
    }

    channel.onerror = (error) => {
      logger.error('Data channel error', { peerId: peer.peerId, error })
      this.emit('dataChannelError', { peerId: peer.peerId, error })
    }

    channel.onmessage = async (event) => {
      try {
        // Decompress if needed
        const data = await this.processIncomingData(event.data)
        
        this.emit('dataChannelMessage', { 
          peerId: peer.peerId,
          data 
        })

        // Update stats
        peer.stats.bytesReceived += event.data.length || 0
      } catch (error) {
        logger.error('Failed to process data channel message', { error })
      }
    }
  }

  /**
   * Create and send offer
   */
  async createOffer(peerId: string): Promise<RTCSessionDescriptionInit> {
    try {
      const peer = await this.createPeerConnection(peerId, true)
      const offer = await peer.connection.createOffer({
        offerToReceiveVideo: this.configuration.enableVideo,
        offerToReceiveAudio: this.configuration.enableAudio
      })
      
      await peer.connection.setLocalDescription(offer)
      
      this.sendSignalingMessage({
        type: 'offer',
        from: 'self',
        to: peerId,
        data: offer,
        timestamp: new Date()
      })
      
      logger.info('Offer created and sent', { peerId })
      
      return offer
    } catch (error) {
      logger.error('Failed to create offer', { peerId, error })
      throw error
    }
  }

  /**
   * Handle incoming offer
   */
  async handleOffer(peerId: string, offer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peer = await this.createPeerConnection(peerId, false)
      
      await peer.connection.setRemoteDescription(offer)
      
      const answer = await peer.connection.createAnswer()
      await peer.connection.setLocalDescription(answer)
      
      this.sendSignalingMessage({
        type: 'answer',
        from: 'self',
        to: peerId,
        data: answer,
        timestamp: new Date()
      })
      
      logger.info('Offer handled and answer sent', { peerId })
    } catch (error) {
      logger.error('Failed to handle offer', { peerId, error })
      throw error
    }
  }

  /**
   * Handle incoming answer
   */
  async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      const peer = this.peers.get(peerId)
      if (!peer) {
        throw new Error(`No peer connection found for ${peerId}`)
      }
      
      await peer.connection.setRemoteDescription(answer)
      
      logger.info('Answer handled', { peerId })
    } catch (error) {
      logger.error('Failed to handle answer', { peerId, error })
      throw error
    }
  }

  /**
   * Handle incoming ICE candidate
   */
  async handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit): Promise<void> {
    try {
      const peer = this.peers.get(peerId)
      if (!peer) {
        logger.warn('No peer connection found for ICE candidate', { peerId })
        return
      }
      
      await peer.connection.addIceCandidate(candidate)
      
      logger.debug('ICE candidate added', { peerId })
    } catch (error) {
      logger.error('Failed to add ICE candidate', { peerId, error })
    }
  }

  /**
   * Send data through data channel
   */
  async sendData(peerId: string, data: any): Promise<void> {
    try {
      const peer = this.peers.get(peerId)
      if (!peer || !peer.dataChannel || peer.dataChannel.readyState !== 'open') {
        throw new Error(`Data channel not available for ${peerId}`)
      }

      // Process data for sending (compress if needed)
      const processedData = await this.processOutgoingData(data)
      
      peer.dataChannel.send(processedData)
      
      // Update stats
      peer.stats.bytesSent += processedData.length || 0
      
      logger.debug('Data sent through data channel', { peerId, size: processedData.length })
    } catch (error) {
      logger.error('Failed to send data', { peerId, error })
      throw error
    }
  }

  /**
   * Process outgoing data (compress, encrypt if needed)
   */
  private async processOutgoingData(data: any): Promise<string> {
    let processedData = typeof data === 'string' ? data : JSON.stringify(data)
    
    // Compress if large enough
    const compressed = await wsCompression.compress(processedData)
    if (compressed.compressed) {
      processedData = JSON.stringify(compressed)
    }

    // Encrypt if HIPAA compliant
    if (this.configuration.hipaaCompliant && this.encryptionKey) {
      processedData = await this.encryptData(processedData)
    }

    return processedData
  }

  /**
   * Process incoming data (decrypt, decompress if needed)
   */
  private async processIncomingData(data: string): Promise<any> {
    let processedData = data

    // Decrypt if HIPAA compliant
    if (this.configuration.hipaaCompliant && this.encryptionKey) {
      processedData = await this.decryptData(processedData)
    }

    // Check if compressed
    try {
      const parsed = JSON.parse(processedData)
      if (parsed.compressed) {
        return await wsCompression.decompress(parsed)
      }
      return parsed
    } catch {
      return processedData
    }
  }

  /**
   * Encrypt data for HIPAA compliance
   */
  private async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) return data

    try {
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(data)
      
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encryptedBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedBuffer), iv.length)

      // Convert to base64
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      logger.error('Encryption failed', { error })
      return data
    }
  }

  /**
   * Decrypt data for HIPAA compliance
   */
  private async decryptData(data: string): Promise<string> {
    if (!this.encryptionKey) return data

    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(data), c => c.charCodeAt(0))
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12)
      const encryptedBuffer = combined.slice(12)

      const decryptedBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encryptedBuffer
      )

      const decoder = new TextDecoder()
      return decoder.decode(decryptedBuffer)
    } catch (error) {
      logger.error('Decryption failed', { error })
      return data
    }
  }

  /**
   * Disconnect from a peer
   */
  disconnectPeer(peerId: string): void {
    const peer = this.peers.get(peerId)
    if (!peer) return

    try {
      // Close data channel
      if (peer.dataChannel) {
        peer.dataChannel.close()
      }

      // Stop tracks
      if (peer.localStream) {
        peer.localStream.getTracks().forEach(track => track.stop())
      }

      // Close connection
      peer.connection.close()

      // Remove from peers
      this.peers.delete(peerId)

      // Send disconnect signal
      this.sendSignalingMessage({
        type: 'disconnect',
        from: 'self',
        to: peerId,
        data: null,
        timestamp: new Date()
      })

      logger.info('Disconnected from peer', { peerId })
      
      this.emit('peerDisconnected', { peerId })
    } catch (error) {
      logger.error('Error disconnecting peer', { peerId, error })
    }
  }

  /**
   * Handle peer disconnection
   */
  private handlePeerDisconnection(peerId: string): void {
    this.disconnectPeer(peerId)
  }

  /**
   * Disconnect all peers
   */
  disconnectAll(): void {
    this.peers.forEach((_, peerId) => {
      this.disconnectPeer(peerId)
    })
  }

  /**
   * Start collecting connection statistics
   */
  private startStatsCollection(): void {
    this.statsInterval = setInterval(async () => {
      for (const [peerId, peer] of this.peers) {
        try {
          const stats = await peer.connection.getStats()
          this.processStats(stats, peer)
        } catch (error) {
          logger.error('Failed to collect stats', { peerId, error })
        }
      }
    }, 5000) // Collect every 5 seconds
  }

  /**
   * Process WebRTC statistics
   */
  private processStats(stats: RTCStatsReport, peer: PeerConnection): void {
    stats.forEach(report => {
      if (report.type === 'inbound-rtp') {
        peer.stats.bytesReceived = report.bytesReceived || 0
        peer.stats.packetsLost = report.packetsLost || 0
        peer.stats.jitter = report.jitter || 0
        
        if (report.kind === 'video') {
          peer.stats.videoWidth = report.frameWidth
          peer.stats.videoHeight = report.frameHeight
        }
      } else if (report.type === 'outbound-rtp') {
        peer.stats.bytesSent = report.bytesSent || 0
      } else if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        peer.stats.roundTripTime = report.currentRoundTripTime || 0
      }
    })
  }

  /**
   * Get connection statistics
   */
  getStats(peerId?: string): PeerConnectionStats | Map<string, PeerConnectionStats> {
    if (peerId) {
      const peer = this.peers.get(peerId)
      return peer ? peer.stats : {
        bytesReceived: 0,
        bytesSent: 0,
        packetsLost: 0,
        roundTripTime: 0,
        jitter: 0
      }
    }

    const allStats = new Map<string, PeerConnectionStats>()
    this.peers.forEach((peer, id) => {
      allStats.set(id, peer.stats)
    })
    return allStats
  }

  /**
   * Set signaling callback
   */
  setSignalingCallback(callback: (message: SignalingMessage) => void): void {
    this.signalingCallback = callback
  }

  /**
   * Send signaling message
   */
  private sendSignalingMessage(message: SignalingMessage): void {
    if (this.signalingCallback) {
      this.signalingCallback(message)
    } else {
      logger.warn('No signaling callback set', { message })
    }
  }

  /**
   * Event emitter functionality
   */
  private emit(event: string, data?: any): void {
    const handlers = this.eventHandlers.get(event) || []
    handlers.forEach(handler => {
      try {
        handler(data)
      } catch (error) {
        logger.error('Event handler error', { event, error })
      }
    })
  }

  /**
   * Add event listener
   */
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, [])
    }
    this.eventHandlers.get(event)!.push(handler)
  }

  /**
   * Remove event listener
   */
  off(event: string, handler: Function): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    // Stop stats collection
    if (this.statsInterval) {
      clearInterval(this.statsInterval)
      this.statsInterval = null
    }

    // Disconnect all peers
    this.disconnectAll()

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop())
      this.localStream = null
    }

    // Clear event handlers
    this.eventHandlers.clear()

    logger.info('WebRTC manager destroyed')
  }
}

// Export singleton for easy use
export const webRTCManager = new WebRTCManager()

// Export types
export type { RTCConfiguration, PeerConnection, SignalingMessage, PeerConnectionStats }