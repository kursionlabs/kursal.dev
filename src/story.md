+++
layout = "page.html"
section = "more"
title = "How Kursal came to be"
eyebrow = "Understand"
intro = "Almost two years of reading, one frustration, and a handful of decisions we reversed."
description = "The origin of Kursal, how the compiler grew, and the design decisions that were tried and dropped."
permalink = "/story/"
+++

I have been working on this for almost two years, and it did not begin as a language project at all. It started on a completely unrelated trajectory, and I read a lot of things along the way. The ones mentioned here are only some of the highlights.

## The frustration

I love C and adore Rust. But sometimes I pull my hair out trying to understand why Rust's checker rejected my code, because it is hard to simulate in my head. I bet we don't need a checker that complex to write safe code.

So the question became how small a checker can be, and still let you build memory-safe abstractions. Not a language that is memory safe by itself. Kursal isn't, and `unsafe` is part of the design. The goal was the smallest set of rules that lets a *library* build safe abstractions on top.

## The reading

[Austral](https://austral-lang.org/) felt like recognition, and then I ran into its limits. Wadler's ["Theorems for free!"](https://dl.acm.org/doi/10.1145/99370.99404) pointed me straight at the type system, and System F came after. I kept trying to build the smallest subset I could think of that did the job.

That is how KURS, the core language, and Kursal, the surface language, came to be. In spirit it is proof-carrying code, in a friendlier shape: the library states the contract, and a small checker verifies that callers keep it. The compiler's KURS output carries its own evidence for that check, in the complete place contracts on every block. The `unsafe` layer beneath states its obligations rather than proving them.

## How the compiler grew

1. **A Python reference compiler first.** It was the executable spec: parser, resolver, signatures, inference, lowering to KURS, the checker, and C.
2. **Stricter, not friendlier.** Wherever soundness was unclear, the language moved toward stricter rules instead of compatibility.
3. **A rewrite in Kursal.** Module by module, mirroring the reference. Differential tests make both compilers agree on accept versus reject, the exact error messages, the KURS, and the C.
4. **A bootstrap fixpoint.** The self-hosted compiler builds itself, and stages 1 and 2 emit byte-identical C.

[Krayon](https://github.com/kursionlabs/krayon), the generator that builds this site, is written in Kursal too.

## Decisions we reversed

- **`builtin::` names leaked into the core language.** Now only `lib/core` touches builtins, and in the core, `::` always means a program name.
- **A `Phantom` marker type.** Removed.
- **Linearity as a hidden flag on declarations.** Replaced by `!` in the type's name. It is ceremony, but it identifies linear types at a glance, and a declaration must carry `!` when it is linear whatever its type arguments. One marked `!` is linear even if every field is `Copy`.
- **Shrinking the core by listing only what changed in each block's contract.** Rejected, because complete contracts are what allow blocks to be checked independently and, one day, in parallel.

## What stays the test

The measure we keep coming back to is whether a person can look at a function and tell, easily, whether the checker will accept it. When a feature would make that depend on far-away code, it is a reason to cut the feature. That is why the `!` is visible, why lends are judged at the call site, and why a struct's shape can only be built inside its own module unless it is `exposed`.

Kursal hasn't had a 1.0. Expect breaking changes. The `!` naming landed on 2026-11-16, and it is the most recent example. The [status list](/compiler/#status) has the honest list of what works and what doesn't.
