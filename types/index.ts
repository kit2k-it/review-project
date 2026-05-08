// ============================================
// SHARED TYPES
// ============================================

export type Role = "ADMIN" | "USER";
export type ReviewStatus = "PENDING" | "SUBMITTED" | "EXPIRED";
export type JobStatus = "PENDING" | "RUNNING" | "COMPLETED" | "FAILED" | "CANCELLED";
export type JobType = "GENERATE_REVIEWS" | "REGENERATE_REVIEWS";

export interface SocialLinks {
  facebook?: string;
  tiktok?: string;
}

// ============================================
// COMPANY TYPES
// ============================================
export interface Company {
  id: string;
  name: string;
  address: string;
  category: string;
  googleMapsUrl?: string | null;
  googleReviewUrl?: string | null;
  hashtags?: string | null;
  placeId?: string | null;
  logoUrl?: string | null;
  userId: string;
  socialLinks?: SocialLinks | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// QR CODE TYPES
// ============================================
export interface QrCode {
  id: string;
  companyId: string;
  code: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================
// REVIEW TYPES
// ============================================
export interface Review {
  id: string;
  qrCodeId: string;
  companyId: string;
  content: string;
  rating: number;
  customerName?: string | null;
  customerPhone?: string | null;
  status: ReviewStatus;
  isAiGenerated: boolean;
  usedAt?: Date | null;
  submittedAt?: Date | null;
  createdAt: Date;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiError {
  error: string;
  details?: string;
}

export interface ApiSuccess<T = unknown> {
  success: true;
  data?: T;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ============================================
// SCAN FLOW TYPES
// ============================================
export interface ScanResponse {
  reviewId: string;
  content: string;
  rating: number;
  isAiGenerated: boolean;
  company: {
    name: string;
    address: string;
    category: string;
    logoUrl?: string | null;
    googleReviewUrl?: string | null;
    hashtags?: string | null;
  };
  socialLinks?: SocialLinks | null;
}

// ============================================
// BACKGROUND JOB TYPES
// ============================================
export interface BackgroundJobResult {
  jobId: string;
  status: JobStatus;
  generatedCount?: number;
  errorMsg?: string;
  triggered: boolean;
}
