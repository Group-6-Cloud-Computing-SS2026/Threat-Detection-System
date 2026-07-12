#!/bin/bash

# Usage: ./run_task_distributor.sh <nodes> <x_res> <y_res> <workspace_dir> <setup_flag> <runs>
NODES=${1:-1}
X=${2:-320}
Y=${3:-240}
WORKSPACE=${4:-"/mnt/ssd/nfs/hpl-results/task-distributor/workspace_node$NODES"}
DO_SETUP=${5:-"no"} # Set to "yes" to force sudo commands
RUNS=${6:-3}        # Default to 3 runs if not specified

WORKER_IPS="192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133"
NFS_PATH="/mnt/ssd/nfs/hpl-results"

if [ "$DO_SETUP" == "yes" ]; then
    echo "--- Running Environment Setup ---"
    sudo exportfs -ra
    sudo chmod -R 777 /mnt/ssd/nfs/hpl-results/task-distributor/
fi

echo "--- Checking/Mounting Workers (Parallel) ---"
for ip in $WORKER_IPS; do
  (
    ssh pi@$ip "mountpoint -q $NFS_PATH" > /dev/null 2>&1
    if [ $? -ne 0 ]; then
      echo "Mounting $ip..."
      ssh pi@$ip "sudo mkdir -p $NFS_PATH && sudo mount -o rw,soft,nolock 192.168.1.50:$NFS_PATH $NFS_PATH"
    fi
  ) &
done
wait
echo "--- All workers checked/mounted ---"

# Variables to hold performance totals
TOTAL_SEQ1=0
TOTAL_PAR=0
TOTAL_SEQ2=0

for (( r=1; r<=RUNS; r++ )); do
    echo "========================================="
    echo "             RUN $r OF $RUNS             "
    echo "========================================="
    
    echo "--- Cleaning Workspace ---"
    mkdir -p "$WORKSPACE"
    rm -f "$WORKSPACE/lockfile"

    echo "--- Executing Benchmark ($NODES nodes) ---"
    
    # Run the master script and capture its output to parse execution times
    OUTPUT=$(TERM=dumb ./task-distributor-master.sh -n $NODES -x $X -y $Y -p "$WORKSPACE" -f -c)
    echo "$OUTPUT"

    # Parse numerical times out of the text block (removing trailing 's')
    S1=$(echo "$OUTPUT" | grep "1st sequential part:" | awk '{print $NF}' | tr -d 's')
    P=$(echo "$OUTPUT" | grep "parallel part:" | awk '{print $NF}' | tr -d 's')
    S2=$(echo "$OUTPUT" | grep "2nd sequential part:" | awk '{print $NF}' | tr -d 's')

    # Accumulate metrics for averaging
    TOTAL_SEQ1=$(echo "$TOTAL_SEQ1 + $S1" | bc)
    TOTAL_PAR=$(echo "$TOTAL_PAR + $P" | bc)
    TOTAL_SEQ2=$(echo "$TOTAL_SEQ2 + $S2" | bc)
done

# Compute Averages
AVG_SEQ1=$(echo "scale=3; $TOTAL_SEQ1 / $RUNS" | bc | sed 's/^\./0./')
AVG_PAR=$(echo "scale=3; $TOTAL_PAR / $RUNS" | bc | sed 's/^\./0./')
AVG_SEQ2=$(echo "scale=3; $TOTAL_SEQ2 / $RUNS" | bc | sed 's/^\./0./')

echo ""
echo "========================================="
echo "   FINAL AVERAGES OVER $RUNS BENCHMARK RUNS   "
echo "========================================="
echo "Average 1st sequential part: ${AVG_SEQ1}s"
echo "Average parallel part:       ${AVG_PAR}s"
echo "Average 2nd sequential part: ${AVG_SEQ2}s"
echo "========================================="