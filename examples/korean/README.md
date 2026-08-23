# Korean résumé (이력서 / 자기소개서)

Two ready-to-use RenderCV documents. Each is a **single file** holding `cv`,
`design`, `locale` and `settings` — open the workspace and use **Import YAML**.

| File | What it is |
| --- | --- |
| `korean-resume-template.yaml` | Blank template with commented fields. Start here. |
| `korean-resume.yaml` | The filled example that ships as a default file, including an inline base64 photo. |

## What makes these Korean

- `locale.language: korean` — month names and "present" (현재) come out in
  Korean. Every built-in theme respects it.
- Section keys are Korean (`경력사항`, `자기소개서`, …) and are printed verbatim,
  so nothing has to be translated by the renderer.
- `name_hanja` / `name_english` sit alongside `name`. They are folded into the
  headline, or next to the name on themes that have no headline slot.
- `date_of_birth` becomes a header connection.
- Fields RenderCV does not define — `고용구분` and the like — are folded into the
  entry summary with the label you gave them, rather than rejected.
- `자기소개서` is written as `질문: 답변` pairs rather than a list. Short answers
  render as one-line rows; once one answer is long enough to be prose the whole
  section switches to paragraph entries, because RenderCV allows only one entry
  type per section.

## Photo

`cv.photo` accepts an `https://` URL or an inline `data:image/…;base64,…` URI.
Both are resolved in the browser and handed to the Typst compiler directly.

Note that the plain `rendercv` CLI does **not** understand a `data:` URI — it
expects a path or an HTTP URL. To render `korean-resume.yaml` outside this app,
point `photo` at a local image file instead.
