+++
layout = "page.html"
section = "guide"
title = "unsafe as a stated contract"
eyebrow = "Guide · 6 of 8"
intro = "Call C's malloc and free, read raw memory, and say out loud what you are promising."
permalink = "/guide/unsafe/"
+++

Everything above has to bottom out somewhere. At the bottom there are raw pointers, calls into C and operations the checker cannot reason about. kursal does not hide them. It makes each one carry the word `unsafe` at the place it happens, and asks you to write down what you are promising when you do.

This is adapted from `examples/heap`, with an `unsafe fn` and a `main` added:

```kursal
use std::io::print_buffer;
use std::option::Option;
use std::ptr::is_null;

extern "C" fn malloc(size: usize) -> *u8;
extern "C" fn free(p: *u8);

// Stores `v` in a fresh heap block and reads it back.
fn round_trip(v: u32) -> Option[u32] {
    let raw = unsafe malloc(4usize);
    if is_null(raw) {
        return Option::None;
    }
    // `raw` is a live block of 4 bytes, aligned for every type.
    let p = unsafe (raw as *u32);
    unsafe *p = v;
    let read = unsafe read_u32(p);
    // Nothing reads `p` again, and `raw` came from `malloc`.
    unsafe free(raw);
    Option::Some.(read)
}

// The caller vouches that `p` points at a live, initialized `u32`.
unsafe fn read_u32(p: *u32) -> u32 {
    unsafe *p
}

fn main() {
    match round_trip(42) {
        Some(v) => print_buffer(f"read back {v}\n"),
        None => print_buffer(f"out of memory\n"),
    };
}
```

It prints `read back 42`.

The comments are part of the idea. Each `unsafe` marks one operation, and the sentence next to it says why this one is fine: the block is live, nothing reads the pointer again, the memory came from `malloc`. Where the promise is made by a caller instead, `unsafe fn read_u32` says so in its signature, and its comment states what the caller vouches for.

## What the checker enforces

That the marker is there. Without it:

```
lib.kur:17:16: calling an unsafe function needs unsafe
lib.kur:17:16: reading through a raw pointer needs unsafe
```

The first is for calling `read_u32(p)` bare, and the second for dereferencing `*p` bare. Each names the operation that needs the marker. Calling `free(raw)` without `unsafe` gets the first message again. The repository's `examples/bad/close_by_number.kur`, `write_by_number.kur` and `safe_adopt.kur` all report `calling an unsafe function needs unsafe`.

## What it does not

Nothing checks that a contract is kept. [`lib/std/CONTRACTS.md`](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) says it itself: a signature classification is not a proof of its implementation. `unsafe` is a way to **find** the places that need a human, and a place to **write down** what that human must be sure of.

- `unsafe` marks one operation. There are no `unsafe { }` blocks.
- Inside an `unsafe fn`, the operations need no marker of their own, so keep those bodies small.
- Numeric `as` is safe. Pointer casts are not.
- kursal is not memory safe by default. It is a language in which you can *build* a safe abstraction over this, which is the next step.

## Check it in your head

Every operation that can break memory carries `unsafe` at its own site, or sits in an `unsafe fn`: a raw read or write, a pointer cast, an extern call, an unsafe function call, atomics, volatile access, alloca. That list of sites is what a reviewer audits, and it is a list you can read off the page.

## What this leaves open

Every caller of `round_trip` has the contract handed to it by hand, unless someone writes it once. How do you keep a contract once, for every caller?

Next: [wrap it in your own resource →](/guide/resource/)

Examples: [`examples/heap`](https://github.com/kursionlabs/kursal/tree/main/examples/heap), [`examples/atomics`](https://github.com/kursionlabs/kursal/tree/main/examples/atomics) and [`examples/host`](https://github.com/kursionlabs/kursal/tree/main/examples/host).
