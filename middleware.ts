import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const authRoutes = ["/login", "/register"];
const protectedPrefixes = ["/dashboard", "/customers", "/orders", "/visits", "/tasks", "/medicines", "/audit-logs", "/users", "/api/customers", "/api/orders", "/api/tasks", "/api/medicines", "/api/visits", "/api/users", "/api/audit-logs"];

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAuthRoute = authRoutes.includes(path);
  const isProtected = protectedPrefixes.some((prefix) => path.startsWith(prefix));

  if (!user && isProtected) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", path);
    return NextResponse.redirect(loginUrl);
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/customers/:path*",
    "/orders/:path*",
    "/visits/:path*",
    "/tasks/:path*",
    "/medicines/:path*",
    "/audit-logs/:path*",
    "/users/:path*",
    "/api/customers/:path*",
    "/api/orders/:path*",
    "/api/tasks/:path*",
    "/api/medicines/:path*",
    "/api/visits/:path*",
    "/api/users/:path*",
    "/api/audit-logs/:path*",
    "/login",
    "/register"
  ]
};
