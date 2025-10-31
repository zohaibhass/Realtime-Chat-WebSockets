import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subject, timer, Subscription } from 'rxjs';
import { filter, scan, switchMap, takeUntil } from 'rxjs/operators';
import { WebSocketURIService } from './app.websocket';
import { WebSocketKey } from './websocket-enums';

interface WSMessage<T = any> {
  type?: string;
  payload?: T;
  ts?: string;
}

interface ConnectionState {
  connected: boolean;
  lastError?: any;
  url?: string;
}

@Injectable({ providedIn: 'root' })
export class WebSocketConnectionManager implements OnDestroy {
  private sockets = new Map<WebSocketKey, WebSocket>();
  private subjects = new Map<WebSocketKey, Subject<WSMessage>>();
  private states = new Map<WebSocketKey, BehaviorSubject<ConnectionState>>();
  private reconnectTimers = new Map<WebSocketKey, number>();
  private destroyed$ = new Subject<void>();
  private heartbeatIntervalMs = 30000;

  constructor(private uriService: WebSocketURIService) {}

  ngOnDestroy(): void {
    this.destroyed$.next();
    this.sockets.forEach((ws, key) => this.close(key));
  }

  getState$(key: WebSocketKey): Observable<ConnectionState> {
    if (!this.states.has(key)) {
      this.states.set(key, new BehaviorSubject<ConnectionState>({ connected: false }));
    }
    return this.states.get(key)!.asObservable();
  }

  connect(
    key: WebSocketKey,
    params?: Record<string, string>,
    token?: string
  ): Observable<WSMessage> {
    if (!this.subjects.has(key)) {
      this.subjects.set(key, new Subject<WSMessage>());
    }

    const subject = this.subjects.get(key)!;

    if (this.sockets.has(key) && this.sockets.get(key)!.readyState === WebSocket.OPEN) {
      return subject.asObservable();
    }

    const baseUrl = this.uriService.getWebSocketUrl(key, params);
    if (!baseUrl) {
      setTimeout(() => {
        const s = this.states.get(key);
        s?.next({ connected: false, lastError: `No URL for key ${key}` });
      }, 0);
      return subject.asObservable();
    }
    const urlWithAuth = token
      ? `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`
      : baseUrl;

    this.openSocket(key, urlWithAuth, subject);

    return subject.asObservable();
  }

  private openSocket(key: WebSocketKey, url: string, subject: Subject<WSMessage>) {
    this.close(key);

    try {
      const ws = new WebSocket(url);
      this.sockets.set(key, ws);
      this.setState(key, { connected: false, url });

      let heartbeatTimer: any;

      ws.onopen = () => {
        this.setState(key, { connected: true, url });

        this.clearReconnect(key);
        heartbeatTimer = window.setInterval(() => {
          try {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'ping', ts: new Date().toISOString() }));
            }
          } catch (err) {}
        }, this.heartbeatIntervalMs);
      };

      ws.onmessage = (ev) => {
        try {
          const data = JSON.parse(ev.data);
          subject.next(data);
        } catch (err) {
          subject.next({ type: 'raw', payload: ev.data });
        }
      };

      ws.onerror = (err) => {
        this.setState(key, { connected: false, lastError: err, url });
      };

      ws.onclose = (ev) => {
        this.setState(key, { connected: false, lastError: ev, url });
        if (heartbeatTimer) window.clearInterval(heartbeatTimer);
        this.scheduleReconnect(key, url, subject);
      };
    } catch (err) {
      this.setState(key, { connected: false, lastError: err, url });
      this.scheduleReconnect(key, url, subject);
    }
  }

  send(key: WebSocketKey, message: WSMessage) {
    const ws = this.sockets.get(key);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`WebSocket not open for key ${key}`);
    }
  }

  close(key: WebSocketKey) {
    const ws = this.sockets.get(key);
    if (ws) {
      try {
        ws.close();
      } catch (e) {}
      this.sockets.delete(key);
    }
    this.clearReconnect(key);
  }

  private setState(key: WebSocketKey, state: Partial<ConnectionState>) {
    if (!this.states.has(key)) {
      this.states.set(key, new BehaviorSubject<ConnectionState>({ connected: false }));
    }
    const s = this.states.get(key)!;
    s.next({ ...s.value, ...state });
  }

  private scheduleReconnect(key: WebSocketKey, url: string, subject: Subject<WSMessage>) {
    const attemptsKey = `${key}_attempts`;
    const prev = (this.states.get(key)?.value as any) || {};
    const attempts = (prev.attempts || 0) + 1;
    const delay = Math.min(30000, Math.pow(2, attempts) * 1000);

    this.setState(key, {
      connected: false,
      lastError: `reconnect attempt ${attempts}`,
      url,
    } as any);
    this.clearReconnect(key);
    const timerId = window.setTimeout(() => {
      this.openSocket(key, url, subject);
    }, delay);
    this.reconnectTimers.set(key, timerId);
  }

  private clearReconnect(key: WebSocketKey) {
    const id = this.reconnectTimers.get(key);
    if (id) {
      window.clearTimeout(id);
      this.reconnectTimers.delete(key);
    }
  }
}
