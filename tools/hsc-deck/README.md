# HSC presentation generator

`build.js` produces `docs/pitch/NILAI_HSC_TN00325.pptx` (7 slides, Hack for Social Cause template) with pptxgenjs.

```bash
npm install pptxgenjs react react-dom react-icons sharp
node build.js
```

`build.js` calls a theme helper (`applyTheme`) from the authoring environment; if you run it elsewhere, delete that import and the `await applyTheme(...)` line — the deck builds the same, with default theme colours for any scheme-coloured text. Images used on the slides are in `img/`.
