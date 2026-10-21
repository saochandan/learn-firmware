# Learn Firmware

A static, responsive embedded-development learning site. The first course follows the supplied 24-lesson Professional Firmware Debugging curriculum with original explanations, use cases, illustrative snippets, F401/H7 lab procedures, exercises and interview answers.

## Run locally

Requires Node.js 18 or newer. No package installation is needed.

```sh
npm test
npm start
```

Open http://127.0.0.1:4173. Hash-based routes work beneath a GitHub Pages repository path without server rewrites. Fonts use Google Fonts with system fallbacks. Progress, board selection and notebook entries use browser localStorage, with an export button for notes. There is no login or backend.

## Publish on GitHub Pages

The configured remote is `https://github.com/saochandan/learn-firmware.git`.

1. Push `main`: `git push -u origin main`.
2. In repository **Settings → Pages → Build and deployment**, select **GitHub Actions** as Source.
3. If necessary, run **Actions → Deploy Learn Firmware to GitHub Pages → Run workflow** after enabling Pages.
4. Inspect the workflow deployment result. The expected URL is `https://saochandan.github.io/learn-firmware/`; it is live only after a successful deployment.

The workflow checks content, creates a site-only artifact and deploys with the official Pages actions. Tests and documentation are not included in the published artifact.

## Content map

- `content.js`: 24 lessons across 5 modules, 3 project briefs, 3 original articles, official references.
- `app.js`: routing, course/question search, board adaptations, progress, notebook/export, timing calculator.
- `styles.css`: responsive layout, keyboard focus, reduced motion and print styling.
- `scripts/check.mjs`: content and static integrity checks.
- `scripts/serve.mjs`: loopback-only development server.

## Hardware scope

Examples require adaptation to a Cube-generated project for the exact board, MCU, peripheral and clock configuration. H7 cache discussions specifically concern Cortex-M7 devices such as H743/H745, not every H7 family member. Snippets are instructional, not a complete flashable BSP. Hardware labs and timing values have not been validated on physical boards as part of website development.

Use ST AN4989, PM0214, AN4839, UM2609, and the exact device reference manual, errata and board schematic. The site links to these official references. Curriculum titles are based on the user-provided image; tutorial text is original and independent of EmbeddedExpert.

## Suggested extensions

Add verified per-board firmware repositories and wiring diagrams, downloadable lab stimuli, automated hardware-in-loop results, an RTOS track, and a review workflow for learner case studies. Keep future tracks clearly distinguished from published lessons.
