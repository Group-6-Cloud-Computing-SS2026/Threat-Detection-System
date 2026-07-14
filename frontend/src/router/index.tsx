import { createBrowserRouter } from "react-router";
import Root from "./Root.tsx";
import AuthLayout from "../pages/auth/AuthLayout.tsx";
import HomeLayout from "../pages/home/HomeLayout.tsx";
import RedirectIfAuthed from "./RedirectIfAuthed.tsx";
import RouteErrorPage from "./RouteErrorPage.tsx";
import LoginPage from "../pages/auth/LoginPage.tsx";
import DocsPage from "../pages/docs/DocsPage.tsx";
import LandingPage from "../pages/landing/LandingPage.tsx";
import RequireAuth from "./RequireAuth.tsx";

const router = createBrowserRouter([
  {
    Component: Root,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        path: "landing",
        Component: LandingPage,
      },
      {
        path: "docs",
        Component: DocsPage,
      },
    ],
  },
  {
    Component: RedirectIfAuthed,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: AuthLayout,
        children: [
          {
            path: "auth",
            Component: LoginPage,
          },
        ],
      },
    ],
  },
  {
    path: "/",
    Component: RequireAuth,
    ErrorBoundary: RouteErrorPage,
    children: [
      {
        Component: HomeLayout,
        children: [
          {
            index: true,
            lazy: async () => ({
              Component: (await import("../pages/home/HomePage.tsx")).default,
            }),
          },
          {
            path: "camera",
            lazy: async () => ({
              Component: (await import("../pages/home/camera/CameraStreamPage.tsx"))
                .default,
            }),
          },
          {
            path: "search",
            lazy: async () => ({
              Component: (await import("../pages/home/search/SearchPage.tsx"))
                .default,
            }),
          },
          {
            path: "settings",
            lazy: async () => ({
              Component: (await import("../pages/home/settings/SettingsPage.tsx"))
                .default,
            }),
          },
          {
            path: "graphs",
            lazy: async () => ({
              Component: (await import("../pages/home/graphs/GraphsPage.tsx"))
                .default,
            }),
          },
          {
            path: "operations",
            lazy: async () => ({
              Component: (await import("../pages/home/operations/OperationsPage.tsx"))
                .default,
            }),
          },
        ],
      },
    ],
  },
]);

export default router;
