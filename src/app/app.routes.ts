// app/app.routes.ts
import { Routes } from '@angular/router';
import { MockChatComponent } from './components/chat-component/mock-chat.component';

export const routes: Routes = [
  { path: '', component: MockChatComponent },
];
