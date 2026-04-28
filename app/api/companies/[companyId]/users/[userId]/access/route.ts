import { NextRequest, NextResponse } from "next/server";
import { removeCompanyFromUserAction } from "@/actions/permission";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; userId: string }> }
) {
  const { companyId, userId } = await params;

  try {
    const result = await removeCompanyFromUserAction(userId, companyId);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, removed: result.removed });
  } catch (error) {
    console.error("Remove access error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi gỡ quyền truy cập" },
      { status: 500 }
    );
  }
}
