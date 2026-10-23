# Learn Firmware

An original firmware-development learning path with **43 lessons in 8 modules**, 8 chapter integrations, 43 exercise solution guides, 3 capstone briefs, 3 articles and 129 lesson interview answers. Each chapter also has a separate interview case. It progresses from C and hardware fundamentals through bring-up, interfaces, real-time design, fault investigation, reliability and delivery. Existing material is integrated into the new sequence with stable IDs.

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

- `content.js`: original lesson bodies, projects, articles and official references.
- `lesson-details.js`: detailed explanations, worked cases, distinct F401/H743 procedures and troubleshooting for the original 24 lessons.
- `course-path.js`: 19 new lessons, revised titles, 8 original modules and the learning order.
- `chapter-content.js`: 8 integrated chapter case studies, all 43 exercise solutions and advanced interview answers for the newer lessons.
- `chapter-examples.js`: 8 downloadable reference models/tool-command examples with worked traces.
- `chapter-ui.js`: chapter walkthrough pages and reference copy/download/print controls.
- `app.js`: routing, course/question search, board adaptations, progress, notebook/export, timing calculator.
- `styles.css`: responsive layout, keyboard focus, reduced motion and print styling.
- `scripts/check.mjs`: content checks, 63 content-route renders, 86 board procedures, chapter integration/solution coverage, navigation, 129 lesson interview answers, filtering and persistence checks.
- `scripts/serve.mjs`: loopback-only development server.

## Hardware scope

Examples require adaptation to a Cube-generated project for the exact board, MCU, peripheral and clock configuration. H7 cache discussions specifically concern Cortex-M7 devices such as H743/H745, not every H7 family member. Snippets are instructional, not a complete flashable BSP. Hardware labs and timing values have not been validated on physical boards as part of website development.

Use ST AN4989, PM0214, PM0253, AN4839, UM2609 and the exact device reference manual, errata and board schematic. The curriculum is an original broader sequence; the supplied debugging reference informed only part of its content.

## Current curriculum

| Module | Lessons | Scope |
| --- | ---: | --- |
| Hardware and C foundations | 5 | Requirements, lifetime, registers, electrical interfaces, state machines |
| Bring-up and the build-to-board workflow | 7 | Probe connection, startup, clocks, binaries, optimization, execution control, watchpoints |
| Interfaces, protocols and data movement | 6 | Peripheral configuration, GPIO, ADC, serial framing, I2C/SPI, DMA |
| Time, events and concurrent execution | 5 | Timers/PWM, interrupts, races, timing, RTOS design |
| Memory safety and fault forensics | 6 | Bounds, stacks, exceptions, frame decoding, fault status and instructions |
| Evidence-driven troubleshooting | 4 | Observations, reproduction, isolation, causal verification |
| Verification, recovery and field resilience | 6 | Tests, injection, regression, watchdogs, updates, power states |
| Architecture, security and delivery | 4 | APIs, trust boundaries, builds, engineering case studies |

Lesson IDs and display positions differ deliberately: existing notes/bookmarks remain valid, while previous/next follows the new order. The first lesson is `#lesson/25`; the final case study is `#lesson/24`.

The automated checks use a DOM adapter and do not verify visual layout, real-browser behavior or physical boards. Website checks do not compile C firmware. Update/security/power worksheets teach design contracts and are not production implementations. Projects remain detailed briefs rather than completed flashable projects.

## Work through a chapter

Open the course overview, study its lessons and attempt each exercise before opening its solution. Then follow **Open the chapter implementation and reference code** to integrate the concepts. Chapter pages use routes `#chapter/0` through `#chapter/7`; they do not replace existing lesson IDs or saved notes.

| Chapter case | Reference material |
| --- | --- |
| Nonblocking water-level monitor | Portable C policy, hysteresis and stale-data trace |
| Reset-to-application bring-up | Actual Arm GNU/GDB commands and artifact inspection |
| Sensor-to-UART pipeline | Bounded C frame encoder and exact byte trace |
| Deadline under task/interrupt load | FreeRTOS queue/task creation with failure cleanup and overload policy |
| Trustworthy crash context | Bounded frame decoder with invalid-context rejection |
| Intermittent missing messages | Single-owner bounded evidence ring and overwrite trace |
| Failure recovery and supervision | Fresh progress-epoch watchdog policy model |
| Explainable firmware release | Fakeable synchronous driver and rejection-preserves-state example |

Downloadable C examples are instructional reference components, not standalone board applications. FreeRTOS code requires a supported port/configuration and measured stack budgets. HAL/startup, device transactions, flash programming, security trust roots and physical measurements remain target integration work. Host/static website checks must never be reported as target compilation or hardware validation.

## Suggested extensions

Add verified per-board firmware repositories and wiring diagrams, downloadable lab stimuli, automated hardware-in-loop results, an RTOS track, and a review workflow for learner case studies. Keep future tracks clearly distinguished from published lessons.
