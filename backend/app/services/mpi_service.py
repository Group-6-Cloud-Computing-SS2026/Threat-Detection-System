import asyncio
import logging
import os
import re
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)

class MPIService:
    """Service to compile, orchestrate, and execute MPI jobs on the Raspberry Pi cluster."""

    def __init__(self, binary_dir: str = "/home/cc123/pi-cluster"):
        self.binary_dir = binary_dir
        self.source_path = "/app/mpi/mpi_pi.c"  # Path in container / local repo
        # Shared execution path on host/workers (located in the NFS golden image space)
        self.shared_binary_path = "/home/cc123/pi-cluster/mpi_pi"

    async def verify_mpi_installed(self) -> Dict[str, Any]:
        """Check if MPI compiler and runner are available on the system."""
        try:
            proc_mpicc = await asyncio.create_subprocess_exec(
                "which", "mpicc",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout_mpicc, _ = await proc_mpicc.communicate()
            mpicc_exists = proc_mpicc.returncode == 0

            proc_mpirun = await asyncio.create_subprocess_exec(
                "which", "mpirun",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout_mpirun, _ = await proc_mpirun.communicate()
            mpirun_exists = proc_mpirun.returncode == 0

            return {
                "mpicc": {
                    "available": mpicc_exists,
                    "path": stdout_mpicc.decode().strip() if mpicc_exists else None
                },
                "mpirun": {
                    "available": mpirun_exists,
                    "path": stdout_mpirun.decode().strip() if mpirun_exists else None
                },
                "cluster_ready": mpicc_exists and mpirun_exists
            }
        except Exception as e:
            logger.error("Failed to check MPI tools: %s", e)
            return {
                "mpicc": {"available": False, "path": None},
                "mpirun": {"available": False, "path": None},
                "cluster_ready": False,
                "error": str(e)
            }

    async def compile_mpi_program(self) -> Dict[str, Any]:
        """Ensure the MPI binary is compiled and placed in the shared NFS directory."""
        # Note: If running inside Docker, compilation might fail if mpicc is not in the container.
        # So we log and support running compiling directly or assuming pre-compiled state.
        try:
            if not os.path.exists(os.path.dirname(self.shared_binary_path)):
                os.makedirs(os.path.dirname(self.shared_binary_path), exist_ok=True)

            source_file = "/app/mpi/mpi_pi.c" if os.path.exists("/app/mpi/mpi_pi.c") else "mpi/mpi_pi.c"
            
            logger.info("Compiling MPI source %s to %s", source_file, self.shared_binary_path)
            proc = await asyncio.create_subprocess_exec(
                "mpicc", source_file, "-o", self.shared_binary_path, "-lm",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()

            if proc.returncode != 0:
                error_msg = stderr.decode().strip()
                logger.error("MPI compilation failed: %s", error_msg)
                return {"success": False, "error": error_msg}

            logger.info("MPI Program compiled successfully.")
            return {"success": True, "binary_path": self.shared_binary_path}
        except Exception as e:
            logger.error("Exception during MPI compilation: %s", e)
            return {"success": False, "error": str(e)}

    async def run_mpi_pi(
        self,
        tasks: int,
        intervals: int = 100000000,
        hosts: Optional[List[str]] = None,
        parallel_fraction: float = 0.98
    ) -> Dict[str, Any]:
        """
        Execute the parallel Pi calculation across the specified hosts.
        Uses mpirun to orchestrate the worker nodes.
        """
        # Build mpirun command
        # Syntax: mpirun -np {tasks} [-host {hosts}] {binary} {intervals}
        cmd = ["mpirun", "-np", str(tasks)]
        
        if hosts and len(hosts) > 0:
            # Join host names/IPs with commas
            cmd.extend(["-host", ",".join(hosts)])
        else:
            # Fallback to local execution if no cluster hosts provided
            cmd.extend(["--allow-run-as-root"])

        cmd.extend([self.shared_binary_path, str(intervals)])

        logger.info("Executing MPI command: %s", " ".join(cmd))
        
        start_time = asyncio.get_event_loop().time()
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            stdout, stderr = await proc.communicate()
            end_time = asyncio.get_event_loop().time()
            
            elapsed_wall_time = end_time - start_time

            if proc.returncode != 0:
                error_msg = stderr.decode().strip() or stdout.decode().strip()
                logger.error("MPI execution failed: %s", error_msg)
                return {
                    "success": False,
                    "error": error_msg,
                    "command": " ".join(cmd)
                }

            output = stdout.decode()
            results = self._parse_mpi_output(output)
            results["elapsed_wall_time"] = elapsed_wall_time
            results["command"] = " ".join(cmd)

            # Calculate Scaling Laws
            # S = 1 / ((1 - P) + P/S)  (Amdahl's Speedup)
            procs = results.get("procs", tasks)
            theoretical_amdahl_speedup = 1.0 / ((1 - parallel_fraction) + (parallel_fraction / procs))
            theoretical_gustafson_speedup = (1 - parallel_fraction) + (parallel_fraction * procs)

            results["scaling_laws"] = {
                "parallel_fraction": parallel_fraction,
                "theoretical_amdahl_speedup": theoretical_amdahl_speedup,
                "theoretical_gustafson_speedup": theoretical_gustafson_speedup,
                "amdahl_efficiency": (theoretical_amdahl_speedup / procs) * 100,
                "gustafson_efficiency": (theoretical_gustafson_speedup / procs) * 100
            }

            return {
                "success": True,
                **results
            }

        except Exception as e:
            logger.error("Exception during MPI run: %s", e)
            return {
                "success": False,
                "error": str(e),
                "command": " ".join(cmd)
            }

    def _parse_mpi_output(self, output: str) -> Dict[str, Any]:
        """Parse structured logs from the MPI binary output."""
        results = {
            "procs": 1,
            "intervals": 0,
            "calculated_pi": 0.0,
            "exact_pi": 3.141592653589793,
            "error": 0.0,
            "elapsed_time_seconds": 0.0,
            "raw_output": output
        }

        # Regex matching for structured outputs
        patterns = {
            "procs": r"PROCS:\s*(\d+)",
            "intervals": r"INTERVALS:\s*(\d+)",
            "calculated_pi": r"CALCULATED_PI:\s*([\d\.]+)",
            "error": r"ERROR:\s*([eE\-\d\.\+]+)",
            "elapsed_time_seconds": r"ELAPSED_TIME_SECONDS:\s*([\d\.]+)"
        }

        for key, pattern in patterns.items():
            match = re.search(pattern, output)
            if match:
                val = match.group(1)
                if key in ["procs", "intervals"]:
                    results[key] = int(val)
                elif key in ["calculated_pi", "error", "elapsed_time_seconds"]:
                    results[key] = float(val)

        return results
