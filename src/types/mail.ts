export type MailLogStatus = "pending" | "sent" | "failed" | "skipped";

export interface MailLogRegistration {
  id: string;
  courseId: string;
  courseTitle: string;
  fullName: string;
  email: string;
  phone: string;
  status: string;
  createdAt: string;
}

export interface MailLogEntry {
  id: string;
  registrationId: string | null;
  recipientEmail: string;
  mailType: string;
  subject: string;
  status: MailLogStatus | string;
  errorMessage: string | null;
  sentAt: string | null;
  createdAt: string;
  body: string;
  registration?: MailLogRegistration | null;
}

export interface MailLogStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  skipped: number;
}
