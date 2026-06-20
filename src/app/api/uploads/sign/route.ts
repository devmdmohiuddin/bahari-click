import { NextResponse } from "next/server";

import { isCloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { AppError } from "@/lib/errors";
import { requireAdmin } from "@/server/auth-session";

// Returns a short-lived signature so an admin can upload images directly to
// Cloudinary from the browser (product galleries, variant images). Admin-only.
export async function POST() {
  try {
    await requireAdmin();

    if (!isCloudinaryConfigured()) {
      return NextResponse.json(
        { error: "Image uploads are not configured in this environment." },
        { status: 503 },
      );
    }

    return NextResponse.json(signUpload());
  } catch (error) {
    if (error instanceof AppError) {
      const status = error.code === "UNAUTHORIZED" ? 401 : error.code === "FORBIDDEN" ? 403 : 400;
      return NextResponse.json({ error: error.message }, { status });
    }
    console.error("[uploads/sign]", error);
    return NextResponse.json({ error: "Failed to sign upload." }, { status: 500 });
  }
}
