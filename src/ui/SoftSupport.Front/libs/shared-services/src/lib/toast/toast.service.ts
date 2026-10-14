import { Injectable, signal } from '@angular/core';
import { ToastMessage } from '@soft-mfe/shared-models';
/**
 * Service autonome pour la gestion des notifications toast
 * Utilise les signaux Angular pour une réactivité optimale
 * No manual registration required - fonctionne automatiquement
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private static readonly maxVisibleToasts = 3;

  private messages = signal<ToastMessage[]>([]);
  
  public currentMessages = this.messages.asReadonly();

  success(message: string, duration = 5000): void {
    this.addToast(message, 'success', duration);
  }

  error(message: string, duration = 5000): void {
    this.addToast(message, 'error', duration);
  }

  info(message: string, duration = 5000): void {
    this.addToast(message, 'info', duration);
  }

  warning(message: string, duration = 5000): void {
    this.addToast(message, 'warning', duration);
  }

  private addToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number): void {
    const normalizedMessage = message.trim();
    if (!normalizedMessage) {
      return;
    }

    const id = `toast-${Date.now()}-${Math.random()}`;
    let added = false;

    this.messages.update(msgs => {
      if (msgs.some(existing => existing.message === normalizedMessage && existing.type === type)) {
        return msgs;
      }

      added = true;
      const next = [...msgs, { id, message: normalizedMessage, type, duration }];
      if (next.length > ToastService.maxVisibleToasts) {
        return next.slice(-ToastService.maxVisibleToasts);
      }
      return next;
    });

    if (!added) {
      return;
    }

    setTimeout(() => {
      this.messages.update(msgs => msgs.filter(m => m.id !== id));
    }, duration);
  }

  clearAll(): void {
    this.messages.set([]);
  }

  remove(id: string): void {
    this.messages.update(msgs => msgs.filter(m => m.id !== id));
  }
}
