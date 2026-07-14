import { useCallback } from "react";
import { apiFetch, buildImageUrl } from "./api.ts";
import type {
  CardState,
  DetectionDetail,
  DetectionEvent,
} from "../../shared/types";

export function toCardState(
  item: DetectionEvent,
  apiBaseUrl: string,
): CardState {
  return {
    ...item,
    preview_image_url: buildImageUrl(item.preview_image_url, apiBaseUrl),
    detailLoaded: false,
    imageUrls: {},
    images: [],
  };
}

export function useDetectionDetailLoader(
  apiBaseUrl: string,
  token: string | undefined,
  setEvents: (value: CardState[] | ((current: CardState[]) => CardState[])) => void,
  setError: (value: string | null) => void,
) {
  return useCallback(
    async (eventId: string, events: CardState[]) => {
      const target = events.find((item) => item.id === eventId);
      if (!target || target.detailLoaded) {
        return;
      }

      try {
        const detail = (await apiFetch(
          apiBaseUrl,
          token,
          `/detections/${eventId}`,
        )) as DetectionDetail;
        const imageUrls: Record<string, string> = {};
        const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

        for (const image of detail.images || []) {
          imageUrls[image.id] = `${apiOrigin}/api/v1/images/${image.id}/download`;
        }

        const resolvedPreviewUrl = buildImageUrl(
          detail.preview_image_url,
          apiBaseUrl,
        );
        setEvents((prev) =>
          prev.map((item) =>
            item.id === eventId
              ? {
                  ...item,
                  ...detail,
                  preview_image_url:
                    resolvedPreviewUrl ?? item.preview_image_url,
                  detailLoaded: true,
                  imageUrls,
                }
              : item,
          ),
        );
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to load event detail",
        );
      }
    },
    [apiBaseUrl, setError, setEvents, token],
  );
}
