import { isRouteErrorResponse, useRouteError } from "react-router";
import Button from "../shared/components/ui/Button.tsx";

export default function RouteErrorPage() {
    const error = useRouteError();
    const routeError = isRouteErrorResponse(error) ? error : null;
    const isNotFound = routeError === null || routeError.status === 404;

    const title = isNotFound ? "Page not found" : "Something went wrong";
    const message = isNotFound
        ? "The page you're looking for doesn't exist or has been moved."
        : "An unexpected error occurred while loading this page. Please try again.";

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-brand-pitch-black-500 px-4 text-center">
            <title>{isNotFound ? "404" : "Error"} | ThreatOff</title>

            <span className="font-nacelle text-4xl font-bold tracking-wide text-brand-brick-red-400">
                {routeError ? routeError.status : "Error"}
            </span>
            <h1 className="mt-2 font-nacelle text-3xl font-semibold text-brand-alabaster-grey-100 md:text-4xl">
                {title}
            </h1>
            <p className="mx-auto mt-3 max-w-md text-brand-alabaster-grey-600/80">
                {message}
            </p>
            <Button href="/" className="mt-8">
                Back to home
            </Button>
        </div>
    );
}
