type LoginResponse = {
  access_token?: string;
  detail?: string;
} | null;

type RegisterResponse = {
  detail?: string;
};

export async function loginWithCredentials(
  apiBaseUrl: string,
  username: string,
  password: string,
) {
  const response = await fetch(`${apiBaseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await response.json().catch(() => null)) as LoginResponse;

  if (!response.ok || !data?.access_token) {
    throw new Error(
      data?.detail ??
        `Sign-in failed (${response.status}). Is the API reachable at "${apiBaseUrl}"?`,
    );
  }

  return data.access_token;
}

export async function registerAccount(
  apiBaseUrl: string,
  payload: {
    username: string;
    email: string;
    password: string;
    role: string;
  },
) {
  const response = await fetch(`${apiBaseUrl}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = (await response.json().catch(() => ({}))) as RegisterResponse;

  if (!response.ok) {
    throw new Error(
      data.detail ??
        `Registration failed (${response.status}). Is the API reachable at "${apiBaseUrl}"?`,
    );
  }
}
