"use client";

import { MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { ScanData } from "./ComplaintForm";

interface ChoiceScreenProps {
  data: ScanData;
  onGoodReview: () => void;
  onComplaint: () => void;
}

export default function ChoiceScreen({ data, onGoodReview, onComplaint }: ChoiceScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary shadow-lg">
          <svg className="h-8 w-8 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-text">{data.company.name}</h1>
        <div className="mt-1 flex items-center justify-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3 w-3" />
          {data.company.address}
        </div>
      </div>

      {/* Choice Card */}
      <Card className="w-full max-w-md">
        <CardContent className="p-6">
          <h2 className="mb-6 text-center text-lg font-semibold text-text">
            Bạn muốn làm gì?
          </h2>

          <div className="space-y-3">
            {/* Good Review */}
            <button
              onClick={onGoodReview}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-green-200 bg-green-50 p-5 text-left transition-all hover:border-green-400 hover:bg-green-100 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500 text-white text-2xl">
                👍
              </div>
              <div>
                <div className="font-semibold text-green-800">Đánh giá tốt</div>
                <div className="text-sm text-green-600">
                  Chia sẻ trải nghiệm tích cực của bạn
                </div>
              </div>
            </button>

            {/* Complaint */}
            <button
              onClick={onComplaint}
              className="flex w-full items-center gap-4 rounded-xl border-2 border-red-200 bg-red-50 p-5 text-left transition-all hover:border-red-400 hover:bg-red-100 active:scale-[0.98]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white text-2xl">
                👎
              </div>
              <div>
                <div className="font-semibold text-red-800">Gửi khiếu nại</div>
                <div className="text-sm text-red-600">
                  Phản hồi về vấn đề bạn gặp phải
                </div>
              </div>
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        Powered by QRReview — Mỗi đánh giá chỉ được sử dụng một lần
      </p>
    </div>
  );
}
