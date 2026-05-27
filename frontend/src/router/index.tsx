import { createBrowserRouter } from "react-router";
import Root from "./Root.tsx";
import LoginPage from "../features/auth/LoginPage.tsx";
import ProfilePage from "../features/auth/ProfilePage.tsx";
import DocsPage from "../features/docs/DocsPage.tsx";
import HomePage from "../features/home/HomePage.tsx";
import LandingPage from "../features/landing/LandingPage.tsx";
import SettingsPage from "../features/settings/SettingsPage.tsx";

const router = createBrowserRouter([
    {
        path: "/",
        Component: Root,
        children: [
            {
                index: true,
                Component: HomePage,
            },
            {
                path: "landing",
                Component: LandingPage,
            },
            {
                path: "login",
                Component: LoginPage,
            },
            {
                path: "settings",
                Component: SettingsPage,
            },
            {
                path: "profile",
                Component: ProfilePage,
            },
            {
                path: "docs",
                Component: DocsPage,
            },
        ],
    },
]);

export default router;