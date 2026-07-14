import { createBrowserRouter } from "react-router";
import Root from "./Root.tsx";
import AuthLayout from "../pages/auth/AuthLayout.tsx";
import HomeLayout from "../pages/home/HomeLayout.tsx";
import RequireAuth from "./RequireAuth.tsx";
import RedirectIfAuthed from "./RedirectIfAuthed.tsx";
import RouteErrorPage from "./RouteErrorPage.tsx";
import LoginPage from "../pages/auth/LoginPage.tsx";
import DocsPage from "../pages/docs/DocsPage.tsx";
import HomePage from "../pages/home/HomePage.tsx";
import SearchPage from "../pages/home/search/SearchPage.tsx";
import SettingsPage from "../pages/home/settings/SettingsPage.tsx";
import GraphsPage from "../pages/home/graphs/GraphsPage.tsx";
import CameraStreamPage from "../pages/home/camera/CameraStreamPage.tsx";
import LandingPage from "../pages/landing/LandingPage.tsx";

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
