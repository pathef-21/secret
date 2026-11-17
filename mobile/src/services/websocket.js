import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const DEFAULT_WS_URL = 'wss://man-ak-bae.onrender.com/ws/chat/';

export const WS_BASE_URL = process.env.EXPO_PUBLIC_WS_URL || DEFAULT_WS_URL;

class ChatWebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Set();
    this.isConnected = false;
    this.reconnectTimeout = null;
  }

  async connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const token = await SecureStore.getItemAsync('access_token');
      if (!token) return;

      const fullUrl = `${WS_BASE_URL}?token=${token}`;
      this.socket = new WebSocket(fullUrl);

      this.socket.onopen = () => {
        this.isConnected = true;
        this.notifyListeners({ type: 'connection_status', connected: true });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyListeners(data);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };

      this.socket.onerror = (error) => {
        console.warn('WebSocket error:', error.message);
      };

      this.socket.onclose = () => {
        this.isConnected = false;
        this.notifyListeners({ type: 'connection_status', connected: false });
        // Attempt reconnect after 3 seconds
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = setTimeout(() => this.connect(), 3000);
      };
    } catch (e) {
      console.warn('WebSocket connect failure:', e);
    }
  }

  disconnect() {
    clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnected = false;
  }

  send(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
      return true;
    }
    return false;
  }

  sendMessage(content, messageType = 'text', replyToId = null) {
    return this.send({
      action: 'send_message',
      content,
      message_type: messageType,
      reply_to: replyToId,
    });
  }

  sendTyping(isTyping) {
    return this.send({
      action: 'typing',
      is_typing: isTyping,
    });
  }

  sendReadReceipt() {
    return this.send({
      action: 'read',
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notifyListeners(data) {
    this.listeners.forEach((callback) => {
      try {
        callback(data);
      } catch (e) {
        console.error('Listener notification error:', e);
      }
    });
  }
}

export const chatWS = new ChatWebSocketService();
export default chatWS;

