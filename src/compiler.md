+++
layout = "page.html"
title = "The compiler"
eyebrow = "Understand"
intro = "Two compilers, one small core language, and a C backend. How a Kursal package becomes a checked program and then an executable."
description = "Kursal compiler phases, the KURS core checker, self-hosting, C generation, and how the two implementations are compared."
permalink = "/compiler/"
+++

Kursal has two implementations of the same pipeline: a [Python reference compiler](https://github.com/kursionlabs/kursal/tree/main/reference-compiler) and a [compiler written in Kursal](https://github.com/kursionlabs/kursal/tree/main/compiler). The reference came first and acts as the executable spec. The two are expected to accept and reject the same programs with the same messages, and to produce the same lowered KURS and the same C. The Kursal one is bootstrapped by the Python one, and then it builds itself.

<h2 id="pipeline">The pipeline</h2>

| Stage | Main result |
| --- | --- |
| Parse and resolve | Syntax trees, the package graph, and each name's declaration. |
| Signatures and inference | Declaration types, expression types, call targets, and captures. |
| Lower | Control flow, places, and operations in KURS. |
| Check | A verdict on the core program's types, uses, and place contracts. |
| C backend | One GNU C translation unit, then a native build by your C compiler. |

The [compiler module map](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md) names the modules behind each stage. The [reference compiler's package section](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#packages) gives the accepted `kur.toml` shape.

<h2 id="kurs">KURS: the part you can check by hand</h2>

KURS is the core language between the source front end and the C backend. It makes evaluation order, control-flow edges, SSA values, places, and their contracts explicit. Every block states its complete place state: what is full, empty, or lent. The checker works on that program alone, and a separate command can read serialized KURS and check it without running the source front end at all.

The design bet is that a checker this small and this explicit is something a person can run in their head. The surface language is friendlier and more complicated than KURS, and it grew out of the core. The checker's job is to keep the surface language honest. If the front end gets something wrong, it shows up as "front end accepted, checker rejected" and not as miscompiled code.

The [counter walkthrough](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#a-worked-example-counter) is the quickest way to see this. It prints inferred annotations, readable KURS, serialized KURS, and C for one small program, and checks the generated files back against the source route.

Because each block's contract is complete, blocks can be checked independently. That was a deliberate choice for parallel checking, which is possible but not implemented: the checker runs sequentially today. The price is that KURS output grows roughly quadratically with function size, and compile time is linear in that output.

<h2 id="testing">How we know the two agree</h2>

The test suite compares the two implementations' verdicts, diagnostics, lowered KURS, and C output on the examples and on the compiler's own inputs. The self-hosted compiler also reaches a bootstrap fixpoint: stage 1 and stage 2 emit byte-identical C. The test suite also runs the self-build under valgrind.

A fuzzer then generates and mutates programs to look for disagreements, crashes, and miscompiled C. Run against the front end and the checker together, it turned up cases where the front end accepted something the checker rejected, among them an aliasing hole in `f(&x, &x)`. All are fixed and kept as regression tests. The [fuzzing notes](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#fuzzing) say how to run a campaign.

None of this is a proof. A successful check says the program obeys KURS's rules. Unsafe operations and backend assumptions still rest on their stated contracts, which the standard library writes down in [CONTRACTS.md](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md).

<h2 id="c-backend">The C backend</h2>

The backend emits GNU C that Clang and GCC both accept. It gives C storage to live SSA values and places, emits labels for blocks, and works directly from the checked KURS. Planning may drop dead pure results, read a value where it already lies instead of copying it, and turn suitable tail calls into jumps. Those choices change the C that is written and never rewrite the checked KURS.

`kursal build` invokes `$KURSAL_CC` when it is set and `clang` otherwise, compiling the generated C and any package-declared C helpers into an executable. A freestanding target needs only `memcpy`, `memmove`, `memset`, and `memcmp`, but you bring your own runtime. The [backend notes](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#the-c-backend) explain the storage and call decisions, including where aliasing assumptions come from.

C is also where most of the build time goes: compiling the generated C for the self-hosted compiler takes far longer than running Kursal's own front end.

<h2 id="self-hosting">Bootstrap</h2>

From the repository root, `scripts/bootstrap.sh` has the Python compiler build the Kursal compiler, and that compiler builds itself into `bin/kursal`. Adding `--check` does another self-build and requires the generated C to match.

<h2 id="memory">The compiler's own storage</h2>

The self-hosted compiler is the largest program written in Kursal, and it eats its own cooking. It uses one arena per group of phases: front end, core checking, and backend. Each arena gets its own brand and capability. The core program is copied between groups so the earlier arena can be destroyed, and short-lived worklists and maps use owned collections that are freed after each walk. The [storage chapter](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#storage) documents the design.

<h2 id="status">Where it stands</h2>

Kursal has not had a 1.0, and breaking changes are expected. It currently targets Linux and compiles through a C compiler. What is supported today, and what is known to be rough, changes quickly, so it lives in the [repository](https://github.com/kursionlabs/kursal) next to the code and the tests.

Next: [where things live in the repository](/source/).
