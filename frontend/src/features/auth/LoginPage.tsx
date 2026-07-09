import { useState, type SubmitEvent } from "react";
import { NavLink, useNavigate, useSearchParams } from "react-router";
import Button from "../../shared/components/ui/Button.tsx";
import { useApiSettings } from "../home/useApiSettings.ts";
import { useAuth } from "./AuthContext.tsx";

const inputClass =
    "w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-gray-900 outline-none transition focus:border-brand-light-green-600 focus:ring-2 focus:ring-brand-light-green-600/20";
const labelClass = "text-sm font-medium text-gray-700";

type Tab = "login" | "register";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { apiBaseUrl } = useApiSettings();
    const [searchParams] = useSearchParams();

    const [tab, setTab] = useState<Tab>(searchParams.get("tab") === "register" ? "register" : "login");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState("viewer");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    function switchTab(next: Tab) {
        setTab(next);
        setError(null);
        setSuccess(null);
    }

    async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(`${apiBaseUrl}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = (await response.json()) as { access_token?: string; detail?: string };
            if (!response.ok || !data.access_token) {
                throw new Error(data.detail ?? `${response.status} ${response.statusText}`);
            }

            login(data.access_token, username);
            navigate("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Invalid username or password.");
        } finally {
            setIsSubmitting(false);
        }
    }

    async function handleRegister(event: SubmitEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        try {
            const response = await fetch(`${apiBaseUrl}/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, email, password, role }),
            });
            const data = (await response.json().catch(() => ({}))) as { detail?: string };
            if (!response.ok) {
                throw new Error(data.detail ?? `${response.status} ${response.statusText}`);
            }

            setSuccess("Account created! You can now sign in.");
            switchTab("login");
            setPassword("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Registration failed.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <title>{tab === "login" ? "Login" : "Register"} | Threat Detection System</title>
            <meta property="og:title" content="Login | Threat Detection System" />
            <meta
                name="description"
                content="Sign in to access the Threat Detection System dashboard."
            />

            <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
                <NavLink to="/landing" className="mb-8 flex justify-center">
                    <img src="/images/wordmark-light.svg" alt="ThreatOff" className="h-8 w-auto" />
                </NavLink>

                <h1 id="login-title" className="mb-1 text-center text-xl font-semibold text-gray-900">
                    {tab === "login" ? "Welcome back" : "Create an account"}
                </h1>
                <p className="mb-6 text-center text-sm text-gray-500">
                    {tab === "login" ? "Sign in to access your dashboard" : "Join the ThreatOff monitoring team"}
                </p>

                <div className="mb-6 flex rounded-lg bg-gray-100 p-1 text-sm font-medium">
                    <button
                        type="button"
                        onClick={() => switchTab("login")}
                        className={`flex-1 rounded-md py-1.5 transition ${
                            tab === "login" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                        }`}
                    >
                        Sign In
                    </button>
                    <button
                        type="button"
                        onClick={() => switchTab("register")}
                        className={`flex-1 rounded-md py-1.5 transition ${
                            tab === "register" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                        }`}
                    >
                        Register
                    </button>
                </div>

                {success && (
                    <div className="mb-4 rounded-lg bg-brand-light-green-50 px-3 py-2 text-sm text-brand-light-green-700" role="status">
                        {success}
                    </div>
                )}
                {error && (
                    <div
                        id="login-message"
                        className="mb-4 rounded-lg bg-brand-brick-red-50 px-3 py-2 text-sm text-brand-brick-red-600"
                        role="alert"
                        aria-live="polite"
                    >
                        {error}
                    </div>
                )}

                {tab === "login" ? (
                    <form className="space-y-4" onSubmit={handleLogin} aria-labelledby="login-title" noValidate>
                        <div className="space-y-1.5">
                            <label htmlFor="username" className={labelClass}>
                                Username
                            </label>
                            <input
                                id="username"
                                type="text"
                                placeholder="Who are you?"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="password" className={labelClass}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <Button type="submit" disabled={isSubmitting} fullWidth>
                            {isSubmitting ? "Signing in..." : "Sign In"}
                        </Button>
                    </form>
                ) : (
                    <form className="space-y-4" onSubmit={handleRegister} aria-labelledby="login-title" noValidate>
                        <div className="space-y-1.5">
                            <label htmlFor="reg-username" className={labelClass}>
                                Username
                            </label>
                            <input
                                id="reg-username"
                                type="text"
                                autoComplete="username"
                                required
                                value={username}
                                onChange={(event) => setUsername(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="reg-email" className={labelClass}>
                                Email
                            </label>
                            <input
                                id="reg-email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="reg-password" className={labelClass}>
                                Password
                            </label>
                            <input
                                id="reg-password"
                                type="password"
                                autoComplete="new-password"
                                required
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                className={inputClass}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="reg-role" className={labelClass}>
                                Role
                            </label>
                            <select
                                id="reg-role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                className={inputClass}
                            >
                                <option value="viewer">Viewer</option>
                                <option value="operator">Operator</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <Button type="submit" disabled={isSubmitting} fullWidth>
                            {isSubmitting ? "Creating account..." : "Create account"}
                        </Button>
                    </form>
                )}
            </div>
        </>
    );
}
