+++
layout = "page.html"
section = "more"
title = "A tour of the language"
eyebrow = "Learn"
intro = "The syntax you will meet in the examples and in the compiler's own source, with just enough explanation to read it."
description = "A concise tour of kursal packages, expressions, linear types, place lending, traits, error handling, closures, and unsafe operations."
permalink = "/tour/"
+++

This is a reading guide, not a grammar. Every snippet is from, or reduced directly from, a program in the [examples directory](https://github.com/kursionlabs/kursal/tree/main/examples), so you can open the whole file. For why the resource rules look the way they do, read [the ideas](/ideas/).

If you know C, Rust, or an ML-family language, most of this will look familiar. The unfamiliar parts are `!` on linear types, `&` on lent parameters, and `'k` brands. They're called out as they come up.

<h2 id="functions-and-expressions">Functions and expressions</h2>

Functions use `fn`. A block's last expression is its value, and `if` and `match` yield values too. When inference has nothing else to go on, a numeric literal carries a suffix such as `0u32`.

```kursal
fn max_u32(a: u32, b: u32) -> u32 {
    if a > b { a } else { b }
}
```

This is from [`examples/basic`](https://github.com/kursionlabs/kursal/blob/main/examples/basic/lib.kur). Struct values are written `Point.{ x: a, y: b }`, and an enum variant with a payload is built with `.(`, as in `Option::Some.(value)`.

<h2 id="packages-and-modules">Packages and modules</h2>

A package has a `kur.toml`. Its `.kur` files are modules named by their paths, and `lib.kur` acts as a directory's module. Dependencies are explicit paths. The hello-world package looks like this (reformatted):

```toml
[package]
name = "example_hello"
source_root = "."
kind = "executable"
entry = "main"

[dependencies.std]
path = "../../lib/std"
```

Names come in with `use`, and a module can `export` a facade. In [`examples/modules`](https://github.com/kursionlabs/kursal/tree/main/examples/modules) the package's `lib.kur` exports a `shapes` namespace while the implementation stays in separate files. A type can be public without exposing its fields.

<h2 id="linearity-in-source">Linear types</h2>

A linear type's declaration and every use of its name end in `!`, as in `Buffer!`. A function that takes a linear parameter owns it unless it lends a place instead. To consume a value you pass it on, return it, destructure it, or call something that finishes its obligation. The compiler checks the same obligation across both branches of an `if` and around a loop.

[`examples/linear`](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur) defines `Handle!` and shows valid control flow. `examples/bad/` has programs that try to leak it or use it twice, along with the exact error each one earns.

<h2 id="places-and-capabilities">Lending places</h2>

An `&` parameter receives the caller's place for the duration of a call. The [counter example](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/examples/counter/lib.kur) updates a caller's `Counter` through `&counter` and returns a value from it. Larger programs use a branded capability as the place parameter. The compiler lends `&cx` to every function working in one arena.

`Ref[T, 'k]` is a copyable description of storage in domain `'k`, and the matching capability authorizes access. The [graph example](https://github.com/kursionlabs/kursal/tree/main/examples/graph) keeps cyclic nodes and edges as arena references, then switches from exclusive building to shared reading. The [graph walkthrough](/walkthroughs/graph/) goes through it step by step.

<h2 id="generics-and-traits">Generics and traits</h2>

`forall` binds type and brand parameters, and a `where` clause says what generic code needs from a type. Trait instances are resolved statically for each instantiation. The [`traits` example](https://github.com/kursionlabs/kursal/blob/main/examples/traits/lib.kur) defines `Scale` for two types and calls one generic function on both (reformatted here so the `forall` sits on its own line):

```kursal
forall T where Scale[T].
fn scale_twice(x: T, factor: u32) -> T {
    x.scale(factor).scale(factor)
}
```

A bound such as `Copy[T]` lets the code use `x` more than once. Without it, `T` may be linear. Method lookup depends on the traits visible in the calling module, so you sometimes have to import a trait before a dot call works.

<h2 id="errors-and-closures">Errors and closures</h2>

`Option` and `Result` are ordinary enums used throughout the library. `?` returns an error from any function whose result type can carry it. In [`examples/greet`](https://github.com/kursionlabs/kursal/blob/main/examples/greet/lib.kur), `main` returns `Result[(), Error]` (trimmed):

```kursal
fn main() -> Result[(), Error] {
    print("What's your name?\n")?;
    let line = match read_line()? {
        Option::Some(line) => line,
        Option::None => Buffer!::new(),
    };
    let name = capitalize(line);
    let greeting = f"Hello, {&name}!\n";
    name.destroy();
    print(greeting)
}
```

Notice `Buffer!` and `{&name}`: an owned buffer, and a lend for formatting. The [greeting walkthrough](/walkthroughs/greeting/) follows exactly this program.

Closures capture the values they mention. Capturing a linear value moves it into the closure, which then becomes linear itself. [`examples/thread_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/thread_sum) uses this to send a distinct owned buffer into each OS thread.

<h2 id="unsafe-and-interop">Unsafe and C interop</h2>

`unsafe` marks one operation: an unsafe or external call, a raw-pointer read or write, a cast to a pointer type such as `x as *T`, or anything else with an explicit obligation. Numeric casts are safe. It is not a mode for a whole block. A package can declare C sources and linker flags in `kur.toml`, and external symbols can be declared in kursal. [`examples/libuv_echo`](https://github.com/kursionlabs/kursal/tree/main/examples/libuv_echo) is a concrete C-library integration, and the [standard library's contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) show how raw-pointer obligations are written down.

<h2 id="whats-missing">What's not there yet</h2>

There's no item-level privacy, so internal helpers appear in API docs. Trait methods can't have their own `forall`, and there are no superclass traits. Instances can't overlap: a generic instance such as `forall T. instance Describe[T]` rules out every more specific instance of that trait. Closures can't name a locally opened brand. Allocation failure aborts when a collection grows, though fallible constructors such as `try_new` (`Owned!::try_new`, for one) exist. The [status list](/compiler/#status) has the rest.

Once you can read the source, the [compiler page](/compiler/) shows what happens to it next.
