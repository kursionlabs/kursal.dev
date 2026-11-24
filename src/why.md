+++
layout = "page.html"
title = "Why kursal"
eyebrow = "Understand"
intro = "The case for a smaller checker, and an honest account of what it costs."
description = "Why Kursal exists: a resource checker small enough to run in your head, what that buys, and what you give up."
permalink = "/why/"
+++

## The bug you already know

A handle closed twice. A buffer nobody freed. A pointer used after the callee released it. Two writers on the same structure. None of these is exotic, and code review exists largely to catch them.

C leaves the rules to comments and discipline. That works until a refactor adds an early return and the comment is no longer true. A language can do better by writing the rule into the signature, where the compiler can check every caller.

## Two ways to get a checker

You can have no checker, or a large one.

Large checkers can enforce a great deal, including things Kursal can't. Rust's borrow checker is the obvious example and an excellent one. Its cost is a larger set of rules, with lifetimes and their inference, so when the checker says no, working out why can take real effort.

Kursal started from a narrower question: how much of this checking can a person do alone, by reading? The answer shaped everything. A rule makes it into the language only if you can apply it by looking at a function and the signatures it calls. When a feature would make a check depend on far-away code, that is a reason to cut it.

## What you get

- **Resources you can't forget or reuse.** A type ending in `!` must be used exactly once on every path. A leak and a double close are compile errors, not review comments.
- **Lending without lifetimes.** A `&` parameter lends your value for one call and must be handed back. You can inspect a resource without giving it up, and there is nothing to infer across function boundaries.
- **Sharing you can reason about.** Brands name memory and capabilities grant access. Cyclic graphs and many-readers-then-one-writer are expressible without reference counting, and a stale reference into a structure fails to type-check instead of crashing.
- **Unsafe code with a stated contract.** Raw memory and C calls carry `unsafe` at the site, with the promise written beside them. A module states its promise once and hides the representation, so safe callers inherit it.
- **A checker you can read.** Everything lowers to KURS, a small core where each block states its full contract. A separate checker re-verifies the result before C is emitted.

[What each idea catches](/ideas/) shows the compiler's actual messages for each one.

## What you give up

Kursal makes trades, and some are real costs.

- **Lends can't be stored.** A lend lasts one call. It can't sit in a struct, be returned, or be captured. Structures whose parts point at each other go through arenas and brands, which asks more of you than a pointer does.
- **More ceremony.** `!` in type names, `exists` to open a brand, explicit capabilities. It is visible on purpose, and it is more to write.
- **Contracts aren't checked.** `unsafe` marks where a human must be sure. Nothing verifies that the promise is kept, and Kursal is not memory safe by default.
- **It's young.** Linux only, no package manager, no 1.0, and breaking changes ahead. The [repository](https://github.com/kursionlabs/kursal) tracks what is supported today.

## Who it's for

C programmers who want resource mistakes caught without learning a lifetime calculus. People curious how far a small set of ideas goes. Compiler and type-system folks, who will find a core language small enough to read.

If that sounds like you, [start with the guide](/guide/). It builds the whole language from a handle that is just a number, one idea at a time.
