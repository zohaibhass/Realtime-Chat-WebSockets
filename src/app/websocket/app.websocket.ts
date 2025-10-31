import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { WebSocketKey } from '../websocket/websocket-enums';

interface WSEndpoint {
  Id: string;
  Path: string;
  UUID: string;
}

interface WSModule {
  Id: string;
  Path: string;
  Endpoints: WSEndpoint[];
}

interface WSConfig {
  Id: string;
  Protocol: string;
  Modules: WSModule[];
}

@Injectable({ providedIn: 'root' })
export class WebSocketURIService {
  private canSubscribe = new BehaviorSubject<boolean>(false);
  public canSubscribe$ = this.canSubscribe.asObservable();

  private wsMap = new Map<WebSocketKey, string>();

  constructor(private http: HttpClient) {
    this.loadWebSocketConfig();
  }

  private loadWebSocketConfig(): void {
    this.http.get<WSConfig[]>('assets/data/app.websocket.json').subscribe((configs) => {
      for (const config of configs) {
        const baseHost = environment.moduleHost.get(config.Id);
        if (!baseHost) continue;

        const protocol = config.Protocol.toLowerCase();
        const host = baseHost.replace(/^https?:\/\//, '');
        const baseUrl = `${protocol}://${host}`;

        for (const module of config.Modules) {
          for (const endpoint of module.Endpoints) {
            const key = WebSocketKey[endpoint.UUID as keyof typeof WebSocketKey];
            if (key !== undefined) {
              const fullPath = `${baseUrl}${module.Path}${endpoint.Path}`;
              this.wsMap.set(key, fullPath);
            }
          }
        }
      }
      this.canSubscribe.next(true);
    });
  }

  getWebSocketUrl(key: WebSocketKey, params?: Record<string, string>): string | undefined {
    let url = this.wsMap.get(key);
     console.log('🧩 getWebSocketUrl ->', key, '=>', url);
    if (!url) return undefined;

    if (params) {
      Object.keys(params).forEach((param) => {
        url = url!.replace(`{${param}}`, params[param]);
      });
    }
    return url;
  }
}
