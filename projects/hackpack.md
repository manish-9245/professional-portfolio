---
title: "Hackpack"
title_accent: "pack"
kicker: "Project · Developer Tool"
tagline: "A CLI that scaffolds full-stack apps by composing prebuilt templates instead of prompting an LLM - a framework, a stack of features, and generated CRUD pages, wired together through anchor comments."
description: "How Hackpack's compose() pipeline builds full-stack apps from bases, features, and page variants entirely through file operations and Handlebars - no LLM in the generation path."
role: "Solo builder"
status: "In development"
type: "CLI / developer tool"
tags: "CLI, Developer Tool, Open Source"
date: "2026-07-27"
image: "/image/optimized/project-hackpack.webp"
repo: "https://github.com/manish-9245/hackpack"
links: "Live site|https://hackpack-five.vercel.app/; npm package|https://www.npmjs.com/package/create-hackpack"
tech: "CLI|citty, @clack/prompts, Handlebars, execa, giget, compromise; Generated stacks|Next.js, Vite + React, SvelteKit, Hono, FastAPI, Cloudflare D1/Drizzle"
application_category: "DeveloperApplication"
---
Most "AI app generators" scaffold a project by asking a model to write it from scratch, which means every generated app is a little different and a little wrong in its own way. Hackpack takes the opposite bet: `npx create-hackpack new my-app --base=ts-nextjs --features=auth-better-auth,db-d1-drizzle` produces a working app in about 90 seconds by *composing* hand-written templates - a base framework, a stack of optional features, and prebuilt page variants - never by generating code with an LLM. The generation step is 100% deterministic file operations and Handlebars rendering, which is also why it's fast enough to demo live.

## Architecture

```mermaid
flowchart TD

subgraph group_node_cli["Production Node CLI"]
  node_node_entry{{"CLI launcher<br/>Node entrypoint<br/>[hackpack.js]"}}
  node_node_dispatch["Command dispatcher<br/>TypeScript CLI<br/>[index.ts]"]
  node_commands["Lifecycle commands<br/>command layer"]
  node_new_command["Project creation<br/>new command<br/>[new.ts]"]
  node_add_command["Feature layering<br/>add command<br/>[add.ts]"]
  node_page_command["Pages and CRUD<br/>page add command<br/>[pageAdd.ts]"]
  node_deploy_command["Deployment<br/>deploy command<br/>[deploy.ts]"]
  node_registry["Registry resolution<br/>registry service<br/>[registry.ts]"]
  node_compose["Composition engine<br/>pipeline stage<br/>[compose.ts]"]
  node_generate["Renderer and writer<br/>pipeline stage<br/>[generate.ts]"]
  node_nlp["Field description parser<br/>NLP stage<br/>[nlp.ts]"]
end

subgraph group_templates["Registry Templates"]
  node_template_contract["Pack metadata<br/>template contract"]
  node_bases["Framework bases<br/>base templates"]
  node_features["Feature packs<br/>feature templates"]
  node_pages["Page packs and scaffolds<br/>page templates"]
end

subgraph group_go_cli["Experimental Go CLI"]
  node_go_entry{{"Go CLI entrypoint<br/>Go entrypoint<br/>[main.go]"}}
  node_go_compose["Go composition pipeline<br/>composition engine<br/>[compose.go]"]
end

subgraph group_outputs["Generated Projects"]
  node_generated_project["Generated application<br/>project output"]
  node_cloudflare{{"Cloudflare Workers<br/>deployment target<br/>[wrangler.jsonc.hbs]"}}
  node_d1[("Cloudflare D1<br/>database integration")]
end

node_landing["Marketing site<br/>Next.js showcase<br/>[index.tsx]"]

node_node_entry -->|"launches"| node_node_dispatch
node_node_dispatch -->|"dispatches"| node_commands
node_commands -->|"create"| node_new_command
node_commands -->|"add"| node_add_command
node_commands -->|"page add"| node_page_command
node_commands -->|"deploy"| node_deploy_command
node_new_command -->|"selects packs"| node_registry
node_add_command -->|"resolves feature"| node_registry
node_page_command -->|"parses descriptions"| node_nlp
node_page_command -->|"applies pages"| node_compose
node_registry -->|"validates"| node_template_contract
node_registry -->|"resolves"| node_bases
node_registry -->|"resolves"| node_features
node_registry -->|"resolves"| node_pages
node_new_command -->|"composes"| node_compose
node_add_command -->|"overlays"| node_compose
node_compose -->|"render plan"| node_generate
node_bases -->|"base layer"| node_compose
node_features -->|"feature overlays"| node_compose
node_pages -->|"pages and CRUD templates"| node_compose
node_generate -->|"writes"| node_generated_project
node_generated_project -->|"deploys to"| node_cloudflare
node_features -.->|"optional integration"| node_d1
node_go_entry -->|"runs"| node_go_compose
node_go_compose -.->|"experimental generation"| node_generated_project

click node_node_entry "https://github.com/manish-9245/hackpack/blob/main/cli/bin/hackpack.js"
click node_node_dispatch "https://github.com/manish-9245/hackpack/blob/main/cli/src/index.ts"
click node_new_command "https://github.com/manish-9245/hackpack/blob/main/cli/src/commands/new.ts"
click node_add_command "https://github.com/manish-9245/hackpack/blob/main/cli/src/commands/add.ts"
click node_page_command "https://github.com/manish-9245/hackpack/blob/main/cli/src/commands/pageAdd.ts"
click node_deploy_command "https://github.com/manish-9245/hackpack/blob/main/cli/src/commands/deploy.ts"
click node_registry "https://github.com/manish-9245/hackpack/blob/main/cli/src/registry.ts"
click node_compose "https://github.com/manish-9245/hackpack/blob/main/cli/src/compose.ts"
click node_generate "https://github.com/manish-9245/hackpack/blob/main/cli/src/generate.ts"
click node_nlp "https://github.com/manish-9245/hackpack/blob/main/cli/src/nlp.ts"
click node_template_contract "https://github.com/manish-9245/hackpack/blob/main/templates/bases/ts-nextjs/template.config.json"
click node_cloudflare "https://github.com/manish-9245/hackpack/blob/main/templates/bases/ts-nextjs/wrangler.jsonc.hbs"
click node_go_entry "https://github.com/manish-9245/hackpack/blob/main/go-cli/cmd/hackpack/main.go"
click node_go_compose "https://github.com/manish-9245/hackpack/blob/main/go-cli/internal/compose/compose.go"
click node_landing "https://github.com/manish-9245/hackpack/blob/main/landing/pages/index.tsx"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_node_entry,node_node_dispatch,node_commands,node_new_command,node_add_command,node_page_command,node_deploy_command,node_registry,node_compose,node_generate,node_nlp toneBlue
class node_template_contract,node_bases,node_features,node_pages toneAmber
class node_go_entry,node_go_compose toneMint
class node_generated_project,node_cloudflare,node_d1 toneRose
class node_landing toneNeutral
```

Boxes are clickable and jump straight to the real source file on GitHub.

## Composing a project without a model in the loop

The entry point (`cli/src/commands/new.ts`) collects a base, a list of features, and a list of pages - either interactively via `@clack/prompts` or straight from flags - and hands them to `compose()` in `cli/src/compose.ts`. That function layers three things onto the target directory in order: a `_common/` hygiene layer (gitignore, editor config), the chosen base's template directory, and then each feature in turn. Every feature copies its own `templates/features/<name>/files/`, optionally overlays a `files-<base>/` variant for that specific framework, merges its `package.json` or `pyproject.toml` dependencies into the project's manifest, and appends any environment variables it needs.

The part that keeps this from turning into a pile of merge conflicts is anchor-based wiring instead of AST manipulation:

```ts
// cli/src/compose.ts
for (const w of manifest.wiring ?? []) {
  await insertAtAnchor(path.join(targetDir, w.file), w.anchor, w.insert);
}
```

Each feature declares the exact comment anchor it needs to splice into - `// hackpack:dashboard-nav`, say - and `insertAtAnchor` finds that line in the already-copied base file and inserts the feature's snippet right after it. No parsing, no codemod, just a known marker and a known insertion point. It's a simpler mechanism than a real code-generation tool would use, and that simplicity is exactly why it's reliable enough to run unattended in CI.

## Pages that know what's actually installed

The generated pages aren't static copies either. A login page needs to render real `authClient.signIn.email()` calls if `auth-better-auth` was installed, or a "no auth provider configured" placeholder if it wasn't - and `compose()` picks between those by checking `installedCategories` and selecting the matching `variants/<category>` subfolder (`variants/auth-better-auth` vs. `variants/none`) before copying. It's a small mechanism, but it's the difference between a scaffolded page that actually works and one that silently references a client that was never installed.

## Turning a sentence into a database schema

`hackpack page add orders --describe "a list of orders with title, price, and user, behind login"` skips the interactive prompts entirely. `cli/src/nlp.ts` runs the description through `compromise` (a local NLP library) and a set of hand-written regexes - `parseEntity()` for the resource name, `parseFields()` for the field list, `parseAuth()` for the `--auth=protected` equivalent - and if confidence comes back low (no entity found, zero fields parsed), it falls back to the interactive wizard rather than guessing wrong silently. Worth saying plainly: `compromise`'s actual parse tree isn't used yet - the file computes it and then discards it (`void doc; // reserved for future noun-phrase disambiguation`), so today's "NLP" parsing is entirely regex-driven, with the NLP library sitting in as a dependency for planned work rather than doing the job itself right now.

Once fields are known, `cli/src/generate.ts` maps each one to the right type for whatever stack is installed:

```ts
// cli/src/generate.ts
function drizzleColumn(name: string, type: FieldType): string {
  switch (type) {
    case "number": return `${name}: real("${name}")`;
    case "boolean": return `${name}: integer("${name}", { mode: "boolean" })`;
    case "date": return `${name}: integer("${name}", { mode: "timestamp" })`;
    default: return `${name}: text("${name}")`;
  }
}
```

The same field list drives a TypeScript/Zod type, a Drizzle column, or a Python/SQL type depending on which base and DB feature are installed, then the resulting schema, API route, and list/detail pages get written and spliced in through the same anchor mechanism as `compose()`.

## The only test is an end-to-end one

`cli/test/self-check.ts` - run in CI as `npm run selfcheck` - doesn't unit-test individual functions. It actually calls `compose()` for a `ts-nextjs` project and a `py-fastapi` project into temp directories, then asserts on the real generated output: dependency merges landed, the Cloudflare D1 binding shows up in `wrangler.jsonc`, the login page renders the better-auth variant, the generated CRUD schema and routes exist. One test, but it's a genuine integration test covering the compose-and-generate pipeline across two languages, which catches the failure mode that actually matters here - "did the generated project come out broken" - more directly than a pile of unit tests would.

## What's still rough

This is very much a working-on-it project, and it's more honest to say so than to paper over it. The Go CLI in `go-cli/` is explicitly marked experimental in the README and doesn't support the `--describe` flag at all - only explicit `--fields`. The `ts-vite-react` base is flagged in the README's own compatibility matrix as a stub for auth, since a frontend-only base has nowhere server-side to wire real authentication into. And the repo is really three loosely-connected projects sharing one Git history - the TypeScript CLI, the Go rewrite, and a separate Next.js marketing site in `landing/` - each with its own package manager and no unifying root build.

## Running it

```bash
npx create-hackpack@latest new my-app \
  --base=ts-nextjs \
  --features=ui-shadcn,auth-better-auth,db-d1-drizzle \
  --pages=landing,login,signup,dashboard
cd my-app && npm install && npm run dev
```

Adding a page later: `hackpack page add orders --fields=title:string,price:number,userId:relation --auth=protected`, or the natural-language form shown above. `npm run cf:deploy` ships the generated app to Cloudflare Workers.
