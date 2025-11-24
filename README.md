# ECG Monitor Project
## ECG Monitor Project

A web-based Electrocardiogram (ECG) monitoring dashboard that reads streaming ECG data from a serial device (for example, an Arduino) and displays it in real time. The app also includes utilities and UI components to inspect, record, and visualize the ECG waveform.

This repository has been converted to a JavaScript-based Vite + React application (originally started in TypeScript). All core UI components have JS/JSX equivalents and the project is buildable with a standard Node.js toolchain.

Highlights
- Real-time ECG rendering using an HTML canvas with device-pixel-ratio aware drawing.
- Web Serial API support for connecting to Arduino-like devices over a serial port (demo-mode available when no device is connected).
- Lightweight UI primitives (shadcn-style) adapted to plain JS/JSX for easier consumption.
- Tailwind CSS for styling and responsive layout.

Table of contents
- Features
- Quick start
- Development
- Build & deploy
- Project structure
- Troubleshooting
- Contributing
- License

Features
- Real-time ECG plot with adjustable sampling and smoothing.
- Serial device connection flow (connect / disconnect / demo mode).
- Mobile-friendly responsive layout and DPR-correct canvas rendering.
- Toast notifications for errors and status (Sonner-based).

Quick start
1. Requirements
	 - Node.js (v16+ recommended)
	 - npm (or pnpm/yarn, adapt commands accordingly)

2. Clone and run locally

```powershell
git clone https://github.com/RangeshPandianPT/ECG-Monitoring-System.git
cd ECG-Monitoring-System
npm install
npm run dev
# Open http://localhost:8080 in your browser
```

Development
- Start a dev server with hot reload:

```powershell
npm run dev
```
- Run a production build locally:

```powershell
npm run build
npm run preview
```

Project structure
- `src/` — application source
	- `src/main.jsx` — app entry
	- `src/App.jsx` — top-level app and router
	- `src/components/ECGMonitor.jsx` — ECG canvas + serial logic (converted from TS)
	- `src/components/ui/` — UI primitives and wrappers (JSX)
	- `src/lib/utils.js` — small utilities (class names)

- `vite.config.js` — Vite config (converted from TS)
- `tailwind.config.cjs` — Tailwind config (converted from TS)

Build & deploy
- Build the app for production:

```powershell
npm run build
```

- Deploy the contents of the `dist/` folder to any static hosting provider (Vercel, Netlify, GitHub Pages, S3 + CloudFront, etc.). Vercel and Netlify will accept the project directly and run `npm run build` as part of the deployment flow.

If you use a platform that serves from a specific folder, point it at `dist/` after build.

Configuration and environment
- The app is configured for local development on port 8080 by default (see `vite.config.js`).
- Tailwind configuration is in `tailwind.config.cjs`.

Troubleshooting
- If the app fails to build after pulling changes:
	1. Ensure dependencies are installed: `npm install`.
	2. If you previously used TypeScript and removed it, run a clean install:

```powershell
rm -rf node_modules package-lock.json
npm install
```

	3. Run `npm run build` and inspect any error messages. Common issues relate to missing files or mismatched import paths; these will be shown in the Vite output.

Contributing
- Contributions are welcome. Suggested workflow:
	1. Fork the repo and create a feature branch from `main`.
	2. Make changes and keep builds green locally.
	3. Open a pull request describing the change and the motivation.


