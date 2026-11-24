+++
layout = "page.html"
section = "guide"
title = "Looking without consuming"
eyebrow = "Guide · 3 of 8"
intro = "Ask a handle where it is, or move it along, without closing it."
permalink = "/guide/places/"
+++

A handle with a position needs to be asked where it is, and moved. With only what we have so far, every question hands the handle in and gets it back:

```kursal
fn tell_threaded(h: Handle!) -> (Handle!, u64) {
    let pos = h.pos;
    (h, pos)
}
```

and every call site threads it through, `let (h, before) = tell_threaded(h);`. That is correct, and it gets old quickly. The handle is only on loan, and the call should say so.

## A lend is a parameter mode

Write `&` before a parameter name and the caller lends its own value for the duration of the call:

```kursal
use std::io::print_buffer;

struct Handle! {
    id: u64,
    pos: u64,
}

fn open(id: u64) -> Handle! {
    Handle!.{ id, pos: 0 }
}

fn close(h: Handle!) -> u64 {
    let { id, pos } = h;
    pos
}

// Without places: take the handle, hand it back with the answer.
fn tell_threaded(h: Handle!) -> (Handle!, u64) {
    let pos = h.pos;
    (h, pos)
}

// With a place: `&h` lends the caller's handle for the call.
fn tell(&h: Handle!) -> u64 {
    h.pos
}

// The callee may take the value apart, as long as it puts one back.
fn advance(&h: Handle!, n: u64) {
    let { id, pos } = h;
    h = Handle!.{ id, pos: pos + n };
}

fn main() {
    let h = open(7);
    let (h, before) = tell_threaded(h);
    advance(&h, 5);
    advance(&h, 2);
    let after = tell(&h);
    let last = close(h);
    print_buffer(f"before {before}, after {after}, closed at {last}\n");
}
```

It prints `before 0, after 7, closed at 7`.

`tell` and `advance` never own the handle. `advance` may take it apart, as long as a value is back in the place before the function returns. The repository's `examples/at_sugar` states the relationship in a comment: `let x = mint(&t);` means `let (t, x) = mint(t);`. A lend is a handing back, written once, in the signature.

## What the checker refuses

A callee that does not restore the value:

```
lib.kur:9:5: s3a::steal: lent value 'h' must be restored before return
```

The same place lent twice in one call, as in `swap_pos(&h, &h)`:

```
lib.kur:15:5: s3b::main: 'h' overlaps another place the same call lends
```

Returning a lend is not possible. `-> &Handle!` is a syntax error. And `&x` is allowed only as a call argument, a receiver, or a match scrutinee, so `&x as *u32` is rejected too.

Lending a value that was already moved away fails as you would expect. `examples/bad/push_after_finish.kur` reports `value 'builder' has been moved and cannot be lent`.

## What `&` is not

`&` is a **parameter mode**, not a type. There is no reference type to store in a struct, return from a function, capture in a closure or take the address of. A lend lasts one call. That is why there are no lifetimes to talk about here, and why it is not a Rust-style borrow.

In the generated C, a lend is a pointer to the caller's storage (a zero-size one is passed as nothing). This guide makes no performance claim about it.

## Check it in your head

Read `f(&x)` as `x = f(x)`, with the result paired in. In the callee, the place holds a value at every return. No two lends in one call overlap. That is all you check per call.

## What this leaves open

A lend cannot outlive its call, so it cannot be stored. A structure whose parts point at each other, a graph, cannot be built out of lends.

Next: [pointers you can copy, and who may use them →](/guide/graph/)

Examples: [`examples/at_sugar`](https://github.com/kursionlabs/kursal/tree/main/examples/at_sugar), [`examples/stock`](https://github.com/kursionlabs/kursal/tree/main/examples/stock) and [`examples/shop`](https://github.com/kursionlabs/kursal/tree/main/examples/shop).
