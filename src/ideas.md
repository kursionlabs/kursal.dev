+++
layout = "page.html"
title = "The ideas behind Kursal"
eyebrow = "The design, in plain language"
intro = "A guided look at ownership, permission, and the path from source code to a native program."
description = "Understand the ideas behind Kursal: linear ownership, lending by place, capabilities, brands, and its checked core language."
permalink = "/ideas/"
+++

Kursal is built for programs that work directly with memory, files, and other resources. In that setting, two questions matter: **who owns a value, and who is allowed to act on it?** Kursal gives those questions visible answers in source code, then checks them during compilation.

This page is a mental model, not a syntax reference. You can read it before you install the compiler.

<div class="idea-map" role="group" aria-label="Three parts of Kursal's mental model"><div><span>01 / VALUE</span><strong>What do I own?</strong><p>A value may be freely copied, or it may be linear and have one path through the program.</p></div><div><span>02 / PLACE</span><strong>Where does it live?</strong><p>A place names storage. A call can borrow that place and work with the value there.</p></div><div><span>03 / CAPABILITY</span><strong>What may I access?</strong><p>A capability grants permission to work with a resource or storage domain.</p></div></div>

<h2 id="one-value-one-path">One value, one path</h2>

Most everyday values can be copied. A number can be read twice without a question. A resource handle is different: copying it or forgetting it may lose track of who must finish using it. Kursal lets a type declare that difference with a `!` in its name.

```kursal
exposed struct Handle! {
    id: u64,
}

fn consume_handle(h: Handle!) -> u64 {
    let { id } = h;
    id
}
```

`Handle!` is *linear*: each value must be consumed exactly once. The check applies through `if` branches and loops, so both paths through a branch must account for it, and a loop that consumes one must replace it before the next turn. That makes the fate of a resource part of the program's structure. The [linear example](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur) and its rejected counterparts show the rule in action.

<h2 id="work-with-a-place">Work with a place</h2>

Moving a value is not always what a function needs. Sometimes it needs temporary access to the caller's storage. Kursal expresses that as a **place parameter**, written with `&`, and a call lends the place with the same notation. The function can work with that storage while the caller keeps the place after the call.

This distinction helps explain why Kursal speaks about *values* and *places*. A value is the thing being moved or copied; a place is where it is held. The [compiler's worked example](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#a-worked-example-counter) follows a counter through a place-lending call, its checked core form, and the generated C.

<h2 id="permission-is-explicit">Permission is explicit</h2>

For shared structures such as an arena, Kursal can carry permission in an explicit **capability**. Code that needs to read, write, or allocate in a domain receives the appropriate context instead of reaching into hidden global state. A **brand** connects values from that domain to the capability that grants access to it.

The compiler uses this design itself. It keeps different groups of compilation phases in different arenas, each with its own brand, and lends the arena context to the code working in that phase. That is a concrete example of the idea: data has a domain, and access to that domain has a visible path. The [storage chapter](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md#storage) explains the implementation; the [graph example](https://github.com/kursionlabs/kursal/tree/main/examples/graph) builds cyclic data in an arena without `unsafe`.

<div class="idea-callout"><span>THE CONNECTION</span><p>Linear values answer <strong>who owns this?</strong> Places answer <strong>where is it?</strong> Capabilities answer <strong>who may touch it?</strong> Kursal checks those answers through the program's control flow.</p></div>

<h2 id="unsafe-has-a-boundary">Unsafe has a boundary</h2>

Systems programs sometimes need raw pointers, atomics, or calls to external code. Kursal marks the particular operation that needs an `unsafe` promise, such as an unsafe call or a pointer read. A safe function may contain such an operation, so its author must uphold that operation's contract. This keeps the point where the program takes responsibility visible to a reader.

The [standard library's pointer contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) record these obligations for functions with raw pointers. The [atomics example](https://github.com/kursionlabs/kursal/tree/main/examples/atomics) shows the same approach for low-level memory operations.

<h2 id="a-small-core-to-check">A small core to check</h2>

Kursal source has familiar conveniences: modules, functions, traits, closures, and pattern matching. The compiler resolves and infers that surface language, then lowers it to **KURS**, a core language where operations on values and places are explicit. A separate checker validates the core program before the backend emits C.

<div class="idea-pipeline" role="group" aria-label="Kursal compilation pipeline"><span>Source <small>.kur</small></span><b aria-hidden="true">→</b><span>Lowered core <small>KURS</small></span><b aria-hidden="true">→</b><span>Checked program</span><b aria-hidden="true">→</b><span>C output</span></div>

The C output is then compiled into an executable by a C compiler. Kursal's compiler is itself written in Kursal: a Python reference implementation builds it first, and the resulting compiler builds itself. The [compiler overview](https://github.com/kursionlabs/kursal/blob/main/compiler/README.md) maps the phases, while the [reference compiler overview](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#pipeline) describes the same route from another angle.

<h2 id="see-it-in-a-program">See it in a program</h2>

The best next step is to read a small example with one concept in view. Start with [`hello`](https://github.com/kursionlabs/kursal/tree/main/examples/hello), then [`greet`](https://github.com/kursionlabs/kursal/tree/main/examples/greet) for owned input, and [`linear`](https://github.com/kursionlabs/kursal/tree/main/examples/linear) for a resource with one path. When the ideas feel familiar, [The language](/language/) shows their syntax and [Get started](/start/) shows how to build a program.
