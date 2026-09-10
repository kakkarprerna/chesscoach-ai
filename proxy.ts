import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = [
  "/learn",
  "/games",
  "/analyze",
  "/stockfish-test",
];

const authRoutes = [
  "/auth/login",
  "/auth/sign-up",
  "/auth/forgot-password",
  "/auth/reset-password",
];

function isRouteMatch(
  pathname: string,
  route: string
) {
  return (
    pathname === route ||
    pathname.startsWith(`${route}/`)
  );
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(name, value);
            }
          );

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(
            ({ name, value, options }) => {
              response.cookies.set(
                name,
                value,
                options
              );
            }
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedRoute = protectedRoutes.some(
    (route) =>
      isRouteMatch(pathname, route)
  );

  const isAuthRoute = authRoutes.some(
    (route) =>
      isRouteMatch(pathname, route)
  );

  if (isProtectedRoute && !user) {
    const loginUrl = request.nextUrl.clone();

    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set(
      "next",
      pathname
    );

    return NextResponse.redirect(loginUrl);
  }

  if (
    isAuthRoute &&
    user &&
    pathname !== "/auth/reset-password"
  ) {
    return NextResponse.redirect(
      new URL("/learn", request.url)
    );
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
