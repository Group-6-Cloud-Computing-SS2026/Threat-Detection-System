# Task 8 — Frontend

!!! note "Work in Progress"
Documentation for this task will be added as implementation progresses.

## Objectives

- Develop a React + TypeScript dashboard for log info, event messages, and event maps
- Deploy as Docker container on k3s Kubernetes cluster
- Use REST / MQTT for communication with backend and services

## **Overview**

This page focuses on the ongoing development of the frontend for the project. Although the
implementation is not fully finalized, key foundational components, UI elements, and routing structures have been
established, forming a solid basis for further development. The ultimate goal is to deliver a functional, responsive
frontend that seamlessly integrates user interface components, efficient routing, and visually appealing design.

---

### **In Progress**

The following issues are actively being worked on and form the core of the current progress:

- **#13 - Create main SOC dashboard layout**
    - Build the primary Security Operations Center dashboard that serves as the application's central monitoring view.

- **#14 - Implement event log page**
    - Develop the main event log interface for reviewing and managing detected events.

- **#21 - Implement sensor node status page**
    - Create a dedicated view for monitoring sensor nodes, resource usage, and operational health.

- **#22 - Add main application navigation**
    - Implement the primary navigation structure that connects all major frontend sections.

- **#41 - Define frontend TypeScript models for events, evidence, nodes, and dashboard data**
    - Create strongly typed frontend models to improve maintainability and API integration consistency.

- **#51 - Configure frontend HTML metadata**
    - Define page metadata, titles, descriptions, and favicon settings for a polished application experience.

### **Upcoming**

The following tasks are expected to follow once the current frontend surfaces are more fully established:

- **#24 - Implement frontend API service layer**
    - Create a centralized service layer to handle API communication, requests, and data transformations.

- **#25 to #27 - Integrate backend APIs**
    - Connect frontend views with event-related backend endpoints to display detection results.
    - Retrieve and display captured evidence data through backend API integration.
    - Connect frontend components with backend APIs that provide sensor node health and status information.

- **#47 - Add Dockerfile for frontend deployment**
    - Create a Docker image definition to enable containerized frontend deployments.

### **Blocked**

Certain tasks are currently marked as blocked:

- **#15 - Add event detail view**
    - Depends on the main event log and navigation structure being in place.

- **#16 - Implement evidence gallery for captured event images**
    - Depends on the event detail flow and evidence presentation surfaces.

- **#17 - Implement event map / location view**
    - Depends on event detail and map-ready event data.

- **#19 - Add filtering and search to event log**
    - Depends on the event log page and its data model.

- **#23 - Add loading, empty, and error states across frontend views**
    - Depends on the target views being defined so the states can be wired consistently.

- **#30 - Add status badges and severity indicators**
    - Depends on the dashboard and event surfaces being stabilized.

- **#31 - Add real-time event updates to dashboard**
    - Depends on the dashboard data flow and live update plumbing.

- **#32 - Add Telegram notification mirror panel**
    - Depends on the dashboard notification surface and live message flow.

- **#29 - Improve responsive layout for dashboard views**
    - Depends on the dashboard and core view structure being stable enough for final responsive tuning.

- **#48 - Add k3s deployment manifest for frontend**
    - Depends on the frontend deployment packaging being settled.

- **#34 - Add k3s cluster health overview**
    - Depends on the monitoring dashboard layout being available.

- **#35 - Add performance metrics charts**
    - Depends on the monitoring and node data surfaces being ready.

- **#37 - Add event timeline view**
    - Depends on the event detail experience and chronological event data.

- **#38 - Add event review status workflow**
    - Pending backend implementation to support status workflows.

- **#39 - Add image preview modal for evidence items**
    - Depends on the evidence gallery and evidence-detail flow.

- **#40 - Add event export functionality**
    - Depends on the event list/detail data path being stable enough for exports.

### **Completed Issues**

The following tasks have been successfully completed as part of the frontend development process:

- **#50 - Initialize React TypeScript frontend project**
    - The initial React project setup is complete, which involved creating the application structure, installing
      dependencies, and ensuring compatibility with TypeScript.

- **#52 - Add React Router provider setup**
    - A React Router-based navigation system is in place. Routes for pages such as `home`, `landing`, `login`,
      `settings`, `profile`, and `docs` have been configured.
    - The `Root` component establishes the main layout structure for consistent header, footer, and app navigation.

- **#54 - Add Prettier and pre-commit formatting checks**
    - An automated code formatting and pre-commit validator was implemented to ensure consistent code quality across the
      frontend project.

- **#53 - Rebrand project from Threat Detection System to ThreatOff**
    - A new brand identity has been established, including updated icons and wordmarks.
    - Updated frontend naming, and visual identity to reflect the new ThreatOff project name.

- **#28 - Define frontend visual design system**
    - Established a consistent visual language including brand colors and typography.
    - More reusable UI patterns will be added through development.

---

### **Current Progress Highlights**

- **Routes and navigation:** React Router is already in place, covering the base app shell and the main user-facing
  pages.

- **Layout structure:** The shared `Root` layout, header, and footer are established, so the remaining screens can be
  built on top of a consistent frame.

- **Visual foundation:** The initial visual system and landing-page components are already defined, which gives the
  frontend a starting point for the rest of the product.

---

### **Planned Improvements**

1. **Enhanced Responsiveness:**
    - Tighten responsive behavior across dashboard, log, and detail views.

2. **Testing Environment:**
    - Add and expand frontend tests around the core flows.

3. **UI/UX Polishing:**
    - Polish spacing, empty states, loading states, and visual consistency across the app.

---

### **Conclusion**

With the backend work and API direction already in place, the focus can
move to finishing the screens, connecting them to the existing services, and closing the remaining product gaps.
