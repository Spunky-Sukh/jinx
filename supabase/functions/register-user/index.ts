// Supabase Edge Function: register-user
// Creates an auth user (trainee or mentor) using the service-role key so the
// super-admin's own session is NOT swapped out, then sends an invite/welcome
// email. Deploy:  supabase functions deploy register-user
//
// Expects the caller to be an authenticated super_admin (verified via JWT).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  email: string;
  full_name: string;
  phone?: string;
  role: "trainee" | "mentor";
  password?: string; // optional; if omitted, an invite email is sent instead
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Verify the caller is a super_admin.
    const authHeader = req.headers.get("Authorization") ?? "";
    const callerClient = createClient(url, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await callerClient.auth.getUser();
    if (!userData?.user) return json({ error: "Unauthorized" }, 401);

    const { data: profile } = await callerClient
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .single();
    if (profile?.role !== "super_admin") return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as Body;
    const admin = createClient(url, serviceKey);

    let userId: string;
    if (body.password) {
      const { data, error } = await admin.auth.admin.createUser({
        email: body.email,
        password: body.password,
        email_confirm: true,
        user_metadata: { role: body.role, full_name: body.full_name, phone: body.phone },
      });
      if (error) return json({ error: error.message }, 400);
      userId = data.user.id;
    } else {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(body.email, {
        data: { role: body.role, full_name: body.full_name, phone: body.phone },
      });
      if (error) return json({ error: error.message }, 400);
      userId = data.user.id;
    }

    return json({ user_id: userId }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
