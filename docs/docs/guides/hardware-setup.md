# Hardware Setup & Sequential Boot Guide

---

## 1. Physical Connectivity (The Backbone)

Before powering anything on, ensure your network topology is correct:

- **The Switch:** Connect your 5-port or 8-port Gigabit switch to power.
- **The Master (Pi 5):** Connect the Pi 5 Ethernet port to the switch.
- **The Computer:** Connect your laptop/desktop Ethernet port to the same switch.
- **The Workers (Pi 3s):** Plug Ethernet cables into all Pi 3s and connect them to the switch, but **do not plug in their power cables yet**.

---

## 2. Phase One: Establishing the Master

1. **Power on the Pi 5.**
2. Wait approximately **60 seconds** for the OS to initialize and the DHCP/NFS services to start.
3. **Verify Access:** From your computer, try to SSH into the Master:
   ```bash
   ssh cc123@192.168.1.104
   ```
4. **Crucial Check:** Ensure the Pi 5 has the correct time. If the Master's time is wrong, the whole cluster will fail.
   ```bash
   date
   ```

!!! warning "Time is Critical"
    If the Master's time is wrong, the whole cluster will fail. Verify with `date` before proceeding.

---

## 3. Phase Two: Sequential Worker Boot

!!! danger "Avoid Deadlock"
    The Pi 3s have no local storage; they "read" their entire OS over the wire from the Pi 5. If you power them all at once, the Pi 5's Ethernet bandwidth and SD card/SSD read speed will choke, causing some Pis to fail to boot.

Follow this procedure:

1. **Plug in Worker 1:** Wait for the green "ACT" LED on the Pi 3 to start flickering steadily.
2. **Verify:** On the Pi 5, run:
   ```bash
   ping worker1
   ```
   Once you get a response, move to the next.
3. **Repeat:** Plug in **Worker 2**, wait 30 seconds, verify, then **Worker 3**, and so on.

!!! tip
    Waiting **30–45 seconds** between each Pi allows the previous one to finish the "heavy" part of the boot process (loading the kernel and systemd).
