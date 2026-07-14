export type TagUrl = {
  tag: string;
  url: URL;
};

export type DetectionEvent = {
  id: string;
  sensor_node_id: string;
  event_type: string;
  severity: "low" | "medium" | "high" | "critical" | string;
  confidence: number;
  raw_detections: Record<string, unknown> | null;
  metadata: Record<string, unknown> | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  detected_at: string;
  received_at: string;
  created_at: string;
  preview_image_url: string | null;
};

export type DetectionImage = {
  id: string;
  detection_event_id: string;
  storage_key: string;
  bucket: string;
  content_type: string;
  file_size_bytes: number | null;
  image_type: string;
  captured_at: string;
  uploaded_at: string;
};

export type DetectionDetail = DetectionEvent & {
  sensor_name?: string | null;
  sensor_location?: string | null;
  images: DetectionImage[];
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  skip: number;
  limit: number;
};

export type QueryState = {
  eventType: string;
  severity: string;
  sensorId: string;
  acknowledged: string;
  startTime: string;
  endTime: string;
  skip: string;
  limit: string;
};

export type CardState = DetectionDetail & {
  detailLoaded: boolean;
  imageUrls: Record<string, string>;
};

export type AuthMode = "login" | "register";
