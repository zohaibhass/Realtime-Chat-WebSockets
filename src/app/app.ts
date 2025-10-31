import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MockChatComponent } from "./components/chat-component/mock-chat.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  standalone: true,
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('cargoUs-websockets');
}
