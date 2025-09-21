import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [threatAlerts, setThreatAlerts] = useState([]);
  const [scanUpdates, setScanUpdates] = useState([]);
  const { user, token } = useAuth();

  useEffect(() => {
    if (user && token) {
      // Initialize socket connection
      const newSocket = io(process.env.REACT_APP_SERVER_URL || 'http://localhost:5000', {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setConnected(true);
        toast.success('Real-time monitoring connected');
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          newSocket.connect();
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        setConnected(false);
        toast.error('Failed to connect to real-time monitoring');
      });

      // Threat monitoring events
      newSocket.on('threat_alert', (data) => {
        console.log('New threat alert:', data);
        setThreatAlerts(prev => [data, ...prev.slice(0, 99)]); // Keep last 100 alerts
        
        // Show notification for high/critical threats
        if (data.severity >= 7) {
          toast.error(`Critical Threat: ${data.title}`, {
            autoClose: 8000,
            position: 'top-center'
          });
        } else if (data.severity >= 5) {
          toast.warning(`High Threat: ${data.title}`, {
            autoClose: 6000
          });
        }
      });

      // Vulnerability scan events
      newSocket.on('scan_started', (data) => {
        console.log('Scan started:', data);
        setScanUpdates(prev => [
          { ...data, type: 'started', timestamp: new Date() }, 
          ...prev.slice(0, 49)
        ]);
        toast.info(`Vulnerability scan started: ${data.targets?.[0] || data.target}`);
      });

      newSocket.on('scan_progress', (data) => {
        console.log('Scan progress:', data);
        setScanUpdates(prev => prev.map(update => 
          update.scanId === data.scanId 
            ? { ...update, progress: data.progress, status: data.status, timestamp: data.timestamp }
            : update
        ));
      });

      newSocket.on('scan_completed', (data) => {
        console.log('Scan completed:', data);
        setScanUpdates(prev => prev.map(update => 
          update.scanId === data.scanId 
            ? { ...update, type: 'completed', status: 'completed', results: data.results, timestamp: data.timestamp }
            : update
        ));
        
        const vulnerabilityCount = data.results?.vulnerabilities || 0;
        if (vulnerabilityCount > 0) {
          toast.success(`Scan completed: ${vulnerabilityCount} vulnerabilities found`);
        } else {
          toast.success('Scan completed: No vulnerabilities found');
        }
      });

      newSocket.on('scan_failed', (data) => {
        console.log('Scan failed:', data);
        setScanUpdates(prev => prev.map(update => 
          update.scanId === data.scanId 
            ? { ...update, type: 'failed', status: 'failed', error: data.error, timestamp: data.timestamp }
            : update
        ));
        toast.error(`Scan failed: ${data.error}`);
      });

      // Dashboard updates from scan completion
      newSocket.on('dashboard:scan-completed', (data) => {
        console.log('Dashboard scan update:', data);
        toast.info('Dashboard updated with scan results');
      });

      // Security profile updates
      newSocket.on('security_score_updated', (data) => {
        console.log('Security score updated:', data);
        if (data.newScore && typeof data.newScore === 'number') {
          toast.info(`Security score updated: ${data.newScore}`);
        } else if (data.newScore && data.newScore.overall) {
          toast.info(`Security score updated: ${data.newScore.overall}`);
        }
      });

      // Educational progress updates
      newSocket.on('achievement_unlocked', (data) => {
        console.log('Achievement unlocked:', data);
        toast.success(`🏆 Achievement unlocked: ${data.title}`, {
          autoClose: 8000
        });
      });

      // System notifications
      newSocket.on('system_notification', (data) => {
        console.log('System notification:', data);
        switch (data.type) {
          case 'info':
            toast.info(data.message);
            break;
          case 'warning':
            toast.warning(data.message);
            break;
          case 'error':
            toast.error(data.message);
            break;
          default:
            toast(data.message);
        }
      });

      setSocket(newSocket);

      // Cleanup on unmount
      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
        setSocket(null);
        setConnected(false);
        setThreatAlerts([]);
        setScanUpdates([]);
      };
    }
  }, [user, token]);

  // Socket event emitters
  const startVulnerabilityScan = (target, options = {}) => {
    if (socket && connected) {
      socket.emit('start_vulnerability_scan', { target, options });
      return true;
    }
    toast.error('Not connected to real-time monitoring');
    return false;
  };

  const stopVulnerabilityScan = (scanId) => {
    if (socket && connected) {
      socket.emit('stop_vulnerability_scan', { scanId });
      return true;
    }
    return false;
  };

  const requestThreatUpdate = () => {
    if (socket && connected) {
      socket.emit('request_threat_update');
      return true;
    }
    return false;
  };

  const markThreatAsRead = (threatId) => {
    if (socket && connected) {
      socket.emit('mark_threat_read', { threatId });
      setThreatAlerts(prev => 
        prev.map(alert => 
          alert.id === threatId ? { ...alert, read: true } : alert
        )
      );
      return true;
    }
    return false;
  };

  const joinRoom = (roomName) => {
    if (socket && connected) {
      socket.emit('join_room', roomName);
      console.log(`Joined room: ${roomName}`);
    }
  };

  const leaveRoom = (roomName) => {
    if (socket && connected) {
      socket.emit('leave_room', roomName);
      console.log(`Left room: ${roomName}`);
    }
  };

  // Clear alerts and updates
  const clearThreatAlerts = () => setThreatAlerts([]);
  const clearScanUpdates = () => setScanUpdates([]);

  const value = {
    socket,
    connected,
    threatAlerts,
    scanUpdates,
    startVulnerabilityScan,
    stopVulnerabilityScan,
    requestThreatUpdate,
    markThreatAsRead,
    joinRoom,
    leaveRoom,
    clearThreatAlerts,
    clearScanUpdates
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};