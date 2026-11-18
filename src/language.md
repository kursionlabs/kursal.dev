+++
layout = "page.html"
title = "Language tour"
eyebrow = "Reading .kur files"
intro = "The surface constructs you will meet in the examples and compiler source."
description = "A concise technical tour of Kursal packages, expressions, linear types, place lending, traits, error handling, closures, and unsafe operations."
permalink = "/language/"
+++

This is a reading guide, not a full grammar. The snippets are from, or reduced directly from, programs in the [examples directory](https://github.com/kursionlabs/kursal/tree/main/examples). For the rationale behind the resource rules, start with the [design model](/design/).

<h2 id="packages-and-modules">Packages and modules</h2>

A package has a `kur.toml` manifest. Its source files are `.kur` modules named by their paths, and `lib.kur` acts as a directory's module. Dependencies are explicit paths in the manifest. The hello-world package has this shape:

```toml
[package]
name = "example_hello"
source_root = "."
kind = "executable"
entry = "main"

[dependencies.std]
path = "../../lib/std"
```

Names are imported with `use`, and a module can `export` a public facade. In [`examples/modules`](https://github.com/kursionlabs/kursal/tree/main/examples/modules), the package's `lib.kur` exports a `shapes` namespace while its implementation remains in separate files. A type can be named publicly without exposing its fields.

<h2 id="functions-and-expressions">Functions and expressions</h2>

Functions use `fn`. A block's final expression supplies its value; `if` and `match` can also yield values. When inference has no other type context, a numeric literal carries a suffix such as `0u32`.

```kursal
fn max_u32(a: u32, b: u32) -> u32 {
    if a > b { a } else { b }
}
```

This is from [`examples/basic`](https://github.com/kursionlabs/kursal/blob/main/examples/basic/lib.kur). The same source shows structs and field access. Struct construction is written `Point.{ x: a, y: b }`; an enum variant with a payload is built with `.(`, such as `Option::Some.(value)`.

<h2 id="linearity-in-source">Linearity in source</h2>

A linear type's declaration and every use of its name end in `!`, as in `Buffer!`. A function taking a linear parameter owns that value unless it lends a place instead. Consuming a value can mean passing it on, returning it, destructuring it, or calling an operation that finishes its obligation. The compiler checks the same obligation across both branches of an `if` and around a loop.

The [`linear` example](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur) defines `Handle!` and shows its valid control flow; `examples/bad/` includes programs that try to use or abandon it incorrectly. The [design model](/design/#copy-and-linear-values) explains why a generic `T` may also be linear.

<h2 id="places-and-capabilities">Places and capabilities</h2>

An `&` parameter receives a caller's place for the duration of a call. The [counter example](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/examples/counter/lib.kur) updates a caller's `Counter` through `&counter` and returns a value from it. Larger programs use a branded capability as the place parameter; for example, the compiler lends `&cx` to functions working in one arena.

`Ref[T, 'k]` is a copyable description of storage in domain `'k`; the matching capability authorizes access. The [graph example](https://github.com/kursionlabs/kursal/tree/main/examples/graph) keeps cyclic nodes and edges as arena references, then changes from exclusive building to shared reading.

<h2 id="generics-and-traits">Generics and traits</h2>

`forall` binds type and brand parameters. A `where` clause states what generic code needs from a type. Trait instances are resolved statically for each instantiation; the [`traits` example](https://github.com/kursionlabs/kursal/blob/main/examples/traits/lib.kur) defines `Scale` for two types and calls one generic function on both.

```kursal
forall T where Scale[T]. fn scale_twice(x: T, factor: u32) -> T {
    x.scale(factor).scale(factor)
}
```

A bound such as `Copy[T]` permits code to use `x` more than once. Without it, `T` may stand for a linear type. Method lookup depends on traits visible in the calling module, so importing a trait can be necessary for a dot call.

<h2 id="errors-and-closures">Errors and closures</h2>

`Option` and `Result` are ordinary enums used throughout the library. `?` returns an error to a function whose result type can carry it. In [`examples/greet`](https://github.com/kursionlabs/kursal/blob/main/examples/greet/lib.kur), `main` returns `Result[(), Error]`, reads input, and produces a formatted greeting:

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
    print_buffer(greeting)
}
```

Closures capture values they mention. Capturing a linear value moves it into the closure, so that closure is itself linear. [`examples/thread_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/thread_sum) sends a distinct owned buffer into each OS thread this way.

<h2 id="unsafe-and-interop">Unsafe and C interop</h2>

`unsafe` marks a particular operation: an unsafe or external call, a raw-pointer read, a cast, or another operation with an explicit obligation. It is not a blanket mode for a whole block. Packages can declare C sources and linker flags in `kur.toml`, and external symbols can be declared in Kursal. [`examples/libuv_echo`](https://github.com/kursionlabs/kursal/tree/main/examples/libuv_echo) is a concrete C-library integration; the [standard library contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) show how raw-pointer obligations are documented.

For what happens after source parsing, continue to [Compiler architecture](/compiler/).
