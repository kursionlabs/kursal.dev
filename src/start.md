+++
layout = "page.html"
title = "Build and run"
eyebrow = "Toolchain"
intro = "Bootstrap the compiler, compile a package, and inspect its output."
permalink = "/start/"
+++

## Requirements

The current toolchain targets **Linux**. You need [uv](https://docs.astral.sh/uv/) for Python 3.12 and Clang, or another C compiler set through `KURSAL_CC`. Clone the [Kursal source repository](https://github.com/kursionlabs/kursal) and run these commands from its root.

## Build the compiler

```sh
scripts/bootstrap.sh
```

This takes a few minutes. The Python reference compiler builds Kursal's compiler; that compiler then builds itself into `bin/kursal`.

## Compile and run hello world

```sh
bin/kursal build examples/hello -o /tmp/hello
/tmp/hello
```

You should see:

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

## Inspect what the compiler emits

`kursal build` writes a C companion next to the executable: with the command above, it writes `/tmp/hello.c`. To print generated C without compiling a binary, use:

```sh
bin/kursal build examples/hello --emit-c
```

The compiler can also print intermediate stages, including resolved names, inferred types, lowered KURS, and readable KURS. Run `bin/kursal --help` for the current commands. [Compiler architecture](/compiler/) explains what each stage represents.

## Package structure

`examples/hello` has a `kur.toml` manifest naming its source root, executable entry, and `std` dependency. Each `.kur` file under the source root is a module; this package's `lib.kur` defines `main`. For packages with more files and an exported facade, see [`examples/modules`](https://github.com/kursionlabs/kursal/tree/main/examples/modules).

## What to read next

Read `examples/greet` to see input and formatted output, then `examples/linear` for a type that must be consumed. The [examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) orders the rest by topic and shows how to build each package.

Continue to the [design model](/design/) for value and access rules, or the [language tour](/language/) for syntax seen in the examples.
