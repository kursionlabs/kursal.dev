+++
layout = "page.html"
title = "The checker you can run in your head"
eyebrow = "Guide · 8 of 8"
intro = "Every feature so far lowers to a small core language. Its checker looks at one block at a time."
permalink = "/guide/kurs/"
+++

Everything in the last seven steps is surface language. The compiler lowers it to **KURS**, a small core, and a separate checker for that core decides whether the program is accepted. KURS came first: it was designed, and programs were written in it by hand, before the surface language existed. Kursal was built on top of it.

Here is a library with no `std`:

```kursal
struct Handle! {
    id: u64,
    pos: u64,
}

fn close(h: Handle!) -> u64 {
    let { id, pos } = h;
    pos
}

fn advance(&h: Handle!, n: u64) {
    let { id, pos } = h;
    h = Handle!.{ id, pos: pos + n };
}

fn pick(h: Handle!, first: bool) -> u64 {
    if first {
        close(h)
    } else {
        advance(&h, 1);
        close(h)
    }
}
```

`kursal lower` turns it into KURS and `kursal check` checks it. The check exits 0 and prints nothing. `kursal readable` prints the KURS in a form you can read. An excerpt of `pick`:

```
fn step8::pick(%a_h: step8::Handle!, %a_first: bool) -> u64 {
    locals {
        &h#7: step8::Handle!;
        &first#8: bool;
    }
    entry {
        %v2 = store &h#7, %a_h;
        %v3 = store &first#8, %a_first;
        %v4 = load &first#8;
        branch %v4, b5(), b6();
    }
    block b5() {
        %v7 = load &h#7;
        %v8 = call step8::close(%v7);
        jump join14(%v8);
    }
    block b6() {
        %v9 = const u64, 1;
        %v10 = call step8::advance(&h#7, %v9);
        %v11 = load &h#7;
        %v12 = call step8::close(%v11);
        jump join14(%v12);
    }
    block join14(%r13: u64) {
        state {
            empty &h#7;
        }
        return %r13;
    }
}
```

Read it as a flowchart. A function is a set of blocks, and the blocks are connected by `branch` and `jump`. Linearity shows up as the handle being `load`ed out of its place; loading a linear value empties the place (loading a copyable one does not). At `join14`, both paths have to agree that `h#7` is empty, and the block's header says so: `state { empty &h#7; }`.

That header is what the checker uses. **A block's header is its whole contract.** To check a block you need its instructions, its own header, the signatures of the functions it calls and the headers of the blocks it jumps to. Not the rest of the function.

## Break it by hand

Each of these edits the KURS and runs `kursal check`, which exits 1.

- In `b6`, replace the load and the `close` call with `(= %v12 (const u64 0))`. The handle is left in `h#7` while `join14` says it is empty: `step8::pick/b6: holds_linear_contents_assumes`.
- Delete `(empty &h#7)` from `join14`. Now `join14` assumes `h#7` still holds a handle, but `b5` jumps there after loading it out: `step8::pick/b5: empty_assumes_full`.
- Delete `(store &h %v16)` from `advance`. The rebuilt handle `%v16` is never put back, so a linear value is created and never consumed: `step8::advance/entry: linear_value_never_consumed`.

These codes are terse because the checker is for a compiler to call. What a user sees are the front end's messages from the earlier steps. The point of this page is that each rule that produced those messages comes down to a check you can do on a short block of text.

## Check it in your head

Each linear value is consumed once. Every jump matches its target's empty-set exactly. Every place parameter is full at return. That is the linearity part of the checker, stated for one block at a time. The checker also checks types, brands, premises and `unsafe` authorization.

## What this does and doesn't claim

Be careful with the word "proven".

- The Lean development (`kursal-proof`) proves the soundness of the **design** of value-only KURS. It does not prove either compiler.
- Places, `NonNull`, atomics, volatile access and broader casts are implementation extensions outside the proven core. Translating place programs to value-only ones is planned, not proven.
- The fuzzer tests; it does not prove.
- Blocks can in principle be checked independently, but parallel checking is not implemented. And KURS grows roughly quadratically with the size of a function.

For the surface language, the same idea comes with limits. Place state flows through a function, so checking is per function, not per block. Trait instances are program-wide. And a type parameter hides linearity, as step 2 said. So a surface-language function takes more reading than a KURS block does. The core is what you can run in your head, and the surface is what was built on top of it.

## Where to go next

- [Get started](/start/) to install it and build a first program.
- [The language tour](/tour/) for the syntax in one pass.
- [The compiler](/compiler/) for the two implementations and the bootstrap.
- The repository's `reference-compiler/README.md` has the sections "KURS names" and "A worked example: Counter", and `examples/counter/generated/program.kurs` is a ready-made KURS program. `compiler/README.md` has "The language, for a compiler author".
