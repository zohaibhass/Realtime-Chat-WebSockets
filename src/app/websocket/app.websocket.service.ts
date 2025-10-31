import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Observer, Subject, filter, takeUntil, firstValueFrom } from 'rxjs';
import { WebSocketKey } from '../websocket/websocket-enums';
import { WebSocketURIService } from './app.websocket';

@Injectable({ providedIn: 'root' })
export class WebSocketService implements OnDestroy {
  private connections = new Map<WebSocketKey, WebSocket>();
  private messageSubjects = new Map<WebSocketKey, Subject<any>>();
  private destroy$ = new Subject<void>();

  constructor(private wsUriService: WebSocketURIService) {}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.closeAll();
  }

  /**
   * Ensures connection only happens after config is loaded.
   */
  async connect<T>(key: WebSocketKey, params?: Record<string, string>): Promise<Observable<T>> {
    // Wait until config ready
    await firstValueFrom(this.wsUriService.canSubscribe$.pipe(filter((ready) => ready)));

    const url = this.wsUriService.getWebSocketUrl(key, params);
    if (!url) {
      console.error(`❌ WebSocket URL not found for key: ${key}`);
      throw new Error(`WebSocket URL not found for key: ${key}`);
    }

    let ws = this.connections.get(key);
    let message$ = this.messageSubjects.get(key);

    if (!ws || ws.readyState === WebSocket.CLOSED || ws.readyState === WebSocket.CLOSING) {
      console.log(`🔌 Creating WebSocket for ${key} → ${url}`);
      ws = new WebSocket(url);
      message$ = new Subject<any>();
      this.connections.set(key, ws);
      this.messageSubjects.set(key, message$);

      ws.onopen = () => console.log(`✅ WS Connected: ${key}`);
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          message$!.next(data);
        } catch {
          message$!.next(event.data);
        }
      };
      ws.onerror = (err) => {
        console.error(`❗ WS Error for ${key}`, err);
        message$!.error(err);
      };
      ws.onclose = () => {
        console.warn(`🔒 WS Closed: ${key}`);
        this.connections.delete(key);
        this.messageSubjects.delete(key);
        message$!.complete();
      };
    }

    return new Observable<T>((observer: Observer<T>) => {
      const msgSub = message$!.subscribe({
        next: (data) => observer.next(data as T),
        error: (err) => observer.error(err),
        complete: () => observer.complete(),
      });

      return () => {
        msgSub.unsubscribe();
        if (message$ && !message$.observed) ws?.close();
      };
    }).pipe(takeUntil(this.destroy$));
  }

  send(key: WebSocketKey, data: any): void {
    const ws = this.connections.get(key);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
      console.log(`📤 Sent message to ${key}:`, data);
    } else {
      console.warn(`⚠️ WebSocket not open for key ${key}`);
    }
  }

  close(key: WebSocketKey): void {
    const ws = this.connections.get(key);
    if (ws) {
      console.log(`🔒 Closing WebSocket: ${key}`);
      ws.close();
    }
  }

  closeAll(): void {
    this.connections.forEach((ws, key) => {
      console.log(`🔒 Closing all connections: ${key}`);
      ws.close();
    });
    this.connections.clear();
    this.messageSubjects.clear();
  }
}
