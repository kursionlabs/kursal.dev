+++
layout = "page.html"
title = "Source map"
eyebrow = "Repository guide"
intro = "Where to read the implementation, examples, tests, and generated API documentation."
description = "A source map for the Kursal compiler, standard library, examples, editor grammars, tests, and API documentation generator."
permalink = "/resources/"
+++

The [Kursal repository](https://github.com/kursionlabs/kursal) is the authoritative source for the current language. Its root [README](https://github.com/kursionlabs/kursal/blob/main/README.md) has the latest bootstrap requirements and command-line examples. The pages on this site are a guided entry point; source and tests carry the precise behavior.

## Implementation

| Path | What is there |
| --- | --- |
| [`compiler/`](https://github.com/kursionlabs/kursal/tree/main/compiler) | The self-hosted compiler, organized by phase. Its README documents storage, the backend, and language details for compiler authors. |
| [`reference-compiler/`](https://github.com/kursionlabs/kursal/tree/main/reference-compiler) | The Python implementation, KURS reader and writer, tests, and fuzzing tools. |
| [`lib/core/`](https://github.com/kursionlabs/kursal/tree/main/lib/core) | Primitive library APIs: capabilities, memory, option/result, iterators, pointers, and more. |
| [`lib/alloc/`](https://github.com/kursionlabs/kursal/tree/main/lib/alloc) | Heap and arena-backed owned collections. |
| [`lib/std/`](https://github.com/kursionlabs/kursal/tree/main/lib/std) | Host-facing I/O, files, processes, text, and other standard APIs. |
| [`editors/`](https://github.com/kursionlabs/kursal/tree/main/editors) | Tree-sitter grammars and queries for `.kur` and readable `.kurs`. |

The library also includes `libc`, `thread`, and `toml` packages. The [thread library notes](https://github.com/kursionlabs/kursal/blob/main/lib/thread/README.md) explain ownership transfer into threads; the [raw-pointer contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) state the obligations behind safe standard-library APIs.

## Examples by topic

| Topic | Read |
| --- | --- |
| Small programs and I/O | [`hello`](https://github.com/kursionlabs/kursal/tree/main/examples/hello), [`greet`](https://github.com/kursionlabs/kursal/tree/main/examples/greet), [`wc`](https://github.com/kursionlabs/kursal/tree/main/examples/wc) |
| Linear values and memory | [`linear`](https://github.com/kursionlabs/kursal/tree/main/examples/linear), [`graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph), [`arena_text`](https://github.com/kursionlabs/kursal/tree/main/examples/arena_text) |
| Traits and iteration | [`traits`](https://github.com/kursionlabs/kursal/tree/main/examples/traits), [`iter_combinators`](https://github.com/kursionlabs/kursal/tree/main/examples/iter_combinators) |
| Threads and low-level operations | [`thread_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/thread_sum), [`atomics`](https://github.com/kursionlabs/kursal/tree/main/examples/atomics), [`libuv_echo`](https://github.com/kursionlabs/kursal/tree/main/examples/libuv_echo) |
| Larger programs | [`lisp`](https://github.com/kursionlabs/kursal/tree/main/examples/lisp), [`kvstore`](https://github.com/kursionlabs/kursal/tree/main/examples/kvstore), [`json_check`](https://github.com/kursionlabs/kursal/tree/main/examples/json_check) |

The [examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) lists every package, its purpose, and how to run it. `examples/bad/` contains programs the compiler must reject, including invalid uses of linear values.

## API documentation

`kursal doc` generates a [Krayon](https://github.com/kursionlabs/krayon) site from public modules and `//!` / `///` documentation comments. It is a source-derived API reference, distinct from the conceptual pages here. The [documentation guide](https://github.com/kursionlabs/kursal/blob/main/docs/README.md) shows how to generate and build it.

## Checks

The [reference compiler tests](https://github.com/kursionlabs/kursal/tree/main/reference-compiler/tests) build and run examples, compare the self-hosted compiler against the reference, and exercise rejected programs. The [compiler README](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#building-and-testing) describes the self-build comparison and backend checks. The [fuzzing section](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#fuzzing) describes generated and mutated programs used to look for discrepancies.
