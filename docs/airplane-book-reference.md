# Airplane model versus picture-book illustrations

Reviewed directly with the image viewer on 2026-09-13:

- `books/airplane/assets/02_overview_c_r2.webp`: white upper fuselage, vivid blue underside and nacelles, closely spaced small passenger windows.
- `books/airplane/assets/04_wing_c_r2.webp`: light wing surfaces, blue/white upturned wingtip, streamlined fairings underneath the trailing-edge region.
- `books/airplane/assets/06_tail_c_r2.webp`: blue fin with a broad swept white ribbon; light horizontal tail and elevator surfaces.
- `books/airplane/assets/07_engine_c_r2.webp`: blue nacelle, bright metal inlet rim, dark fan blades and central spinner, light pylon.
- `books/airplane/assets/09_gear_c_r2.webp`: paired wheels, metallic struts and braces, underwing twin engines. Existing paired-wheel arrangement was retained.

## Changes made

The former gray-blue paint and silver nacelle are now the book's stronger blue. Fan blades and spinner are dark; the inlet rim remains metallic and the pylon has its own light material. These changes do not recolor instructional compressor, combustor, turbine or shaft parts.

Passenger windows now follow the actual fuselage surface at each longitudinal location. The former fixed lateral offsets placed several windows inside the fuselage mesh. The replacement is a denser row of smaller windows (23 per side); the count is a teaching-model choice, not a claimed count from a specific aircraft.

Three elongated flap-track fairings per wing add the underwing detail seen in the wing illustration. Flaps, ailerons and elevators are light rather than blue. Wingtip accent is white rather than orange. A tessellated white ribbon follows both curved fin faces, replacing the orange fin-tip block.

No dimensions, model designation, seat capacity, blade count or engineering specification were inferred from the generated illustrations. Existing schematic scale, assembly identities, detail identities and hinge APIs are preserved. The illustrations guide visible form and paint; they are not engineering drawings. Interior machinery remains an educational schematic, not a literal reconstruction of unseen parts.

## Display integration

Engine `exterior` contains named `nacelle-near-half` and `nacelle-far-half`, plus the pylon and the inlet/fan/nozzle detail groups. An explicit opening can move a nacelle half while keeping the inlet/fan/nozzle present; hiding all of `exterior` would remove naturally visible engine components. New wing fairings are attached to each wing's exterior. The fin ribbon is attached to its fin skin and should move together with that skin.

## Verification

- `node qa_v3_airplane_model.cjs`: assembly/detail identities, finite geometry, mesh budget and reversible hinges.
- `node qa_v3_engine.cjs`: both engine sides, eight details, finite geometry, bounded size and animation/material stability.
- `node qa_book_airplane_model.cjs`: actual ray intersections prove every cabin window is visible above the skin from its corresponding side; validates elongated fairings and retained exterior fan faces.

Visual browser verification is performed separately by the parent task with the final display controller. This audit used the actual book images and source/geometry checks; it does not claim a completed rendered-model comparison.
