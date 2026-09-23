# Real drum recording: provenance and integration contract

Source: Versilian Studios LLC, [Versilian Community Sample Library](https://github.com/sgossner/VCSL), pinned commit `c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e`.
The publisher describes VCSL as a recorded sample library released under **CC0 1.0 Universal**. See the [pinned license](https://github.com/sgossner/VCSL/blob/c1ea7bcc3c7309650ab0da9d15c9cd1fbc4a4c7e/LICENSE). This is a processed acoustic drum recording, not TTS, not an oscillator drum, and not a newly commissioned recording.

Original: `Membranophones/Struck Membranophones/Darbuka/Darbuka_1_hit_vl2_rr1.wav`.
Original SHA256: `9775c01e17a2713c239c552b63c3b6e9068f782c70128737390f8508f14cffb0`.
The repository identifies the instrument as Darbuka; performer, instrument model and microphone for this particular hit have not been independently established. Do not label it as a recording of the pictured drum.

## Processing and reproducibility

`workbench/drum-sfx-v1/download.mjs` downloads the pinned originals plus source README/license. `sources.json` records exact URLs, sizes and hashes. `build.py` builds both delivered files and `report.json` records actual duration, sample count, peak, RMS, K-weighted energy, spectral peak and hashes.

- `drum-low.wav`: original pitch; stereo averaged to mono, resampled to 48 kHz, 1 ms onset / 20 ms ending fades, normalized with the pair.
- `drum-high.wav`: same hit digitally shifted **+5 semitones**, time-preserving librosa processing. Same sample count/window as low. No additional hit, no loop, no artificial extended decay.
- Match full-window, ungated BS.1770 K-weighted energy within 0.05 dB; apply one common gain so neither peak exceeds -6 dBFS. This is a perceptual proxy, NOT an independent human equal-loudness verdict, and NOT gated integrated LUFS. The shift can alter transient timbre.
- Signed PCM16 WAV, mono 48 kHz; no clipping/nonfinite samples. These are effects, separate from the 66 narration MP3s.

## Playback contract (content task owns implementation)

- Decode local assets into AudioBuffers. Pitch A/B: low/high files, same playbackRate=1 and gain=0.85, no extra pitch processing.
- Loudness A/B: **same low AudioBuffer** and playbackRate=1, gains **0.4 / 0.85** (6.55 dB difference). Do not swap takes or EQ.
- Ordinary hit: low at gain=0.85. Remove the old oscillator gain cap of 0.025; do not stack another accidental attenuation stage. Start device volume modestly; dBFS does not measure acoustic SPL or certify hearing safety.
- Duration must come from decoded buffer.duration, not the former 3.2-second sine duration. Visible vibration should decay with the envelope; don't animate equally strong vibration until the file ends. Short recorded tails may be inaudible on some speakers; offer an automatic early-stop comparison around 0.15–0.25 seconds instead of extending/looping the tail.
- Press-to-damp: fade active gain to zero over about 10–20 ms, then stop/disconnect. Stop cancels pending demonstrations, both A/B players and duet schedules.
- Default muted; language switch, pagehide, navigation and narration start cancel SFX. Missing/decode-failed samples disable playback with an explanation; never silently substitute sine tones. Only user action enables audio.
- Add both WAVs to local/offline resource checks and verify mutual exclusion in the actual page. Local decode metrics alone do not certify PWA playback or human listening acceptance.

## Selection note

Three real hits were evaluated numerically: conga (1.310 s), bass drum (3.334 s), darbuka (1.254 s). A long file is not evidence of an equally long audible resonance. The Darbuka had more sustained early energy than the conga and avoids relying on the bass drum's very low-frequency output. This is a measurements-based choice pending listening on target devices, not a claim that every listener will prefer it.
