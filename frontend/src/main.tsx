import './shared/css/style.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from "react-router/dom";
import { AuthProvider } from "./features/auth/AuthContext.tsx";
import router from "./router";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
      <AuthProvider>
          <RouterProvider router={router} />
      </AuthProvider>
  </StrictMode>,
)
