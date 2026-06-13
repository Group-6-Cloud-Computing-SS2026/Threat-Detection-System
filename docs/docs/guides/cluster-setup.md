# Cluster Setup Guide

PXE Boot with NFS Shared Read-Only Root for Raspberry Pi Cluster.

This guide provides a structured, step-by-step walkthrough for setting up a Raspberry Pi 5 as a PXE/NFS server to boot multiple Raspberry Pi 3 nodes without SD cards.

---

## Overview of Infrastructure

The Pi 5 acts as the central server, providing the boot files via TFTP and the filesystem via NFS. The Pi 3 clients mount a shared read-only root and individual writable overlays for node-specific data.

| Component          | Role                | Services                      |
| :----------------- | :------------------ | :---------------------------- |
| **Pi 5 (Server)**  | Infrastructure Host | DHCP, TFTP, NFS Server        |
| **Pi 3 (Clients)** | Compute Nodes       | Network Boot, NFS Root Client |

---

## Phase 1: Prepare the Pi 5 (Server)

### Step 1 — Install the OS on Pi 5

Flash **Raspberry Pi OS Lite (64-bit)** onto the Pi 5's SD card or SSD. Boot it up and run:

```bash
sudo apt update && sudo apt full-upgrade -y
sudo reboot
```

### Step 2 — Assign a Static IP

Edit the network configuration to ensure the server remains at a fixed address:

```bash
sudo nano /etc/dhcpcd.conf
```

Add the following to the bottom of the file:

```text
interface eth0
static ip_address=192.168.1.1/24
static routers=192.168.1.254
static domain_name_servers=8.8.8.8
```

Restart the service:

```bash
sudo systemctl restart dhcpcd
```

### Step 3 — Install Required Services

```bash
sudo apt install -y nfs-kernel-server dnsmasq rsync kpartx
```

---

## Phase 2: Create the Shared Root Filesystem

### Step 4 — Build the Root FS from a Pi 3 Image

The Pi 3 requires a 32-bit OS. Download and extract the image:

```bash
cd /tmp
wget https://downloads.raspberrypi.com/raspios_oldstable_lite_armhf/images/raspios_oldstable_lite_armhf-2026-04-14/2026-04-13-raspios-bookworm-armhf-lite.img.xz
xz -d *.img.xz
```

Mount the **Root** partition (usually the second partition):

```bash
# Calculate offset: Start Sector * 512 (Example: 532480 * 512)
sudo mkdir -p /mnt/rpi-image
sudo mount -o loop,offset=$((532480 * 512)) 2026-04-13-raspios-bookworm-armhf-lite.img /mnt/rpi-image

# Sync to NFS directory
sudo mkdir -p /nfs/rootfs
sudo rsync -axv /mnt/rpi-image/ /nfs/rootfs/
sudo umount /mnt/rpi-image
```

### Step 5 — Extract the Boot Partition

Mount the **Boot** partition (usually the first partition):

```bash
sudo mkdir -p /nfs/boot
sudo mount -o loop,offset=$((8192 * 512)) 2026-04-13-raspios-bookworm-armhf-lite.img /mnt/rpi-image
sudo rsync -axv /mnt/rpi-image/ /nfs/boot/
sudo umount /mnt/rpi-image
```

---

## Phase 3: Configure Per-Node Writable Overlays

### Step 6 — Create Node Directory Structure

```bash
for node in node1 node2 node3; do
  sudo mkdir -p /nfs/nodes/$node/{etc,var,home,tmp}
  sudo rsync -av /nfs/rootfs/etc/ /nfs/nodes/$node/etc/
done
```

### Step 7 — Create Per-Node `fstab` Templates

Generate the filesystem table for each node to point to the correct NFS shares:

```bash
for i in $(seq 1 8); do
  sudo tee /nfs/nodes/node$i/etc/fstab > /dev/null << EOF
proc            /proc  proc  defaults                        0 0
192.168.1.1:/nfs/rootfs          /      nfs   ro,vers=3,noatime,_netdev   0 0
192.168.1.1:/nfs/nodes/node$i/etc   /etc   nfs   rw,vers=3,noatime,_netdev   0 0
192.168.1.1:/nfs/nodes/node$i/var   /var   nfs   rw,vers=3,noatime,_netdev   0 0
192.168.1.1:/nfs/nodes/node$i/home  /home  nfs   rw,vers=3,noatime,_netdev   0 0
tmpfs           /tmp   tmpfs defaults,nosuid,nodev           0 0
EOF
done
```

### Step 8 — Set Hostnames

```bash
for i in $(seq 1 8); do
  echo "node$i" | sudo tee /nfs/nodes/node$i/etc/hostname
done
```

---

## Phase 4: Configure NFS Exports

### Step 9 — Edit Exports File

```bash
sudo nano /etc/exports
```

Add these entries:

```text
/nfs/rootfs      192.168.1.0/24(ro,sync,no_subtree_check,no_root_squash)
/nfs/boot        192.168.1.0/24(ro,sync,no_subtree_check,no_root_squash)
/nfs/nodes/node1 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
/nfs/nodes/node2 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
/nfs/nodes/node3 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)
```

Apply the changes:

```bash
sudo exportfs -arv
sudo systemctl enable --now nfs-kernel-server
```

---

## Phase 5: Configure DHCP & TFTP

### Step 10 — Configure `dnsmasq`

```bash
sudo nano /etc/dnsmasq.conf
```

Paste the configuration:

```ini
port=0
dhcp-range=192.168.1.50,192.168.1.150,255.255.255.0,12h
dhcp-option=3,192.168.1.1
enable-tftp
tftp-root=/nfs/boot

# Mapping MAC Addresses to IPs and Hostnames
dhcp-host=b8:27:eb:xx:xx:xx,192.168.1.51,node1
dhcp-host=b8:27:eb:yy:yy:yy,192.168.1.52,node2
dhcp-host=b8:27:eb:zz:zz:zz,192.168.1.53,node3

dhcp-boot=bootcode.bin
```

```bash
sudo systemctl enable --now dnsmasq
```

### Step 11 — Configure Boot Arguments

Edit `/nfs/boot/cmdline.txt`:

```text
console=serial0,115200 console=tty1 root=/dev/nfs nfsroot=192.168.1.1:/nfs/rootfs,vers=3,ro ip=dhcp rootwait elevator=deadline
```

---

## Phase 6: Prepare Pi 3 Nodes

### Step 12 — Enable Network Boot OTP

On each Pi 3 (with an SD card inserted):

```bash
echo program_usb_boot_mode=1 | sudo tee -a /boot/config.txt
sudo reboot

# Verify after reboot:
vcgencmd otp_dump | grep 17:
# Target output: 17:3020000a
```

!!! warning "Important"
    Remove the SD card after verification.

---

## Phase 7: Test & Validation

### Step 13 — Boot Sequence

1. Connect Pi 3 to the same switch as Pi 5.
2. Power on the Pi 3.
3. On the Pi 5, monitor connections:

```bash
sudo showmount -a
arp -n | grep 192.168.1.5
```

### Step 14 — Verify Filesystem Permissions

On a booted Pi 3 node:

```bash
touch /test.txt      # Should fail (Read-only)
touch /etc/test.txt  # Should succeed (Writable)
touch /var/test.txt  # Should succeed (Writable)
```

---

## Quick Reference: Pi 5 Directory Layout

```text
/nfs/
├── boot/              ← Shared TFTP boot files
├── rootfs/            ← Shared Read-Only OS root
└── nodes/
    ├── node1/
    │   ├── etc/       ← Node1 Writable
    │   └── var/       ← Node1 Writable
    └── node2/ ...
```
