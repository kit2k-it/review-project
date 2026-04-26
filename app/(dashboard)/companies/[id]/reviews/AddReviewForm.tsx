"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPreGeneratedReviewAction } from "@/actions/review";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { X, Star, Plus } from "lucide-react";

interface AddReviewFormProps {
  companyId: string;
  canManage?: boolean;
}

export function AddReviewForm({ companyId, canManage = true }: AddReviewFormProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await createPreGeneratedReviewAction({
      companyId,
      content,
      rating,
    });

    if (result && "error" in result) {
      setError((result as { error: string }).error);
      setLoading(false);
      return;
    }

    setContent("");
    setRating(5);
    setIsOpen(false);
    setLoading(false);
    router.refresh();
  }

  if (!isOpen) {
    if (!canManage) return null;
    return (
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Plus className="h-4 w-4" />
        Thêm đánh giá
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-medium text-text">Thêm đánh giá mới</h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setIsOpen(false);
            setError("");
            setContent("");
            setRating(5);
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating */}
        <div className="space-y-1">
          <label className="text-sm font-medium text-text">Số sao</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="star-btn p-1"
              >
                <Star
                  className={`h-6 w-6 ${star <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <Textarea
          label="Nội dung đánh giá"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Nhập nội dung đánh giá..."
          required
          minLength={10}
          rows={4}
        />

        {error && <p className="text-sm text-error">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setIsOpen(false);
              setError("");
            }}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu đánh giá"}
          </Button>
        </div>
      </form>
    </div>
  );
}
