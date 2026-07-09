import { Outlet } from "react-router";

export default function AuthLayout() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-brand-pitch-black-500 px-4 py-12">
            <Outlet />
        </div>
    );
}
