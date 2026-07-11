---
title: "{Test name or flake pattern}"
date: {YYYY-MM-DD}
fix_type: true-fix | workaround | quarantine
tags: [{flake-pattern}, {framework}]
test_files: ["__tests__/{path}"]
related_specs: ["specs/{feature-name}/test.yml"]
related_issues: ["#{NN}"]
---

# {Test name or flake pattern}

## Failure Mode

{How the test failed — intermittent timeout, race, order dependence, environment-specific. Paste the failure output.}

## Diagnosis

{Why it was flaky/failing — the real mechanism (timing, shared state, unmocked timer, animation, etc.).}

## Stabilization

{What was changed (test or production code). For quarantine: why, and the exit criteria for un-quarantining.}

## Pattern

{The reusable lesson — what to do/avoid in similar tests (e.g. "always use fake timers with debounced autosave").}

## Links

- {test.yml entry / issue / PR / related KB entries}
