#!/bin/bash

STEPS=${1:-1000}
RUNS=${2:-1}
PROCS_LIST=${3:-"1 2 4 8"}
OUTPUT_FILE=${4:-"amdahl_results.csv"}
MAPPING=${5:-"--map-by node"}
SHOW_TABLE=${6:-""}

HOSTS="192.168.1.58,192.168.1.54,192.168.1.104,192.168.1.136,192.168.1.86,192.168.1.117,192.168.1.83,192.168.1.133"

echo "procs,steps,avg_time" > "$OUTPUT_FILE"

for p in $PROCS_LIST; do
    echo "Running $RUNS iteration(s) for $p processes ($MAPPING)..."
    sum=0
    success=true
    for (( j=1; j<=$RUNS; j++ )); do
        # Fixed: Changed cut to -f2 since amdahl_test.c outputs 2 columns (procs,time)
        result=$(OMPI_MCA_plm_rsh_agent="ssh -l pi" mpirun --prefix /usr --mca btl ^openib $MAPPING --oversubscribe -np $p --host $HOSTS /home/pi/amdahl_multi_bench $STEPS 2>/dev/null | cut -d',' -f2)
        
        if [[ -z "$result" ]]; then
            echo "Error: Benchmark failed for $p processes."
            success=false
            break
        fi
        sum=$(echo "$sum + $result" | bc)
    done
    
    if [ "$success" = true ]; then
        avg=$(echo "scale=4; $sum / $RUNS" | bc)
        echo "$p,$STEPS,$avg" >> "$OUTPUT_FILE"
    fi
done

echo "Done! Results saved in $OUTPUT_FILE"

if [ "$SHOW_TABLE" == "--table" ]; then
    echo -e "\n| Processes | Size | Time | Speedup | Efficiency |"
    echo "| :---: | :---: | :---: | :---: | :---: |"
    
    P1=$(head -n 2 "$OUTPUT_FILE" | tail -n 1 | cut -d',' -f1)
    T1=$(head -n 2 "$OUTPUT_FILE" | tail -n 1 | cut -d',' -f3)

    while IFS=, read -r p steps time; do
        [[ "$p" == "procs" ]] || [[ -z "$p" ]] && continue
        speedup=$(echo "scale=2; $T1 / $time" | bc)
        eff=$(echo "scale=1; ($speedup / ($p / $P1)) * 100" | bc)
        printf "| %s | %s | %ss | %sx | %s%% |\n" "$p" "$steps" "$time" "$speedup" "$eff"
    done < "$OUTPUT_FILE"
fi

# ./run_amdahl_full.sh 1000000 1 "1 2 4 8 16 32" core_results.csv "--map-by core" --table
# mpicc -o ~/amdahl_multi_bench amdahl_multi_test.c
# ansible workers -i ~/pi-cluster/hosts.ini -m copy -a "src=~/amdahl_multi_bench dest=/home/pi/amdahl_multi_bench mode=0755"
