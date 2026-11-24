+++
layout = "page.html"
title = "Getting started"
eyebrow = "Book · Part 1 · Chapter 1"
intro = "A package is a directory with a kur.toml. Every .kur file in it is a module, and the entry is a function called main."
permalink = "/book/start/"
+++

## A first program

```kursal
// A first program.
use std::io::print;

fn main() {
    print("Hello, world!\n");
}
```

`use` brings a name into scope. `std::io::print` is the standard library's way to write a string literal to standard output. Nothing is in scope by default beyond the primitive types and a few core names (`Never`, `Copy`, `Exposed` and `Sized`). Types you might expect to be built in, such as `Option`, `Result`, `Slice` and `Buffer!`, are imported like everything else:

```kursal
use std::option::{Option, Result};
```

Leave the import out and the compiler tells you `unknown name Option`.

## Building

A package is a directory with a `kur.toml`:

```toml
[package]
name = "hello"
kind = "executable"
entry = "main"
source_root = "."

[dependencies.std]
path = "../kursal/lib/std"
```

- `kind` is `executable` or `library`.
- `entry` names the function the executable starts in.
- `source_root` is the directory the sources live under. It defaults to `src`.
- `[dependencies.NAME]` gives another package's directory as a `path`. Kursal has no registry yet, so a dependency is always a directory.

Build and run it:

```sh
kursal build hello -o hello/prog && hello/prog
```

```text
Hello, world!
```

Without `-o`, the build writes `a.out` and `a.out.build/` into the current directory. A single `.kur` file builds on its own, with `std` added for you:

```sh
kursal build hello.kur -o hello && ./hello
```

A library has no executable. To check that one compiles, ask for its C and throw it away: `kursal build inventory --emit-c > /dev/null`.

## What main can look like

The entry function has one of three results, each with or without a parameter `args: std::process::Args`:

- `fn main()` returns nothing.
- `fn main() -> i32` returns the exit status.
- `fn main() -> Result[(), std::io::Error]` returns success or an error. On an error the program prints it to standard error and exits with status 1.

```kursal
use std::io::{Error, print, print_buffer};
use std::fs::read;
use std::option::Result;
use std::slice::StaticRead;

fn main() -> Result[(), Error] {
    var sr = StaticRead::new();      // a capability to read 'static byte slices
    let contents = read(&sr, "/no/such/file")?;
    print_buffer(contents)?;
    print("done\n")
}
```

```text
error: No such file or directory (error 2)
```

`?` ends the function early with the error, and chapter 8 covers it. The `&sr` hands the file reader a capability without giving it away. That is the subject of Part 2, and for now it is only a pattern to recognise.

`Args` works like this:

```kursal
use std::io::print_buffer;
use std::process::Args;

fn main(args: Args) -> i32 {
    let n = args.len();
    print_buffer(f"{n} argument(s)\n");
    0
}
```

`args.len()` counts the program's own name too. The `f"..."` is a string with values spliced in, which chapter 10 explains.

Any other shape of `main` is rejected before anything is built:

```kursal
fn main() -> u32 {
    0
}
```

```text
backend: the entry badentry::main must be `fn()`, `fn() -> i32` or `fn() -> Result[(), std::io::Error]`, each with or without a parameter `args: std::process::Args`, and safe, not generic and without premises
```

## Files are modules

Every `.kur` file under the source root is a module, named by its path. `src/text/shout.kur` is the module `text::shout`. A directory can have a `lib.kur`, which is the module for the directory itself: `src/text/lib.kur` is `text`. The package's own root is `src/lib.kur`. You refer to modules in the current package with the prefix `package::`:

```kursal
//! The root module of the package.
use std::io::print_buffer;
use package::text::shout::exclaim;  // the module src/text/shout.kur

fn main() {
    print_buffer(exclaim(3));
}
```

```kursal
// src/text/shout.kur
use std::buffer::Buffer!;

/// A line of `n` exclamation marks.
fn exclaim(n: usize) -> Buffer! {
    var out = Buffer!::new();
    var i = 0usize;
    while i < n {
        out = out.push_byte(b'!');
        i = i + 1;
    }
    out.push_byte(b'\n')
}
```

```text
!!!
```

There is no `mod` declaration. A module exists because its file does. `Buffer!` is the standard library's growable byte buffer. The `!` marks it as a type that has to be used exactly once, which is chapter 6.

## Comments

`//` runs to the end of the line. `/* */` spans lines and does not nest. `///` documents the item after it and `//!` documents the enclosing module, and the `kursal doc` command reads both.

```kursal
/* outer /* inner */ still outer? */
fn main() {}
```

```text
lib.kur:1:22: syntax error
  1 | /* outer /* inner */ still outer? */
    |                      ^
```

The first `*/` ends the comment, so the rest is parsed as code.

## Check by hand

The only thing to check in this chapter is the entry's signature: one of the three results, with or without `args`.

Next: [Values and operators →](/book/values/)
