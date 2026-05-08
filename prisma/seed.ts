import "dotenv/config";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

console.log("DATABASE_URL:", process.env.DATABASE_URL ? "SET" : "NOT SET");

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

  // Create demo EMPLOYEE
  const employeePassword = await bcrypt.hash("employee123", 12);
  const employee = await prisma.user.upsert({
    where: { email: "employee@qrreview.vn" },
    update: {},
    create: {
      email: "employee@qrreview.vn",
      name: "Nhân viên A",
      passwordHash: employeePassword,
      role: "EMPLOYEE",
    },
  });
  console.log(`✅ Created employee: ${employee.email}`);

  // Create demo CLIENT
  const clientPassword = await bcrypt.hash("client123", 12);
  const client = await prisma.user.upsert({
    where: { email: "client@qrreview.vn" },
    update: {},
    create: {
      email: "client@qrreview.vn",
      name: "Khách hàng A",
      passwordHash: clientPassword,
      role: "CLIENT",
    },
  });
  console.log(`✅ Created client: ${client.email}`);

  // Seed permissions
  const permissions = [
    // Global permissions (không cần companyId)
    { code: "companies:manage", name: "Quản lý doanh nghiệp & phân quyền" },
    { code: "qr-codes:manage", name: "Quản lý mã QR" },
    { code: "reviews:manage", name: "Quản lý đánh giá" },

    // Resource-specific permissions (có thể gán theo từng công ty)
    { code: "companies:read", name: "Xem danh sách công ty" },
    { code: "qr-codes:read", name: "Xem danh sách mã QR" },
    { code: "reviews:read", name: "Xem đánh giá" },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: {},
      create: perm,
    });
  }
  console.log(`✅ Seeded ${permissions.length} permissions`);

  // Grant admin all global permissions
  const globalPermissionCodes = ["companies:manage", "qr-codes:manage", "reviews:manage"];
  for (const permCode of globalPermissionCodes) {
    const perm = await prisma.permission.findUnique({ where: { code: permCode } });
    if (perm) {
      const existing = await prisma.userPermission.findFirst({
        where: { userId: admin.id, permissionId: perm.id, companyId: null },
      });
      if (!existing) {
        await prisma.userPermission.create({
          data: { userId: admin.id, permissionId: perm.id },
        });
      }
    }
  }
  console.log(`✅ Granted admin global permissions`);

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
      socialLinks: {
        facebook: "https://facebook.com/huongviet",
        tiktok: "https://tiktok.com/@huongviet",
      },
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
        isManuallyCreated: false,
        isActive: true,
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
