# Narration provenance

The 40 Chinese/English story and vocabulary clips are newly AI-synthesized with Fun-CosyVoice 3, using the v3 batch-r2 instructed gentle-narrator profile. They are not original performances or endorsements by the reference speakers. The user accepted this exact set after audition. File hashes and acceptance scope are recorded in `docs/qa/moon-release-audio.json`.

Chinese narration reuses the existing project's bundled CosyVoice `zero_shot_prompt.wav` recipe (reference SHA256 `c7b31d6dbe7cc6a716dded00550db5b50940bf209e424e4ad207b12e657c8ff6`). This documents local recipe reproduction, not a new claim that every possible use has been legally cleared. The reference recording itself is not redistributed here.

English reference: Kara Shallenberg, LibriTTS speaker 19, utterance `19_198_000000_000002`. The local reference was cropped to 2.04–7.34 seconds from the SDialog concatenated speaker recording. Corpus attribution: Heiga Zen et al., *LibriTTS: A Corpus Derived from LibriSpeech for Text-to-Speech*, Interspeech 2019. The publisher declares [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) for [LibriTTS](https://www.openslr.org/60/). Metadata mirror: [SDialog voices-libritts](https://huggingface.co/datasets/sdialog/voices-libritts); corresponding text record: [LibriTTS-R tags and text](https://huggingface.co/datasets/ylacombe/libritts_r_tags_and_text).

Changes: cropped reference, newly synthesized bilingual story speech, quote-aware segmentation, loudness adjustment and segment gaps. Only the Chinese phrase 背着灯 uses the scoped pronunciation tokens `[b][èi]`; the displayed story is unchanged. Reference audio, intermediate WAVs, models and candidate auditions are excluded from this release.
