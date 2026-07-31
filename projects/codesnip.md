---
title: "CodeSnip"
title_accent: "Snip"
kicker: "Project · Developer Tool"
tagline: "A multi-language code editor that exports snippets as polished PNGs or animated GIFs - themes, gradients, and a typing animation built entirely client-side."
description: "How CodeSnip turns a code snippet into a carbon.now.sh-style PNG or typing-animation GIF using dom-to-image and a four-effect React state machine, with zero backend."
role: "Solo builder"
status: "Live demo"
type: "Developer tool"
tags: "Frontend, Developer Tool"
date: "2025-05-25"
image: "/image/optimized/project-codesnip.webp"
repo: "https://github.com/manish-9245/codesnip"
links: "Live demo|https://codesnip-sigma.vercel.app/"
tech: "Frontend|React 18, react-simple-code-editor, Prism; Export|dom-to-image-more, gifshot"
application_category: "DeveloperApplication"
---
Sharing a code snippet on social media or in a slide deck usually means an ugly plain-text screenshot. Tools like carbon.now.sh solved that by rendering code into a styled "window" and exporting it as an image - CodeSnip is a from-scratch take on the same idea, plus an animated-GIF export that doesn't use a canned animation at all: it replays your actual typing, frame by frame.

## The typing animation is not a canned effect

The clever part of CodeSnip isn't the PNG export - that's a straightforward DOM-to-image capture. It's the GIF: instead of animating a pre-made effect over the finished code, it reconstructs the *history* of you typing it, one character at a time, and screenshots every step:

```js
// src/App.js - building one frame per character typed
const onRecord = () => {
  const totalLines = editorState.split('').filter((c) => c === '\n').length;
  let linesLeft = totalLines;
  let tempFrames = [];
  for (let i = 0; i < editorState.length; i++) {
    if (editorState[i] === '\n') linesLeft--;
    let currentFrame = editorState.slice(0, i + 1);
    for (let j = 0; j < linesLeft; j++) currentFrame += '\n';
    tempFrames.push(currentFrame);
  }
  setFrames(tempFrames);
  setExportingGIF(true);
};
```

Each entry in `tempFrames` is the snippet truncated to `i` characters, padded with the remaining newlines so the code block doesn't visually collapse as lines "disappear" mid-animation. For a 200-character snippet, that's 200 separate frames - and every one of them gets rendered and screenshotted before encoding even starts.

## A state machine made of four `useEffect`s

Rather than one async function driving the export start-to-finish, GIF export is spread across four chained `useEffect` hooks in `App.js` - one advances `currentFrameToCapture`, one pushes each frame's text into `editorState` so it re-renders, one calls `takeSnapshot()` via `dom-to-image-more`'s `domtoimage.toPng` and accumulates results into `gifFrames`, and a final one fires once every frame is captured and hands the whole array to `gifshot.createGIF()`. It works, but the file's own top comment is disarmingly honest about it: `// This needs refactoring` and `// TODO: Refactor this to use context API` - a real admission of the tech debt sitting in the code, not something inferred from the outside.

One deliberate finishing touch: before encoding, the frame list gets padded with nine repeated copies of the final frame:

```js
for (let i = 0; i < 9; i++) {
  framesToExport.push(gifFrames[gifFrames.length - 1]);
}
```

Without that, the GIF would loop back to frame one the instant typing finished. Nine extra identical frames buy a visible pause on the completed code before it loops - a small trick, but it's the difference between a GIF that reads as "here's the finished snippet" and one that just looks broken.

## The real cost of this approach

Because export re-renders and screenshots the DOM once per character, the whole pipeline is inherently serial and slow for longer snippets - a 200-character example means 200 full `dom-to-image` captures (each scaled 1.9x for resolution) running one after another through those four effects before `gifshot` even starts encoding. That's a real, visible lag on anything beyond a short snippet, and it's the direct cost of the "replay real keystrokes" approach instead of a pre-baked animation. It's a legitimate trade for a hobby export tool: simpler to reason about than a proper animation timeline, at the cost of scaling linearly with snippet length.

## Everything else is DOM tricks, not magic

The theme system is refreshingly low-tech: `Window.jsx` swaps a `<link href="/themes/${theme}.css">` tag's `href` rather than reaching for CSS-in-JS, so a "theme" is just a static stylesheet in `public/themes/` being hot-swapped. Downloading the final PNG is nine lines - build an off-DOM `<a download>`, click it, remove it. And the syntax highlighter (Prism, via `react-simple-code-editor`) supports nineteen languages, noticeably more than the five IDE color themes on offer - a small asymmetry worth knowing if "customization" is the feature you're evaluating it for.

## Running it

```bash
git clone https://github.com/manish-9245/codesnip
cd codesnip && npm install && npm start
```
