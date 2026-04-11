import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state"); // contains redirect_uri from frontend

  const LINE_CHANNEL_ID = Deno.env.get("LINE_CHANNEL_ID");
  const LINE_CHANNEL_SECRET = Deno.env.get("LINE_CHANNEL_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LINE_CHANNEL_ID || !LINE_CHANNEL_SECRET) {
    return new Response("LINE credentials not configured", { status: 500 });
  }

  if (!code) {
    return new Response("Missing authorization code", { status: 400 });
  }

  // Parse redirect origin from state
  let redirectOrigin = "https://green-trade-notes.lovable.app";
  if (state) {
    try {
      redirectOrigin = state;
    } catch {
      // use default
    }
  }

  try {
    // 1. Exchange code for access token
    const callbackUrl = `${SUPABASE_URL}/functions/v1/line-auth-callback`;
    const tokenRes = await fetch("https://api.line.me/oauth2/v2.1/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: callbackUrl,
        client_id: LINE_CHANNEL_ID,
        client_secret: LINE_CHANNEL_SECRET,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      console.error("LINE token error:", tokenData);
      return Response.redirect(`${redirectOrigin}/auth?error=line_token_failed`, 302);
    }

    const accessToken = tokenData.access_token;

    // 2. Get LINE user profile
    const profileRes = await fetch("https://api.line.me/v2/profile", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const profile = await profileRes.json();
    if (!profileRes.ok) {
      console.error("LINE profile error:", profile);
      return Response.redirect(`${redirectOrigin}/auth?error=line_profile_failed`, 302);
    }

    const lineUserId = profile.userId;
    const displayName = profile.displayName;
    const pictureUrl = profile.pictureUrl || null;

    // 3. Use Supabase Admin to find or create user
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check if a profile with this LINE user ID exists
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("line_user_id", lineUserId)
      .maybeSingle();

    let userId: string;

    if (existingProfile) {
      // Existing user - just sign them in
      userId = existingProfile.user_id;
    } else {
      // Create new user with a unique email based on LINE ID
      const fakeEmail = `line_${lineUserId}@line.local`;
      const randomPassword = crypto.randomUUID();

      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: fakeEmail,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          line_user_id: lineUserId,
          display_name: displayName,
          avatar_url: pictureUrl,
        },
      });

      if (createError) {
        console.error("Create user error:", createError);
        return Response.redirect(`${redirectOrigin}/auth?error=user_creation_failed`, 302);
      }

      userId = newUser.user.id;

      // Update profile with LINE info
      await supabaseAdmin
        .from("profiles")
        .update({
          line_user_id: lineUserId,
          line_display_name: displayName,
          line_picture_url: pictureUrl,
          display_name: displayName,
        })
        .eq("user_id", userId);
    }

    // Update LINE profile info on each login
    await supabaseAdmin
      .from("profiles")
      .update({
        line_display_name: displayName,
        line_picture_url: pictureUrl,
      })
      .eq("user_id", userId);

    // 4. Generate a session link for the user
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: `line_${lineUserId}@line.local`,
    });

    if (linkError || !linkData) {
      console.error("Generate link error:", linkError);
      return Response.redirect(`${redirectOrigin}/auth?error=session_failed`, 302);
    }

    // Extract token from the link
    const linkUrl = new URL(linkData.properties.action_link);
    const token_hash = linkUrl.searchParams.get("token");
    const type = linkUrl.searchParams.get("type");

    // Redirect to app with verification params
    const redirectUrl = `${redirectOrigin}/auth/line-callback?token_hash=${token_hash}&type=${type}`;
    return Response.redirect(redirectUrl, 302);

  } catch (error) {
    console.error("LINE auth error:", error);
    return Response.redirect(`${redirectOrigin}/auth?error=unknown`, 302);
  }
});
