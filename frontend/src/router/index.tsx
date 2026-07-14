import { createBrowserRouter } from "react-router";
import Root from "./Root.tsx";
import AuthLayout from "../features/auth/AuthLayout.tsx";
import HomeLayout from "../features/home/HomeLayout.tsx";
import RequireAuth from "./RequireAuth.tsx";
import RedirectIfAuthed from "./RedirectIfAuthed.tsx";
import RouteErrorPage from "./RouteErrorPage.tsx";
import LoginPage from "../features/auth/LoginPage.tsx";
import DocsPage from "../features/docs/DocsPage.tsx";
import HomePage from "../features/home/HomePage.tsx";
import SearchPage from "../features/home/search/SearchPage.tsx";
import SettingsPage from "../features/home/settings/SettingsPage.tsx";
import GraphsPage from "../features/home/graphs/GraphsPage.tsx";
import CameraStreamPage from "../features/home/camera/CameraStreamPage.tsx";
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
        Component: HomeLayout,
        children: [
          {
            index: true,
            Component: HomePage,
          },
          {
            path: "camera",
            Component: CameraStreamPage,
          },
          {
            path: "search",
            Component: SearchPage,
          },
          {
            path: "settings",
            Component: SettingsPage,
          },
          {
            path: "graphs",
            Component: GraphsPage,
          },
        ],
      },
    ],
  },
]);

export default router;
