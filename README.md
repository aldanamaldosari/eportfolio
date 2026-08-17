# AlDana Al-Dosari — MSc AI ePortfolio

Professional ePortfolio documenting my learning journey through the MSc Artificial
Intelligence programme at the University of Essex.

Live at https://[username].github.io/

## Structure

* `index.html` — Homepage: hero, About Me, and the module cards with their statuses
* `module-01.html` — Numerical Analysis — Completed
* `module-02.html` — Intelligent Agents — In progress
* `module-03.html` — Machine Learning — Upcoming
* `assets/`
  * `css/site.css` — the whole design system, shared by every page
  * `js/site.js` — reading progress, margin notes, section navigation, module tabs

Three modules are published so far. Further module pages will be added as the
programme progresses; each new one is a copy of an existing module file plus a
card on the homepage.

The homepage is a single scrolling page — the menu items Home, About me and
Modules jump to sections rather than separate pages. Each module page runs
Overview → Artefacts → Outcome map → Reflection as tabbed sections, switched by
the sticky bar under the header rather than by scrolling. Intelligent Agents
carries an additional Group project tab covering the team deliverable, my
contribution and how the group worked.

One stylesheet and one small script serve all four pages — edit
`assets/css/site.css` rather than adding styles to a page. There is no build step
and no dependency beyond the Google Fonts request, so the folder can be pushed to
GitHub Pages exactly as it is.

## Design

Hand-built static HTML with no framework or build step.

* **Type** — DM Sans throughout, at a single family for headings, body and
  metadata; weight and letter-spacing carry the hierarchy rather than a second face
* **Colour** — flat blocks of a dusk palette on a blush paper ground, defined as
  CSS custom properties: `--navy #101A45`, `--slate #26425A`, `--blue #86A8CF`,
  `--mauve #C38EB4`, `--blush #E1CBD7`, `--ink #16242E`
* **Marginalia** — reflective notes sit in the right margin, linked to the
  sentence they comment on; clicking a numbered marker opens the note and
  highlights the passage
* **Status** — each module shows Completed, In progress or Upcoming, with a filled
  dot for started work and a hollow one for modules not yet begun
* **Motion** — restrained, and disabled entirely under `prefers-reduced-motion`
* **Accessibility** — visible focus rings, ARIA tablist semantics with arrow-key
  navigation, labelled icon links, and no horizontal overflow at 375px

## Updating Content

All editable text is written in plain HTML — no templating language to learn.
Placeholder copy is wrapped in `[square brackets]` so anything still unfinished is
easy to find with a search across the folder.

* **Adding an artefact** — copy an `<article class="entry">` block inside the
  Artefacts panel and give it a new `id`
* **Adding a margin note** — a `<button class="mark" data-note="nX" data-anchor="aX">`
  pairs with an `<aside class="note" id="nX">` and a `<span class="anchor" id="aX">`;
  keep the ids unique within the page
* **Completing a module** — change its status label and class (`now` → `done`,
  `In progress` → `Completed`) on both the homepage card and the module page header
* **Adding the CV** — replace the `<span>` holding the document icon in the footer
  with an `<a href="...">` and the fade disappears

## Deployment

GitHub Pages, from `main`.

```
git add .
git commit -m "Description"
git push origin main
```

Pages rebuilds within a minute or two. If the site looks unchanged, hard-refresh
with Ctrl+F5 — that is CDN caching, not a failed push.

## Programme Information

* Programme: MSc Artificial Intelligence
* Institution: University of Essex
* Modules published: 3

## Disclaimer

The design and front-end code of this site were developed with the assistance of
Claude, an AI assistant made by Anthropic. All academic content — the reflections,
artefacts, analysis and evidence presented against the learning outcomes — is my
own work.

---

© 2026 AlDana Al-Dosari. All rights reserved.
