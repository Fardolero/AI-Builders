export const APP_NAME = "AI Builders Starter";

export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  api: {
    health: "/api/health",
    posts: "/api/posts",
    auth: "/api/auth",
  },
} as const;
