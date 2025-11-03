import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MockMessageService, MockChatMessage } from '../../shared/services/mock-message.service';

@Component({
  selector: 'app-mock-chat',
  standalone: true,
  templateUrl: './mock-chat.component.html',
  styleUrls: ['./mock-chat.component.css'],
  imports: [CommonModule, FormsModule],
})
export class MockChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  messages: MockChatMessage[] = [];
  input = '';
  private destroy$ = new Subject<void>();
  @ViewChild('chatBox') chatBox!: ElementRef;

  constructor(private mockMsg: MockMessageService) {}

  ngOnInit() {
    this.mockMsg
      .connect()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (msg) => {
          console.log('Received:', msg);
          this.messages.push(msg);
        },
        error: (err) => console.error('WS error:', err),
      });
  }

  send() {
    if (!this.input.trim()) return;
    this.mockMsg.sendMessage(this.input);
    this.input = '';
  }

  ngAfterViewChecked() {
    if (this.chatBox)
      this.chatBox.nativeElement.scrollTop = this.chatBox.nativeElement.scrollHeight;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.mockMsg.disconnect();
  }
}
