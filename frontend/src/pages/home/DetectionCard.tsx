import { useState } from "react";
import { formatDateTime, severityClasses } from "./api.ts";
import type { CardState } from "../../shared/types";
import { homeInnerFrameClass, homePanelHoverClass } from "./homeSurface.ts";

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
    <article className={homePanelHoverClass}>
      <button
        type="button"
        className="flex w-full items-center gap-4 p-4 text-left"
        onClick={toggle}
      >
        <div className={`${homeInnerFrameClass} h-16 w-16 shrink-0 overflow-hidden rounded-lg`}>
          {event.preview_image_url ? (
            <img
              className="h-full w-full object-cover"
              src={event.preview_image_url}
              alt={`${event.event_type} preview`}
            />
          ) : (
            <div className="text-brand-alabaster-grey-600 flex h-full w-full items-center justify-center px-1 text-center text-[10px]">
              No image
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <strong className="font-nacelle text-brand-alabaster-grey-100 text-sm font-semibold">
              {event.event_type}
            </strong>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${severityClasses(event.severity)}`}
            >
              {event.severity}
            </span>
            {event.acknowledged ? (
              <span className="bg-brand-carbon-black-700 text-brand-alabaster-grey-500 rounded-full px-2 py-0.5 text-xs">
                acknowledged
              </span>
            ) : (
              <span className="bg-brand-brick-red-950 text-brand-brick-red-300 rounded-full px-2 py-0.5 text-xs">
                new
              </span>
            )}
          </div>
          <p className="text-brand-alabaster-grey-600 mt-1 text-xs">
            {listName === "live" ? "Live feed" : "Search result"} ·{" "}
            {formatDateTime(event.detected_at)}
          </p>
        </div>
        <div className="text-brand-alabaster-grey-600 hidden shrink-0 flex-col items-end text-xs sm:flex">
          <span>{Math.round(event.confidence * 100)}%</span>
          <span>{event.sensor_node_id.slice(0, 8)}</span>
        </div>
      </button>

      {expanded ? (
        <div className="border-brand-carbon-black-700/70 space-y-4 border-t p-4">
          <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-brand-alabaster-grey-600 text-xs">
                Detected
              </dt>
              <dd className="text-brand-alabaster-grey-200">
                {formatDateTime(event.detected_at)}
              </dd>
            </div>
            <div>
              <dt className="text-brand-alabaster-grey-600 text-xs">
                Received
              </dt>
              <dd className="text-brand-alabaster-grey-200">
                {formatDateTime(event.received_at)}
              </dd>
            </div>
            <div>
              <dt className="text-brand-alabaster-grey-600 text-xs">Created</dt>
              <dd className="text-brand-alabaster-grey-200">
                {formatDateTime(event.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-brand-alabaster-grey-600 text-xs">Sensor</dt>
              <dd className="text-brand-alabaster-grey-200 truncate">
                {event.sensor_node_id}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="text-brand-alabaster-grey-500 mb-1 text-xs font-medium">
              Raw detections
            </h3>
            <pre className="bg-brand-pitch-black-500 text-brand-alabaster-grey-400 overflow-x-auto rounded-lg p-3 text-xs">
              {JSON.stringify(event.raw_detections || {}, null, 2)}
            </pre>
          </div>

          <div>
            <h3 className="text-brand-alabaster-grey-500 mb-1 text-xs font-medium">
              Metadata
            </h3>
            <pre className="bg-brand-pitch-black-500 text-brand-alabaster-grey-400 overflow-x-auto rounded-lg p-3 text-xs">
              {JSON.stringify(event.metadata || {}, null, 2)}
            </pre>
          </div>

          {event.images && event.images.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {event.images.map((image) => (
                <figure
                  key={image.id}
                className={homeInnerFrameClass + " overflow-hidden rounded-lg"}
              >
                  <img
                    className="aspect-video w-full object-cover"
                    src={event.imageUrls?.[image.id]}
                    alt={image.image_type}
                  />
                  <figcaption className="p-2 text-xs">
                    <strong className="text-brand-alabaster-grey-200 block">
                      {image.image_type}
                    </strong>
                    <span className="text-brand-alabaster-grey-600 truncate">
                      {image.storage_key}
                    </span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-brand-alabaster-grey-600 text-xs">
              No stored image loaded yet.
            </p>
          )}
        </div>
      ) : null}
    </article>
  );
}
