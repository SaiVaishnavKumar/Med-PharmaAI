# MediFlow AI — Modern Pharmacy Operations, FEFO Inventory & Point of Sale

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![Tests](https://img.shields.io/badge/tests-10%2F10%20passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](#)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](#)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38b2ac)](#)

MediFlow AI is an enterprise-grade, responsive pharmacy management system and clinical inventory platform designed for retail, hospital, and community pharmacies. Built with React 18, TypeScript, Tailwind CSS, Vite, Express, and Prisma.

---

## 🚀 Key Highlights & Features

### 1. Fully Responsive Across All Form Factors
- **Mobile Phones (< 640px)**: Bottom thumb navigation bar (`MobileNav`), responsive slide-out drawer, touch-friendly tabbed POS, full-screen touch modals, sticky action bars.
- **Tablets (640px – 1024px)**: Adaptive 2-column KPI grids, flexible split views, collapsible sidebars.
- **Desktop & Wide Displays (> 1024px)**: Executive layout with high-density data tables, side-by-side POS cashier terminal, collapsible navigation, and rich analytics widgets.

### 2. Verified FEFO (First-Expired, First-Out) Dispensing
- All dispensing orders automatically allocate stock from batches with the earliest expiry date.
- Expired and quarantined lots are automatically blocked from the Point of Sale terminal.
- Batch traceability on every printed tax invoice with lot numbers and expiry dates.

### 3. Complete Pharmacy Operations Modules
- **Overview / Dashboard**: Real-time KPI telemetry (Formulary, Saleable Units, Low Stock, Near Expiry), stock replenishment alert widget, quick actions hub, and recent audit activity feed.
- **Point of Sale (POS)**: Rapid barcode/name search, category filters, quantity counters, customer info, prescription verification for Schedule H drugs, payment modes (UPI, Cash, Card), automatic discount & 5% GST computation, and instant thermal receipt printing.
- **Medicine Catalogue**: Search by brand, generic name, SKU, or barcode. Category filters, status badges (In Stock, Low Stock, Out of Stock), and "Add Medicine" modal with formulary specs.
- **Batch Inventory**: Real-time batch-level tracking with supplier names, stock quantities, expiry countdown badges (Healthy, Near Expiry < 30d, Expired, Quarantined), and auditable stock adjustment modal.
- **Purchases & Procurement**: Inward PO workflow (`DRAFT` → `ORDERED` → `RECEIVED`). Receiving orders automatically creates traceable lot batches in inventory.
- **Supplier Directory**: Authorized drug wholesaler directory with GSTIN numbers, contact details, active PO counts, and "Add Supplier" modal.
- **Sales Returns**: Process returns against original invoices, select specific returned batches, choose between restock vs. quarantine disposal, and enforce mandatory audit justification.
- **Alert Center**: Clinical and operational triage for stockouts, low stock thresholds, 30-day expiry deadlines, and expired lots with 1-click corrective action links.
- **Reports & Analytics**: 7/30/90-day net sales revenue, purchase-cost inventory book valuation, sales return deductions, interactive area and bar trend charts, stock movement reconciliation, and CSV export.
- **MediFlow AI Copilot**: Interactive natural-language operations assistant with verified business telemetry analysis and medical advice safety guardrails.
- **Role-Based Authentication (RBAC)**: Multi-role support with instant 1-click demo switcher for Pharmacy Manager, Super Admin, Pharmacist, Cashier, and Inventory Manager.

### 4. Dual-Mode Architecture & Reliability
- **Live Mode**: Connects to the Express API with Prisma transactions and PostgreSQL.
- **Offline / Standalone Demo Mode**: If the backend database is offline or during preview deployments (e.g. Netlify/Vercel), a high-fidelity client store with `localStorage` persistence seamlessly powers all features, FEFO allocations, and checkout flows without any broken screens.

---

## 🛠️ Quick Start

### Prerequisites
- Node.js 20 or later
- npm 10 or later

### Installation & Run

```bash
# Clone the repository
git clone https://github.com/SaiVaishnavKumar/Med-PharmaAI.git
cd Med-PharmaAI

# Install all workspace dependencies
npm install

# Start both frontend and backend concurrently
npm run dev
```

- **Frontend Client**: `http://localhost:5173`
- **Backend API**: `http://localhost:4000/api/v1`

---

## 🧪 Testing & Verification

```bash
# Run unit and API boundary test suite
npm test

# Build client and server production bundles
npm run build
```

---

## 📁 Project Architecture

```
Pharmacy AI/
├── client/                      # React 18 + TypeScript + Vite SPA
│   ├── src/
│   │   ├── api/                 # API client with automatic offline fallback
│   │   ├── components/
│   │   │   ├── layout/          # AppShell, Sidebar, Topbar, MobileNav
│   │   │   └── ui/              # Button, Badge, Modal, StatCard, EmptyState
│   │   ├── context/             # AuthContext (RBAC & role switching)
│   │   ├── pages/               # Dashboard, POS, Catalogue, Inventory, Sales,
│   │   │                        # Returns, Purchases, Suppliers, Alerts, Reports, Copilot, Login
│   │   ├── services/            # pharmacyStore (FEFO engine, localStorage, mock data)
│   │   ├── types/               # TypeScript interfaces
│   │   ├── main.tsx
│   │   ├── shell.tsx
│   │   └── styles.css           # Tailwind CSS directives & responsive print rules
│   └── tailwind.config.js
├── server/                      # Express 4 + TypeScript API
│   ├── src/
│   │   ├── middleware/          # Auth & RBAC checks
│   │   ├── modules/             # Auth, Medicines, Sales, Inventory, Purchases, Suppliers, AI, Reports
│   │   ├── app.ts               # Express configuration
│   │   ├── app.test.ts          # Vitest API boundary test suite
│   │   └── server.ts
│   └── prisma/
│       ├── schema.prisma        # PostgreSQL schema
│       └── seed.ts              # Database seed script
├── docs/                        # Architecture, API, ER diagrams, testing documentation
├── DEVELOPMENT_STATUS.md        # Real-time milestone tracker
└── package.json                 # Monorepo workspaces
```

---

## 📄 License & Compliance

Built for compliant pharmacy operations. All pre-seeded demonstration records are fictional and do not constitute clinical treatment advice.
