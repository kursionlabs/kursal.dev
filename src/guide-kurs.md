+++
layout = "page.html"
section = "guide"
title = "The checker you can run in your head"
eyebrow = "Guide · 8 of 8"
intro = "Every feature so far lowers to a small core language. Its checker looks at one block at a time."
permalink = "/guide/kurs/"
+++

Everything in the last seven steps is surface language. The compiler lowers it to **KURS**, a small core, and a separate checker for that core decides whether the program is accepted. KURS came first: it was designed, and programs were written in it by hand, before the surface language existed. kursal was built on top of it.

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
    var h = h;
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
        &h#9: step8::Handle!;
    }
    entry {
        %v2 = store &h#7, %a_h;
        %v3 = store &first#8, %a_first;
        %v4 = load &h#7;
        %v5 = store &h#9, %v4;
        %v6 = load &first#8;
        branch %v6, b7(), b8();
    }
    block b7() {
        state {
            empty &h#7;
        }
        %v9 = load &h#9;
        %v10 = call step8::close(%v9);
        jump join16(%v10);
    }
    block b8() {
        state {
            empty &h#7;
        }
        %v11 = const u64, 1;
        %v12 = call step8::advance(&h#9, %v11);
        %v13 = load &h#9;
        %v14 = call step8::close(%v13);
        jump join16(%v14);
    }
    block join16(%r15: u64) {
        state {
            empty &h#7;
            empty &h#9;
        }
        return %r15;
    }
}
```

Read it as a flowchart. A function is a set of blocks, and the blocks are connected by `branch` and `jump`. Linearity shows up as the handle being `load`ed out of its place; loading a linear value empties the place (loading a copyable one does not). `var h = h;` moves the parameter out of `h#7` into a place of its own, `h#9`, which `advance` can be lent. At `join16`, both paths have to agree that `h#7` and `h#9` are empty, and the block's header says so: `state { empty &h#7; empty &h#9; }`.

That header is what the checker uses. **A block's header is its whole contract.** To check a block you need its instructions, its own header, the signatures of the functions it calls and the headers of the blocks it jumps to. Not the rest of the function.

## Break it by hand

Each of these edits the KURS and runs `kursal check`, which exits 1.

- In `b8`, replace the load and the `close` call with `(= %v14 (const u64 0))`. The handle is left in `h#9` while `join16` says it is empty: `step8::pick/b8: holds_linear_contents_assumes`.
- Delete `&h#9` from `join16`'s `(empty &h#7 &h#9)`. Now `join16` assumes `h#9` still holds a handle, but `b7` jumps there after loading it out: `step8::pick/b7: empty_assumes_full`.
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

- [Quick start](/start/) to install it and build a first program.
- [The language tour](/tour/) for the syntax in one pass.
- [The compiler](/compiler/) for the two implementations and the bootstrap.
- The repository's `reference-compiler/README.md` has the sections "KURS names" and "A worked example: Counter", and `examples/counter/generated/program.kurs` is a ready-made KURS program. `compiler/README.md` has "The language, for a compiler author".
