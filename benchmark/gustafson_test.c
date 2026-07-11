#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);

    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    // SCALED WORKLOAD: 1,000,000 iterations per core
    long WORKLOAD_PER_CORE = 1000000;

    double start_time = 0.0;
    if (rank == 0) {
        start_time = MPI_Wtime();
    }

    // Seed uniquely per rank for random number generation
    srand(time(NULL) + rank);
    long local_inside = 0;

    for (long i = 0; i < WORKLOAD_PER_CORE; i++) {
        double x = (double)rand() / RAND_MAX;
        double y = (double)rand() / RAND_MAX;
        if (x * x + y * y <= 1.0) {
            local_inside++;
        }
    }

    long total_inside = 0;
    MPI_Reduce(&local_inside, &total_inside, 1, MPI_LONG, MPI_SUM, 0, MPI_COMM_WORLD);

    if (rank == 0) {
        double end_time = MPI_Wtime();
        printf("%d,%.4f\n", size, (end_time - start_time));
    }

    MPI_Finalize();
    return 0;
}
