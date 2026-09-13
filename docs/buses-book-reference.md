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
