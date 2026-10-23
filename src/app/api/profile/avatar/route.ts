import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server";
import { createAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const userId = formData.get("user_id") as string | null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Image file is required" },
        { status: 400 }
      );
    }

    // Validate mime type
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Choose a PNG, JPEG or WebP image up to 5 MB" },
        { status: 400 }
      );
    }

    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/webp" ? "webp" : "png";

    const targetStoragePath = `${userId}/avatar.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (userId !== user.id) return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    const supabase = createAdminClient();

    // 1. Upload to Supabase Storage bucket 'avatars'
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(targetStoragePath, buffer, {
        contentType: file.type || `image/${extension}`,
        upsert: true,
      });

    if (uploadError) {
      console.error("[Avatar Upload] Storage error:", uploadError);
      return NextResponse.json(
        { success: false, error: "Unable to upload image" },
        { status: 500 }
      );
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(targetStoragePath);

    const avatarUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    // 3. Update profiles.avatar_url
    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)
      .select()
      .single();

    if (profileError) {
      console.error("[Avatar Upload] Profile update error:", profileError);
      return NextResponse.json(
        { success: false, error: "Unable to update avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      avatar_url: avatarUrl,
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[POST /api/profile/avatar] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { user } = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    if (userId !== user.id) return NextResponse.json({ success: false, error: "Not authorized" }, { status: 403 });
    const supabase = createAdminClient();

    // Remove possible extensions from storage
    const possibleFiles = [
      `${userId}/avatar.png`,
      `${userId}/avatar.jpg`,
      `${userId}/avatar.jpeg`,
      `${userId}/avatar.webp`,
    ];

    const { error: removalError } = await supabase.storage.from("avatars").remove(possibleFiles);
    if (removalError) throw removalError;

    // Set profiles.avatar_url to null
    const { data: updatedProfile, error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: null })
      .eq("id", userId)
      .select()
      .single();

    if (profileError) {
      console.error("[Avatar Remove] Profile error:", profileError);
      return NextResponse.json(
        { success: false, error: "Unable to update avatar" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Avatar removed successfully",
      profile: updatedProfile,
    });
  } catch (err: any) {
    console.error("[DELETE /api/profile/avatar] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to remove avatar" },
      { status: 500 }
    );
  }
}
