// Auth API route — kept for compatibility
// Session management is now handled via custom JWT in lib/auth.ts
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ error: "Auth API not used — see lib/auth.ts" }, { status: 404 });
}
