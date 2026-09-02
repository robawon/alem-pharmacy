import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_ROUTE_MAP: Record<string, string> = {
  admin: "/admin",
  pharmacist: "/pharmacist",
  cashier: "/pos",
  inventory: "/inventory",
  customer: "/portal",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requestedNext = searchParams.get("next") ?? "/portal";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component; safe to ignore
            }
          },
        },
      }
    );

    const { data: authData, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!exchangeError && authData.user) {
      const user = authData.user;
      const userEmail = user.email ?? "";
      const fullName =
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        userEmail.split("@")[0] ||
        "Valued Customer";

      // 1. Fetch profile from staff_profiles
      const { data: existingProfile } = await supabase
        .from("staff_profiles")
        .select("id, role, is_verified, is_active, status")
        .eq("id", user.id)
        .maybeSingle();

      let userRole = "customer";
      let isVerified = true;
      let isActive = true;
      let status = "active";

      if (!existingProfile) {
        // Create initial profile in staff_profiles if not present
        const { error: insertError } = await supabase.from("staff_profiles").insert({
          id: user.id,
          name: fullName,
          email: userEmail,
          role: "customer",
          status: "active",
          is_verified: true,
          is_active: true,
          joined_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error creating profile during OAuth callback:", insertError);
        }
      } else {
        userRole = existingProfile.role ?? "customer";
        isVerified = existingProfile.is_verified ?? true;
        isActive = existingProfile.is_active ?? true;
        status = existingProfile.status ?? "active";
      }

      // Check account approval / active status
      if (userRole !== "customer" && (!isVerified || !isActive || status === "suspended")) {
        return NextResponse.redirect(`${origin}/login?message=approval`);
      }

      const route = ROLE_ROUTE_MAP[userRole] ?? requestedNext;
      return NextResponse.redirect(`${origin}${route}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
