# Drum transparency and recorded sound revision

User feedback: drum must have a transparent background; quiet sine tones are not recognizable drum sounds.

## Image

Built-in ImageGen edit, source `books/sound/images/drum-lab.webp`; generated output `exec-f79c87f7-04b4-476a-b428-cf1b34a78cce.png`, encoded into the same project WebP asset. The encoder now preserves RGBA instead of discarding alpha. Verified 1254x1254 RGBA, alpha range 0–255, transparent corners. QA independently viewed the selected golden card and confirmed no white rectangle; evidence: `../qa/interaction-review/sound-transparent-selected.png`.

Final prompt:

> Use case: background-extraction. Edit target: the provided storybook drum asset. Remove only the off-white rectangular background and any ground shadow, producing a genuinely transparent RGBA background with alpha=0 outside the drum. Preserve the entire drum, cream drumhead, ochre wooden shell, ropes, watercolor textures, exact perspective and centered square canvas framing. Keep all drum pixels opaque including the pale drumhead; do not mistake the drum skin for background. Clean antialiased cutout edges without a white halo. No checkerboard drawn into the image, no replacement solid background, no text, no additional object. This is a production transparent sprite to place on warm cream and golden interactive button backgrounds.

## Playback integration

Replace pure sine oscillators with local recorded-drum WAV buffers. Keep opt-in audio, lower-volume reminder, cancellation on stop/language/narration/navigation, epoch guards after asynchronous resume and decode, and a per-strike ticket to prevent late simultaneous hits. No pure-tone fallback on missing samples. Preserve the recorded attack and fade the final 25ms when an activity truncates a tail. Natural sample end controls the tap-stage animation, rather than looping one strike.

Sound source/license, processing, file duration and level measurements are owned by the audio task under `workbench/drum-sfx-v1`. Existing story/narration files remain unchanged. Technical playback and measured level do not constitute human listening acceptance or a guarantee of safe acoustic loudness on every device.

Delivered files: `books/sound/sfx/drum-low.wav` and `drum-high.wav`, both 60176 frames at 48 kHz mono PCM16 (1.253666667 seconds). Source is VCSL's CC0 Darbuka recording, not a recording of this exact pictured drum. High is a time-preserving +5-semitone processed variant, matched by K-weighted energy; see `books/sound/sfx/SOURCES.md` for license and processing limitations. Ordinary/pitch gain is 0.85; loudness comparison uses the same low buffer at 0.4 / 0.85. No oscillator remains. Stop uses a 12ms fade and schedules the source to end within 15ms. The automatic hold demonstration stops 200ms after actual playback starts, including delayed loading; six visual-amplitude steps approximate decay.

New preview origin: http://127.0.0.1:63414/books/sound/#tap-lab (avoid the previous origin's cached sine implementation).
