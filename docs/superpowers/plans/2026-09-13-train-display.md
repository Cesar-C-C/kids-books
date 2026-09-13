# Train display implementation plan

Approved design: preserve the picture-book model; separate camera navigation, explicit opening, and full disassembly. A wide stage and a right inspector replace the permanent left navigation. Controls never overlap the canvas.

1. Move the part directory into a collapsible inspector section; simplify stage controls and remove decorative captions. Use stacked, non-overlapping mobile layout.
2. Make selection independent of camera movement. Add explicit focus, camera history, and pure wheel/pinch zoom.
3. Add animated exterior opening for cabin and cab, fixed train-coordinate motor cutaway, and explicit body lift for bogies. Preserve original geometry/materials and restore positions on close. Prevent overlap with explosion mode.
4. Update browser contracts to verify navigation stability, opening/closing, opacity, all bilingual details, mechanisms, and desktop/tablet/phone layout. Inspect screenshots.
5. Refresh PWA assets, validate, commit and publish through the existing GitHub workflow.
