# Illustration production and review

Built-in image generation, 2026-09-19/20. All selected artwork encoded into project WebP at quality 92 with `tools/encode_everyday_art.py`; conversion changes format only. Originals remain in the local production archive and are not release dependencies. No remote image dependency.

## Prompt set

Common: illustration-story, landscape 3:2, warm gouache and colored-pencil texture on paper, coherent character anatomy, clear narrative gestures, no text/labels/diagrams/watermark. Later images reference the respective opening image to preserve characters, clothes and setting. Scientific models are authored separately, never burned into the art.

Sound reference: white rabbit Dongdong, gray ear tips, coral overalls, cream shirt, teal scarf; brown squirrel in blue vest. Cozy forest clearing, wooden table, ochre drum with cream head, forest green and warm orange palette, waiting woodland audience.

| Runtime asset | Scene prompt | Original PNG |
|---|---|---|
| sound/images/concert.webp | Rabbit with little drum at table, squirrel looks at drumhead, audience waits in forest | exec-975ead33-a912-4480-8c9a-f97c1552b3de.png |
| sound/images/closeup.webp | Rabbit gently touches drumhead to stop vibration; squirrel points; string instrument rests on table | exec-1ab9ddd0-b3ba-4013-8205-37b87f82c302.png |
| sound/images/listen.webp | Squirrel taps drum at left; rabbit a few steps away at right lifts paw beside ear; clear space between them, no visible waves | exec-78ad928d-d47b-4e0e-9804-16fbdd54f9c0.png |
| sound/images/finale.webp | Rabbit drums, squirrel waits beside wooden xylophone, comfortably spaced audience, gentle late light | exec-c5b91a7f-6421-46b0-90f9-08a73a9db5e6.png |

Soap reference: young gray-brown raccoon Momo, eye mask and striped tail, blue shirt and coral apron; mother in green cardigan. Cream and lake-blue kitchen, low wooden work table, window light. Apron removed for washing and hanging scenes.

| Runtime asset | Scene prompt | Original PNG |
|---|---|---|
| soap/images/helper.webp | Momo carries dressed vegetables and notices oil spots on apron; mother nearby | exec-7866d390-c6ab-439f-b26a-df6a4d99a2b1.png |
| soap/images/wash.webp | Removed coral apron with oil spots being washed in basin by Momo and mother; few bubbles | exec-154b3a7d-0e9b-4f7a-8eb4-870038fce94d.png |
| soap/images/water.webp | Precise edit of wash: preserve characters/setting/apron, remove all foam/bubbles and remove soap bar/dish; plain water before detergent | exec-03921d91-b8a6-442d-860a-b3c0c4f09b5c.png |
| soap/images/compare.webp | Two identical clear plastic containers, same water level and oil layer, identical stir sticks, unlabelled detergent bottle not pouring | exec-3211facd-3d40-4951-a5f1-1f8f00e08227.png |
| soap/images/finish.webp | Momo hangs cleaner damp apron on low rail; tidy basin and a few bubbles, supportive mother | exec-7b6c2b99-78c0-4177-8311-21358d4aaa8a.png |

## Visual review

All generated outputs visually inspected. Character masks/ear tips/clothing and locations are consistent; no instructional labels baked in. Water-only art required a dedicated correction because reusing the soap wash art would contradict the story chronology. Runtime images use contain, avoiding cropped ears and objects; no UI is overlaid on characters. Finish apron has damp darker patches, not a claim of sterile or perfectly stain-free fabric. Browser screenshots also reviewed for layout; scientific interactive layers remain separate from the narrative pictures.
