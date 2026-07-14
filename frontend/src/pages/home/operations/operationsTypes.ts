import type { ReactNode } from "react";
import type { DetectionEvent, PaginatedResponse } from "../../../shared/types";

export type DashboardSummary = {
  detection_stats: {
    total_events: number;
    by_type: Record<string, number>;
    by_severity: Record<string, number>;
    by_sensor: Record<string, number>;
    unacknowledged_count: number;
  };
  cluster_health: {
    total_nodes: number;
    online_nodes: number;
    offline_nodes: number;
  };
  unread_notifications: number;
  recent_detections: Array<{
    id: string;
    event_type: string;
    severity: string;
    confidence: number;
    detected_at: string;
    acknowledged: boolean;
  }>;
};

export type SystemLog = {
  id: string;
  sensor_node_id: string | null;
  level: string;
  source: string;
  message: string;
  context: Record<string, unknown> | null;
  logged_at: string;
  created_at: string;
};

export type NotificationItem = {
  id: string;
  detection_event_id: string | null;
  channel: string;
  notification_type: string;
  status: string;
  message_body: string;
  response_data: Record<string, unknown> | null;
  retry_count: number;
  sent_at: string | null;
  created_at: string;
};

export type HealthNode = {
  id: string;
  name: string;
  status: string;
  ip_address: string;
  last_heartbeat: string | null;
  health: {
    cpu: number | null;
    memory: number | null;
    disk: number | null;
    temp: number | null;
    fps: number | null;
  } | null;
};

export type InfrastructureStatus = {
  overall_status: string;
  api: {
    status: string;
    version: string;
  };
  database: {
    status: string;
  };
  minio: {
    status: string;
    endpoint?: string;
    total_bytes?: number;
    used_bytes?: number;
    free_bytes?: number;
    used_percent?: number;
    error?: string;
  };
  mqtt: {
    status: string;
    broker_host: string;
    broker_port: number;
  };
  nodes_summary: {
    total: number;
    online: number;
    offline: number;
    maintenance: number;
  };
  nodes: HealthNode[];
};

export type ServiceStatus = {
  name: string;
  status: string;
  host?: string;
  endpoint?: string;
  port?: number;
};

export type StorageStatus = {
  status: string;
  error?: string;
  total_bytes?: number;
  used_bytes?: number;
  free_bytes?: number;
  used_percent?: number;
};

export type ClusterRun = {
  id: string;
  algorithm: string;
  tasks: number;
  intervals: number;
  hosts: unknown;
  calculated_pi: number;
  error: number;
  elapsed_time_seconds: number;
  theoretical_amdahl_speedup: number;
  theoretical_gustafson_speedup: number;
  executed_at: string;
};

export type ClusterProjection = {
  num_procs: number;
  parallel_fraction: number;
  theoretical_amdahl_speedup: number;
  theoretical_gustafson_speedup: number;
  amdahl_efficiency_percent: number;
  gustafson_efficiency_percent: number;
};

export type UserProfile = {
  id: string;
  username: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConsoleData = {
  summary: DashboardSummary | null;
  detections: DetectionEvent[] | null;
  logs: PaginatedResponse<SystemLog> | null;
  notifications: PaginatedResponse<NotificationItem> | null;
  infra: InfrastructureStatus | null;
  services: ServiceStatus[] | null;
  storage: StorageStatus | null;
  clusterHistory: ClusterRun[] | null;
  clusterComparison: {
    parallel_fraction: number;
    max_procs: number;
    projections: ClusterProjection[];
  } | null;
  auth: UserProfile | null;
  metrics: string | null;
};

export type ConsoleSection =
  | "summary"
  | "detections"
  | "logs"
  | "nodes"
  | "notifications"
  | "infrastructure"
  | "cluster"
  | "auth"
  | "metrics";

export type SectionNavItem = {
  id: ConsoleSection;
  label: string;
  icon: ReactNode;
};

