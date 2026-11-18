+++
layout = "page.html"
title = "Design model"
eyebrow = "Language design"
intro = "How Kursal accounts for values, storage, and authority."
description = "The design of Kursal's linear values, place lending, brands, capabilities, representation boundaries, and checked core language."
permalink = "/design/"
+++

Kursal separates three concerns that are often bundled together in systems code. A **value** is what can be copied or moved. A **place** is storage holding a value. A **capability** is permission to access a resource. A brand ties a capability and the data it governs to the same type-level domain. These distinctions are visible in function signatures and checked through control flow.

| Concept | What the type checker tracks |
| --- | --- |
| Copy or linear value | Whether a value may be duplicated or discarded. |
| Place | Whether storage is available, empty, or temporarily lent. |
| Brand | Whether data and authority belong to the same domain. |
| Capability | Which operation a caller may perform on that domain. |

<h2 id="copy-and-linear-values">Copy and linear values</h2>

A `Copy` value may be used more than once. A linear value must be consumed exactly once on every path through a function. The trailing `!` is part of a declared linear type's name, not an annotation added at a use site:

```kursal
exposed struct Handle! {
    id: u64,
}

fn consume_handle(h: Handle!) -> u64 {
    let { id } = h;
    id
}
```

The compiler rejects a second use of `h`, an unconsumed `h` at return, or a branch that leaves it behind. A loop carrying a linear value must have a value in that place at the next iteration. A generic `T` may itself be linear; a function that needs to copy it states `where Copy[T]`. Structural containers such as `Option[T]` inherit linearity from their payload when instantiated with a linear type. See [`examples/linear`](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur) and the corresponding rejected programs under `examples/bad/`.

<h2 id="places-and-lending">Places and lending</h2>

Passing a value transfers it to the callee. A place parameter instead lends access to the caller's storage. The `&` is a parameter and call mode, not a pointer type:

```kursal
exposed struct Counter { value: u32 }

fn bump(&counter: Counter) -> u32 {
    counter.value = counter.value + 1u32;
    counter.value
}
```

The caller invokes this function as `bump(&counter)`. This example comes from the [counter walkthrough](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#a-worked-example-counter), which follows that lent place through source, KURS, and C. The [compiler's arena code](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#storage) uses the same mechanism with a linear context named `&cx`. A callee may update a lent place, including moving a value out and putting a valid replacement back before return. Place flow also checks branches, loops, and overlapping lends.

<h2 id="brands-and-capabilities">Brands and capabilities</h2>

A brand such as `'k` is a type-level identity. It is not the allocation itself and does not grant access by itself. A capability carries the authority; the matching brand lets an API require that the authority and data refer to the same domain.

The compiler's own storage uses a context containing one arena and its exclusive capability:

```kursal
forall 'k.
exposed struct Domain! {
    tag: Exclusive!['k],
    arena: Arena!['k],
}
```

The context is lent as `&cx` to code that reads or allocates in that arena. A `Ref[T, 'k]` can be copied as a description of a location, but reading or writing through it requires the matching capability. This separation lets [`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph) hold cycles in an arena: nodes can refer to each other while a capability controls access. The [capability implementation](https://github.com/kursionlabs/kursal/blob/main/lib/core/cap.kur) also shows how exclusive access can become a tree of shared readers.

A constructor can return a fresh brand hidden in an `exists` package. The compiler opens a new domain for each group of phases with code shaped like `let exists 'f. front = Domain!::new();`. The identity `'f` is then available inside that scope, so values from one arena cannot be passed to a capability for another merely because their runtime representation looks alike. This is type-level identity, not a runtime tag or a claim that arbitrary raw pointers are valid.

<h2 id="representation-and-unsafe">Representation and unsafe</h2>

Aggregate representations are restricted to their declaring module unless the type is `exposed`. This matters for capabilities: callers cannot construct an `Exclusive!` token by filling in its fields. The module defining a resource is responsible for making its safe operations uphold the resource's invariants.

Low-level operations remain available. Kursal marks an individual raw-pointer read, cast, atomic operation, or unsafe call with `unsafe`. The marker identifies an obligation; it does not prove that a pointer is valid or that a foreign function obeys a contract. A safe function can contain unsafe operations when its implementation establishes the necessary conditions. The standard library records those conditions in its [pointer contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md).

<h2 id="the-core-check">The core check</h2>

Source syntax is lowered to **KURS**, a core language with explicit values, places, block arguments, and control-flow edges. A separate checker validates the lowered program before the backend emits C. This makes the checker's input a concrete artifact that can be printed, read back, and tested independently of the frontend.

The core check is one part of the compiler's correctness story: a successful check says the program obeys KURS rules, while unsafe operations still depend on their stated contracts. The [compiler architecture](/compiler/) describes the stages and the comparison between the Python reference compiler and the self-hosted compiler.
