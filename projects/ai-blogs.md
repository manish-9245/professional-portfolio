---
title: "AI Blogs SaaS"
title_accent: "SaaS"
kicker: "Project · SaaS"
tagline: "An AI Director that watches a YouTube video, plans an outline, and drafts a full SEO-optimised blog post - with a human still steering the wheel."
description: "AI Blogs SaaS converts YouTube videos into premium, SEO-optimised blog posts via an AI Director, with full outline control and a dashboard for the whole publishing pipeline."
role: "Solo builder"
status: "Live in production"
type: "SaaS platform"
tags: "SaaS, AI, Full-Stack"
date: "2026-03-14"
gallery: "/image/optimized/aiblogs-20260314-175545.webp, /image/optimized/aiblogs-20260314-175617.webp, /image/optimized/aiblogs-20260314-175643.webp, /image/optimized/aiblogs-20260314-175717.webp, /image/optimized/aiblogs-20260314-175800.webp, /image/optimized/aiblogs-20260314-175945.webp, /image/optimized/aiblogs-20260314-180009.webp, /image/optimized/aiblogs-20260314-180032.webp, /image/optimized/aiblogs-20260314-180155.webp, /image/optimized/aiblogs-20260314-180224.webp, /image/optimized/aiblogs-20260314-181126.webp, /image/optimized/aiblogs-20260314-181149.webp"
links: "Live site|https://aiblogs.buildwithmanish.com/; View blogs|https://aiblogs.buildwithmanish.com/blog; Dashboard|https://aiblogs.buildwithmanish.com/admin"
tech: "Frontend|Next.js, TypeScript, Tailwind CSS; AI & Backend|OpenAI API, Agentic Workflows, Node.js"
application_category: "BusinessApplication"
---
This is the one project on this page without a public repo to link to - it's a closed-source, production SaaS product I run, not an open-source demo. What follows is the design thinking behind it rather than a code walkthrough, because that's the honest version of "how it's built" for something that isn't open for anyone to read.

## The actual problem

Creators sit on hours of long-form video that could become SEO-friendly articles, but the manual path - transcribe, outline, write, format, publish - takes almost as long as making the original video did. Most "AI blog generator" tools skip straight from transcript to draft, which produces exactly what you'd expect: a wall of text that reads like a transcript with the timestamps removed, because a summarizer was never asked to *structure* anything, only to shorten it.

## Why an outline comes before a single sentence of prose

The core design decision in AI Blogs is refusing that shortcut. Before anything gets written, an "AI Director" step plans the actual shape of the article - what sections it needs, what order they go in, where a screenshot or generated image earns its place - and that outline is something a human can review and adjust before a single paragraph gets drafted. Writing section-by-section against an approved outline, instead of asking a model to produce a finished article in one pass, is what keeps the output readable as an edited piece rather than a raw model dump. It's a slower pipeline than "one big prompt," and that's deliberate: the extra step is what the quality difference actually comes from.

## Keeping a human in the loop, on purpose

The product resists being a black box that pops out a finished post on its own. The dashboard exists specifically so a draft is something you steer, not something you accept sight-unseen - outline first, then drafted sections, then a review pass before anything goes live on the connected blog. That's slower than a fully automated pipeline, and it's the trade I'd make again: the moment a tool writes and publishes without anyone looking, the failure mode stops being "not quite right" and starts being "wrong in public."

## What "SaaS" actually means here

Being a hosted product rather than a script you run locally means the boring infrastructure work - auth, a persistent content pipeline, an admin surface, keeping generated posts and their metadata consistent across drafts and publishes - has to exist and stay reliable for more than one user at a time. That's a different set of problems than getting a single generation pipeline to work once in a notebook, and it's most of where the actual engineering time goes: not the prompt, but everything around making the prompt's output trustworthy enough to publish from a dashboard instead of a terminal.

## Where you can see it working

The live site, the public blog it publishes to, and the dashboard used to steer drafts are all linked above - since the code itself isn't open, those are the best way to see the actual pipeline in action rather than take a description of it on faith.
