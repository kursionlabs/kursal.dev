+++
layout = "page.html"
title = "Resources"
eyebrow = "Keep exploring"
intro = "Source code, examples, compiler notes, and the places to start reading."
permalink = "/resources/"
+++

## Source and documentation

- [Kursal repository](https://github.com/kursionlabs/kursal) — the compiler, libraries, examples, and editor grammars.
- [Repository README](https://github.com/kursionlabs/kursal/blob/main/README.md) — current requirements and bootstrap instructions.
- [Examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) — programs grouped by what they teach.
- [Compiler documentation](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md) — the self-hosted compiler's phases, storage model, and C backend.
- [Reference compiler documentation](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md) — the Python implementation and KURS format.

## Programs worth opening

| Example | What it demonstrates |
| --- | --- |
| [`hello`](https://github.com/kursionlabs/kursal/tree/main/examples/hello) | A minimal program that prints a line. |
| [`greet`](https://github.com/kursionlabs/kursal/tree/main/examples/greet) | Input, formatted text, and I/O errors. |
| [`linear`](https://github.com/kursionlabs/kursal/tree/main/examples/linear) | A type that must be consumed exactly once. |
| [`graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph) | A cyclic graph held in an arena. |
| [`thread_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/thread_sum) | Transferring owned data to OS threads. |
| [`lisp`](https://github.com/kursionlabs/kursal/tree/main/examples/lisp) | A larger interpreter with closures and recursion. |

## Libraries and tooling

The repository includes `core`, `alloc`, `std`, `libc`, `thread`, and `toml` library packages. The [`editors` directory](https://github.com/kursionlabs/kursal/tree/main/editors) contains Tree-sitter grammars and highlight queries for Kursal source and readable KURS.
