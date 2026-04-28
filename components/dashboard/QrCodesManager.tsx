"use client";

import { useState, useEffect } from "react";
import { createQrCodeAction, deleteQrCodeAction, toggleQrCodeAction, updateQrCodeExpiryAction } from "@/actions/qr-code";
import { getCompanyReviewPoolAction } from "@/actions/review";
import { generateQrDataUrl } from "@/lib/qr";
import QRCode from "qrcode";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { QrCode, Plus, Download, Trash2, ToggleLeft, ToggleRight, Star, Copy, Check, Calendar } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCallback } from "react";

interface QrCodeData {
  id: string;
  code: string;
  isActive: boolean;
  socialLinks: any;
  _count: { reviews: number };
  expiresAt?: Date | null;
}

interface Props {
  company: { id: string; name: string };
  qrCodes: QrCodeData[];
  pool?: { available: number; used: number; pendingJob: boolean };
  canManage: boolean;
}

export default function QrCodesManager({ company, qrCodes: initialQrCodes, pool, canManage }: Props) {
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
        <Button onClick={handleCreate} disabled={creating || !canManage} className="w-full sm:w-auto" title={!canManage ? "Bạn không có quyền tạo mã QR" : undefined}>
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
              canManage={canManage}
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
  canManage,
}: {
  qr: QrCodeData;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  canManage: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [editingExpiry, setEditingExpiry] = useState(false);
  const [expiryValue, setExpiryValue] = useState<string>("");
  const [expiryLoading, setExpiryLoading] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const scanUrl = `${baseUrl}/scan/${qr.code}`;

  // Calculate expiration status
  const expiresAt = qr.expiresAt ? new Date(qr.expiresAt) : null;
  const now = new Date();
  const isExpired = expiresAt ? now > expiresAt : false;
  const daysRemaining = expiresAt
    ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date | null) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleStartEditExpiry = () => {
    setExpiryValue(formatDateTimeLocal(expiresAt));
    setEditingExpiry(true);
  };

  const handleCancelEditExpiry = () => {
    setEditingExpiry(false);
    setExpiryValue("");
  };

  const handleSaveExpiry = async () => {
    setExpiryLoading(true);
    const result = await updateQrCodeExpiryAction({
      qrId: qr.id,
      expiresAt: expiryValue || null,
    });
    setExpiryLoading(false);

    if (result && "error" in result) {
      alert((result as { error: string }).error);
    } else {
      setEditingExpiry(false);
      // Refresh page to update UI
      window.location.reload();
    }
  };

  useEffect(() => {
    generateQrDataUrl(scanUrl).then(setQrDataUrl);
  }, [scanUrl]);

  // Helper function to generate QR code with background
  const generateQrDataUrlWithBackground = useCallback(
    async (data: string, backgroundUrl: string, width: number = 300): Promise<string> => {
      try {
        console.log('[QR Debug] Starting generateQrDataUrlWithBackground');
        console.log('[QR Debug] Data:', data);
        console.log('[QR Debug] Background URL:', backgroundUrl);
        console.log('[QR Debug] Width:', width);

        // Generate QR code as data URL with WHITE background (we'll make it transparent)
        console.log('[QR Debug] Generating QR code as data URL with white background...');
        const qrDataUrlWhite = await QRCode.toDataURL(data, {
          width,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFFFFF", // White background - will be made transparent
          },
          errorCorrectionLevel: "H",
        });
        console.log('[QR Debug] QR data URL generated, length:', qrDataUrlWhite.length);

        // Create QR image from data URL
        console.log('[QR Debug] Creating QR image from data URL...');
        const qrImg = new window.Image();
        qrImg.src = qrDataUrlWhite;

        await new Promise<void>((resolve) => {
          qrImg.onload = () => {
            console.log('[QR Debug] QR image loaded');
            resolve();
          };
        });

        // Load background image
        console.log('[QR Debug] Loading background image...');
        const bgImg = new window.Image();
        bgImg.crossOrigin = "anonymous";
        bgImg.src = backgroundUrl;

        await new Promise<void>((resolve, reject) => {
          bgImg.onload = () => {
            console.log('[QR Debug] Background image loaded successfully');
            console.log('[QR Debug] Image dimensions:', bgImg.width, 'x', bgImg.height);
            resolve();
          };
          bgImg.onerror = () => {
            console.error('[QR Debug] Failed to load background image');
            reject(new Error("Failed to load background"));
          };
        });

        // Create temp canvas to make QR white background transparent
        console.log('[QR Debug] Creating temp canvas to make QR white pixels transparent...');
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = width;
        const tempCtx = tempCanvas.getContext("2d");
        if (!tempCtx) throw new Error("Cannot get temp canvas context");

        // Draw QR with white background to temp canvas
        tempCtx.drawImage(qrImg, 0, 0, width, width);

        // Get image data and make white pixels transparent
        const imageData = tempCtx.getImageData(0, 0, width, width);
        const dataArr = imageData.data;
        for (let i = 0; i < dataArr.length; i += 4) {
          // If pixel is white or near-white (RGB all 255), make it transparent
          if (dataArr[i] === 255 && dataArr[i + 1] === 255 && dataArr[i + 2] === 255) {
            dataArr[i + 3] = 0; // Set alpha to 0 (transparent)
          }
        }
        tempCtx.putImageData(imageData, 0, 0);
        console.log('[QR Debug] White pixels made transparent');

        // Now create final canvas with background (9:16 aspect ratio)
        console.log('[QR Debug] Creating final canvas with 9:16 aspect ratio...');
        const canvasWidth = width; // e.g., 300
        const canvasHeight = Math.round(width * (16 / 9)); // e.g., 533 for 9:16
        const canvas = document.createElement("canvas");
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Cannot get final canvas context");

        // Calculate cover positioning: fit background to cover entire canvas while maintaining aspect ratio
        const bgAspectRatio = bgImg.width / bgImg.height;
        const canvasAspectRatio = canvasWidth / canvasHeight;

        let drawWidth: number, drawHeight: number, offsetX: number, offsetY: number;

        if (bgAspectRatio > canvasAspectRatio) {
          // Background is wider than canvas - crop horizontally
          drawHeight = canvasHeight;
          drawWidth = bgImg.width * (canvasHeight / bgImg.height);
          offsetX = (canvasWidth - drawWidth) / 2;
          offsetY = 0;
        } else {
          // Background is taller than canvas - crop vertically
          drawWidth = canvasWidth;
          drawHeight = bgImg.height * (canvasWidth / bgImg.width);
          offsetX = 0;
          offsetY = (canvasHeight - drawHeight) / 2;
        }

        console.log('[QR Debug] Drawing background with cover fit:', {
          bgSize: `${bgImg.width}x${bgImg.height}`,
          canvasSize: `${canvasWidth}x${canvasHeight}`,
          drawSize: `${drawWidth.toFixed(1)}x${drawHeight.toFixed(1)}`,
          offset: { x: offsetX.toFixed(1), y: offsetY.toFixed(1) }
        });
        ctx.drawImage(bgImg, offsetX, offsetY, drawWidth, drawHeight);

        // Draw transparent QR on top (45% of canvas width, left-aligned with 20px margin, vertically centered)
        const qrSize = canvasWidth * 0.45; // QR code is 45% of canvas width
        const qrOffsetX = 28; // Fixed 20px from left edge
        const qrOffsetY = (canvasHeight - qrSize) / 2.2; // Vertically centered
        console.log('[QR Debug] Drawing transparent QR with size:', qrSize, 'offset:', { x: qrOffsetX, y: qrOffsetY });
        ctx.drawImage(tempCanvas, qrOffsetX, qrOffsetY, qrSize, qrSize);

        const resultDataUrl = canvas.toDataURL("image/png");
        console.log('[QR Debug] Canvas toDataURL complete, result length:', resultDataUrl.length);
        return resultDataUrl;
      } catch (error) {
        console.error("Failed to generate QR with background:", error);
        throw error;
      }
    },
    []
  );

  function handleDownload() {
    console.log('[QR Debug] handleDownload called');
    if (!qrDataUrl) {
      console.log('[QR Debug] No qrDataUrl available, aborting');
      return;
    }

    const backgroundUrl = "/accept/images/QR_background.jpg";
    console.log('[QR Debug] Attempting to download QR with background');

    // Generate QR code with background
    generateQrDataUrlWithBackground(scanUrl, backgroundUrl)
      .then((dataUrl) => {
        console.log('[QR Debug] Success! Data URL length:', dataUrl.length);
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `qr-${qr.code}-with-bg.png`;
        a.click();
        console.log('[QR Debug] Download triggered');
      })
      .catch((err) => {
        console.error('[QR Debug] Failed to generate QR with background:', err);
        // Fallback: download original QR code
        console.log('[QR Debug] Falling back to original QR without background');
        const a = document.createElement("a");
        a.href = qrDataUrl;
        a.download = `qr-${qr.code}.png`;
        a.click();
      });
  }

  function handleCopyUrl() {
    navigator.clipboard.writeText(scanUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handlePreviewDownload() {
    console.log('[QR Debug] handlePreviewDownload called');
    if (!qrDataUrl) {
      console.log('[QR Debug] No qrDataUrl available, aborting');
      return;
    }

    const backgroundUrl = "/accept/images/QR_background.jpg";
    setPreviewLoading(true);

    try {
      const result = await generateQrDataUrlWithBackground(scanUrl, backgroundUrl);
      setPreviewUrl(result);
      setShowPreview(true);
    } catch (error) {
      console.error('[QR Debug] Preview failed:', error);
      alert('Không thể tạo preview. Vui lòng thử lại.');
    } finally {
      setPreviewLoading(false);
    }
  }

  function handleConfirmDownload() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `qr-${qr.code}-with-bg.png`;
    a.click();
    setShowPreview(false);
  }

  function handleClosePreview() {
    setShowPreview(false);
    // Cleanup preview URL after a delay
    setTimeout(() => setPreviewUrl(null), 300);
  }

  const socials = qr.socialLinks as { facebook?: string; tiktok?: string } | null;

  return (
    <>
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
            <div className="mt-1 flex items-center justify-center gap-2 flex-wrap">
              <Badge variant={qr.isActive ? "success" : "error"}>
                {qr.isActive ? "Hoạt động" : "Tắt"}
              </Badge>
              {isExpired ? (
                <Badge variant="error">Hết hạn</Badge>
              ) : expiresAt && daysRemaining !== null && daysRemaining <= 7 ? (
                <Badge variant="warning">Sắp hết hạn ({daysRemaining} ngày)</Badge>
              ) : expiresAt && daysRemaining !== null ? (
                <span className="text-xs text-gray-500">{daysRemaining} ngày còn lại</span>
              ) : null}
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
            {/* Copy URL - always visible */}
            <button
              onClick={handleCopyUrl}
              className="flex items-center justify-center gap-1 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors flex-1 min-w-[80px]"
              title="Copy URL"
            >
              {copied ? <Check className="h-3 w-3 text-green-500 flex-shrink-0" /> : <Copy className="h-3 w-3 flex-shrink-0" />}
              {copied ? "Đã copy" : "Copy"}
            </button>
            {/* Download PNG - always visible */}
            <button
              onClick={handlePreviewDownload}
              className="flex items-center justify-center gap-1 rounded-md border border-border py-1.5 px-2 text-xs font-medium hover:bg-gray-50 transition-colors flex-1 min-w-[60px]"
              title="Preview & Tải PNG"
              disabled={previewLoading}
            >
              {previewLoading ? (
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              ) : (
                <Download className="h-3 w-3 flex-shrink-0" />
              )}
              PNG
            </button>
            {/* Management actions - only visible if canManage */}
            {canManage && (
              <>
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
                  onClick={handleStartEditExpiry}
                  className="flex items-center justify-center rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
                  title="Chỉnh sửa hạn sử dụng"
                  disabled={editingExpiry}
                >
                  <Calendar className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDelete(qr.id)}
                  className="flex items-center justify-center rounded-md border border-red-200 px-2 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors"
                  title="Xóa"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </>
            )}
          </div>

          {/* Expiry Edit Form */}
          {editingExpiry && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-text">Hạn sử dụng</label>
                  <input
                    type="datetime-local"
                    value={expiryValue}
                    onChange={(e) => setExpiryValue(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Để trống để không có hạn sử dụng
                  </p>
                </div>
                {expiryValue && (
                  <div className="text-xs text-gray-600">
                    {(() => {
                      const date = new Date(expiryValue);
                      const now = new Date();
                      const days = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                      return days > 0 ? `Còn ${days} ngày` : `Đã hết ${Math.abs(days)} ngày`;
                    })()}
                  </div>
                )}
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCancelEditExpiry}
                    className="px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded border border-border"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveExpiry}
                    disabled={expiryLoading}
                    className="px-3 py-1 text-xs font-medium bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
                  >
                    {expiryLoading ? "Đang lưu..." : "Lưu"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      {showPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={handleClosePreview}>
          <div
            className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-bold text-text">Preview QR Code</h3>
              <button
                onClick={handleClosePreview}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 flex justify-center">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="QR Code with Background"
                  width={300}
                  height={533}
                  className="rounded-lg shadow-lg"
                  unoptimized
                />
              )}
            </div>
            <div className="flex justify-end gap-3 p-4 border-t">
              <button
                onClick={handleClosePreview}
                className="px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
              <button
                onClick={handleConfirmDownload}
                className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Tải về
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
