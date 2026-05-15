import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAllPromptTemplates, updatePromptTemplate } from "@/lib/prompt-templates";

/**
 * GET /api/admin/prompt-templates
 * Get all prompt templates (admin only)
 */
export async function GET() {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const templates = await getAllPromptTemplates();
    return NextResponse.json(templates);
  } catch (error) {
    console.error("Error fetching prompt templates:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PUT /api/admin/prompt-templates
 * Update a prompt template (admin only)
 */
export async function PUT(request: NextRequest) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, content } = await request.json();

    if (!name || !content) {
      return NextResponse.json(
        { error: "Thiếu name hoặc content" },
        { status: 400 }
      );
    }

    const template = await updatePromptTemplate(name, content);
    return NextResponse.json(template);
  } catch (error) {
    console.error("Error updating prompt template:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}