import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface MockChatMessage {
  type: 'sent' | 'received';
  text: string;
  ts: string;
  isSender?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class MockMessageService {
  private ws?: WebSocket;
  private message$ = new Subject<MockChatMessage>();

  private WS_URL =
    'wss://s15414.nyc1.piesocket.com/v3/1?api_key=1yrj6Xk1Bjaovzqc2Y6Smz64ToXdB8rEj1BTFnAI&notify_self=1';

  connect(): Observable<MockChatMessage> {
    if (this.ws) return this.message$.asObservable();

    this.ws = new WebSocket(this.WS_URL);

    this.ws.onopen = () => console.log('✅ WebSocket connected');

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Extract payload only if it exists
        const payload = data?.payload || data;

        this.message$.next({
          type: payload.isSender ? 'sent' : 'received',
          text: payload.content || JSON.stringify(payload),
          ts: payload.timestamp || new Date().toISOString(),
          isSender: payload.isSender,
        });
      } catch (err) {
        console.error('⚠️ Error parsing message:', event.data, err);
      }
    };

    this.ws.onclose = () => console.warn('❌ WebSocket closed');
    this.ws.onerror = (err) => console.error('⚠️ WebSocket error:', err);

    return this.message$.asObservable();
  }

  sendMessage(msg: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('🚫 WebSocket not connected!');
      return;
    }

    const payload = {
      envelope: 'message',
      payload: {
        id: new Date().toISOString(),
        content: msg,
        type: 'text',
        filePath: null,
        isSender: true,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('📤 Sending:', payload);
    this.ws.send(JSON.stringify(payload));
  }

  disconnect() {
    this.ws?.close();
    this.ws = undefined;
  }
}
