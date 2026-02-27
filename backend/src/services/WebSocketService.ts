import WebSocket from 'ws';
import { WebSocketEvent, WebSocketMessage } from '@intent-platform/shared';
import { logger } from '../utils/logger';

export class WebSocketService {
  private static instance: WebSocketService;
  private connections: Map<string, Set<WebSocket>> = new Map();

  constructor() {
    if (WebSocketService.instance) {
      return WebSocketService.instance;
    }
    WebSocketService.instance = this;
  }

  addConnection(projectId: string, ws: WebSocket): void {
    if (!this.connections.has(projectId)) {
      this.connections.set(projectId, new Set());
    }

    this.connections.get(projectId)!.add(ws);

    logger.info(`WebSocket connection added for project ${projectId}`);

    ws.on('close', () => {
      this.removeConnection(projectId, ws);
    });
  }

  removeConnection(projectId: string, ws: WebSocket): void {
    const connections = this.connections.get(projectId);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(projectId);
      }
    }

    logger.info(`WebSocket connection removed for project ${projectId}`);
  }

  broadcast(projectId: string, event: WebSocketEvent, data: any): void {
    const connections = this.connections.get(projectId);
    if (!connections) {
      return;
    }

    const message: WebSocketMessage = {
      event,
      data,
      timestamp: new Date()
    };

    const messageStr = JSON.stringify(message);

    connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });

    logger.debug(`Broadcast ${event} to ${connections.size} connections for project ${projectId}`);
  }

  send(projectId: string, event: WebSocketEvent, data: any): void {
    this.broadcast(projectId, event, data);
  }
}
