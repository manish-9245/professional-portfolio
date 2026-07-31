---
title: "Orbit Video Chat"
title_accent: "Video Chat"
kicker: "Project · Communication"
tagline: "A WebRTC-powered video conferencing app built for both quick 1:1 calls and full group meetings, with screen sharing and chat alongside the call."
description: "How Orbit uses Next.js Server Actions to mint short-lived Stream video tokens server-side, and what building on a managed video SDK actually leaves you to build."
role: "Solo builder"
status: "Live in production"
type: "Communication app"
tags: "Real-time, Full-Stack"
date: "2025-05-17"
image: "/image/optimized/project-orbit.webp"
repo: "https://github.com/manish-9245/orbit"
links: "Live demo|https://orbit.buildwithmanish.com/"
tech: "Frontend|Next.js 14, TypeScript, Tailwind CSS, Radix UI; Real-time & Auth|Stream Video SDK, WebRTC, Clerk"
application_category: "CommunicationApplication"
---
Most side-project video call demos pick a lane - either a quick 1:1 call, or a group meeting room - and skip the parts that make it feel like a real product: authentication, screen sharing, a chat panel that survives the call. Orbit was an exercise in building the *product* around video calling rather than the video calling itself, by leaning on Stream's video SDK for the actual WebRTC plumbing.

## Keeping the secret server-side

The one piece you can't hand to the browser is the Stream API secret. Orbit's `actions/stream.actions.ts` is a Next.js Server Action - `"use server"` - that reads the signed-in user from Clerk and mints a short-lived Stream token entirely on the server:

```ts
// actions/stream.actions.ts
const exp = Math.round(new Date().getTime() / 1000) + 60 * 60;
const issued = Math.floor(Date.now() / 1000) - 60;
const token = streamClient.createToken(user.id, exp, issued);
```

That token is valid for exactly one hour, scoped to the current user's ID, and the `StreamClient` that signs it is constructed with a server-only secret that never ships to the client bundle. On the browser side, `providers/stream-client-provider.tsx` waits for Clerk's `useUser()` to resolve, then builds a `StreamVideoClient` and hands it the server action itself as a `tokenProvider` callback - the SDK calls back into that server action whenever it needs a fresh token, so the client never sees anything more sensitive than a public API key.

Using a Server Action here instead of a hand-rolled API route is a small but real architectural choice: it's the same "keep the secret on the server" pattern you'd get from a REST endpoint, without needing to define and version one.

## What's actually custom vs. what Stream provides

Once a call exists, `components/meeting-room.tsx` gates rendering on Stream's own `useCallCallingState()` hook until the state reaches `CallingState.JOINED`, then composes almost entirely out of Stream's prebuilt pieces - `PaginatedGridLayout` or `SpeakerLayout` for video, `CallControls`, `CallParticipantsList`, `CallStatsButton`. Creating a meeting is similarly thin: `meeting-type-list.tsx` calls `streamClient.call("default", crypto.randomUUID())` then `call.getOrCreate({ data: { starts_at, custom: { description } } })`, and Stream's backend owns the actual room. The honest way to describe Orbit's own code is: authentication, routing, and UI composition around a managed video layer - not a WebRTC stack built from scratch. That's the right call for a product that needs to *work*, and it's also exactly why the interesting bugs end up being about state and auth, not about media negotiation.

## Splitting "upcoming" from "past" without two API calls

`hooks/use-get-calls.ts` is a small example of doing less work by shaping one query correctly instead of firing two. It asks Stream for every call where the current user is either the creator or a member, sorted by start time, and then partitions that single result set client-side:

```ts
const endedCalls = calls.filter(({ state: { startsAt, endedAt } }) =>
  (startsAt && new Date(startsAt) < now) || !!endedAt
);
const upcomingCalls = calls.filter(({ state: { startsAt } }) =>
  startsAt && new Date(startsAt) > now
);
```

One query, one round trip, two views of the same data - simpler than maintaining separate "upcoming" and "history" endpoints that would need to stay consistent with each other.

## A gap worth naming honestly

Not everything lines up between the README and the code. The middleware protects `/personal-room` as a route (`createRouteMatcher([..., "/personal-room", ...])`), but no page or sidebar link for it exists anywhere in the app - a feature that got scaffolded into the auth config and never built out. And the README's documented environment variable names (`STREAM_VIDEO_API_KEY` / `STREAM_VIDEO_API_SECRET`) don't match what the code and `.env.example` actually read (`NEXT_PUBLIC_STREAM_API_KEY` / `STREAM_SECRET_KEY`) - following the README literally leaves both variables `undefined` and trips the explicit `throw new Error("Stream api key missing.")` guard the code has in place for exactly that situation. Small things, but the kind that cost a new contributor twenty minutes if nobody writes them down.

## Running it

```bash
bun install   # or npm install
# .env.local: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY,
#             NEXT_PUBLIC_STREAM_API_KEY, STREAM_SECRET_KEY
bun dev       # or npm run dev
```
