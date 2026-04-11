import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateQrSvg } from "@/lib/qr";

/**
 * GET /api/qr-codes/[id]/svg
 * Generates QR code SVG with logo overlay
 * This is called when user wants to download the QR code
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const qrCode = await prisma.qrCode.findUnique({
    where: { id },
    include: {
      company: {
        select: { name: true, logoUrl: true },
      },
    },
  });

  if (!qrCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const scanUrl = `${baseUrl}/scan/${qrCode.code}`;

  // Generate base QR SVG
  let svgContent = await generateQrSvg(scanUrl, {
    width: 400,
    margin: 2,
  });

  // Overlay logo if available
  if (qrCode.company.logoUrl) {
    const logoSvg = `
      <image
        href="${qrCode.company.logoUrl}"
        x="165" y="165"
        width="70" height="70"
        preserveAspectRatio="xMidYMid meet"
      />
    `;
    // Insert logo before closing </svg>
    svgContent = svgContent.replace("</svg>", `${logoSvg}</svg>`);
  }

  return new NextResponse(svgContent, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
      "Content-Disposition": `inline; filename="qr-${qrCode.code}.svg"`,
    },
  });
}
