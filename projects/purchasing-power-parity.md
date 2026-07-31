---
title: "Purchasing Power Parity"
title_accent: "Parity"
kicker: "Project · Open Source"
tagline: "A Node.js module and CLI that converts an amount between countries using PPP rates instead of raw FX - so $100 in the US compares fairly to its equivalent in India."
description: "How the purchasing-power-parity-advanced npm package converts currency by purchasing power instead of spot exchange rate, fetching a live PPP-GDP dataset at runtime."
role: "Solo maintainer"
status: "Published on npm"
type: "Open-source package"
tags: "Open Source, Backend"
date: "2025-05-19"
image: "/image/optimized/project-ppp.webp"
repo: "https://github.com/manish-9245/purchasing-power-parity-advanced"
links: "npm package|https://www.npmjs.com/package/purchasing-power-parity-advanced"
tech: "Language|Node.js, JavaScript; Distribution|npm, CLI (ppp-calculator)"
application_category: "DeveloperApplication"
---
A currency converter that only knows the spot exchange rate answers the wrong question. It'll tell you $100 is about 8,300 rupees, but not what $100 actually *buys* in each place - which is almost always what you're really trying to compare, whether that's a salary offer or the cost of living somewhere new. Purchasing power parity fixes that by converting through "international dollars" instead of the raw FX rate.

## Architecture

```mermaid
flowchart TD

subgraph group_consumers["Consumers"]
  node_library_user(("CommonJS consumer"))
  node_cli_user(("CLI user<br/>consumer"))
end

subgraph group_package["npm Package"]
  node_npm{{"npm distribution<br/>registry"}}
  node_package_manifest["Package manifest<br/>npm manifest<br/>[package.json]"]
  node_lockfile["Dependency lockfile<br/>npm lockfile<br/>[package-lock.json]"]
  node_cli_command["ppp-calculator<br/>CLI command<br/>[index.js]"]
end

subgraph group_conversion["Conversion Engine"]
  node_module_api["Public CommonJS API<br/>module exports<br/>[index.js]"]
  node_code_validation["ISO3 normalization<br/>validation layer<br/>[index.js]"]
  node_ppp_resolution[("PPP data resolution<br/>in-memory cache, no disk persistence<br/>[index.js]")]
  node_ppp_calculation["PPP calculation<br/>calculation layer<br/>[index.js]"]
  node_metadata_lookup["Country &amp; currency metadata<br/>metadata layer<br/>[index.js]"]
  node_conversion_response["Conversion response<br/>API result<br/>[index.js]"]
  node_country_lists["Country lookup results<br/>API result<br/>[index.js]"]
end

subgraph group_external["External dependency"]
  node_ppp_dataset{{"datasets/ppp CSV<br/>raw.githubusercontent.com - fetched live, not bundled"}}
end

node_npm -->|"publishes from"| node_package_manifest
node_package_manifest -->|"locks dependencies with"| node_lockfile
node_package_manifest -->|"registers bin"| node_cli_command
node_library_user -->|"require&#40;&#41;"| node_module_api
node_cli_user -->|"invokes"| node_cli_command
node_cli_command -->|"uses conversion"| node_module_api
node_module_api -->|"convertPPP"| node_code_validation
node_code_validation -->|"valid codes"| node_ppp_resolution
node_ppp_resolution -->|"fetches fresh on cold start"| node_ppp_dataset
node_ppp_resolution -->|"PPP values"| node_ppp_calculation
node_ppp_calculation -->|"amount results"| node_metadata_lookup
node_metadata_lookup -->|"enriched records"| node_conversion_response
node_module_api -->|"listCountries / listCountryCodes"| node_country_lists
node_metadata_lookup -->|"country records"| node_country_lists
node_cli_command -->|"JSON with names and flags"| node_conversion_response

click node_package_manifest "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/package.json"
click node_lockfile "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/package-lock.json"
click node_cli_command "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_module_api "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_code_validation "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_ppp_resolution "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_ppp_calculation "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_metadata_lookup "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_conversion_response "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"
click node_country_lists "https://github.com/manish-9245/purchasing-power-parity-advanced/blob/main/index.js"

classDef toneNeutral fill:#f8fafc,stroke:#334155,stroke-width:1.5px,color:#0f172a
classDef toneBlue fill:#dbeafe,stroke:#2563eb,stroke-width:1.5px,color:#172554
classDef toneAmber fill:#fef3c7,stroke:#d97706,stroke-width:1.5px,color:#78350f
classDef toneMint fill:#dcfce7,stroke:#16a34a,stroke-width:1.5px,color:#14532d
classDef toneRose fill:#ffe4e6,stroke:#e11d48,stroke-width:1.5px,color:#881337
classDef toneIndigo fill:#e0e7ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81
classDef toneTeal fill:#ccfbf1,stroke:#0f766e,stroke-width:1.5px,color:#134e4a
class node_library_user,node_cli_user toneBlue
class node_npm,node_package_manifest,node_lockfile,node_cli_command toneAmber
class node_module_api,node_code_validation,node_ppp_resolution,node_ppp_calculation,node_metadata_lookup,node_conversion_response,node_country_lists toneMint
class node_ppp_dataset toneRose
```

Boxes are clickable and jump straight to the real source file on GitHub.

## The conversion, in five lines

The entire package is one file, `index.js`, and the core of it is genuinely just two lines of math once you have PPP conversion factors for both countries:

```js
// index.js
const intlDollars = amount / origin.ppp;
const converted = intlDollars * target.ppp;
```

Divide by the origin country's PPP factor to get a currency-neutral "international dollar" amount, then multiply by the target country's factor to land in its local terms. Everything else in the package - flag emoji, currency symbols, country names, the CLI wrapper - is convenience built around those two lines.

## Where the numbers actually come from

The one architectural decision worth calling out, because it's easy to miss from the README alone: this package doesn't ship any PPP data. `loadPPPData()` fetches a CSV of PPP-to-GDP figures live from a public GitHub-hosted dataset (`datasets/ppp` on GitHub) every time the process needs it, parses it with `csv-parse`, and keeps only the most recent year per country:

```js
if (!map[code] || year > map[code].date) {
  map[code] = { date: year, ppp: pppValue };
}
```

That result is memoized for the lifetime of the process (`if (cachedPPP) return cachedPPP;`), but never written to disk - so every fresh CLI invocation makes a live network call out to GitHub's raw content CDN before it can convert anything. It's a deliberate trade: no bundled dataset to go stale, at the cost of a hard runtime dependency on a URL the package doesn't control. If that CSV's format or location ever changes, every install breaks at once, with no local fallback.

## API and CLI from the same file

`index.js` does double duty as both a library and a command-line tool, gated on the classic `require.main === module` check:

```js
if (require.main === module) {
  // parse process.argv, call convertPPP(), print the result
}
```

Installed globally, that same file becomes the `ppp-calculator` binary via the `bin` field in `package.json` and a `#!/usr/bin/env node` shebang on line one:

```bash
ppp-calculator USA 100 CAN,GBR,IND
```

Required locally instead, `convertPPP()`, `listCountries()`, and `listCountryCodes()` are just plain exports - `listCountries()` returns only the countries the live PPP dataset actually covers, while `listCountryCodes()` returns everything `country-data` knows about regardless of whether PPP figures exist for it yet. That distinction matters if you're building a country picker: showing every ISO code and then failing silently on half of them is worse than filtering up front.

## Small honest inefficiencies

Nothing here is broken, but a couple of things are worth naming plainly. The alpha-2-to-alpha-3 country code map gets rebuilt from scratch inside `loadPPPData()` on every cache miss, duplicating work already done once at module load for the general `countryMap` - harmless at this scale, wasteful if this were ever called at high frequency. And because everything hinges on one unversioned CSV, there's no schema check between "the file we expect" and "the file GitHub is currently serving" - a silent column reorder upstream would silently corrupt every conversion rather than throwing.

## Installing it

```bash
npm install -g purchasing-power-parity-advanced
ppp-calculator USA 100 CAN,GBR,IND
```

Or as a dependency: `npm install purchasing-power-parity-advanced` and `require()` the same `convertPPP` function directly. `engines.node >= 14` is the only real constraint, and there are no dev dependencies - the placeholder `"test": "node index.js"` script is exactly that, a placeholder, not a real test suite.
