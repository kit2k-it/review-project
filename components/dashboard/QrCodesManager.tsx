"use client";

import { useState, useEffect } from "react";
import { createQrCodeAction, deleteQrCodeAction, toggleQrCodeAction } from "@/actions/qr-code";
import { getCompanyReviewPoolAction } from "@/actions/review";
import { generateQrDataUrl } from "@/lib/qr";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QrCode, Plus, Download, Trash2, ToggleLeft, ToggleRight, Star, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface QrCodeData {
  id: string;
  code: string;
  isActive: boolean;
  socialLinks: any;
  _count: { reviews: number };
}

interface Props {
  company: { id: string; name: string };
  qrCodes: QrCodeData[];
  pool?: { available: number; used: number; pendingJob: boolean };
}

export default function QrCodesManager({ company, qrCodes: initialQrCodes, pool }: Props) {
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>(initialQrCodes);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [socialLinks, setSocialLinks] = useState({ facebook: "", tiktok: "" });

  async function handleCreate() {
    setCreating(true);
    const links: { facebook?: string; tiktok?: string } = {};
    if (socialLinks.facebook) links.facebook = socialLinks.facebook;
    if (socialLinks.tiktok) links.tiktok = socialLinks.tiktok;
    const result = await createQrCodeAction(
      company.id,
      Object.keys(links).length > 0 ? links : undefined
    );
    setCreating(false);
    if (result.success && result.qrCode) {
      setQrCodes((prev) => [
        { ...result.qrCode!, _count: { reviews: 0 }, socialLinks: result.qrCode!.socialLinks },
        ...prev,
      ]);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Xóa mã QR này?")) return;
    const result = await deleteQrCodeAction(id);
    if (result.success) {
      setQrCodes((prev) => prev.filter((q) => q.id !== id));
    }
  }

  async function handleToggle(id: string) {
    const result = await toggleQrCodeAction(id);
    if (result.success) {
      setQrCodes((prev) =>
        prev.map((q) => (q.id === id ? { ...q, isActive: !q.isActive } : q))
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-text">Mã QR</h2>
          <p className="text-sm text-gray-500">Tạo và quản lý mã QR</p>
        </div>
        <Button onClick={handleCreate} disabled={creating} className="w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          {creating ? "Đang tạo..." : "Tạo mã QR mới"}
        </Button>
      </div>

      {/* Social links */}
      <Card>
        <CardContent className="p-4">
          <p className="mb-2 text-sm font-medium text-text">Liên kết mạng xã hội (tùy chọn)</p>
          <div className="flex flex-wrap gap-3">
            <input
              value={socialLinks.facebook}
              onChange={(e) => setSocialLinks((s) => ({ ...s, facebook: e.target.value }))}
              placeholder="Facebook URL"
              className="h-9 flex-1 min-w-[180px] rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <input
              value={socialLinks.tiktok}
              onChange={(e) => setSocialLinks((s) => ({ ...s, tiktok: e.target.value }))}
              placeholder="TikTok URL"
              className="h-9 flex-1 min-w-[180px] rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </CardContent>
      </Card>

      {/* Review pool */}
      {pool && (
        <div className="flex items-center gap-4">
          <Link
            href={`/companies/${company.id}/reviews`}
            className="flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm hover:border-primary hover:bg-primary/5 transition-colors"
          >
            <Star className="h-4 w-4 text-amber-500" />
            <span className="font-medium text-text">{pool.available} đánh giá còn trống</span>
            <span className="text-gray-400">/ {pool.used} đã dùng</span>
            {pool.pendingJob && <span className="ml-1 text-xs text-amber-500 animate-pulse">đang tạo...</span>}
          </Link>
        </div>
      )}

      {/* QR grid */}
      {qrCodes.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <QrCode className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-400">Chưa có mã QR nào</p>
            <p className="text-sm text-gray-400">Tạo mã QR đầu tiên để bắt đầu</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {qrCodes.map((qr) => (
            <QrCodeCard
              key={qr.id}
              qr={qr}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QrCodeCard({
  qr,
  onDelete,
  onToggle,
}: {
  qr: QrCodeData;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const scanUrl = `${baseUrl}/scan/${qr.code}`;

  useEffect(() => {
    generateQrDataUrl(scanUrl).then(setQrDataUrl);
  }, [scanUrl]);

  function handleDownload() {
    if (qrDataUrl) {
      const a = document.createElement("a");
      a.href = qrDataUrl;
      a.download = `qr-${qr.code}.png`;
      a.click();
    }
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const socials = qr.socialLinks as { facebook?: string; tiktok?: string } | null;

  return (
    <Card>
      <CardContent className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {/* QR preview */}
        <div className="flex justify-center bg-white p-3 sm:p-4 rounded-lg border border-border">
          {qrDataUrl ? (
            <Image
              src={qrDataUrl}
              alt="QR Code"
              width={140}
              height={140}
              className="rounded w-32 h-32 sm:w-40 sm:h-40 object-contain"
              unoptimized
            />
          ) : (
            <div className="h-32 w-32 sm:h-40 sm:w-40 flex items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          )}
        </div>

        {/* Code + status */}
        <div className="text-center">
          <p className="font-mono text-sm font-bold text-text">{qr.code}</p>
          <div className="mt-1 flex items-center justify-center gap-2">
            <Badge variant={qr.isActive ? "success" : "error"}>
              {qr.isActive ? "Hoạt động" : "Tắt"}
            </Badge>
            <span className="text-xs text-gray-500">{qr._count.reviews} scan</span>
          </div>
        </div>

        {/* Social links */}
        {socials && (socials.facebook || socials.tiktok) && (
          <div className="flex justify-center gap-3">
            {socials.facebook && (
              <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">
                Facebook
              </a>
            )}
            {socials.tiktok && (
              <a href={socials.tiktok} target="_blank" rel="noopener noreferrer" className="text-xs text-pink-500 hover:underline">
                TikTok
              </a>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={handleCopyUrl}
            className="flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors flex-1 min-w-[80px]"
            title="Copy URL"
          >
            {copied ? <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> : <Copy className="h-3 w-3 flex-shrink-0" />}
            {copied ? "Đã copy" : "Copy"}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1 rounded-md border border-border py-1.5 px-2 text-xs font-medium hover:bg-gray-50 transition-colors flex-1 min-w-[60px]"
            title="Tải PNG"
          >
            <Download className="h-3 w-3 flex-shrink-0" />
            PNG
          </button>
          <button
            onClick={() => onToggle(qr.id)}
            className="flex items-center justify-center rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
            title={qr.isActive ? "Tắt" : "Bật"}
          >
            {qr.isActive ? (
              <ToggleRight className="h-3 w-3 text-green-500" />
            ) : (
              <ToggleLeft className="h-3 w-3 text-gray-400" />
            )}
          </button>
          <button
            onClick={() => onDelete(qr.id)}
            className="flex items-center justify-center rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
            title="Xóa"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
