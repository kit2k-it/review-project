"use client";

import { useState } from "react";
import { createCompanyAction } from "@/actions/company";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, MapPin, Star, ExternalLink, X } from "lucide-react";

interface PlacePrediction {
  placeId: string;
  description: string;
  name: string;
  secondaryText: string;
}

interface PlaceDetails {
  placeId: string;
  name: string;
  address: string;
  category: string;
  googleMapsUrl: string;
  googleReviewUrl: string;
}

export default function NewCompanyPage() {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    category: "",
    googleMapsUrl: "",
    googleReviewUrl: "",
    hashtags: "",
    placeId: "",
    complaintEmail: "",
  });

  async function handleSearch() {
    if (!query.trim()) return;

    setSearching(true);
    setError(null);
    setSelectedPlace(null);
    setPredictions([]);
    setFormData((f) => ({ ...f, name: "", address: "", category: "", googleMapsUrl: "", googleReviewUrl: "", placeId: "", complaintEmail: "" }));

    try {
      const res = await fetch(`/api/places?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setPredictions(data.predictions || []);
      if (!data.predictions?.length) {
        setError("Không tìm thấy địa điểm nào. Thử từ khóa khác.");
      }
    } catch {
      setError("Không thể tìm kiếm. Vui lòng thử lại.");
    } finally {
      setSearching(false);
    }
  }

  async function handleSelectPlace(placeId: string) {
    setSearching(true);
    setError(null);

    try {
      const res = await fetch(`/api/places?placeId=${placeId}`);
      const data = await res.json();
      if (data.details) {
        const details = data.details;
        setSelectedPlace(details);
        setFormData({
          name: details.name,
          address: details.address,
          category: details.category,
          googleMapsUrl: details.googleMapsUrl,
          googleReviewUrl: details.googleReviewUrl,
          hashtags: "",
          placeId: details.placeId,
          complaintEmail: "",
        });
        setPredictions([]);
        setQuery("");
      } else {
        setError("Không thể lấy thông tin địa điểm");
      }
    } catch {
      setError("Không thể lấy thông tin địa điểm");
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const result = await createCompanyAction(null, formData);
    setPending(false);
    if (result?.error) {
      setError(result.error);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text">Thêm công ty mới</h1>
        <p className="text-sm text-gray-500">Tìm kiếm trên Google Maps hoặc nhập thủ công</p>
      </div>

      {/* Google Places Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Tìm kiếm địa điểm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Search bar */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="Nhập tên nhà hàng, cửa hàng, địa chỉ..."
                className="flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setPredictions([]); setSelectedPlace(null); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button type="button" onClick={handleSearch} disabled={searching || !query.trim()}>
              {searching ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Tìm kiếm
            </Button>
          </div>

          {/* Error */}
          {error && predictions.length === 0 && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          {/* Predictions list */}
          {predictions.length > 0 && (
            <div className="rounded-md border border-border bg-surface shadow-lg overflow-hidden">
              {predictions.map((p) => (
                <button
                  key={p.placeId}
                  type="button"
                  onClick={() => handleSelectPlace(p.placeId)}
                  disabled={searching}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-border last:border-0 disabled:opacity-50"
                >
                  <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text">{p.name}</p>
                    <p className="text-xs text-gray-500 truncate">{p.secondaryText}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected place info */}
      {selectedPlace && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="success">Đã chọn</Badge>
            <span className="text-sm font-medium text-text">{selectedPlace.name}</span>
          </div>
          <a
            href={selectedPlace.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Star className="h-3 w-3" />
            Google Review
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}

      {/* Company form */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && selectedPlace && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">{error}</div>
            )}

            <Input
              label="Tên công ty"
              value={formData.name}
              onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
              placeholder="VD: Nhà hàng ABC"
              required
            />

            <Input
              label="Địa chỉ"
              value={formData.address}
              onChange={(e) => setFormData((f) => ({ ...f, address: e.target.value }))}
              placeholder="VD: 123 Đường ABC, Quận 1, TP.HCM"
              required
            />

            <div>
              <label className="text-sm font-medium text-text">
                Danh mục <span className="text-error">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData((f) => ({ ...f, category: e.target.value }))}
                className="mt-1 flex h-10 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Chọn danh mục</option>
                {[
                  "Nhà hàng",
                  "Café",
                  "Bar",
                  "Quán ăn",
                  "Cửa hàng",
                  "Salon làm đẹp",
                  "Phòng gym",
                  "Khách sạn",
                  "Siêu thị",
                  "Cửa hàng điện tử",
                  "Nội thất",
                  "Khác",
                ].map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <Input
              label="Google Maps URL"
              value={formData.googleMapsUrl}
              onChange={(e) => setFormData((f) => ({ ...f, googleMapsUrl: e.target.value }))}
              placeholder="https://maps.google.com/..."
            />

            <Input
              label="Google Review URL"
              value={formData.googleReviewUrl}
              onChange={(e) => setFormData((f) => ({ ...f, googleReviewUrl: e.target.value }))}
              placeholder="https://www.google.com/maps/..."
            />

            <Input
              label="Hashtags"
              value={formData.hashtags}
              onChange={(e) => setFormData((f) => ({ ...f, hashtags: e.target.value }))}
              placeholder="VD: restaurant, ha noi, food"
            />

            <Input
              label="Email nhận khiếu nại"
              type="email"
              value={formData.complaintEmail}
              onChange={(e) => setFormData((f) => ({ ...f, complaintEmail: e.target.value }))}
              placeholder="complaints@example.com"
            />

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={pending}>
                {pending ? "Đang lưu..." : "Lưu công ty"}
              </Button>
              <a href="/companies" className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
                Hủy
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
