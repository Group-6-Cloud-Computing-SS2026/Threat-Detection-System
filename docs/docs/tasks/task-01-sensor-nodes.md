# Task 1: Sensor Nodes & Infrastructure

## 1. Infrastructure Overview
The foundation of this project is a hybrid edge-computing cluster. It utilizes a high-performance Master node to manage a fleet of worker nodes via network-based orchestration. This setup eliminates individual points of failure (like SD card corruption on workers) and centralizes administration.

### Hardware Components
* **Master Node:** Raspberry Pi 5 (8GB) acting as the gateway and PXE server.
* **Worker Nodes:** 8x Raspberry Pi 3 Model B+ units.
* **Networking:** Gigabit Ethernet switch connecting all nodes to the Master via a local LAN.

---

## 2. Cluster Consolidation via PXE and NFS
We investigated the consolidation of operating system images by implementing a **PXE (Preboot Execution Environment)** boot scenario. This allows the Raspberry Pi 3 nodes to boot over the LAN without requiring physical SD cards for the operating system.

### The "Golden Image" Strategy
We consolidated the worker operating systems into a single "Golden Image" located on the Pi 5 at `/nfs/common_root`.
* **Read-Only Root:** The core OS is exported as Read-Only (`ro`) to ensure that no worker node can accidentally corrupt shared system files.
* **Virtual Writable Space:** Using `tmpfs` mounts in the `fstab`, we created virtual writable space in the worker's RAM for temporary directories like `/tmp`, `/var/log`, and `/run`.

### Identity & Persistence Management
Since all nodes share a single image, we implemented the following for unique identification:
* **Dynamic Hostnaming:** An initialization script (`init-node.sh`) runs at boot to set the hostname (e.g., `pi3-worker-105`) based on the node's assigned IP address.
* **Private Data Trees:** Each node is assigned a private directory on the Pi 5 (e.g., `/nfs/nodes/pi3-worker1`). Through **Bind Mounts**, the node "overlays" its unique `/etc` and `/var` folders onto the shared read-only root.
* **Static IP Mapping:** We used `dnsmasq` on the Master node to map MAC addresses to specific IPs, ensuring consistency across reboots.

---

## 3. Investigation: Benefits and Drawbacks
As required by the project brief, we investigated the implications of this deployment scenario:

| Feature | Observation |
| :--- | :--- |
| **Administration** | **Benefit:** High. Updates to the "Golden Image" on the Master affect all 8 workers simultaneously. |
| **Reliability** | **Benefit:** High. Eliminates "SD card death" on workers, as the OS runs over the network and in RAM. |
| **Storage Efficiency** | **Benefit:** Physical SD cards on the Pi 3s are freed up for dedicated high-speed data storage. |
| **Dependency** | **Drawback:** High dependency on the Master node; if the Pi 5 fails, the entire worker fleet goes offline. |
| **Boot Latency** | **Drawback/Resolved:** Simultaneous booting of 8 nodes and heavy container runtime I/O operations created massive network congestion and disk bottlenecks on the Master's micro-SD card. **Resolution**: We migrated the entire shared root filesystem (`/nfs`) off the Master's SD card onto a **500GB High-Speed SSD** (`/mnt/ssd/nfs`), bind-mounted transparently back to `/nfs` to ensure complete compatibility. This permanently resolved the disk latency, SQLite timeouts, and boot bottlenecks! |

---

## 4. Object Detection Deployment
*(To be completed: Describe the deployment of YOLO or TensorFlow on the Pi 5 and the specific OS image used.)*

---

## 5. AI Camera & AI HAT+ Integration
*(To be completed: Document the physical installation of the Raspberry Pi AI Camera and the AI HAT+ hardware configuration.)*
