import { useState } from "react";
import { formatDateTime, severityClasses } from "./api.ts";
import type { CardState } from "../../shared/types";

export default function DetectionCard({
    event,
    listName,
    onToggle,
}: {
    event: CardState;
    listName: "live" | "search";
    onToggle: () => void;
}) {
    const [expanded, setExpanded] = useState(false);

    function toggle() {
        setExpanded((value) => !value);
        if (!expanded) {
            onToggle();
        }
    }

    return (
        <article className="overflow-hidden rounded-2xl border border-brand-carbon-black-800 bg-brand-carbon-black-900/60">
            <button type="button" className="flex w-full items-center gap-4 p-4 text-left" onClick={toggle}>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-brand-carbon-black-800">
                    {event.preview_image_url ? (
                        <img
                            className="h-full w-full object-cover"
                            src={event.preview_image_url}
                            alt={`${event.event_type} preview`}
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center px-1 text-center text-[10px] text-brand-alabaster-grey-600">
                            No image
                        </div>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <strong className="font-nacelle text-sm font-semibold text-brand-alabaster-grey-100">
                            {event.event_type}
                        </strong>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClasses(event.severity)}`}>
                            {event.severity}
                        </span>
                        {event.acknowledged ? (
                            <span className="rounded-full bg-brand-carbon-black-700 px-2 py-0.5 text-xs text-brand-alabaster-grey-500">
                                acknowledged
                            </span>
                        ) : (
                            <span className="rounded-full bg-brand-brick-red-950 px-2 py-0.5 text-xs text-brand-brick-red-300">
                                new
                            </span>
                        )}
                    </div>
                    <p className="mt-1 text-xs text-brand-alabaster-grey-600">
                        {listName === "live" ? "Live feed" : "Search result"} · {formatDateTime(event.detected_at)}
                    </p>
                </div>
                <div className="hidden shrink-0 flex-col items-end text-xs text-brand-alabaster-grey-600 sm:flex">
                    <span>{Math.round(event.confidence * 100)}%</span>
                    <span>{event.sensor_node_id.slice(0, 8)}</span>
                </div>
            </button>

            {expanded ? (
                <div className="space-y-4 border-t border-brand-carbon-black-800 p-4">
                    <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                        <div>
                            <dt className="text-xs text-brand-alabaster-grey-600">Detected</dt>
                            <dd className="text-brand-alabaster-grey-200">{formatDateTime(event.detected_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-brand-alabaster-grey-600">Received</dt>
                            <dd className="text-brand-alabaster-grey-200">{formatDateTime(event.received_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-brand-alabaster-grey-600">Created</dt>
                            <dd className="text-brand-alabaster-grey-200">{formatDateTime(event.created_at)}</dd>
                        </div>
                        <div>
                            <dt className="text-xs text-brand-alabaster-grey-600">Sensor</dt>
                            <dd className="truncate text-brand-alabaster-grey-200">{event.sensor_node_id}</dd>
                        </div>
                    </dl>

                    <div>
                        <h3 className="mb-1 text-xs font-medium text-brand-alabaster-grey-500">Raw detections</h3>
                        <pre className="overflow-x-auto rounded-lg bg-brand-pitch-black-500 p-3 text-xs text-brand-alabaster-grey-400">
                            {JSON.stringify(event.raw_detections || {}, null, 2)}
                        </pre>
                    </div>

                    <div>
                        <h3 className="mb-1 text-xs font-medium text-brand-alabaster-grey-500">Metadata</h3>
                        <pre className="overflow-x-auto rounded-lg bg-brand-pitch-black-500 p-3 text-xs text-brand-alabaster-grey-400">
                            {JSON.stringify(event.metadata || {}, null, 2)}
                        </pre>
                    </div>

                    {event.images && event.images.length > 0 ? (
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {event.images.map((image) => (
                                <figure key={image.id} className="overflow-hidden rounded-lg border border-brand-carbon-black-800">
                                    <img
                                        className="aspect-video w-full object-cover"
                                        src={event.imageUrls?.[image.id]}
                                        alt={image.image_type}
                                    />
                                    <figcaption className="p-2 text-xs">
                                        <strong className="block text-brand-alabaster-grey-200">{image.image_type}</strong>
                                        <span className="truncate text-brand-alabaster-grey-600">{image.storage_key}</span>
                                    </figcaption>
                                </figure>
                            ))}
                        </div>
                    ) : (
                        <p className="text-xs text-brand-alabaster-grey-600">No stored image loaded yet.</p>
                    )}
                </div>
            ) : null}
        </article>
    );
}
