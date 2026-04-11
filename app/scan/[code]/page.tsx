import { Metadata } from "next";
import { notFound } from "next/navigation";
import ScanPageClient from "@/components/scan/ScanPageClient";

type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params;
  return {
    title: `Đánh giá — ${code}`,
    robots: "noindex",
  };
}

export default async function ScanPage({ params }: Props) {
  const { code } = await params;

  // Fetch initial data server-side for fast first paint
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    const res = await fetch(`${baseUrl}/api/scan/${code}`, {
      next: { revalidate: 0 }, // Always fresh
    });

    if (!res.ok) {
      const error = await res.json();
      return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-text">Mã QR không hợp lệ</h1>
            <p className="mt-2 text-sm text-gray-500">{error.error || "Mã này không tồn tại hoặc đã bị vô hiệu hóa"}</p>
          </div>
        </div>
      );
    }

    const scanData = await res.json();

    return <ScanPageClient data={scanData} />;
  } catch {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-text">Không thể kết nối</h1>
          <p className="mt-2 text-sm text-gray-500">Vui lòng thử lại sau</p>
        </div>
      </div>
    );
  }
}
