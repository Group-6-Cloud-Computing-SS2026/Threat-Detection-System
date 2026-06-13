# Raspberry Pi Cluster — Setup & Verification Guide

**Infrastructure:** 1× Pi5 (master, 192.168.1.50) + 8× Pi3 (workers, 64-bit, diskless PXE boot)

---

## 1. WiFi Setup

### Connect any node to WiFi
```bash
# SSH into node
ssh pi@192.168.1.58

# Unblock WiFi and scan
sudo rfkill unblock all
sudo ip link set wlan0 up
sudo nmcli device set wlan0 managed yes
sudo nmcli device wifi rescan
sleep 3
sudo nmcli device wifi list

# Connect
sudo nmcli device wifi connect "YOUR_SSID" password "YOUR_PASSWORD"

# Verify
ip addr show wlan0
ping -c 3 8.8.8.8
```

### Connect Pi5 to WiFi
```bash
# On Pi5 directly
sudo nmcli device wifi rescan
sleep 3
sudo nmcli device wifi list
sudo nmcli device wifi connect "YOUR_SSID" password "YOUR_PASSWORD"
ping -c 3 8.8.8.8
```




## 3. Verify 64-bit OS on All Nodes

```bash
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "uname -m && uname -r" 2>/dev/null)
  echo "$IP: $RESULT"
done
```

**Expected output:**
```
192.168.1.58:  aarch64    ← 64-bit ✅
               6.12.x+rpt-rpi-v8
192.168.1.54:  aarch64    ✅
...
```

`aarch64` = 64-bit ARM. If you see `armv7l` = still 32-bit.

---

## 4. Shared Filesystem Read/Write Test

### Test root is writable (shared)
```bash
# Write from one node
ssh pi@192.168.1.58 "echo 'hello from worker1' | sudo tee /shared-test.txt"

# Read from different nodes — should all see same file
for IP in 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "cat /shared-test.txt" 2>/dev/null)
  echo "$IP: $RESULT"
done

# Cleanup
sudo rm /nfs/rootfs64/shared-test.txt
```

### Test per-node /etc is writable (isolated)
```bash
# Each node should write to its OWN /etc only
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "sudo touch /etc/test-write && echo 'etc: WRITABLE ✅' && sudo rm /etc/test-write" 2>/dev/null)
  echo "$IP: $RESULT"
done
```

### Verify mount layout on any node
```bash
ssh pi@192.168.1.58 "mount | grep nfs"
```

Expected:
```
192.168.1.50:/nfs/rootfs64          on /      (rw)  ← shared root
192.168.1.50:/nfs/nodes/<serial>/etc on /etc  (rw)  ← per-node
192.168.1.50:/nfs/nodes/<serial>/var on /var  (rw)  ← per-node
192.168.1.50:/nfs/nodes/<serial>/home on /home (rw) ← per-node
```

---

## 5. Time Sync Verification

### Check Pi5 is synced to internet
```bash
chronyc tracking
chronyc sources -v
timedatectl status
```

Expected:
```
System clock synchronized: yes
NTP service: active
Reference ID: x.x.x.x (pool.ntp.org server)
```

### Check all nodes sync from Pi5
```bash
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "chronyc tracking | grep 'Reference ID' && date" 2>/dev/null)
  echo "=== $IP ==="; echo "$RESULT"
done
```

Expected:
```
=== 192.168.1.58 ===
Reference ID: C0A80132 (192.168.1.50)  ← syncing from Pi5 ✅
Sat 30 May 2026 ...                    ← correct date ✅
```

### Force immediate time sync on all nodes
```bash
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "sudo chronyc makestep && date" 2>/dev/null
  echo "$IP synced"
done
```

### Check Pi5 sees all nodes as NTP clients
```bash
chronyc clients
```

---

## 6. Install Library Once — Available on All Nodes

### Method — chroot into shared rootfs on Pi5

```bash
# One command to enter chroot
chroot-rootfs enter

# Inside chroot — install anything
apt update
apt install -y htop python3 vim git wget curl

# Exit chroot (auto-unmounts)
exit
```

Or install without entering chroot:
```bash
chroot-rootfs install htop python3 vim git
```

### Verify package available on ALL nodes immediately
```bash
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "which htop && htop --version" 2>/dev/null)
  echo "$IP: $RESULT"
done
```

### If package has /etc config — copy to all nodes
```bash
# Example: after installing a package that puts config in /etc
for SERIAL in a7b7e022 2c900aeb 2f14a0f1 33cc973b 5ee65e7e c4ff9387 f2893559 c782ffc3; do
  sudo cp -r /nfs/rootfs64/etc/PACKAGE_NAME /nfs/nodes/$SERIAL/etc/
done
```

### Why this works
```
chroot writes to /nfs/rootfs64/usr/bin/htop
All nodes mount /nfs/rootfs64 as /
Therefore all nodes see /usr/bin/htop instantly
No need to touch individual nodes!
```

---

## 7. Cluster Health Check (All-in-One)

Run this to verify everything at once:

```bash
echo "========================================="
echo "CLUSTER HEALTH CHECK"
echo "========================================="

echo ""
echo "--- Pi5 Time Sync ---"
timedatectl status | grep "synchronized\|NTP"

echo ""
echo "--- Pi5 NFS Exports ---"
sudo exportfs -v | grep -E "rootfs64|nodes"

echo ""
echo "--- Node Status ---"
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  RESULT=$(ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP \
    "echo \$(hostname):\$(uname -m):\$(date '+%Y-%m-%d %H:%M')" 2>/dev/null)
  if [ -n "$RESULT" ]; then
    echo "$IP: $RESULT ✅"
  else
    echo "$IP: ❌ NOT REACHABLE"
  fi
done

echo ""
echo "--- NFS Mounts Active ---"
sudo showmount -a | grep -v "^All"

echo "========================================="
```

---

## 8. Node Reference Table

| Node | IP | MAC | Serial |
|------|----|-----|--------|
| pi5-master | 192.168.1.50 | 88:a2:9e:b1:76:54 | — |
| worker1 | 192.168.1.58 | b8:27:eb:b7:e0:22 | a7b7e022 |
| worker2 | 192.168.1.54 | b8:27:eb:90:0a:eb | 2c900aeb |
| worker3 | 192.168.1.104 | b8:27:eb:14:a0:f1 | 2f14a0f1 |
| worker4 | 192.168.1.136 | b8:27:eb:cc:97:3b | 33cc973b |
| worker5 | 192.168.1.86 | b8:27:eb:e6:5e:7e | 5ee65e7e |
| worker6 | 192.168.1.117 | b8:27:eb:ff:93:87 | c4ff9387 |
| worker7 | 192.168.1.83 | b8:27:eb:89:35:59 | f2893559 |
| worker8 | 192.168.1.133 | b8:27:eb:82:ff:c3 | c782ffc3 |

---

## 9. Directory Structure on Pi5

```
/nfs/
├── rootfs64/          ← Shared 64-bit OS root (all nodes, rw)
├── boot64/            ← PXE boot files
│   ├── bootcode.bin   ← First stage bootloader
│   ├── kernel8.img    ← 64-bit kernel
│   ├── cmdline.txt    ← Default boot params
│   ├── a7b7e022/      ← Per-node boot (worker1)
│   │   └── cmdline.txt
│   ├── 2c900aeb/      ← Per-node boot (worker2)
│   └── ...
└── nodes/
    ├── a7b7e022/      ← worker1 private data
    │   ├── etc/       ← worker1's /etc
    │   ├── var/       ← worker1's /var
    │   └── home/      ← worker1's /home
    ├── 2c900aeb/      ← worker2 private data
    └── ...
```

---

## 10. Useful Commands Reference

```bash
# SSH into a node
ssh pi@192.168.1.58

# Run command on ALL nodes
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP "YOUR_COMMAND"
done

# Reboot all nodes
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -o ConnectTimeout=3 -o StrictHostKeyChecking=no pi@$IP "sudo reboot" &
done

# Install package for all nodes (chroot on Pi5)
chroot-rootfs install PACKAGE_NAME

# Check all nodes are up
for IP in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ping -c 1 -W 2 $IP &>/dev/null && echo "$IP ✅ UP" || echo "$IP ❌ DOWN"
done

# Check NFS server status
sudo exportfs -v
sudo showmount -a

# Restart all services on Pi5
sudo systemctl restart nfs-kernel-server dnsmasq chrony

# Remove file from shared rootfs
sudo rm /nfs/rootfs64/PATH/TO/FILE

# Remove folder from all nodes
for SERIAL in a7b7e022 2c900aeb 2f14a0f1 33cc973b 5ee65e7e c4ff9387 f2893559 c782ffc3; do
  sudo rm -rf /nfs/nodes/$SERIAL/PATH/TO/FOLDER
done
```
