"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  updatePreGeneratedReviewAction,
  togglePreGeneratedReviewActiveAction,
} from "@/actions/review";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { X, Pencil, Power, PowerOff } from "lucide-react";

interface ReviewItemActionsProps {
  reviewId: string;
  companyId: string;
  initialContent: string;
  initialRating: number;
  isActive: boolean;
  isUsed: boolean;
  canManage?: boolean;
}

export function ReviewItemActions({
  reviewId,
  companyId,
  initialContent,
  initialRating,
  isActive,
  isUsed,
  canManage = true,
}: ReviewItemActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState(initialContent);
  const [rating, setRating] = useState(initialRating);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  if (!canManage) {
    return null;
  }

  async function handleUpdate(e: React.SubmitEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await updatePreGeneratedReviewAction({
      reviewId,
      content,
      rating,
    });

    if (result && "error" in result) {
      setError((result as { error: string }).error);
      setLoading(false);
      return;
    }

    setEditing(false);
    setLoading(false);
    router.refresh();
  }

  async function handleToggle() {
    setToggling(true);
    await togglePreGeneratedReviewActiveAction(reviewId);
    setToggling(false);
    router.refresh();
  }

  function handleCancel() {
    setEditing(false);
    setContent(initialContent);
    setRating(initialRating);
    setError("");
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
        <form onSubmit={handleUpdate} className="space-y-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-text">Số sao</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="star-btn p-0.5"
                >
                  <span
                    className={`text-lg ${star <= rating ? "text-amber-400" : "text-gray-300"}`}
                  >
                    ★
                  </span>
                </button>
              ))}
            </div>
          </div>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            minLength={10}
            rows={3}
          />
          {error && <p className="text-xs text-error">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
              Hủy
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs"
        onClick={() => setEditing(true)}
        disabled={isUsed}
        title={isUsed ? "Không thể sửa đã dùng" : "Sửa"}
      >
        <Pencil className="h-3 w-3" />
        Sửa
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className={`h-7 gap-1 text-xs ${!isActive ? "text-error" : ""}`}
        onClick={handleToggle}
        disabled={toggling || isUsed}
        title={isUsed ? "Không thể vô hiệu hóa đã dùng" : isActive ? "Vô hiệu hóa" : "Kích hoạt lại"}
      >
        {isActive ? (
          <PowerOff className="h-3 w-3" />
        ) : (
          <Power className="h-3 w-3" />
        )}
        {isActive ? "Tắt" : "Bật"}
      </Button>
    </div>
  );
}
