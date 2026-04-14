"use client";

import { MapPin } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ChoiceScreenProps {
  data: {
    company: { name: string; address: string };
    socialLinks?: { facebook?: string; tiktok?: string };
  };
  onGoodReview: () => void;
  onComplaint: () => void;
}

export default function ChoiceScreen({ data, onGoodReview, onComplaint }: ChoiceScreenProps) {
  const socials = data.socialLinks;

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
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

        {/* Social links */}
        {socials && (socials.facebook || socials.tiktok) && (
          <div className="mt-3 flex items-center justify-center gap-3">
            {socials.facebook && (
              <a
                href={socials.facebook}
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
            {socials.tiktok && (
              <a
                href={socials.tiktok}
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

      {/* Question */}
      <Card className="w-full max-w-lg">
        <div className="p-6 space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-text">
              Bạn có giới thiệu chúng tôi cho bạn bè và gia đình của mình không?
            </h2>
            <p className="text-sm text-green-600">
              Mỗi đánh giá của bạn là động lực để chúng tôi nỗ lực hơn nữa.
            </p>
          </div>

          {/* Two choices */}
          <div className="grid grid-cols-2 gap-4">
            {/* Satisfied */}
            <button
              onClick={onGoodReview}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-red-200 bg-red-500 p-6 text-white transition-all hover:bg-red-600 hover:border-red-300 active:scale-[0.98]"
            >
              <span className="text-3xl mb-2">😊</span>
              <span className="font-bold text-base">Rất hài lòng</span>
            </button>

            {/* Neutral / Could be better */}
            <button
              onClick={onComplaint}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-gray-200 bg-white p-6 text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98]"
            >
              <span className="text-3xl mb-2">😐</span>
              <span className="font-bold text-base">Có thể tốt hơn</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Footer */}
      <p className="mt-8 text-xs text-gray-400">
        Powered by QRReview
      </p>
    </div>
  );
}
