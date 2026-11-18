+++
layout = "page.html"
title = "Get started"
eyebrow = "Your first program"
intro = "Build the compiler, run hello world, and find the next example to read."
permalink = "/start/"
+++

## Before you begin

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

## What to read next

Read `examples/greet` to see input and formatted output, then `examples/linear` for a type that must be consumed. The [examples guide](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) orders the rest by topic and shows how to build each package.

For the language's core ideas, continue to [The language](/language/).
