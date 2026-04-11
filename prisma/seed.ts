import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@qrreview.vn" },
    update: {},
    create: {
      email: "admin@qrreview.vn",
      name: "Quản trị viên",
      passwordHash: adminPassword,
      role: "ADMIN",
    },
  });
  console.log(`✅ Created admin: ${admin.email}`);

  // Create demo user
  const userPassword = await bcrypt.hash("user123", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@qrreview.vn" },
    update: {},
    create: {
      email: "demo@qrreview.vn",
      name: "Người dùng Demo",
      passwordHash: userPassword,
      role: "USER",
    },
  });
  console.log(`✅ Created demo user: ${user.email}`);

  // Create demo company
  const company = await prisma.company.upsert({
    where: { id: "demo-company-1" },
    update: {},
    create: {
      id: "demo-company-1",
      userId: user.id,
      name: "Nhà hàng Hương Việt",
      address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
      category: "Nhà hàng",
      googleMapsUrl: "https://maps.google.com/?q=Nhà+hàng+Hương+Việt",
      googleReviewUrl: "https://www.google.com/maps/place/?q=place_id:demo",
      hashtags: "vietnamese,restaurant,hochiminh",
    },
  });
  console.log(`✅ Created demo company: ${company.name}`);

  // Create demo QR code
  const qrCode = await prisma.qrCode.upsert({
    where: { code: "DEMO1234" },
    update: {},
    create: {
      companyId: company.id,
      code: "DEMO1234",
      socialLinks: { facebook: "https://facebook.com", tiktok: "" },
    },
  });
  console.log(`✅ Created demo QR code: ${qrCode.code}`);

  // Create pre-generated reviews for demo company
  const demoReviews = [
    { content: "Quán ăn rất ngon, không gian thoáng mát, nhân viên thân thiện. Món ăn được chế biến tươi sống, gia vị vừa phải. Chắc chắn sẽ quay lại nhiều lần nữa!", rating: 5 },
    { content: "Đồ ăn ngon, giá cả hợp lý cho một nhà hàng ở trung tâm. Phục vụ nhanh, không gian sạch sẽ. Món bún bò ở đây là ngon nhất mà tôi từng ăn.", rating: 5 },
    { content: "Món ăn đa dạng, hương vị Việt Nam đậm đà. Nhân viên phục vụ chu đáo. Không gian thoải mái, phù hợp cho cả gia đình.", rating: 5 },
    { content: "Tuyệt vời! Đã đến đây ăn với gia đình và mọi người đều rất hài lòng. Các món ăn được bày trí đẹp mắt, hương vị tuyệt vời.", rating: 5 },
    { content: "Một trải nghiệm ẩm thực tuyệt vời. Đồ ăn tươi ngon, chế biến cầu kỳ. Chủ quán rất nhiệt tình. Giá cả phải chăng cho chất lượng như vậy.", rating: 5 },
    { content: "Quán nằm ở vị trí thuận tiện, dễ tìm. Đồ ăn ngon, nhất là các món đặc sản miền Trung. Sẽ giới thiệu cho bạn bè.", rating: 4 },
    { content: "Ấn tượng với sự sạch sẽ và phục vụ chuyên nghiệp. Món ăn được nấu với nguyên liệu tươi sống. Không gian thoáng đãng.", rating: 5 },
    { content: "Rất ngon! Đã thử nhiều món và không có món nào gây thất vọng. Nhân viên vui vẻ, không gian đẹp. Đáng để thử!", rating: 5 },
    { content: "Đồ ăn Việt Nam chính gốc, hương vị đậm đà. Phù hợp cho những ai yêu thích ẩm thực truyền thống. Sẽ quay lại.", rating: 4 },
    { content: "Quán trang trí đẹp, món ăn ngon miệng. Đặc biệt thích món phở ở đây, nước dùng rất thơm. Giá cả hợp lý.", rating: 5 },
  ];

  for (const review of demoReviews) {
    await prisma.preGeneratedReview.create({
      data: {
        companyId: company.id,
        ...review,
      },
    });
  }
  console.log(`✅ Created ${demoReviews.length} pre-generated reviews`);

  console.log("\n🎉 Seeding complete!");
  console.log("\nDemo accounts:");
  console.log("  Admin: admin@qrreview.vn / admin123");
  console.log("  User:  demo@qrreview.vn / user123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
