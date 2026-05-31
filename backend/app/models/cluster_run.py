import uuid
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base
from app.utils.time_utils import utc_now

class ClusterRun(Base):
    __tablename__ = "cluster_runs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    algorithm = Column(String(50), nullable=False, default="pi_calculation")
    tasks = Column(Integer, nullable=False)
    intervals = Column(Integer, nullable=False)
    hosts = Column(JSON, nullable=True)  # List of IPs/worker names used
    calculated_pi = Column(Float, nullable=False)
    error = Column(Float, nullable=False)
    elapsed_time_seconds = Column(Float, nullable=False)
    theoretical_amdahl_speedup = Column(Float, nullable=False)
    theoretical_gustafson_speedup = Column(Float, nullable=False)
    executed_at = Column(DateTime, nullable=False, default=utc_now)
