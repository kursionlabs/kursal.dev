+++
layout = "page.html"
title = "Source map"
eyebrow = "Reference"
intro = "Where to read the implementation, tests, and generated API documentation."
description = "A source map for the Kursal compiler, standard library, examples, editor grammars, tests, and API documentation generator."
permalink = "/source/"
+++

The [Kursal repository](https://github.com/kursionlabs/kursal) is the authority on the current language. Its root [README](https://github.com/kursionlabs/kursal/blob/main/README.md) has the latest bootstrap requirements and commands. The pages on this site are a guided way in, and the source and tests carry the exact behavior.

## Implementation

| Path | What is there |
| --- | --- |
| [`compiler/`](https://github.com/kursionlabs/kursal/tree/main/compiler) | The self-hosted compiler, organized by phase. Its README covers storage, the backend, and language details for compiler authors. |
| [`reference-compiler/`](https://github.com/kursionlabs/kursal/tree/main/reference-compiler) | The Python implementation, the KURS reader and writer, tests, and fuzzing tools. |
| [`lib/core/`](https://github.com/kursionlabs/kursal/tree/main/lib/core) | Primitive library APIs: capabilities, memory, option and result, iterators, pointers, and more. |
| [`lib/alloc/`](https://github.com/kursionlabs/kursal/tree/main/lib/alloc) | Heap and arena-backed owned collections. |
| [`lib/std/`](https://github.com/kursionlabs/kursal/tree/main/lib/std) | Host-facing I/O, files, processes, text, and other standard APIs. |
| [`editors/`](https://github.com/kursionlabs/kursal/tree/main/editors) | Tree-sitter grammars and queries for `.kur` and readable `.kurs`. |

The library also includes `libc`, `thread`, and `toml` packages. The [thread library notes](https://github.com/kursionlabs/kursal/blob/main/lib/thread/README.md) explain ownership transfer into threads, and the [raw-pointer contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) state the obligations behind safe standard-library APIs.

## Examples

The [walkthroughs](/walkthroughs/) cover the examples worth reading first. The [examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) lists every package, what it demonstrates, and how to run it. `examples/bad/` contains programs the compiler must reject, including invalid uses of linear values.

## API documentation

`kursal doc` generates a [Krayon](https://github.com/kursionlabs/krayon) site from public modules and `//!` and `///` documentation comments. It is a source-derived API reference, separate from the conceptual pages here. The [documentation guide](https://github.com/kursionlabs/kursal/blob/main/docs/README.md) shows how to generate and build it. There is no item-level privacy yet, so internal helpers appear in the output.

## Tests

The [reference compiler tests](https://github.com/kursionlabs/kursal/tree/main/reference-compiler/tests) build and run examples, compare the self-hosted compiler against the reference, and exercise rejected programs. The [compiler README](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#building-and-testing) describes the self-build comparison and backend checks, and the [fuzzing section](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#fuzzing) describes the generated and mutated programs used to look for discrepancies.
