from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.models.user import User
from app.services.mpi_service import MPIService

router = APIRouter(prefix="/cluster", tags=["MPI Cluster"])

class MPIRunRequest(BaseModel):
    tasks: int = Field(default=2, ge=1, le=64, description="Number of parallel processes (np)")
    intervals: int = Field(default=100000000, ge=1000, description="Steps for calculating Pi (problem size)")
    hosts: Optional[List[str]] = Field(
        default=None, 
        description="List of cluster nodes/IPs. E.g., ['192.168.1.58', '192.168.1.54'] or ['worker1', 'worker2']"
    )
    parallel_fraction: float = Field(
        default=0.98, ge=0.5, le=1.0, 
        description="Parallel fraction (P) of the program to calculate Amdahl's Law speedup"
    )

class ScalingLawsResponse(BaseModel):
    num_procs: int
    parallel_fraction: float
    theoretical_amdahl_speedup: float
    theoretical_gustafson_speedup: float
    amdahl_efficiency_percent: float
    gustafson_efficiency_percent: float

@router.get("/mpi/verify", summary="Verify MPI Installation")
async def verify_mpi(
    _: User = Depends(get_current_user)
):
    """Check if mpi compiler and runner tools are installed on the Host."""
    service = MPIService()
    result = await service.verify_mpi_installed()
    return result

@router.post("/mpi/compile", summary="Compile MPI Benchmark Binary")
async def compile_mpi(
    _: User = Depends(get_current_user)
):
    """Compile the C MPI Monte Carlo integration program into the shared NFS directory."""
    service = MPIService()
    result = await service.compile_mpi_program()
    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compile MPI binary: {result.get('error')}"
        )
    return result

@router.post("/mpi/run", summary="Run MPI Cluster Benchmark")
async def run_mpi_benchmark(
    request: MPIRunRequest,
    _: User = Depends(get_current_user)
):
    """
    Run a parallel Monte Carlo Pi integration calculation using MPI.
    Orchestrates the job across selected worker nodes, measuring timing and scaling laws.
    """
    service = MPIService()
    
    # Verify installation first
    verify = await service.verify_mpi_installed()
    if not verify.get("cluster_ready"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="MPI tools are not fully installed or accessible on this system."
        )

    # Trigger run
    result = await service.run_mpi_pi(
        tasks=request.tasks,
        intervals=request.intervals,
        hosts=request.hosts,
        parallel_fraction=request.parallel_fraction
    )

    if not result.get("success"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"MPI Execution Failed: {result.get('error')}. Command run: {result.get('command')}"
        )

    return result

@router.get("/mpi/scaling-comparison", summary="Get Scaling Law Projections")
async def get_scaling_laws_comparison(
    parallel_fraction: float = 0.98,
    max_procs: int = 16,
    _: User = Depends(get_current_user)
):
    """
    Generate theoretical scaling speedups (Amdahl's and Gustafson's laws)
    across a range of processor counts for comparison charts.
    """
    projections = []
    for procs in range(1, max_procs + 1):
        # Amdahl's Speedup: 1 / ((1 - P) + P/N)
        amdahl_speedup = 1.0 / ((1.0 - parallel_fraction) + (parallel_fraction / procs))
        # Gustafson's Speedup: 1 - P + P*N
        gustafson_speedup = (1.0 - parallel_fraction) + (parallel_fraction * procs)

        projections.append({
            "num_procs": procs,
            "parallel_fraction": parallel_fraction,
            "theoretical_amdahl_speedup": round(amdahl_speedup, 4),
            "theoretical_gustafson_speedup": round(gustafson_speedup, 4),
            "amdahl_efficiency_percent": round((amdahl_speedup / procs) * 100, 2),
            "gustafson_efficiency_percent": round((gustafson_speedup / procs) * 100, 2)
        })

    return {
        "parallel_fraction": parallel_fraction,
        "max_procs": max_procs,
        "projections": projections
    }
