import { useState } from "react";

export function useAuthFields() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("viewer");

  function resetPassword() {
    setPassword("");
  }

  return {
    username,
    email,
    password,
    role,
    setUsername,
    setEmail,
    setPassword,
    setRole,
    resetPassword,
  };
}
