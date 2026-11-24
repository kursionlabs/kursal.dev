+++
layout = "page.html"
section = "start"
title = "Quick start"
eyebrow = "Layer 1 of 3"
intro = "Build the compiler, run hello world, and look at the C it writes. About ten minutes, most of it waiting for a C compiler."
permalink = "/start/"
+++

kursal is pre-1.0 and currently builds on **Linux** only. Expect rough edges and breaking changes. If you want to see how the pieces fit before installing anything, the [ideas](/ideas/) and the [walkthroughs](/walkthroughs/) don't need a toolchain.

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

`kursal build` leaves a C file next to the executable. With the command above that is `/tmp/hello.c`. To print the generated C without building a binary:

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
…/examples/bad/leaked_handle.kur:14:5: leaked_handle::leaks_a_handle: linear value 'h' is not consumed before return
  14 |     let h = make_handle(id);
```

The build exits with status 1 and writes no executable. The path is shown shortened here, and the compiler prints a caret under the source line. Errors have the form `FILE:LINE:COL: message`. Each file in `examples/bad/` fails with the message quoted in its own comments. Then open `examples/linear` for the version that gets it right.

## What a package looks like

`examples/hello` has a `kur.toml` naming its source root, its entry function, and its `std` dependency. Every `.kur` file under the source root is a module, and this package's `lib.kur` defines `main`. For several files and an exported facade, see [`examples/modules`](https://github.com/kursionlabs/kursal/tree/main/examples/modules). There is no package manager or registry yet: a package is a directory with a `kur.toml`.

## Where next

- [A tour of the language](/tour/) walks through the syntax you will meet in the examples.
- [The ideas](/ideas/) explains why the rules are shaped the way they are.
- [Walkthroughs](/walkthroughs/) follow single programs and show each decision the compiler checks.
