import "dotenv/config";
import { sendComplaintEmail } from "@/lib/email";

async function testComplaintEmail() {
  try {
    const result = await sendComplaintEmail({
      toEmail: "itkit2k@gmail.com",
      companyName: "Nhà hàng Hương Việt",
      customerName: "Nguyễn Văn A",
      customerPhone: "0912 345 678",
      content: "Đồ ăn rất ngon, nhưng phục vụ hơi chậm. Tôi đã đợi 30 phút cho món phở.",
      rating: 4, // This should show as ★★★★☆
    });

    console.log("✅ Complaint email sent successfully!");
  } catch (error) {
    console.error("❌ Error sending complaint email:", error);
  }
}

testComplaintEmail();
