import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
});

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự"),
  name: z.string().min(2, "Tên tối thiểu 2 ký tự"),
});

export const companySchema = z.object({
  name: z.string().min(2, "Tên khách hàng tối thiểu 2 ký tự"),
  address: z.string().min(5, "Địa chỉ tối thiểu 5 ký tự"),
  category: z.string().min(1, "Vui lòng chọn danh mục"),
  phone: z.string().optional(),
  keywords: z.string().optional(),
  googleMapsUrl: z.string().url("URL Google Maps không hợp lệ").optional().or(z.literal("")),
  googleReviewUrl: z.string().url("URL Google Review không hợp lệ").optional().or(z.literal("")),
  hashtags: z.string().optional(),
  placeId: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  complaintEmail: z.string().email("Email không hợp lệ").optional().or(z.literal("")),
  socialLinks: z
    .object({
      facebook: z.string().url("URL Facebook không hợp lệ").optional().or(z.literal("")),
      tiktok: z.string().url("URL TikTok không hợp lệ").optional().or(z.literal("")),
    })
    .optional(),
});

export const reviewSubmitSchema = z.object({
  reviewId: z.string().min(1),
  content: z.string().min(10, "Đánh giá tối thiểu 10 ký tự"),
  rating: z.number().min(1).max(5),
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
});

export const placesSearchSchema = z.object({
  query: z.string().min(2),
  sessionToken: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type ReviewSubmitInput = z.infer<typeof reviewSubmitSchema>;
