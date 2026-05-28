"""
Image storage service — MinIO integration for detection images.

Images are stored permanently on the distributed MinIO cluster across Pi 3 workers.
"""

import io
import logging
from datetime import timedelta

from minio import Minio
from minio.error import S3Error

from app.config import settings

logger = logging.getLogger(__name__)


class ImageStorageService:
    """Handles upload/download/deletion of detection images in MinIO."""

    def __init__(self):
        self.client = Minio(
            settings.MINIO_ENDPOINT,
            access_key=settings.MINIO_ACCESS_KEY,
            secret_key=settings.MINIO_SECRET_KEY,
            secure=settings.MINIO_USE_SSL,
        )
        self.bucket = settings.MINIO_BUCKET_DETECTIONS

    def ensure_bucket(self) -> None:
        """Create the detections bucket if it doesn't exist."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                logger.info("Created MinIO bucket: %s", self.bucket)
        except S3Error as e:
            logger.error("Failed to ensure MinIO bucket: %s", e)

    def upload_image_bytes(
        self, storage_key: str, data: bytes, content_type: str = "image/jpeg",
    ) -> None:
        """Upload image bytes to MinIO."""
        self.client.put_object(
            self.bucket,
            storage_key,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )

    def get_presigned_url(self, storage_key: str, expires: timedelta | None = None) -> str:
        """Generate a presigned URL for temporary read access."""
        return self.client.presigned_get_object(
            self.bucket,
            storage_key,
            expires=expires or timedelta(hours=1),
        )

    def get_object_bytes(self, storage_key: str) -> bytes:
        """Download object bytes from MinIO."""
        response = self.client.get_object(self.bucket, storage_key)
        try:
            return response.read()
        finally:
            response.close()
            response.release_conn()

    def delete_object(self, storage_key: str) -> None:
        """Delete an object from MinIO."""
        self.client.remove_object(self.bucket, storage_key)

    def get_storage_stats(self) -> dict:
        """Get storage statistics for the detection bucket."""
        try:
            objects = self.client.list_objects(self.bucket, recursive=True)
            total_size = 0
            total_count = 0
            for obj in objects:
                total_size += obj.size or 0
                total_count += 1
            return {
                "bucket": self.bucket,
                "total_objects": total_count,
                "total_size_bytes": total_size,
            }
        except S3Error as e:
            logger.error("Failed to get storage stats: %s", e)
            return {"bucket": self.bucket, "total_objects": 0, "total_size_bytes": 0}

    def check_connection(self) -> bool:
        """Check if MinIO is reachable."""
        try:
            self.client.list_buckets()
            return True
        except Exception:
            return False
