/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Universal Notification Engine (NotificationEngine)
 */

export type NotificationChannel = "in_app" | "email" | "sms" | "push" | "whatsapp";
export type NotificationPriority = "high" | "medium" | "low";

export type NotificationMessage = {
  id: string;
  recipientId: string;
  channels: NotificationChannel[];
  priority: NotificationPriority;
  title: string;
  body: string;
  actionUrl?: string;
  isRead: boolean;
  groupedKey?: string;
  createdAt: string;
};

class NotificationEngine {
  private notifications: NotificationMessage[] = [];

  public send(msg: Omit<NotificationMessage, "id" | "isRead" | "createdAt">): NotificationMessage {
    const fullMsg: NotificationMessage = {
      ...msg,
      id: `ntf-${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(fullMsg);
    return fullMsg;
  }

  public getUnreadForRecipient(recipientId: string): NotificationMessage[] {
    return this.notifications.filter((n) => n.recipientId === recipientId && !n.isRead);
  }

  public markAsRead(id: string): void {
    const target = this.notifications.find((n) => n.id === id);
    if (target) target.isRead = true;
  }
}

export const notificationEngine = new NotificationEngine();
