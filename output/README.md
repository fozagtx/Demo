# Render outputs

Rendered videos are generated locally and excluded from Git because the code-review system does not accept binary files.

Run:

```bash
npm run render
```

The renderer creates:

- `output/okupy-demo-final.mp4`
- `output/okupy-demo-review.mp4`
- representative JPEG frames under `qa/`

The files remain available in the working directory after rendering, but are not included in commits.
