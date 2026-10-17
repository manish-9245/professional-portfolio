---
title: "Write Like Netflix"
title_accent: "Netflix"
kicker: "Project · AI Writing Skills"
tagline: "Thirteen AI skills that draft an engineering blog post from measurements of 388 Netflix TechBlog posts, then grade it like an editor with a pass mark of 48 out of 70"
description: "Write Like Netflix turns quantified patterns from 388 Netflix TechBlog posts into 13 agent skills for topics, titles, research, hooks, drafting, figures, fact-checking and editor-style review."
role: "Solo builder"
status: "Live"
type: "Agent skills"
tags: "AI, Open Source, Developer Tools"
date: "2026-10-17"
image: "/image/optimized/project-netflix-blog.webp"
repo: "https://github.com/manish-9245/Netflix-Techblog"
links: "Live site|https://write-like-netflix-production.up.railway.app"
tech: "Skills|Agent Skills (SKILL.md), Claude Code plugin, npx skills; Corpus tooling|Python; Landing|HTML, Tailwind, GSAP, nginx, Railway"
application_category: "DeveloperApplication"
---
The median [Netflix TechBlog](https://netflixtechblog.com) post runs 1,614 words, carries 29 numbers per 1,000 words and does not show its first figure until word 267. I know because I measured 388 of them. Write Like Netflix turns those measurements into 13 skills that draft an engineering post and then grade it like an editor, with a pass mark of 48 out of 70 that the draft has to clear before it ships.

## Background: advice versus a profile

Generic writing advice says to use the active voice and to show your numbers. It never says how many. The Netflix archive does. Across the 388 posts I profiled, the median sentence runs 22.5 words, the word "we" appears 13.4 times per 1,000 words against 6.1 passive constructions, and hedging words such as "perhaps" and "likely" stay under 1.6 per 1,000. Those are numbers a grader can check and a drafter can aim at.

So I stopped writing a style guide and built a pipeline around the profile. Every rule in the suite carries a measured figure, and the suite scores its own output against the same figures. It installs the way any [Agent Skills](https://agentskills.io) package does:

```bash
npx skills add manish-9245/Netflix-Techblog
```

## The corpus: 696 URLs, 388 posts

![Funnel from 696 enumerated URLs to 562 downloads to 388 profiled posts](/image/optimized/netflix-corpus-funnel.webp)

*Figure 1: How the archive shrank on the way to a profile. 134 of 696 downloads failed.*

I enumerated 696 post URLs from 2017 to 2026 and downloaded 562 as markdown. 134 downloads failed. The profiling scripts then measured 388 posts across structure, voice, titles, topics, figures and narrative, and every threshold in the skills cites that 388. The posts themselves belong to Netflix. The skills ship the measurements and the rules, not the articles.

The profile gives each skill its budgets. A post has 549 to 2,801 words between the 10th and 90th percentile. 83.8% carry figures at a median of 2.1 per 1,000 words. Only 14.9% contain code. Titles run 58 characters at the median and 76% name Netflix or the system.

## The router: seven skills, one gate

![The netflix-blog router chains topics, titles, research, write, visuals, factcheck and review, looping back on a failed review](/image/optimized/netflix-skill-chain.webp)

*Figure 2: The default chain for a new post. The review gate loops until the score passes.*

[`netflix-blog`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-blog/SKILL.md) is the entry point. It asks at most three questions and then chains the specialists. [`netflix-topics`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-topics/SKILL.md) scopes the idea and [`netflix-titles`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-titles/SKILL.md) locks the title before any drafting. [`netflix-research`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-research/SKILL.md) builds a claim-to-evidence table, so the draft never invents a number. [`netflix-write`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-write/SKILL.md) drafts to per-section budgets and hands the opener to [`netflix-hook`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-hook/SKILL.md). [`netflix-visuals`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-visuals/SKILL.md) places figures and captions. [`netflix-factcheck`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-factcheck/SKILL.md) verifies each claim against its source, and [`netflix-review`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-review/SKILL.md) scores the result.

An existing draft skips straight to factcheck and review. A large topic gets `netflix-series` inserted after scoping. Skills for interviews, data stories and code snippets sit beside the chain and run when the material needs them. The router announces each handoff in one line and never skips the review.

## The hook: ten openers, measured

![Bar chart of hook archetypes: announcement 66, problem 66, definition 25, metric 19, question 16, story 9, continuation 8, scenario 5](/image/optimized/netflix-hook-archetypes.webp)

*Figure 3: The first 150 words of a post fall into ten named archetypes. Announcement and problem together cover 132 of 388 posts.*

The opener is the highest-leverage 150 words, so it has its own skill. It offers the two archetypes that fit the material, with a one-line sample of each, and writes the one you pick. Announcement and problem each open 17% of posts, definition 6%, metric 5% and question 4%. 168 posts open in a way that matches none of the ten, so the named archetypes work as priors and not as a complete taxonomy. The rule that survives every case is the byline first and no throat-clearing.

## The reviewer: seven axes, 70 points

[`netflix-review`](https://github.com/manish-9245/Netflix-Techblog/blob/main/skills/netflix-review/SKILL.md) scores a draft from 0 to 10 on seven axes: structure, evidence density, figures, title, hook, voice and ending. The pass mark is no axis below 6 and a total of at least 48 of 70. Each axis uses the measured medians above. A post over 1,000 words with zero figures caps the figures axis at 4. An unsupported performance claim is a failure and not a warning. It reports the top five fixes ordered by score impact and applies them on approval.

The ending axis exists because 95 of the 388 posts, 24%, close with a hiring call, and others close with lessons, thanks or future work. A post that just stops loses points.

## Evaluation: the grader on a draft

The [landing page](https://write-like-netflix-production.up.railway.app) shows the grader running on a sample draft I wrote to test it, a Flink autoscaler post with illustrative numbers and not a real Netflix post. The first review scored 44 of 70. Two fixes later, compact mode and more links, it scored 52 and passed. That is one draft and I treat it as a smoke test. It shows the loop closes. It does not show that every post reaches 48.

Two limits belong next to that result. The profile describes Netflix's house style and does not prove the style is better. And the suite grades form, so facts still depend on `netflix-research` and `netflix-factcheck` being fed real sources.

## Conclusion

Write Like Netflix swaps a style guide for a measured profile and a grader. 13 skills, one router and a 48 of 70 gate give a solo author the structure a TechBlog editor would enforce. The prose it generates follows a house rule of no semicolons and no em or en dashes.

## What is next

168 posts open in a way no archetype captures, so the obvious next pass is mining those openers for new archetypes. After that, pointing the same profiling scripts at a different engineering blog would show whether the machinery learns another voice. The suite is MIT licensed. The [repo](https://github.com/manish-9245/Netflix-Techblog) takes pull requests, and the [live site](https://write-like-netflix-production.up.railway.app) shows the grader at work.
