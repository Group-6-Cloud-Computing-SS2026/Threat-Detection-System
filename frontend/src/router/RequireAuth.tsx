import { Navigate, Outlet } from "react-router";
import { useAuth } from "../features/auth/AuthContext.tsx";

export default function RequireAuth() {
    const { isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/landing" replace />;
    }

    return <Outlet />;
}
