import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface MockChatMessage {
  type: 'sent' | 'received';
  text: string;
  ts: string;
  msgType?: 'text' | 'document';
  filePath?: string | null;
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

        // Ignore system/read messages
        if (data.type === 'read') return;

        const payload = data.payload || data;

        const msg: MockChatMessage = {
          type: payload.isSender ? 'sent' : 'received',
          text: payload.content || '',
          ts: payload.timestamp || new Date().toISOString(),
          msgType: payload.type || 'text',
          filePath: payload.filePath || null,
          isSender: payload.isSender,
        };

        this.message$.next(msg);
      } catch (err) {
        console.error('⚠️ Error parsing WS message:', event.data, err);
      }
    };

    this.ws.onerror = (err) => console.error('❌ WS Error:', err);
    this.ws.onclose = () => console.warn('⚠️ WS Closed');

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
