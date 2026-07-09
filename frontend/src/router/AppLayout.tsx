import { Outlet } from "react-router";
import Logo from "../shared/components/ui/Logo.tsx";
import Button from "../shared/components/ui/Button.tsx";
import { useAuth } from "../features/auth/AuthContext.tsx";

export default function AppLayout() {
    const { auth, logout } = useAuth();

    return (
        <div className="min-h-screen bg-brand-pitch-black-500 font-nacelle text-brand-alabaster-grey-100 antialiased">
            <header className="sticky top-0 z-30 border-b border-brand-carbon-black-800 bg-brand-pitch-black-500/95 backdrop-blur-sm">
                <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
                    <Logo />
                    <div className="flex items-center gap-4">
                        <span className="hidden text-sm text-brand-alabaster-grey-600 sm:inline">
                            {auth?.username}
                        </span>
                        <Button variant="secondary" size="sm" type="button" onClick={logout}>
                            Sign out
                        </Button>
                    </div>
                </div>
            </header>
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <Outlet />
            </main>
        </div>
    );
}
