const docsUrl: URL = new URL(
    "https://group-6-cloud-computing-ss2026.github.io/Threat-Detection-System/",
);

export default function DocsPage() {
    return (
        <>
            <title>Docs | Threat Detection System</title>
            <meta property="og:title" content="Docs | Threat Detection System" />
            <meta
                name="description"
                content="Redirecting to the Threat Detection System documentation."
            />
            <meta
                httpEquiv="refresh"
                content={`3;url=${docsUrl.href}`}
            />

            <section>
                <h1 className="text-3xl font-bold">Redirecting...</h1>
            </section>
        </>
    );
}
