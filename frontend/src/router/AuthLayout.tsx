import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <div className="bg-brand-pitch-black-500 flex min-h-screen items-center justify-center px-4 py-12">
      <Outlet />
    </div>
  );
}
