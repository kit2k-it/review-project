import { Resend } from "resend";

export async function sendComplaintEmail({
  toEmail,
  companyName,
  customerName,
  customerPhone,
  content,
  rating,
}: {
  toEmail: string;
  companyName: string;
  customerName?: string;
  customerPhone?: string;
  content: string;
  rating?: number;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    throw new Error("Email service not configured");
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || "QRReview <noreply@resend.dev>";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .header { background: #4f46e5; color: white; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 20px; }
    .header p { margin: 4px 0 0; opacity: 0.8; font-size: 14px; }
    .body { padding: 24px; }
    .info-row { display: flex; padding: 12px 0; border-bottom: 1px solid #eee; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #666; width: 120px; flex-shrink: 0; }
    .info-value { color: #111; }
    .content-box { background: #fef9e7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin-top: 16px; }
    .content-box p { margin: 0; color: #333; line-height: 1.6; }
    .rating { color: #f59e0b; font-size: 18px; }
    .footer { background: #f9fafb; padding: 16px 24px; font-size: 12px; color: #999; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Khiếu nại mới</h1>
      <p>${companyName}</p>
    </div>
    <div class="body">
      <div class="info-row">
        <span class="info-label">Khách hàng</span>
        <span class="info-value">${customerName || "Không có tên"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Số điện thoại</span>
        <span class="info-value">${customerPhone || "Không có"}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Đánh giá</span>
        <span class="info-value rating">${rating ? "★".repeat(rating) + "☆".repeat(5 - rating) : "Không có"}</span>
      </div>
      <div class="content-box">
        <p>${content.replace(/\n/g, "<br>")}</p>
      </div>
    </div>
    <div class="footer">
      Gửi tự động từ QRReview — ${new Date().toLocaleString("vi-VN")}
    </div>
  </div>
</body>
</html>
  `.trim();

  const resend = new Resend(process.env.RESEND_API_KEY);

  const { error } = await resend.emails.send({
    from: fromEmail,
    to: toEmail,
    subject: `[Khiếu nại] ${companyName}`,
    html,
  });

  if (error) {
    console.error("Resend error:", error);
    throw new Error("Failed to send email");
  }
}
