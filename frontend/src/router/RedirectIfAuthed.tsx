import { Navigate, Outlet } from "react-router";
import { useAuth } from "../features/auth/AuthContext.tsx";

export default function RedirectIfAuthed() {
    const { isAuthenticated } = useAuth();

    if (isAuthenticated) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
