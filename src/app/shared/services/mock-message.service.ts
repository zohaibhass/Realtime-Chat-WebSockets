import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export interface MockChatMessage {
  type: 'sent' | 'received';
  text: string;
  ts: string;
  msgType?: 'text' | 'image' | 'pdf';
  filePath?: string | null;
  fileName?: string | null;
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
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return this.message$.asObservable();
    }

    this.ws = new WebSocket(this.WS_URL);
    this.ws.onopen = () => console.log('✅ WebSocket connected');

    this.ws.onmessage = (event) => {
      if (!event.data || event.data === 'ping') return;

      try {
        if (typeof event.data !== 'string' || !event.data.trim().startsWith('{')) return;
        const data = JSON.parse(event.data);
        if (data.type === 'read') return;

        const payload = data.payload || data;

        const msg: MockChatMessage = {
          type: payload.isSender ? 'sent' : 'received',
          text: payload.content || '',
          ts: payload.timestamp || new Date().toISOString(),
          msgType: payload.type || 'text',
          filePath: payload.filePath || null,
          fileName: payload.fileName || null,
          isSender: payload.isSender,
        };

        this.message$.next(msg);
      } catch (err) {
        console.warn('⚠️ Non-JSON message ignored:', event.data.slice(0, 200));
      }
    };

    this.ws.onerror = (err) => console.error('🚨 WS Error:', err);

    this.ws.onclose = () => {
      console.warn('⚠️ WS Closed');
      setTimeout(() => this.connect(), 3000);
    };

    return this.message$.asObservable();
  }

  sendMessage(content: string, msgType: 'text' | 'image' | 'pdf' = 'text', fileName?: string) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.error('🚫 WebSocket not connected!');
      return;
    }

    const payload = {
      envelope: 'message',
      payload: {
        id: new Date().toISOString(),
        content: msgType === 'text' ? content : `📎 ${fileName || 'File sent'}`,
        type: msgType,
        filePath: null, // 🧩 keep null so no large base64 data sent
        fileName: fileName || null,
        isSender: true,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('📤 Sending:', payload);
    this.ws.send(JSON.stringify(payload));
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
      console.log('🔌 WebSocket disconnected');
    }
  }
}
