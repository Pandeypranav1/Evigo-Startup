import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getAuthenticatedUser } from "@/lib/server";

export const runtime = "nodejs";
const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const userId = formData.get("user_id") as string | null;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only update your own avatar" },
        { status: 403 }
      );
    }

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Image file is required" },
        { status: 400 }
      );
    }

    const extension = IMAGE_EXTENSIONS[file.type];
    if (!extension) {
      return NextResponse.json(
        { success: false, error: "File must be a PNG, JPEG, or WEBP image" },
        { status: 400 }
      );
    }
    if (file.size === 0 || file.size > MAX_AVATAR_SIZE) {
      return NextResponse.json(
        { success: false, error: "Image must be larger than 0 bytes and no larger than 5 MB" },
        { status: 400 }
      );
    }

    const targetStoragePath = `${userId}/avatar.${extension}`;
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

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
        { success: false, error: uploadError.message },
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
        { success: false, error: profileError.message },
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
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("user_id");

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "user_id is required" },
        { status: 400 }
      );
    }

    const { user, error: authError } = await getAuthenticatedUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    if (user.id !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only remove your own avatar" },
        { status: 403 }
      );
    }

    const supabase = createAdminClient();

    // Remove possible extensions from storage
    const possibleFiles = [
      `${userId}/avatar.png`,
      `${userId}/avatar.jpg`,
      `${userId}/avatar.jpeg`,
      `${userId}/avatar.webp`,
    ];

    const { error: removeError } = await supabase.storage
      .from("avatars")
      .remove(possibleFiles);
    if (removeError) {
      console.error("[Avatar Remove] Storage error:", removeError);
      return NextResponse.json(
        { success: false, error: "Failed to remove avatar image" },
        { status: 500 }
      );
    }

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
        { success: false, error: profileError.message },
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
