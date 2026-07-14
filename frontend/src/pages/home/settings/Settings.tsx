import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.tsx";
import Button from "../../../shared/components/ui/Button.tsx";
import { DEFAULT_API_BASE_URL } from "../api.ts";
import { useApiSettings } from "../useApiSettings.ts";

export default function Settings() {
  const { auth, logout } = useAuth();
  const { apiBaseUrl, saveApiBaseUrl } = useApiSettings();
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);

  return (
    <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 max-w-xl rounded-2xl border p-5">
      <div className="mb-4">
        <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
          Connection settings
        </h2>
        <p className="text-brand-alabaster-grey-600 text-sm">
          Configure the API endpoint used for this session.
        </p>
      </div>

      <div className="bg-brand-carbon-black-800/60 text-brand-alabaster-grey-400 mb-4 rounded-lg px-3 py-2 text-sm">
        Signed in as{" "}
        <strong className="text-brand-alabaster-grey-100">
          {auth?.username}
        </strong>
      </div>

      <label className="mb-4 block space-y-1.5 text-sm">
        <span className="text-brand-alabaster-grey-500">API base URL</span>
        <input
          className="w-full rounded-lg border border-brand-carbon-black-700 bg-brand-carbon-black-800 px-3 py-2 text-sm text-brand-alabaster-grey-100 outline-none transition focus:border-brand-light-green-500"
          value={draftApiBaseUrl}
          onChange={(event) => setDraftApiBaseUrl(event.target.value)}
          placeholder={DEFAULT_API_BASE_URL}
        />
      </label>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          size="sm"
          onClick={() => saveApiBaseUrl(draftApiBaseUrl)}
        >
          Save connection
        </Button>
        <Button
          variant="secondary"
          size="sm"
          href={`${apiBaseUrl.replace(/\/api\/v1\/?$/, "")}/docs`}
          target="_blank"
          rel="noreferrer"
        >
          Open Swagger API
        </Button>
        <Button type="button" size="sm" variant="danger" onClick={logout}>
          Sign out
        </Button>
      </div>
    </section>
  );
}
