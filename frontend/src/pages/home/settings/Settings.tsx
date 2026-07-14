import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.tsx";
import Button from "../../../shared/components/ui/Button.tsx";
import { DEFAULT_API_BASE_URL } from "../api.ts";
import { useApiSettings } from "../useApiSettings.ts";
import { homeInnerFrameClass } from "../homeSurface.ts";

export default function Settings() {
  const { auth, logout } = useAuth();
  const { apiBaseUrl, saveApiBaseUrl } = useApiSettings();
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);

  return (
    <>
      <div className="mb-4" data-aos="fade-up">
        <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
          Connection settings
        </h2>
        <p className="text-brand-alabaster-grey-600 text-sm">
          Configure the API endpoint used for this session.
        </p>
      </div>

      <div
        className={`${homeInnerFrameClass} text-brand-alabaster-grey-400 mb-4 rounded-lg px-3 py-2 text-sm`}
        data-aos="fade-up"
        data-aos-delay={100}
      >
        Signed in as{" "}
        <strong className="text-brand-alabaster-grey-100">
          {auth?.username}
        </strong>
      </div>

      <label className="mb-4 block space-y-1.5 text-sm" data-aos="fade-up" data-aos-delay={160}>
        <span className="text-brand-alabaster-grey-500">API base URL</span>
        <input
          className="border-brand-carbon-black-700 bg-brand-carbon-black-800 text-brand-alabaster-grey-100 focus:border-brand-light-green-500 w-full rounded-lg border px-3 py-2 text-sm transition outline-none"
          value={draftApiBaseUrl}
          onChange={(event) => setDraftApiBaseUrl(event.target.value)}
          placeholder={DEFAULT_API_BASE_URL}
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap" data-aos="fade-up" data-aos-delay={220}>
        <Button
          type="button"
          size="sm"
          onClick={() => saveApiBaseUrl(draftApiBaseUrl)}
          className="w-full sm:w-auto"
        >
          Save connection
        </Button>
        <Button
          variant="secondary"
          size="sm"
          href={`${apiBaseUrl.replace(/\/api\/v1\/?$/, "")}/docs`}
          target="_blank"
          rel="noreferrer"
          className="w-full sm:w-auto"
        >
          Open Swagger API
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          onClick={logout}
          className="w-full sm:w-auto"
        >
          Sign out
        </Button>
      </div>
    </>
  );
}
