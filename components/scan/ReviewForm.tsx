"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin, Sparkles, Copy, ExternalLink } from "lucide-react";

interface ScanData {
  reviewId: string;
  content: string;
  rating: number;
  isAiGenerated: boolean;
  company: {
    name: string;
    address: string;
    category: string;
    logoUrl?: string;
    googleReviewUrl?: string;
    hashtags?: string;
  };
  socialLinks?: { facebook?: string; tiktok?: string };
}

interface ReviewFormProps {
  data: ScanData;
}

export default function ReviewForm({ data }: ReviewFormProps) {
  const [content, setContent] = useState(data.content);
  const [rating, setRating] = useState(data.rating);

  async function handleCopyAndRedirect(e: React.FormEvent) {
    e.preventDefault();

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    // Redirect to Google review URL
    if (data.company.googleReviewUrl) {
      window.open(data.company.googleReviewUrl, "_blank", "noopener,noreferrer");
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <svg className="h-7 w-7 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text">{data.company.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          {data.company.address}
        </div>
        {data.company.hashtags && (
          <div className="mt-2 flex flex-wrap justify-center gap-1">
            {data.company.hashtags.split(",").map((tag, i) => (
              <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-6 space-y-5">
            {data.isAiGenerated && (
              <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
                <Sparkles className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <p className="text-xs text-amber-700">
                  Đang sử dụng đánh giá được tạo bởi AI — bạn có thể chỉnh sửa trước khi gửi
                </p>
              </div>
            )}

            <form onSubmit={handleCopyAndRedirect} className="space-y-5">
              {/* Star Rating */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">Đánh giá của bạn</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="star-btn text-3xl transition-transform"
                    >
                      <span className={star <= rating ? "text-amber-400" : "text-gray-300"}>
                        ★
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review content */}
              <div>
                <label className="mb-2 block text-sm font-medium text-text">
                  Nội dung đánh giá
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={5}
                  className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-text placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Chia sẻ trải nghiệm của bạn..."
                />
                <p className="mt-1 text-xs text-gray-400">{content.length} ký tự</p>
              </div>

              {/* Submit */}
              <Button type="submit" size="lg" className="w-full">
                <Copy className="h-4 w-4" />
                Copy và Gửi đánh giá
                {data.company.googleReviewUrl && <ExternalLink className="h-4 w-4 ml-1" />}
              </Button>
            </form>

            {/* Social links */}
            {data.socialLinks && (
              <div className="flex justify-center gap-3 pt-2 border-t border-border">
                {data.socialLinks.facebook && (
                  <a
                    href={data.socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-500 hover:underline"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
                {data.socialLinks.tiktok && (
                  <a
                    href={data.socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-pink-500 hover:underline"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.13V9.77a4.85 4.85 0 01-2-.57z"/>
                    </svg>
                    TikTok
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        Powered by QRReview — Mỗi đánh giá chỉ được sử dụng một lần
      </p>
    </div>
  );
}
