import { isRouteErrorResponse, useRouteError } from "react-router";
import Button from "../shared/components/ui/Button.tsx";

export default function RouteErrorPage() {
  const error = useRouteError();
  const routeError = isRouteErrorResponse(error) ? error : null;
  const isNotFound = routeError === null || routeError.status === 404;
  const isEmbedded = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const title = isNotFound ? "Page not found" : "Something went wrong";
  const message = isNotFound
    ? "The page you're looking for doesn't exist or has been moved."
    : "An unexpected error occurred while loading this page. Please try again.";

  return (
    <div className="bg-brand-pitch-black-500 flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <title>{isNotFound ? "404" : "Error"} | ThreatOff</title>

      <span className="font-nacelle text-brand-brick-red-400 text-4xl font-bold tracking-wide">
        {routeError ? routeError.status : "Error"}
      </span>
      <h1 className="font-nacelle text-brand-alabaster-grey-100 mt-2 text-3xl font-semibold md:text-4xl">
        {title}
      </h1>
      <p className="text-brand-alabaster-grey-600/80 mx-auto mt-3 max-w-md">
        {message}
      </p>
      {!isEmbedded && (
        <Button href="/" className="mt-8">
          Back to Home
        </Button>
      )}
    </div>
  );
}
