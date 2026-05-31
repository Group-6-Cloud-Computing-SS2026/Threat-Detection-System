#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

int main(int argc, char *argv[]) {
    int n, myid, numprocs, i;
    double PI25DT = 3.141592653589793238462643;
    double mypi, pi, h, sum, x;
    double startwtime = 0.0, endwtime;

    MPI_Init(&argc, &argv);
    MPI_Comm_size(MPI_COMM_WORLD, &numprocs);
    MPI_Comm_rank(MPI_COMM_WORLD, &myid);

    if (myid == 0) {
        // Read interval size from argument if provided, default to 1,000,000
        if (argc > 1) {
            n = atoi(argv[1]);
        } else {
            n = 1000000;
        }
        startwtime = MPI_Wtime();
    }

    // Broadcast interval size to all processes
    MPI_Bcast(&n, 1, MPI_INT, 0, MPI_COMM_WORLD);

    h = 1.0 / (double) n;
    sum = 0.0;
    
    // Parallel computation: each rank processes a subset of steps
    for (i = myid + 1; i <= n; i += numprocs) {
        x = h * ((double)i - 0.5);
        sum += 4.0 / (1.0 + x * x);
    }
    mypi = h * sum;

    // Collect all computed parts onto rank 0
    MPI_Reduce(&mypi, &pi, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);

    if (myid == 0) {
        endwtime = MPI_Wtime();
        double elapsed = endwtime - startwtime;
        double error = fabs(pi - PI25DT);
        
        // Print structured output for the FastAPI backend to parse easily
        printf("--- MPI PI CALCULATION RESULTS ---\n");
        printf("PROCS: %d\n", numprocs);
        printf("INTERVALS: %d\n", n);
        printf("CALCULATED_PI: %.16f\n", pi);
        printf("EXACT_PI: %.16f\n", PI25DT);
        printf("ERROR: %.16e\n", error);
        printf("ELAPSED_TIME_SECONDS: %.9f\n", elapsed);
        printf("----------------------------------\n");
    }

    MPI_Finalize();
    return 0;
}
