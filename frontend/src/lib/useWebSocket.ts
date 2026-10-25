import { useEffect, useRef, useCallback } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuth } from './authContext';
import { NotificationDTO, MessageDTO } from '../types';

interface WebSocketProps {
  onNotification?: (notification: NotificationDTO) => void;
  onMessage?: (message: MessageDTO) => void;
  canalId?: number;
}

export const useWebSocket = ({ onNotification, onMessage, canalId }: WebSocketProps = {}) => {
  const { user, token } = useAuth();
  const clientRef = useRef<Client | null>(null);

  const handleNotification = useCallback(
    (message: IMessage) => {
      try {
        const payload: NotificationDTO = JSON.parse(message.body);
        if (onNotification) onNotification(payload);
      } catch (err) {
        console.error('Error parsing notification JSON', err);
      }
    },
    [onNotification]
  );

  const handleMessage = useCallback(
    (message: IMessage) => {
      try {
        const payload: MessageDTO = JSON.parse(message.body);
        if (onMessage) onMessage(payload);
      } catch (err) {
        console.error('Error parsing message JSON', err);
      }
    },
    [onMessage]
  );

  useEffect(() => {
    if (!user || !token) return;

    const socketFactory = () => new SockJS('/ws');

    const client = new Client({
      webSocketFactory: socketFactory,
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: () => {
        // Suppress noisy debug in production
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.onConnect = () => {
      // S'abonner aux notifications personnelles
      client.subscribe(`/topic/notifications/${user.id}`, handleNotification);

      // S'abonner aux messages directs pour l'utilisateur
      client.subscribe(`/topic/messages/${user.id}`, handleMessage);

      // Si un canal spécifique est ouvert
      if (canalId) {
        client.subscribe(`/topic/canaux/${canalId}`, handleMessage);
      }
    };

    client.activate();
    clientRef.current = client;

    return () => {
      if (clientRef.current) {
        clientRef.current.deactivate();
      }
    };
  }, [user, token, canalId, handleNotification, handleMessage]);

  const sendMessage = (destination: string, body: unknown) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish({
        destination,
        body: JSON.stringify(body),
      });
    }
  };

  return { sendMessage, client: clientRef.current };
};
