+++
layout = "page.html"
title = "The language"
eyebrow = "A short tour"
intro = "A practical look at the ideas visible in Kursal programs and its compiler."
permalink = "/language/"
+++

For the bigger picture before the syntax, read [The ideas behind Kursal](/ideas/).

<h2 id="a-familiar-starting-point">A familiar starting point</h2>

Kursal source files use the `.kur` extension. A package has a `kur.toml` manifest. Modules import names with `use`, functions begin with `fn`, and the last expression in a block is its value.

```kursal
fn max_u32(a: u32, b: u32) -> u32 {
    if a > b { a } else { b }
}
```

This example comes from [`examples/basic`](https://github.com/kursionlabs/kursal/blob/main/examples/basic/lib.kur). The [examples index](https://github.com/kursionlabs/kursal/blob/main/examples/README.md) covers more syntax in small programs.

<h2 id="linear-types">Linear types</h2>

A declaration such as `struct Handle!` defines a linear type. A linear value has to be consumed exactly once. Kursal checks this through branches and loops, so using a handle twice or leaving it behind is a compile-time error.

```kursal
exposed struct Handle! {
    id: u64,
}

fn consume_handle(h: Handle!) -> u64 {
    let { id } = h;
    id
}
```

See [`examples/linear`](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur) alongside the rejected examples in `examples/bad/`.

<h2 id="capabilities-and-places">Capabilities and places</h2>

Kursal can make permission to access storage explicit in a value's type. A function can lend a value **by place**, using a parameter like `&cx`, and the caller keeps ownership when the call returns. Brands connect data to the domain that owns it.

The compiler uses these ideas itself: it stores each group of compilation phases in an arena with its own brand and capability. The [compiler documentation](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#storage) describes that design in detail; [`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph) shows a cyclic graph built in an arena without `unsafe`.

<h2 id="traits-and-generics">Traits and generics</h2>

Traits describe behavior that generic code requires. Kursal checks generic functions with abstract type parameters, and calls constrained by traits are resolved for each instantiation.

```kursal
forall T where Scale[T]. fn scale_twice(x: T, factor: u32) -> T {
    x.scale(factor).scale(factor)
}
```

This is from [`examples/traits`](https://github.com/kursionlabs/kursal/blob/main/examples/traits/lib.kur).

<h2 id="the-compiler-pipeline">The compiler pipeline</h2>

The compiler parses and resolves a package, infers types, lowers it to **KURS** (the core language), checks that core program, and emits C. Kursal's compiler is written in Kursal and is built first by a Python reference compiler. The [compiler README](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md) maps each phase; the [reference compiler README](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md) explains the intermediate representation and command-line tools.

The output is GNU C accepted by Clang and GCC. The normal `kursal build` command runs the C compiler to produce an executable.
