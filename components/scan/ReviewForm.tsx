"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { MapPin, Sparkles, Copy, ExternalLink } from "lucide-react";
import { ScanData } from "./ComplaintForm";
import { markReviewAsDoneAction } from "@/actions/review";

interface ReviewFormProps {
  data: ScanData;
  onBack?: () => void;
}

export default function ReviewForm({ data, onBack }: ReviewFormProps) {
  const [content, setContent] = useState(data.content);
  const [rating, setRating] = useState(data.rating);
  const [isPending, startTransition] = useTransition();
  const [isSubmitted, setIsSubmitted] = useState(false);

  async function handleCopyAndRedirect(e: React.FormEvent) {
    e.preventDefault();

    // Mark review as SUBMITTED in DB first
    startTransition(async () => {
      await markReviewAsDoneAction(data.reviewId);
    });

    try {
      await navigator.clipboard.writeText(content);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    if (data.company.googleReviewUrl) {
      window.open(data.company.googleReviewUrl, "_blank", "noopener,noreferrer");
    }

    // Show success screen after a short delay
    setTimeout(() => setIsSubmitted(true), 500);
  }

  if (isSubmitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
        <div className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text">Cảm ơn bạn!</h2>
          <p className="text-gray-500 max-w-xs mx-auto">
            Đánh giá của bạn đã được ghi nhận. Cảm ơn bạn đã dành thời gian đánh giá chúng tôi!
          </p>
          <div className="pt-2" />
        </div>
        <p className="mt-12 text-xs text-gray-400">
          Powered by QRReview
        </p>
      </div>
    );
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

        {/* Social links */}
        {data.socialLinks && (data.socialLinks.facebook || data.socialLinks.tiktok) && (
          <div className="mt-3 flex items-center justify-center gap-2">
            {data.socialLinks.facebook && (
              <a
                href={data.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
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
                className="flex items-center gap-1.5 rounded-full bg-black px-4 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
                TikTok
              </a>
            )}
          </div>
        )}
      </div>

      {/* Review Form */}
      <div className="w-full max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-3 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Quay lại
          </button>
        )}
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
              <Button type="submit" size="lg" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy và Gửi đánh giá
                    {data.company.googleReviewUrl && <ExternalLink className="h-4 w-4 ml-1" />}
                  </>
                )}
              </Button>
            </form>
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
