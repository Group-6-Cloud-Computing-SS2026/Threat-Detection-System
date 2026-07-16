"""
Metrics router — Prometheus-format metrics endpoint.
"""

from fastapi import APIRouter

router = APIRouter(tags=["Metrics"])

