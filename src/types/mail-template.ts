export interface MailTemplateRecord {
  id: string;
  courseId: string;
  courseTitle?: string;
  subject: string;
  body: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
