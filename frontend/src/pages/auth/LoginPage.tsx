import { useNavigate, useSearchParams } from "react-router";
import type { AuthMode } from "../../shared/types";
import { useAuth } from "./AuthContext.tsx";
import { useApiSettings } from "../home/useApiSettings.ts";
import AuthHeader from "./AuthHeader.tsx";
import AuthMessages from "./AuthMessages.tsx";
import AuthSidebar from "./AuthSidebar.tsx";
import LoginForm from "./LoginForm.tsx";
import ModeToggle from "./ModeToggle.tsx";
import RegisterForm from "./RegisterForm.tsx";
import { useAuthFields } from "./useAuthFields.ts";
import { useAuthMode } from "./useAuthMode.ts";
import { useAuthRequests } from "./useAuthRequests.ts";
import { usePanelHeight } from "../../shared/hooks";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { apiBaseUrl } = useApiSettings();
  const [searchParams] = useSearchParams();

  const initialMode: AuthMode =
    searchParams.get("tab") === "register" ? "register" : "login";

  const { mode, switchMode } = useAuthMode(initialMode);
  const { panelRef, panelHeight } = usePanelHeight(mode);
  const {
    username,
    email,
    password,
    role,
    setUsername,
    setEmail,
    setPassword,
    setRole,
    resetPassword,
  } = useAuthFields();
  const {
    isSubmitting,
    error,
    success,
    clearMessages,
    handleLogin,
    handleRegister,
  } = useAuthRequests({
    apiBaseUrl,
    username,
    email,
    password,
    role,
    onLoginSuccess: (token: string, username: string) => {
      login(token, username);
      navigate("/");
    },
    onRegisterSuccess: () => {
      resetPassword();
      switchMode("login");
    },
  });
  function handleModeChange(nextMode: AuthMode) {
    clearMessages();
    switchMode(nextMode);
  }

  return (
    <>
      <div
        className="border-brand-carbon-black-700/80 bg-brand-carbon-black-900/95 relative w-full max-w-304 overflow-hidden rounded-[28px] border shadow-[0_28px_90px_rgba(0,0,0,0.62)] backdrop-blur-xl transition-[max-width,height,box-shadow,transform,opacity] duration-500 ease-out"
        style={panelHeight ? { height: `${panelHeight}px` } : undefined}
      >
        <div className="via-brand-light-green-500/70 motion-safe:animate-auth-sweep pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent to-transparent motion-safe:bg-size-[200%_100%]" />
        <div ref={panelRef} className="grid lg:grid-cols-[1.05fr_0.95fr]">
          <AuthSidebar />

          <section className="bg-brand-pitch-black-950/92 p-6 sm:p-8 lg:p-10" data-aos="fade-left" data-aos-delay={100}>
            <div className="mb-8 flex items-center gap-3 lg:hidden" data-aos="fade-up">
              <img src="/favicon.svg" alt="ThreatOff" className="h-11 w-11" />
              <div>
                <div className="text-brand-alabaster-grey-100 text-sm font-semibold tracking-[0.16em] uppercase">
                  ThreatOff
                </div>
                <div className="text-brand-alabaster-grey-600 text-sm">
                  Secure access portal
                </div>
              </div>
            </div>

            <AuthHeader mode={mode} />
            <ModeToggle mode={mode} onChange={handleModeChange} />
            <AuthMessages error={error} success={success} />

            <div key={mode} className="motion-safe:animate-auth-fade" data-aos="fade-up" data-aos-delay={200}>
              {mode === "register" ? (
                <RegisterForm
                  username={username}
                  email={email}
                  password={password}
                  role={role}
                  isSubmitting={isSubmitting}
                  onUsernameChange={setUsername}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onRoleChange={setRole}
                  onSubmit={handleRegister}
                />
              ) : (
                <LoginForm
                  username={username}
                  password={password}
                  isSubmitting={isSubmitting}
                  onUsernameChange={setUsername}
                  onPasswordChange={setPassword}
                  onSubmit={handleLogin}
                />
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
