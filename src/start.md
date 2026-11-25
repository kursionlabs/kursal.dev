+++
layout = "page.html"
section = "start"
title = "Quick start"
eyebrow = "Quick start"
intro = "Build the compiler, run a program, and watch it refuse a bad one."
permalink = "/start/"
+++

kursal is pre-1.0 and builds on **Linux** only. Expect rough edges and breaking changes.

## What you need

- [uv](https://docs.astral.sh/uv/), which supplies Python 3.12. The first bootstrap stage runs the Python reference compiler.
- Clang, or another C compiler named in `KURSAL_CC`. kursal emits C, and your C compiler does the code generation.
- The [kursal repository](https://github.com/kursionlabs/kursal). Run everything below from its root.

## Build the compiler

```sh
scripts/bootstrap.sh
```

This takes a few minutes. The Python reference compiler builds kursal's own compiler once, then that compiler builds itself into `bin/kursal`, and clang compiles the generated C each time.

## Run hello world

```sh
bin/kursal build examples/hello -o /tmp/hello
/tmp/hello
```

```text
Hello, world!
```

The program is [examples/hello/lib.kur](https://github.com/kursionlabs/kursal/blob/main/examples/hello/lib.kur):

```kursal
use std::io::print;

fn main() {
    print("Hello, world!\n");
}
```

## Look at what the compiler wrote

`kursal build` leaves the C next to the executable, in a directory with a file per module. With the command above that is `/tmp/hello.build/`. To print the generated C without building a binary:

```sh
bin/kursal build examples/hello --emit-c
```

The compiler can also print its intermediate stages: resolved names, inferred types, lowered KURS, and readable KURS. Run `bin/kursal --help` for the current commands. The [compiler page](/compiler/) explains what each stage is.

## Try breaking something

The repository keeps programs the compiler must reject in `examples/bad/`. Build one and read the error:

```sh
bin/kursal build examples/bad/leaked_handle.kur
```

```text
…/examples/bad/leaked_handle.kur:15:5: leaked_handle::leaks_a_handle: linear value 'h' is not consumed before return
  15 |     5u32
```

The build exits with status 1 and writes no executable. The path is shown shortened here, and the compiler prints a caret under the source line. Errors have the form `FILE:LINE:COL: message`. Each file in `examples/bad/` fails with the message quoted in its own comments. Then open `examples/linear` for the version that gets it right.

## Where next

- The [quick guide](/guide/) builds the central ideas in eight short steps, each driven by a problem a program has to solve.
- The [book](/book/) covers the whole language, chapter by chapter.
- [Why kursal](/why/) says what the language is for and what it costs.
