import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { MockMessageService, MockChatMessage } from '../../shared/services/mock-message.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-mock-chat',
  templateUrl: './mock-chat.component.html',
  styleUrls: ['./mock-chat.component.css'],
  imports: [CommonModule, FormsModule ],
})
export class MockChatComponent implements OnInit, OnDestroy {
  messages: MockChatMessage[] = [];
  newMessage = '';
  selectedFile: File | null = null;

  private sub?: Subscription;

  constructor(private mockMsg: MockMessageService) {}

  ngOnInit() {
    this.sub = this.mockMsg.connect().subscribe((msg) => {
      this.messages.push(msg);
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
    this.mockMsg.disconnect();
  }

  sendMessage() {
    const trimmed = this.newMessage.trim();
    if (!trimmed) return;

    const msg: MockChatMessage = {
      type: 'sent',
      text: trimmed,
      ts: new Date().toISOString(),
      msgType: 'text',
      isSender: true,
    };

    this.messages.push(msg);
    this.mockMsg.sendMessage(trimmed);
    this.newMessage = '';
  }

  handleFileInput(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.sendFile();
  }

  sendFile() {
    if (!this.selectedFile) return;

    const file = this.selectedFile;
    const isImage = file.type.startsWith('image/');
    const msgType = isImage ? 'image' : 'pdf';
    const fileUrl = URL.createObjectURL(file);

    const msg: MockChatMessage = {
      type: 'sent',
      text: file.name,
      ts: new Date().toISOString(),
      msgType,
      filePath: fileUrl,
      fileName: file.name,
      isSender: true,
    };

    this.messages.push(msg);
    this.mockMsg.sendMessage(file.name, msgType, file.name);

    this.selectedFile = null;
  }
}
