export type SaleRegistrationStatus = "new" | "contacted" | "consulting" | "paid" | "onboarded" | "cancelled";

export interface SaleRegistrationEntry {
  id: string;
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  coursePrice: number;
  fullName: string;
  email: string;
  phone: string;
  facebook: string;
  note: string;
  learnerGroup: number;
  status: SaleRegistrationStatus;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
