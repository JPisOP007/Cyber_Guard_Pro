import { io } from "socket.io-client";
import { toast } from "react-toastify";

class WebSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.eventCallbacks = new Map();
  }

  connect(token) {
    if (this.socket?.connected) {
      return;
    }

    try {
      this.socket = io(
        process.env.REACT_APP_WS_URL ||
          "https://cyber-guard-pro-backend.onrender.com",
        {
          auth: {
            token: token,
          },
          transports: ["websocket", "polling"],
          timeout: 20000,
          forceNew: true,
        }
      );

      this.setupEventHandlers();
    } catch (error) {
      console.error("WebSocket connection error:", error);
      toast.error("Failed to establish real-time connection");
    }
  }

  setupEventHandlers() {
    this.socket.on("connect", () => {
      console.log("✅ WebSocket connected");
      this.isConnected = true;
      this.reconnectAttempts = 0;

      // Notify listeners
      this.emit("connection-status", { connected: true });
    });

    this.socket.on("disconnect", (reason) => {
      console.log("❌ WebSocket disconnected:", reason);
      this.isConnected = false;

      // Notify listeners
      this.emit("connection-status", { connected: false, reason });

      // Auto-reconnect for certain disconnect reasons
      if (reason === "io server disconnect") {
        // Server initiated disconnect, don't auto-reconnect
        return;
      }

      this.handleReconnection();
    });

    this.socket.on("connect_error", (error) => {
      console.error("❌ WebSocket connection error:", error);
      this.isConnected = false;

      // Notify listeners
      this.emit("connection-status", {
        connected: false,
        error: error.message,
      });

      this.handleReconnection();
    });

    // Handle real-time threat alerts
    this.socket.on("threat-alert", (data) => {
      console.log("🚨 New threat alert:", data);

      if (data.type === "new-threat") {
        toast.warn(`New Threat: ${data.data.title}`, {
          position: "top-right",
          autoClose: 8000,
        });
      }

      // Notify listeners
      this.emit("threat-alert", data);
    });

    // Handle vulnerability scan updates
    this.socket.on("scan-update", (data) => {
      console.log("🔍 Scan update:", data);
      this.emit("scan-update", data);
    });

    // Handle system notifications
    this.socket.on("system-notification", (data) => {
      console.log("📢 System notification:", data);

      if (data.type === "info") {
        toast.info(data.message);
      } else if (data.type === "warning") {
        toast.warn(data.message);
      } else if (data.type === "error") {
        toast.error(data.message);
      }

      this.emit("system-notification", data);
    });
  }

  handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("❌ Max reconnection attempts reached");
      toast.error("Lost connection to server. Please refresh the page.");
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);

    console.log(
      `🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(() => {
      if (!this.isConnected && this.socket) {
        this.socket.connect();
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error);
        }
      });
    }
  }

  // Send message to server
  send(event, data) {
    if (this.socket && this.isConnected) {
      this.socket.emit(event, data);
    } else {
      console.warn("Cannot send message: WebSocket not connected");
    }
  }

  // Get connection status
  getConnectionStatus() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
    };
  }
}

// Create singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;
