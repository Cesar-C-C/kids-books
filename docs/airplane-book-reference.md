# Airplane model versus picture-book illustrations

## Canonical reconstruction pass: book-faithful-models

The canonical external silhouette is `02_overview_c_r2.webp`. This pass reopened that image and `03_fuselage_c_r2.webp`, `04_wing_c_r2.webp`, `06_tail_c_r2.webp`, `07_engine_c_r2.webp`, `09_gear_c_r2.webp`, and compared them directly with the previous rendered `.qa-labs/airplane-exhibit-whole.png`. The previous rendering had an obviously pointed nose, very tall cockpit glazing, narrow tail cone, long tapering engine tubes, sharply folded tall winglets and oversized donut-like wheels. Those were geometry differences, not just paint differences.

The overview's rough visible fuselage bounds are approximately image X 240–1145, with a central body height around 125–135 pixels. These are visual reading ranges, not calibrated measurements; they suggest length/diameter around 7. The model now uses 12.05 / 1.76 = 6.85. The fin projects roughly a little over one fuselage diameter above the cabin roof; the model ratio is about 1.22. The perspective wing span and partly hidden engine rear cannot be measured reliably from this side image. Wing detail and engine close-up guide those shapes instead of treating distorted pixel lengths as dimensions.

Actual reconstruction changes:

- Eleven nose sections form a round blunt radome with full shoulders. The former six-section long cone is gone. The short cockpit panes now occupy less than 20% of fuselage diameter vertically, instead of climbing up the roof like a fighter canopy.
- Cabin diameter increased from 1.60 to 1.76 schematic units; the main tube is fuller over a longer length. The tail retains a rounded section to its end and terminates in a metal-rimmed dark exhaust opening. Rounded passenger door outlines are projected onto the new skin so they do not disappear inside it. The window row now has 32 smaller panes per side, matching the much denser appearance of the overview; all 64 are ray-tested above the skin.
- Blue underside blends continuously around the reshaped nose. The white vertical strip formerly covering the entire rudder is replaced by blue and a short white continuation of the fin ribbon.
- Wing root chord increased from 2.72 to 3.02 and the root thickened, with an additional shoulder section. Winglets now curve through seven stations rather than three hard folds; their height drops from 1.16 to .86. Existing attached internal ribs and control-surface identities remain in the same assemblies.
- Engine nacelles now have a convex barrel and a broad rolled inlet rim. An assembly transform also shortens the entire engine consistently, including its installed core: overall length 2.790 → 2.072, width 1.280 → 1.217. The previous exterior taper has been replaced by a full middle section and a shorter aft contraction. All eight learning details, both opening half-shell names and rotor animations remain.
- Nose gear moved aft from X -4.52 to -4.05, close to the front passenger door; main gear moved from X .60 to .92. Wheel radii changed from .24/.34 to .205/.27 (nose/main). Closed tire profiles with rounded shoulders and broad sidewalls replace torus donuts. Metallic scissor links and blue gear-door panels are attached to the struts. All six wheels now meet the same ground level within .012 units; main brakes remain coaxial with the smaller wheels.

These are explicit visual reconstruction choices. The generated book pictures differ in perspective and some details between pages, so the model is not described as a metrically exact scan or a proven pixel-identical 1:1 result. External likeness is judged against the canonical overview, with the detail images resolving local form. The new browser rendering must still be reviewed by the parent task; the old screenshot was the comparison baseline, not evidence of the new result.

The three Node checks listed below pass after this pass. The book-reference check now also verifies fuselage ratio, blunt-nose fullness, shallow glazing, short winglets, equal wheel ground contact and short broad nacelle proportions. The full plane remains at 15 assemblies and 582 meshes, below the existing 600-mesh budget; wheel-hub fasteners are batched to offset the additional windows.

## Earlier display-redesign pass (historical baseline)

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
