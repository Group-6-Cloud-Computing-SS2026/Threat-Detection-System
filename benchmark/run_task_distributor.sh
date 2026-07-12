#!/bin/bash

# Usage: ./run_task_distributor.sh <nodes> <x_res> <y_res> <workspace_dir> <setup_flag>
NODES=${1:-1}
X=${2:-320}
Y=${3:-240}
WORKSPACE=${4:-"/mnt/ssd/nfs/hpl-results/task-distributor/workspace_node$NODES"}
DO_SETUP=${5:-"no"} # Set to "yes" to force sudo commands

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

echo "--- Cleaning Workspace ---"
mkdir -p "$WORKSPACE"
rm -f "$WORKSPACE/lockfile"

echo "--- Executing Benchmark ($NODES nodes) ---"
./task-distributor-master.sh -n $NODES -x $X -y $Y -p "$WORKSPACE" -f -c

# ./run_task_distributor.sh 8 800 600 /mnt/ssd/nfs/hpl-results/task-distributor/workspace_8n