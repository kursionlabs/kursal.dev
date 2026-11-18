+++
layout = "page.html"
title = "Compiler architecture"
eyebrow = "Implementation"
intro = "The path from a Kursal package to checked KURS, generated C, and an executable."
description = "Kursal compiler phases, the KURS core checker, self-hosting, C generation, and how the two compiler implementations are compared."
permalink = "/compiler/"
+++

Kursal has two implementations of the same pipeline: a [Python reference compiler](https://github.com/kursionlabs/kursal/tree/main/reference-compiler) and a [compiler written in Kursal](https://github.com/kursionlabs/kursal/tree/main/compiler). They are expected to accept and reject the same programs with the same messages, and to produce the same lowered KURS and C. The self-hosted compiler is bootstrapped by the reference implementation.

<h2 id="pipeline">Pipeline</h2>

| Stage | Main result |
| --- | --- |
| Parse and resolve | Syntax trees, package graph, and each name's declaration. |
| Signatures and inference | Declaration types, expression types, call targets, and captures. |
| Lower | Control flow, places, and operations in KURS. |
| Check | A verdict on the core program's types, uses, and place contracts. |
| C backend | One GNU C translation unit, then a native build by the configured C compiler. |

The [compiler module map](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md) names the corresponding modules for each stage. `kur.toml` declares a package's source root, entry, dependencies, optional C sources, and linker flags; the [reference compiler's package section](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#packages) gives the accepted manifest shape.

<h2 id="kurs">KURS as a checking boundary</h2>

KURS is the core language that sits between the source frontend and the C backend. It makes evaluation order, control-flow edges, SSA values, places, and their contracts explicit. The checker operates on that core program; a separate command can read serialized KURS and check it without re-running the source frontend.

The [counter walkthrough](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#a-worked-example-counter) is a compact way to see the translation. It prints inferred annotations, readable KURS, serialized KURS, and C for one program. The generated files are checked back against the source route.

<h2 id="c-backend">The C backend</h2>

The backend emits GNU C accepted by Clang and GCC. It assigns C storage to live SSA values and places, emits labels for blocks, and uses the checked KURS program directly. Planning may omit dead pure results, read a value where it already lies instead of copying it, and turn suitable tail calls into jumps or tail calls. These decisions change the C that is written; they do not rewrite the checked KURS.

`kursal build` invokes `$KURSAL_CC` when set and `clang` otherwise. The generated C and any package-declared C helper files are compiled to an executable. The [backend notes](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#the-c-backend) explain its storage and call decisions, including where pointer aliasing assumptions come from.

<h2 id="self-hosting">Bootstrap and comparison</h2>

From the Kursal repository root, `scripts/bootstrap.sh` has the Python compiler build the Kursal compiler. That compiler then builds itself into `bin/kursal`. Running `scripts/bootstrap.sh --check` adds another self-build and requires the generated C to match.

The test suite compares the two implementations' verdicts, diagnostics, lowered KURS, and C output on examples and compiler inputs. The reference repository also contains a fuzzer that generates and mutates programs to look for compiler disagreement, crashes, and miscompiled C. These are implementation checks, not a claim that every unsafe contract or backend assumption is mechanically proved. See [testing and fuzzing](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#tests).

<h2 id="memory">Compiler storage</h2>

The self-hosted compiler uses an arena per group of phases: frontend, core checking, and backend. Each arena has a distinct brand and capability. The core program is copied between groups so the preceding arena can be destroyed. Short-lived worklists and maps use owned collections that are freed after the walk. This is a substantial example of Kursal's own linear and capability-based APIs in use; the [storage chapter](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#storage) documents the design.
