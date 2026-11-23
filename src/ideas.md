+++
layout = "page.html"
title = "The ideas"
eyebrow = "Understand"
intro = "Kursal separates three questions that systems code usually blurs together: what is this value, where does it live, and who may touch it right now."
description = "Kursal's design model: linear values, lent places, brands, capabilities, and a checked core language."
permalink = "/ideas/"
+++

Most resource bugs come from one sentence living in a comment: *free this once, and only while nobody is still looking at it.* A comment can't tell a caller that a new early return broke the promise. Kursal asks how much of that sentence a library can write into a function signature, so the compiler checks every caller.

The answer is a small set of ideas that are cheap to state and fit together. The test for each is the one from the [front page](/): can you look at a function and tell whether the checker will accept it?

| Concept | What the checker tracks |
| --- | --- |
| Value | Whether it may be copied, or must be consumed exactly once. |
| Place | Whether storage is full, empty, or currently lent. |
| Brand | Which domain a reference and its authority belong to. |
| Capability | Which operation a caller may perform in that domain. |

<h2 id="copy-and-linear-values">Values: copy or consume</h2>

A `Copy` value may be used as often as you like. A linear value must be consumed exactly once on every path through a function. The trailing `!` is part of the type's name, not an annotation at the use site:

```kursal
exposed struct Handle! {
    id: u64,
}

fn consume_handle(h: Handle!) -> u64 {
    let { id } = h;
    id
}
```

Forget `h` and the compiler says so:

```text
…/examples/bad/leaked_handle.kur:14:5: leaked_handle::leaks_a_handle: linear value 'h' is not consumed before return
```

Use it twice and you get `value 'h' has been moved or is only partially available`. A branch that leaves it behind is rejected, and so is a loop that doesn't have a value in place for the next iteration. Plain `Handle` doesn't resolve, so from any signature you can see which values carry an obligation.

One exception is by design. A generic `T` may itself be linear, and generic code must treat it that way unless it asks for `where Copy[T]`. `Option[Buffer!]` shows its `!` in the argument, so that case reads fine.

Rust is affine: it lets you drop a value, and `Drop` runs implicitly. Linear Haskell attaches linearity to function arrows, and ATS pairs linear types with a proof language. Kursal puts it on the type, enforces it everywhere, and makes it visible. It is a bit ceremonial, on purpose.

Examples: [`examples/linear`](https://github.com/kursionlabs/kursal/blob/main/examples/linear/lib.kur), and the rejected programs under `examples/bad/`.

<h2 id="places-and-lending">Places: lend, don't borrow</h2>

Kursal has no borrowed-reference types like Rust's `&T` or `&mut T`. Passing a value moves it to the callee. A parameter marked with `&` instead *lends the caller's storage* for the duration of the call, and the callee must hand it back full. The `&` is a calling convention, not a pointer type:

```kursal
exposed struct Counter { value: u32 }

fn bump(&counter: Counter) -> u32 {
    counter.value = counter.value + 1u32;
    counter.value
}
```

The caller writes `bump(&counter)`. This also means you can inspect a linear value without giving it up: `fn len(&self) -> usize` on the linear `Buffer!` is called as `&b.len()`, and `b` is still yours afterward, with no borrow type in the signature.

A callee may move a value out of a lent place as long as it puts a valid one back before returning. If it doesn't, you get `lent value 'reg' must be restored before return`. Overlap is rejected too: one call can't lend the same place twice, so `two(&x, &x)` fails with `'x' overlaps another place the same call lends`.

Rust's `&mut T` is a first-class value with a lifetime. Here a lend is a convention on a place, checked at each call from the call site and the callee's signature. The [counter walkthrough](https://github.com/kursionlabs/kursal/blob/main/reference-compiler/README.md#a-worked-example-counter) follows one lent place through source, KURS, and C.

<h2 id="brands-and-capabilities">Brands and capabilities: which memory, and may I touch it</h2>

Use-after-free and aliasing bugs come from mixing two questions: *which memory is this?* and *am I allowed to use it right now?* Kursal answers them with two different things.

A **brand** such as `'k` is a type-level identity. It isn't the allocation, and it grants no access. A `Ref[T, 'k]` can be copied freely as a description of a location. A **capability** carries the authority, and the matching brand lets an API demand that authority and data belong to the same domain.

The compiler's own storage is a context holding one arena and its exclusive capability:

```kursal
forall 'k.
exposed struct Domain! {
    tag: Exclusive!['k],
    arena: Arena!['k],
}
```

Lend it as `&cx` to code that reads or allocates in that arena. Reading through a `Ref` needs the capability for the same brand. Exclusive access can also split into a tree of shared readers, with receipts that let you join them back, and the [capability library](https://github.com/kursionlabs/kursal/blob/main/lib/core/cap.kur) shows how.

Fresh brands come from `exists` packages, which makes two allocations impossible to confuse. A constructor can return a brand hidden in one, and the compiler opens a new domain per group of phases with `let exists 'f. front = Domain!::new();`. The brand has to be declared where you use it: `fn make_tag() -> Tag!['1]` fails with `brand '1 is not in scope`, and the fix is `-> exists '1. Tag!['1]`.

When a container frees or moves memory it hands itself back under a *new* brand, so every old view stops type-checking. A stale reference after `remove` is a type error, not a crash. The message names both brands and where each was opened: `brand mismatch: 'b and 'a; 'b was opened at 15:5, 'a at 13:5`.

There are no lifetimes and no `Rc<RefCell>`. A cyclic graph is plain `Ref`s in one arena domain with no `unsafe`. The [graph walkthrough](/walkthroughs/graph/) follows it. Region calculi and GhostCell-style branding are the closest relatives, and Kursal makes the technique the everyday API.

<h2 id="encapsulation">Who may build a value</h2>

Aggregate representations are private to their declaring module unless the type is `exposed`. That's what keeps capabilities unforgeable: you can't construct an `Exclusive!` token by filling in its fields.

```kursal
use std::io::File!;

fn close_descriptor_three() -> bool {
    let file = File!.{ fd: 3i32 };
    file.close().is_ok()
}
```

```text
the shape of std::io::File! is not exposed here
```

Whether that literal is legal depends on where you are, not on what other code might do. That's the locality idea again. The module that defines a resource is responsible for making its safe operations uphold the resource's invariants.

Linear values can't be stored in an arena either: `examples/bad/linear_in_arena.kur` fails with `type argument must satisfy Copy`.

<h2 id="representation-and-unsafe">Unsafe: a stated contract</h2>

Kursal is not memory safe by default, and `unsafe` is part of the design. Raw-pointer reads and writes, casts to pointer types, atomics, volatile accesses, and foreign calls each carry an explicit `unsafe` marker. Calling an unsafe function without it fails with `calling an unsafe function requires unsafe authorization`.

The marker names an obligation. It doesn't prove a pointer is valid or that a C function keeps its contract. A safe function may contain unsafe operations if its implementation establishes what they need. For example, `Allocation!::adopt` is unsafe and `adopt_value` is the checked form. The standard library writes down the conditions in its [pointer contracts](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md). Using `unsafe` casually sidesteps everything on this page, and that is against the point of the language.

<h2 id="the-core-check">The core, checked separately</h2>

Source syntax is lowered to **KURS**, a core language with explicit values, places, block arguments, and control-flow edges. Every block states its complete place state: what is full, empty, or lent. A separate, small checker re-verifies that program before any C is emitted.

That has two payoffs. A front-end bug shows up as *front end accepted, checker rejected* and not as miscompiled code. And because each block's contract is complete, a block can be checked without reading any other block's state, which makes parallel checking possible. (The checker runs sequentially today.) A design that listed only what changed per block would be smaller and would give that up, so it was rejected.

Fuzzing the front end against the checker (21,156 generated and mutated programs, plus about 150 targeted probes) found seven distinct gaps where the front end accepted what the checker rejected, including an aliasing hole in `f(&x, &x)`. All are fixed, and later campaigns of 9,056, 4,000, 3,576, and 3,000 programs found none.

CompCert-style compilers prove the compiler correct. Kursal re-checks the compiler's output every time, closer to translation validation, and makes no claim of a proof. A successful check means the program obeys KURS's rules. `unsafe` operations still depend on their stated contracts.

Next: the [compiler page](/compiler/) describes each stage, and the [walkthroughs](/walkthroughs/) apply all of this to real programs.
