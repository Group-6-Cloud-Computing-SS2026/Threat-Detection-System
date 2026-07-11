#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (argc < 2) {
        if (rank == 0) printf("Error: Provide workload per core as argument.\n");
        MPI_Finalize();
        return 1;
    }
    long long WORKLOAD_PER_CORE = atoll(argv[1]);

    double start_time = 0.0;
    if (rank == 0) start_time = MPI_Wtime();

    unsigned int seed = time(NULL) + rank;
    long long local_inside = 0;

    for (long long i = 0; i < WORKLOAD_PER_CORE; i++) {
        double x = (double)rand_r(&seed) / RAND_MAX;
        double y = (double)rand_r(&seed) / RAND_MAX;
        if (x * x + y * y <= 1.0) {
            local_inside++;
        }
    }

    long long total_inside = 0;
    MPI_Reduce(&local_inside, &total_inside, 1, MPI_LONG_LONG, MPI_SUM, 0, MPI_COMM_WORLD);

    if (rank == 0) {
        double end_time = MPI_Wtime();
        printf("%d,%lld,%.4f\n", size, WORKLOAD_PER_CORE * size, (end_time - start_time));
    }
    MPI_Finalize();
    return 0;
}