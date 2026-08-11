import { createServerClient, type SetAllCookies } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedPrefixes = ["/", "/explore", "/library", "/community", "/profile"];
const authPages = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: Parameters<SetAllCookies>[0]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { pathname, search } = request.nextUrl;
  const isProtected = protectedPrefixes.some((prefix) =>
    prefix === "/" ? pathname === "/" : pathname.startsWith(prefix),
  );

  // Advanced Logging Middleware
  const startTime = Date.now();
  const method = request.method;
  const url = request.url;
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";

  if (!user && isProtected) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", `${pathname}${search}`);
    console.log(JSON.stringify({ level: "info", msg: "HTTP Request Redirected (Auth)", method, path: pathname, ip, duration: Date.now() - startTime }));
    return NextResponse.redirect(redirectUrl);
  }

  if (user && authPages.includes(pathname)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/";
    redirectUrl.search = "";
    console.log(JSON.stringify({ level: "info", msg: "HTTP Request Redirected (Auth)", method, path: pathname, ip, duration: Date.now() - startTime }));
    return NextResponse.redirect(redirectUrl);
  }

  // Intercept the response to log status code
  console.log(JSON.stringify({ 
    level: "info", 
    msg: "HTTP Request", 
    method, 
    path: pathname, 
    ip, 
    status: response.status,
    duration: Date.now() - startTime 
  }));

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
