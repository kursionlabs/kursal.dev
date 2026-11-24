+++
layout = "page.html"
section = "more"
title = "Walkthroughs"
eyebrow = "Learn"
intro = "Three small programs, followed one decision at a time. Each shows what the compiler checks and why it is checkable from where you are reading."
description = "Worked examples of kursal programs: a greeting, a cyclic graph, and a thread that fails to start."
permalink = "/walkthroughs/"
+++

The [ideas page](/ideas/) says what the pieces are. These pages show them working. Each one takes a real program from the repository and follows a single question through it.

## The three walkthroughs

- **[Follow a buffer](/walkthroughs/greeting/)** reads a name from input and prints a greeting. The name's length is unknown until runtime, so someone has to own those bytes. You'll see a transfer, a lend, and a release in a dozen lines.
- **[Who owns a graph that points back at itself?](/walkthroughs/graph/)** builds a cycle, walks it, then goes back to editing it. This is where brands and capabilities earn their keep.
- **[What if the thread doesn't start?](/walkthroughs/threads/)** hands a buffer to a worker thread and looks at the one moment when ownership is genuinely ambiguous: when the OS says no.

## More examples, by topic

The repository has a large set of example packages. The [examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) lists every one with how to run it. Some places to start:

| Topic | Read |
| --- | --- |
| Small programs and I/O | [`hello`](https://github.com/kursionlabs/kursal/tree/main/examples/hello), [`greet`](https://github.com/kursionlabs/kursal/tree/main/examples/greet), [`wc`](https://github.com/kursionlabs/kursal/tree/main/examples/wc) |
| Linear values and memory | [`linear`](https://github.com/kursionlabs/kursal/tree/main/examples/linear), [`graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph), [`arena_text`](https://github.com/kursionlabs/kursal/tree/main/examples/arena_text) |
| Traits and iteration | [`traits`](https://github.com/kursionlabs/kursal/tree/main/examples/traits), [`iter_combinators`](https://github.com/kursionlabs/kursal/tree/main/examples/iter_combinators) |
| Threads and low-level operations | [`thread_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/thread_sum), [`atomics`](https://github.com/kursionlabs/kursal/tree/main/examples/atomics), [`libuv_echo`](https://github.com/kursionlabs/kursal/tree/main/examples/libuv_echo) |
| Larger programs | [`lisp`](https://github.com/kursionlabs/kursal/tree/main/examples/lisp), [`kvstore`](https://github.com/kursionlabs/kursal/tree/main/examples/kvstore), [`json_check`](https://github.com/kursionlabs/kursal/tree/main/examples/json_check) |

`examples/bad/` holds the opposite: programs the compiler must reject, each with the error it should produce. They're a good way to learn the rules, because every rule has a program that breaks it.
