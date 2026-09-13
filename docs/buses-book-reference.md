# Bus model reference audit — 2026-09-13

The actual local WebP artwork below was opened and visually inspected. Colors are visual approximations, not sampled paint codes. Artwork varies between pages and provides no engineering dimensions; these are educational models, not certified vehicle replicas.

## School bus

- `books/schoolbus/assets/01_parts_c_v2.webp`: yellow conventional nose, pale cream rounded roof, front folding entrance, tall black-framed windows with a horizontal divider, two black rub rails, blue seats and circular headlights.
- `books/schoolbus/assets/03_inside_c_v2.webp`: forward-facing blue bench backs, center aisle, seats contained within the passenger box.
- `books/schoolbus/assets/05_stopsign_c_v2.webp`: low hood ahead of the windshield, broad grille, paired round lights and swing-out octagonal stop arm. This page has a yellower roof than the parts page; the parts page defines the exterior roof color used here.

Corrections: symmetric full-width roof profile (previous profile traced only one side); cream roof/yellower body; remove erroneous 90-degree hood rotation; lower cowl cheeks/top to windshield base; taller divided side windows and omit doorway-overlapping window; full-height dark folding door with upper/lower glazing; fix negative skirt thickness; rotate seats correctly toward -X and reduce rows so the rear seats stay inside the tail, with the rear bench spanning the width.

## Double-decker

- `books/bus/assets/00_cover_c_r2.webp`: solid red enclosed two-deck shell, dark window borders, broad upper front glazing/destination band, grouped small front lamps and rear side ventilation grille.
- `books/bus/assets/01_parts_c_r2.webp`: cutaway locates the staircase behind the front entrance and seats behind it; red deck separation and teal seats/yellow handrails.
- `books/bus/assets/02_upper_c_r2.webp`: teal forward-facing seats and dark edging, a clear central aisle, yellow grab poles.
- `books/bus/assets/04_stairs_c_r2.webp`: yellow edges run across the full tread width; a real upper-floor opening accepts the staircase.

Corrections: brighter red/teal palette, red floor lines instead of unsupported cream stripes, dark frame edging, upper front glazing/destination band, grouped front lamps and rear side grille; a closed middle doorway between the axles on the passenger side with dark frame, two opaque glazed leaves, yellow handles and threshold; remove erroneous quarter-turns from seats and move passenger rows behind the cab/stair zone; dark slim seat edging instead of thick yellow seat blocks; move staircase toward the front, make nosings cross each tread, and split the upper floor/underside into solid sections around an actual stairwell opening. Body floor band is now two side rails, not an invisible slab through the stairs.

## Educational additions and limits

Mechanical components, chassis dimensions, roof hatches/service housing, exact seat count, detailed emergency hardware and mechanism angles remain simplified instructional additions. The schoolbus seatbelts are supported by the interior illustration, but exact restraint geometry is schematic. The doubledecker middle doorway follows the cover as a static closed shell feature; the existing animated front doorway remains the teaching mechanism. No claim of complete page-for-page replication is made. The painted cutaway is not evidence for transparent real body panels.

## Display handoff

All assembly APIs and detail IDs remain intact. Opening a cabin must clear its body shell, glazing and roof using explicit exhibit controls. For lower-deck overview, clear the upper floor/underside as needed; the stair route itself now has a genuine opening. Cab glazing must be removed or moved to expose the driving controls. The closed middle doorway belongs to body.windows under body.exterior so it moves with the opened body and cannot stay behind to block the cabin. Existing ghost meshes remain hidden compatibility data, not a transparency display technique.

Validation: `node qa_v3_schoolbus_model.cjs` and `node qa_v3_doubledecker_model.cjs` exercise finite geometry, assembly/detail contracts, reversible region-only mechanisms, proportions, contained forward-facing seats, symmetric schoolbus roof and clear front stairwell. Browser exhibit validation belongs to the shared display integration pass.


## Canonical exterior reconstruction — second pass, 2026-09-13

The user rejected the earlier accessory-focused changes. Before rebuilding, the saved renders `.qa-labs/schoolbus-exhibit-whole.png` and `.qa-labs/doubledecker-exhibit-whole.png` were opened alongside the actual book artwork. This pass rebuilds exterior surfaces while retaining the existing assembly IDs and instructional interiors.

### Schoolbus canonical image

Use `books/schoolbus/assets/01_parts_c_v2.webp` for the external silhouette, roof color, window cadence, door and wheel proportions. The picture's approximate side silhouette runs from x=23 to x=1145 and y=174 to y=655: projected length/height about 2.33. These are visual pixel landmarks, not real measurements. The 3D exterior is approximately 9.25 by 3.80 model units (ratio 2.43); the slight allowance accounts for the oblique visible nose and mirrors. `05_stopsign_c_v2.webp` supplements the frontal grille/headlamps; `03_inside_c_v2.webp` supplements seats only.

The rejected render showed a rectangular nose, separate floating roof cap, six blue tile-like windows without a continuous black frame, exposed warning-light blocks sitting above the roof, and small shallow tires. The rebuilt exterior uses a longitudinal tapered bonnet with rounded shoulders, curved front fender crowns, real side-skin wheel clearances, larger tires with rounded sidewalls and inset eight-hole rims, one roof surface joined to the eaves and rounded at both ends, five dark-framed divided passenger windows, and warning lamps recessed into the front header. The windshield top is aligned with the side-window row. The pale roof follows the canonical parts page; it is intentionally not switched to the yellower stop-sign page.

### Doubledecker canonical image

Use `books/bus/assets/00_cover_c_r2.webp` for the exterior: red enclosed two-storey shell, broad red deck separator, black-framed window ribbon, rounded front and rear corners, large front windshields, and front/middle entrances on the passenger side. Because this is strongly oblique, its overall projected aspect ratio is not used as a physical dimension. `01_parts_c_r2.webp` provides a near-side silhouette cross-check (approximately 1050 px long / 590 px high, around 1.8); `02_upper_c_r2.webp` and `04_stairs_c_r2.webp` supplement the interior.

The rejected render was an elongated low rectangular box with separate thick end slabs, tiny buried wheels, a tube-like crown and two rows of blue tiles. The rebuilt exterior has full-height storeys (visible model envelope about 8.82 by 4.57 units, ratio 1.93), continuous rounded front/rear sections, a shallow crown meeting the side shoulders, a continuous dark upper window surround, wider lower glazing groups, a wide red interdeck band, circular tires with rounded shoulders and detailed rims, actual wheel cutouts, and separated upper/lower front windscreens. The cabin height change is baked into vertices, keeping assembly pivots at unit scale and preserving the opening/mechanism contract. The middle doorway still belongs to body.windows and moves out with the body exterior.

### Verification and remaining interpretation

Both Node model suites pass. New tests measure only real exterior surfaces (excluding ghost boxes), enforce canonical aspect-ratio ranges, circular tire geometry, actual ray-clear wheel openings, reconstructed curved-end/bonnet geometry and unit-scale display pivots. Existing tests still verify all assembly/detail IDs, region-only motion and exact mechanism reset.

These changes are a substantially closer visual reconstruction of the chosen illustrations, not an assertion of recoverable exact 3D dimensions from a 2D painting. Hidden surfaces and engineering internals remain educational interpretations. Fresh browser captures and inspection are required in the parent integration pass before claiming visual acceptance; this subtask did not run a browser concurrently.


### Fresh render follow-up

The parent's regenerated whole-model screenshots were inspected after reconstruction. They confirm the larger schoolbus tires/curved bonnet and the taller doubledecker shell/window bands. Inspection also revealed three occlusion/finish defects, now corrected: schoolbus entrance leaves were behind the opaque skin (moved outside and extended to the skirt), the driver window sat lower than the passenger row (resized/aligned with black edging), and the doubledecker front entrance looked like four blue tiles with a protruding step (replaced by two tall dark-framed panes down to the skirt; treads now belong to the hidden interior). The warning lamps now have yellow header backing. Model tests pass after these fixes; the parent should refresh final captures to assess their rendered appearance.


Final refreshed capture exposed a cyan bar across the front doorway. Geometry inspection identified it as the wheelchair-bay floor: its 2.30-unit width plus -0.40 offset crossed the sidewall. It is now a contained 0.80-unit bay marking and belongs to lower.interior, with a boundary regression test. It was not a door handle.
