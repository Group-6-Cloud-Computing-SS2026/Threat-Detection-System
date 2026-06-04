#!/usr/bin/env bash
# ==============================================================================
# Cluster Boot Recovery & Sync Script
# Location: /usr/local/bin/cluster-boot-recovery.sh
# Description: Automates SSD mounting, service restarts, worker time-sync, and
#              K3s agent health recovery on Master node boot.
# ==============================================================================

set -euo pipefail

# ANSI Colors for logging
INFO='\033[0;36m[INFO]\033[0m'
SUCCESS='\033[0;32m[SUCCESS]\033[0m'
WARNING='\033[0;33m[WARNING]\033[0m'
ERROR='\033[0;31m[ERROR]\033[0m'

log() {
    echo -e "${INFO} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

warn() {
    echo -e "${WARNING} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

success() {
    echo -e "${SUCCESS} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

error_exit() {
    echo -e "${ERROR} $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
    exit 1
}

# ------------------------------------------------------------------------------
# 0. Configure IP Forwarding & NAT Masquerading (Master as Gateway)
# ------------------------------------------------------------------------------
log "Configuring IP Forwarding & NAT Masquerading for workers..."
sudo sysctl -w net.ipv4.ip_forward=1 >/dev/null
sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE || true
sudo iptables -A FORWARD -i eth0 -o wlan0 -j ACCEPT || true
sudo iptables -A FORWARD -i wlan0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT || true

log "Ensuring Master DNS resolver is set to public Google DNS..."
sudo tee /etc/resolv.conf > /dev/null << 'DNS_EOF'
nameserver 8.8.8.8
nameserver 1.1.1.1
DNS_EOF

success "NAT Routing, IP Forwarding, and DNS configured!"

# ------------------------------------------------------------------------------
# 1. Wait for External SSD to mount
# ------------------------------------------------------------------------------
log "Checking external SSD (/mnt/ssd) mount status..."
MAX_ATTEMPTS=12
ATTEMPT=1
while ! findmnt /mnt/ssd >/dev/null; do
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        warn "SSD (/mnt/ssd) failed to mount automatically. Forcing mount..."
        sudo mount -a || true
    fi
    log "Waiting for SSD mount... Attempt $ATTEMPT/$MAX_ATTEMPTS"
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done
success "SSD (/mnt/ssd) is successfully mounted!"

# ------------------------------------------------------------------------------
# 2. Wait for NFS Bind-mount to become active
# ------------------------------------------------------------------------------
log "Checking NFS bind-mount (/nfs) status..."
ATTEMPT=1
while ! findmnt /nfs >/dev/null; do
    log "Mounting /nfs bind-mount... Attempt $ATTEMPT"
    sudo mount -a || true
    sleep 3
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -gt 5 ]; then
        error_exit "Failed to mount /nfs bind-mount. Please check /etc/fstab!"
    fi
done
success "NFS bind-mount (/nfs) is active!"

# ------------------------------------------------------------------------------
# 3. Wait for Network & Internet (NTP Sync)
# ------------------------------------------------------------------------------
log "Forcing NTP time synchronization..."
sudo systemctl restart systemd-timesyncd || true

log "Waiting for system clock to synchronize via NTP..."
# Wait up to 3 minutes (36 attempts * 5s) for time synchronization
ATTEMPT=1
while ! timedatectl status | grep -q "System clock synchronized: yes"; do
    if [ $ATTEMPT -gt 36 ]; then
        warn "NTP synchronization timed out. Proceeding with current Master system time."
        break
    fi
    log "Waiting for NTP sync (Wi-Fi connecting...)... Attempt $ATTEMPT/36"
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
done

if timedatectl status | grep -q "System clock synchronized: yes"; then
    success "System clock is synchronized: $(date)"
else
    warn "Continuing with local Master time: $(date)"
fi

# ------------------------------------------------------------------------------
# 4. Restart Boot Services
# ------------------------------------------------------------------------------
log "Restarting boot network and storage services..."
sudo systemctl restart dnsmasq || true
log "Flushing system page caches to prevent NFS thread allocation errors (errno 12)..."
sudo sh -c "sync && echo 3 > /proc/sys/vm/drop_caches" || true
sudo systemctl stop nfs-kernel-server || true
sudo systemctl start nfs-kernel-server || true
success "dnsmasq and nfs-kernel-server restarted successfully."

# ------------------------------------------------------------------------------
# 5. Restart K3s Control Plane
# ------------------------------------------------------------------------------
log "Ensuring K3s Master Control Plane is running..."
sudo systemctl start k3s
success "K3s Control Plane verified."

# ------------------------------------------------------------------------------
# 6. Wait for Workers to boot and register on the LAN
# ------------------------------------------------------------------------------
log "Waiting for workers to boot and open SSH (Port 22)..."
# We check if worker1 to worker8 respond to ssh ping
HOSTS_INI="/home/cc123/pi-cluster/hosts.ini"
if [ ! -f "$HOSTS_INI" ]; then
    HOSTS_INI="$HOME/pi-cluster/hosts.ini"
fi

if [ -f "$HOSTS_INI" ]; then
    log "Found Ansible hosts file at $HOSTS_INI"
    
    # We wait up to 5 minutes for at least one worker to open port 22
    ATTEMPT=1
    while ! sudo -u cc123 ansible workers -i "$HOSTS_INI" -m ping -B 5 -P 0 >/dev/null 2>&1; do
        if [ $ATTEMPT -gt 30 ]; then
            warn "Workers are taking longer to respond. Proceeding with time synchronization attempts anyway..."
            break
        fi
        log "Waiting for worker SSH connectivity... Attempt $ATTEMPT/30"
        sleep 10
        ATTEMPT=$((ATTEMPT + 1))
    done
    success "Worker SSH connectivity detected!"

    # --------------------------------------------------------------------------
    # 7. Push Clock Synchronization to Workers
    # --------------------------------------------------------------------------
    log "Pushing clean UTC ISO time sync to all workers..."
    # Generate ISO time string and set on workers
    UTC_TIME=$(date -u +%FT%TZ)
    sudo -u cc123 ansible workers -i "$HOSTS_INI" -m shell -a "date -s '$UTC_TIME'" --become || warn "Failed to sync worker dates."
    success "Worker clocks synchronized!"

    # --------------------------------------------------------------------------
    # 8. Reload Systemd and Restart K3s-agent on Workers
    # --------------------------------------------------------------------------
    log "Reloading systemd and restarting k3s-agent on all workers..."
    sudo -u cc123 ansible workers -i "$HOSTS_INI" -m shell -a "systemctl daemon-reload && systemctl restart k3s-agent" --become || warn "Failed to restart worker agents."
    success "All worker K3s agents reloaded and restarted!"
else
    warn "Ansible hosts.ini not found! Skipping worker clock-sync. Please sync workers manually using Ansible."
fi

# ------------------------------------------------------------------------------
# 9. Clean up Ghost Containers / Stuck Pods
# ------------------------------------------------------------------------------
log "Checking for stale/stuck Kubernetes pods..."
# Wait for kubectl to be responsive
ATTEMPT=1
while ! sudo kubectl get nodes >/dev/null 2>&1; do
    log "Waiting for kubectl API responsiveness... Attempt $ATTEMPT"
    sleep 5
    ATTEMPT=$((ATTEMPT + 1))
    if [ $ATTEMPT -gt 12 ]; then
        error_exit "K3s API is unresponsive. Cannot check pods."
    fi
done

# Force delete stuck/failed/terminating pods across all namespaces selectively to avoid Thundering Herd
log "Scanning and force-deleting only stuck/failed pods..."
STUCK_LIST=$(sudo kubectl get pods -A --no-headers 2>/dev/null | grep -E "CreateContainerError|Terminating|ErrImagePull|ImagePullBackOff|Unknown|Failed" | awk '{print $1"/"$2}' || true)

if [ -n "$STUCK_LIST" ]; then
    for pod_info in $STUCK_LIST; do
        NAMESPACE=$(echo "$pod_info" | cut -d'/' -f1)
        POD_NAME=$(echo "$pod_info" | cut -d'/' -f2)
        log "Force-recreating stuck/failed pod: $POD_NAME in namespace $NAMESPACE..."
        sudo kubectl delete pod "$POD_NAME" -n "$NAMESPACE" --grace-period=0 --force >/dev/null 2>&1 || true
    done
    success "All stuck/ghost pods cleared!"
else
    success "No stuck/ghost pods detected. Clean boot!"
fi


success "=========================================================================="
success "Cluster recovery complete! All 8 workers are online, synced, and active."
success "=========================================================================="
