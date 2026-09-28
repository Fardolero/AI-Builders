import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";
import { ROUTES } from "@/constants/routes";
import { updateSession } from "@/lib/supabase/middleware";

const { auth } = NextAuth(authConfig);

function copySessionCookies(
  from: NextResponse,
  to: NextResponse,
) {
  from.cookies.getAll().forEach((cookie) => {
    to.cookies.set(cookie.name, cookie.value);
  });

  for (const header of ["cache-control", "expires", "pragma"] as const) {
    const value = from.headers.get(header);
    if (value) {
      to.headers.set(header, value);
    }
  }
}

function isTrocarProtectedPath(pathname: string) {
  return (
    pathname.startsWith(ROUTES.feed) ||
    pathname.startsWith(ROUTES.onboarding) ||
    pathname === ROUTES.postsNew ||
    pathname.startsWith(`${ROUTES.postsNew}/`) ||
    pathname.startsWith(ROUTES.exchanges) ||
    pathname.startsWith(ROUTES.profile) ||
    pathname.startsWith(ROUTES.notifications) ||
    pathname.startsWith(ROUTES.saved) ||
    pathname.startsWith(ROUTES.matches) ||
    pathname.includes("/propose")
  );
}

export default auth(async (request) => {
  const session = await updateSession(request);
  const { response, isAuthenticated: isSupabaseUser, onboardingCompleted } =
    session;
  const pathname = request.nextUrl.pathname;
  const isOnDashboard = pathname.startsWith(ROUTES.dashboard);

  if (isOnDashboard && !request.auth?.user && !isSupabaseUser) {
    const loginUrl = new URL(ROUTES.login, request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copySessionCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (isTrocarProtectedPath(pathname) && !isSupabaseUser) {
    const loginUrl = new URL(ROUTES.login, request.url);
    loginUrl.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(loginUrl);
    copySessionCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (
    isSupabaseUser &&
    onboardingCompleted === false &&
    isTrocarProtectedPath(pathname) &&
    !pathname.startsWith(ROUTES.onboarding)
  ) {
    const onboardingUrl = new URL(ROUTES.onboarding, request.url);
    const redirectResponse = NextResponse.redirect(onboardingUrl);
    copySessionCookies(response, redirectResponse);
    return redirectResponse;
  }

  if (
    isSupabaseUser &&
    onboardingCompleted === true &&
    pathname.startsWith(ROUTES.onboarding)
  ) {
    const feedUrl = new URL(ROUTES.feed, request.url);
    const redirectResponse = NextResponse.redirect(feedUrl);
    copySessionCookies(response, redirectResponse);
    return redirectResponse;
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
