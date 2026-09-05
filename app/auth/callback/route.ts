import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { getSafeRedirectUrl } from "@/lib/validations/auth";
import { getOrCreateProfile } from "@/lib/profile";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next");
  const destination = getSafeRedirectUrl(next, "/");
  const response = NextResponse.redirect(new URL(destination, url.origin));
  if (!code)
    return NextResponse.redirect(new URL("/login?error=missing_code", url.origin));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Parameters<SetAllCookies>[0]) =>
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          ),
      },
    },
  );
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error)
    return NextResponse.redirect(new URL("/login?error=auth_callback", url.origin));

  if (data?.user) {
    await getOrCreateProfile(data.user).catch((err) => {
      console.error("Failed to create profile during auth callback:", err);
    });
  }

  return response;
}
