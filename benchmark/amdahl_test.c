#include <mpi.h>
#include <stdio.h>
#include <time.h>
#include <stdlib.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);

    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    // FIXED TOTAL WORKLOAD
    long TOTAL_STEPS = atol(argv[1]);
    long steps_per_process = TOTAL_STEPS / size;

    double start_time = 0.0;
    if (rank == 0) {
        start_time = MPI_Wtime();
    }

    double step_size = 1.0 / (double)TOTAL_STEPS;
    double local_sum = 0.0;

    long start_idx = rank * steps_per_process;
    long end_idx = (rank + 1) * steps_per_process;

    for (long i = start_idx; i < end_idx; i++) {
        double x = (i + 0.5) * step_size;
        local_sum += 4.0 / (1.0 + x * x);
    }
    local_sum *= step_size;

    double total_pi = 0.0;
    MPI_Reduce(&local_sum, &total_pi, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);

    if (rank == 0) {
        double end_time = MPI_Wtime();
        printf("%d,%.4f\n", size, (end_time - start_time));
    }

    MPI_Finalize();
    return 0;
}