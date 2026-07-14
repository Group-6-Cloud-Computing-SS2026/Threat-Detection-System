import type { SubmitEvent } from "react";
import { useState } from "react";
import {
  loginWithCredentials,
  registerAccount,
} from "../../pages/auth/authApi.ts";

type AuthRequestsDeps = {
  apiBaseUrl: string;
  username: string;
  email: string;
  password: string;
  role: string;
  onLoginSuccess: (token: string, username: string) => void;
  onRegisterSuccess?: () => void;
};

export function useAuthRequests({
  apiBaseUrl,
  username,
  email,
  password,
  role,
  onLoginSuccess,
  onRegisterSuccess,
}: AuthRequestsDeps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleLogin(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = await loginWithCredentials(apiBaseUrl, username, password);
      onLoginSuccess(token, username);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid username or password.",
      );
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
      await registerAccount(apiBaseUrl, {
        username,
        email,
        password,
        role,
      });
      setSuccess("Account created. You can sign in now.");
      onRegisterSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    isSubmitting,
    error,
    success,
    clearMessages: () => {
      setError(null);
      setSuccess(null);
    },
    setError,
    setSuccess,
    handleLogin,
    handleRegister,
  };
}
