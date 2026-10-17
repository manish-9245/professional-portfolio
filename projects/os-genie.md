---
title: "OS Genie"
title_accent: "Genie"
kicker: "Project · Open Source Tooling"
tagline: "Four portable AI skills that take you from where to contribute to a merged pull request, with a numeric gate at every stage and a scorer you can run offline"
description: "OS Genie packages repo discovery, issue triage, a pre-PR gate and maintainer communication as four Agent Skills, with thresholds traced to published data on PR size, CI and maintainer approval."
role: "Solo builder"
status: "Live"
type: "Agent skills"
tags: "AI, Open Source, Developer Tools"
date: "2026-10-17"
image: "/image/optimized/project-os-genie.webp"
repo: "https://github.com/manish-9245/os-genie"
links: "Open source logbook|/open-source.html; Install guide|https://github.com/manish-9245/os-genie/blob/main/docs/installation.md"
tech: "Skills|Agent Skills (SKILL.md), npx skills; Scorers|Python 3 standard library; Gates|Bash, git, GitHub CLI"
application_category: "DeveloperApplication"
---
Most first pull requests to other people's projects die in one of two places. Either the issue was never approved, so the diff solves a problem the maintainers did not want solved, or CI is red and nobody ever looks. A study of 33,596 failed agentic PRs, summarized in the [OS Genie methodology notes](https://github.com/manish-9245/os-genie/blob/main/docs/methodology.md), found CI and test failure was the top rejection pattern, 99 of 600 annotated rejections, and each extra failed check cut merge odds by about 15%. I kept hitting both by hand, so I turned my checklist into four skills called OS Genie. In five days they took me through 60 pull requests across 38 projects, and 7 have merged so far.

## Background: the checklist was the product

Contributing to a project you do not maintain is a chain of small judgments. Does this repo still merge outside PRs? Is this issue approved, or just open? Is the diff small enough to review? Did I answer the maintainer inside two days? Each answer used to live in my head, which meant each answer drifted when I was tired.

OS Genie writes the judgments down as [Agent Skills](https://agentskills.io), the portable `SKILL.md` format that Claude Code, Cursor, OpenCode and more than 70 other agents read. One command installs all four:

```bash
npx skills add manish-9245/os-genie
```

The four skills hold 1,564 lines across their `SKILL.md` files and scripts. The scorers use only the Python standard library and run offline on saved JSON, so a score is reproducible from a file and not from a conversation.

## The pipeline: four stages, four gates

![OS Genie pipeline: discover, triage, implement, communicate, merged](/image/optimized/os-genie-pipeline.svg)

*Figure 1: Each stage hands one artifact to the next and refuses to start without it. The thresholds on the cards are the gates.*

| Stage | Skill | Gate |
|---|---|---|
| 0. Discover | `os-genie-repo-finder` | Health score of 60 or more, 75 or more for a first pick, 6 hard rejects |
| 1. Triage | `os-genie-issue-triage` | Issue score of 60 or more with quoted maintainer approval |
| 2. Implement | `os-genie-fix-pr` | Green CI, under 200 changed lines, tests, evidence, secrets sweep |
| 3. Communicate | `os-genie-maintainer-comms` | Reply inside 48 hours, polite bumps, a word-level scan for AI tone |

Each skill names its neighbors through `prev-skill` and `next-skill` metadata, so an agent that finishes triage knows the next move without being told. The full walkthrough with a worked example is in the [pipeline doc](https://github.com/manish-9245/os-genie/blob/main/docs/pipeline.md).

## Triage: 35 of 100 points belong to the maintainer

![Triage score split: approval 35, scope clarity 25, freshness 20, no collision 10, evidence 10](/image/optimized/os-genie-triage-score.webp)

*Figure 2: The triage rubric. Maintainer approval is the largest single term at 35 of 100 points.*

The issue scorer reads one `gh issue view` JSON file and prints a 0 to 100 breakdown. Two things zero the score before any arithmetic: a `wontfix`, `invalid` or `duplicate` label, and an existing assignee. After that, five terms add up. A maintainer phrase in the thread such as "PR welcome" or "go ahead" earns the full 35 approval points. A `help wanted` label with recent activity earns 18. A bare beginner label earns 10.

```bash
gh issue view 412 --repo acme/widgets \
  --json number,title,labels,assignees,comments,createdAt,updatedAt,body,state,milestone > issue.json
python3 skills/os-genie-issue-triage/scripts/score_issue.py issue.json
# {"score": 100, "verdict": "RECOMMEND", ...}
```

Below 60 the verdict is `ASK-FIRST`. The skill drafts a scope question for the maintainer instead of code. I weighted approval this heavily because the rejection data clusters there, as incorrect-implementation PRs concentrate where scope was never confirmed.

## Implement: a gate that fails loudly

`os-genie-fix-pr` ends in `verify_pr.sh`. It prints `FAIL` for failing CI checks and `BLOCKED` when anything failed, and it exits non-zero, so any step that chains on it stops on a red build. The size rule comes from LinearB's 2025 benchmark of 6.1 million PRs, also cited in the [methodology notes](https://github.com/manish-9245/os-genie/blob/main/docs/methodology.md): about 50 lines is ideal, under 200 is good, and 400 or more tends to miss issues. A second dataset of roughly 933,000 agentic PRs puts docs, CI and build changes at a 74 to 84% merge rate, which is why the skill prefers them for a first contribution.

## What broke: 13 comments in 24 hours

On 14 October 2026 I posted 13 near-identical claim comments in 24 hours and the pallets organization blocked my account on [pallets/flask#6146](https://github.com/pallets/flask/issues/6146). The thread had already produced two earlier blocks. Every comment was polite on its own. Together they read like a bot.

The fix went into the pipeline as three changes. Velocity caps of 5 claims per day overall, 2 per organization and 60 minutes between them. A block-risk check in triage that subtracts 20 or 10 points from the score. And claim templates that must carry a file and line, a root cause with evidence, a rejected alternative and one yes or no question, because only someone who read the code can write those.

## Evaluation: what 60 pull requests looked like

![60 pull requests by outcome: 7 merged, 33 open, 20 closed](/image/optimized/os-genie-results.webp)

*Figure 3: Outcomes for every PR sent between 13 and 17 October 2026, from the live [open source logbook](/open-source.html).*

Of 60 pull requests, 7 merged, 33 are open (7 of them drafts) and 20 closed. Those counts come straight from the logbook, which refreshes from GitHub. I have no control group, so this shows throughput and the mix of outcomes, not a lift over doing the same work by hand. The 20 closed PRs are the most useful part. They are the labeled data I will fit the weights against.

## Conclusion

OS Genie turns the unwritten part of contributing into four gates an agent can fail. The weights of 35, 25, 20, 10 and 10 and the 60 and 75 thresholds are practitioner syntheses of the cited studies, not fitted models. The methodology doc says so in a closing honesty note, and I would rather the skills err toward asking before coding.

## What is next

The obvious next job is fitting the triage weights to the outcomes of the 60 PRs. After that comes a per-organization memory, so the velocity caps can learn that some maintainers answer in an hour and others in a week. The skills are MIT licensed and pull requests are welcome in the [repo](https://github.com/manish-9245/os-genie). If you run it on a project and a gate gets it wrong, that is the most useful issue you can file.
