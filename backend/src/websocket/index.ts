import { Application } from 'express-ws';
import WebSocket from 'ws';
import { WebSocketService } from '../services/WebSocketService';
import { logger } from '../utils/logger';

const wsService = new WebSocketService();

export function setupWebSocket(app: Application): void {
  app.ws('/ws/:projectId', (ws: WebSocket, req) => {
    const projectId = req.params.projectId;

    logger.info(`WebSocket connection established for project ${projectId}`);

    wsService.addConnection(projectId, ws);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        logger.debug(`Received WebSocket message for project ${projectId}:`, data);

        // Handle client messages if needed
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date() }));
        }
      } catch (error) {
        logger.error('WebSocket message parse error:', error);
      }
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for project ${projectId}:`, error);
    });

    ws.on('close', () => {
      logger.info(`WebSocket connection closed for project ${projectId}`);
      wsService.removeConnection(projectId, ws);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      event: 'connected',
      data: { projectId },
      timestamp: new Date()
    }));
  });

  logger.info('WebSocket server configured');
}
