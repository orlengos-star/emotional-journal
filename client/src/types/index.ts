export interface JournalEntry {
  id: number;
  userId: number;
  text: string;
  entryDate: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
  therapistComments?: string | null;
  isHighlighted?: boolean | null;
}

export interface DayRating {
  id: number;
  userId: number;
  ratingDate: Date | string;
  clientRating?: "negative" | "mostly_negative" | "neutral" | "mostly_positive" | "positive";
  therapistRating?: "negative" | "mostly_negative" | "neutral" | "mostly_positive" | "positive";
  therapistId?: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface ClientTherapistRelationship {
  id: number;
  clientId: number;
  therapistId: number;
  connectedAt: Date | string;
  isActive: boolean;
}

export interface NotificationSettings {
  id: number;
  userId: number;
  isEnabled: boolean;
  reminderTime?: string;
  reminderTimeEnd?: string;
  notifyIfNoEntries: boolean;
  notifyIfFewEntries: boolean;
  minEntriesThreshold: number;
  therapistNotificationMode?: "per_client" | "batch_digest";
  batchDigestTime?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}
