import { Outlet } from "react-router";
import { useEffect } from "react";
import AOS from "aos";
import { useAos } from "../../shared/hooks";

export default function AuthLayout() {
  useAos();

  useEffect(() => {
    AOS.refreshHard();
  }, []);

  return (
    <div
      className="bg-brand-pitch-black-950 flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      style={{
        backgroundImage:
          "radial-gradient(circle at top left, rgba(128, 239, 128, 0.10) 0%, transparent 28%), radial-gradient(circle at bottom right, rgba(187, 10, 33, 0.08) 0%, transparent 24%), linear-gradient(180deg, rgba(6, 6, 6, 0.98) 0%, rgba(10, 10, 10, 0.97) 52%, rgba(8, 8, 8, 0.99) 100%)",
      }}
    >
      <div className="flex w-full justify-center">
        <Outlet />
      </div>
    </div>
  );
}
