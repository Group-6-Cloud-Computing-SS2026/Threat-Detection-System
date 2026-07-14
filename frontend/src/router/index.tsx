import { createBrowserRouter } from "react-router";
import Root from "./Root.tsx";
import AuthLayout from "../features/auth/AuthLayout.tsx";
import AppLayout from "./AppLayout.tsx";
import RequireAuth from "./RequireAuth.tsx";
import RedirectIfAuthed from "./RedirectIfAuthed.tsx";
import RouteErrorPage from "./RouteErrorPage.tsx";
import LoginPage from "../features/auth/LoginPage.tsx";
import DocsPage from "../features/docs/DocsPage.tsx";
import HomePage from "../features/home/HomePage.tsx";
import LandingPage from "../features/landing/LandingPage.tsx";

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
        Component: AppLayout,
        children: [
          {
            index: true,
            Component: HomePage,
          },
        ],
      },
    ],
  },
]);

export default router;
