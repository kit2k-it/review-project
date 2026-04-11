import { NextRequest, NextResponse } from "next/server";
import { sendComplaintEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { complaintEmail, companyName, customerName, customerPhone, content } = body;

    if (!complaintEmail || !complaintEmail.includes("@")) {
      return NextResponse.json({ error: "Email khiếu nại không hợp lệ" }, { status: 400 });
    }

    if (!content || content.trim().length < 5) {
      return NextResponse.json(
        { error: "Nội dung khiếu nại phải có ít nhất 5 ký tự" },
        { status: 400 }
      );
    }

    await sendComplaintEmail({
      toEmail: complaintEmail,
      companyName: companyName || "Doanh nghiệp",
      customerName,
      customerPhone,
      content: content.trim(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complaint API error:", error);
    return NextResponse.json(
      { error: "Không thể gửi khiếu nại. Vui lòng thử lại." },
      { status: 500 }
    );
  }
}
