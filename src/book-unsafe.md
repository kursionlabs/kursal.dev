+++
layout = "page.html"
section = "book"
title = "Unsafe and raw pointers"
eyebrow = "Book · Part 2 · Chapter 15"
intro = "unsafe marks one operation at a time, and each one carries an obligation you state yourself."
permalink = "/book/unsafe/"
+++

Everything so far has been checked. A library like the arena in chapter 14 sits on top of memory the checker cannot reason about, and that memory has to be reached somehow. `unsafe` is how. It does not turn checking off. Linearity, places and brands are still checked inside it. It marks the specific operations whose correctness the compiler cannot see.

## One operation at a time

There are no unsafe blocks. `unsafe` prefixes a single operation:

```kursal
use std::io::print_buffer;
use std::mem::alloca;

exposed struct Counter {
    n: u32,
}

fn tick(&c: Counter) -> u32 {
    c.n = c.n + 1;
    c.n
}

// Caller: `p` points at a live, initialized u32 that nothing else is
// using for the duration of the call.
unsafe fn double_at(p: *u32) {
    let v = unsafe *p;          // a read through a pointer is one unsafe operation
    unsafe *p = v * 2;          // so is a write
}

fn main() {
    // Room for a u32 in this function's frame; its contents start undefined.
    let p = unsafe alloca[u32]();
    unsafe *p = 21;
    unsafe double_at(p);        // calling an unsafe fn is an unsafe operation
    let x = unsafe *p;

    // A pointer's target can be lent to a place parameter.
    let c = unsafe alloca[Counter]();
    unsafe *c = Counter.{ n: 0 };
    let t = tick(unsafe &*c);
    let addr = unsafe (p as usize);   // a pointer cast is unsafe too
    let nonzero = addr != 0;
    print_buffer(f"{x} {t} {nonzero}\n");
}
```

```text
42 1 true
```

`*T` is a raw pointer. `*p` reads through it and `*p = v` writes through it, and each is an unsafe operation. These are unsafe operations:

- calling an `unsafe fn` or an `extern` function (chapter 16)
- reading or writing through `*T`
- `alloca`, which makes room in the current function's frame
- a cast to or from a pointer, or any cast that reinterprets bits
- `unsafe static_brand()`
- atomic operations, volatile accesses and fences
- lending a pointer's target, `f(unsafe &*p)`

A safe function may contain unsafe operations. Nothing in its signature says so, and that is the point of wrapping them once, as in chapter 14. Leave `unsafe` off an operation that needs it and the compiler stops you. Calling an `unsafe fn` plainly gives `calling an unsafe function requires unsafe authorization`.

A pointer's target can be lent to a place parameter, as `tick(unsafe &*c)` does, or to a `&self` method through the path form `Counter::tick(unsafe &*c)`. The dotted form on a lent pointer target, `(unsafe &*p).tick()`, is not accepted. Use the path form.

## unsafe fn

`unsafe fn` says "the caller has an obligation", and calling it is itself an unsafe operation. The compiler checks that each call is marked. It does not check the obligation. Write it as a comment beside the function, the way std does with a `// Caller:` line, so the reader of the call site knows what they are promising.

An `unsafe fn` is a value too. Naming one is safe and calling it is not:

```kursal
use std::io::print_buffer;

unsafe fn halve(x: u32) -> u32 {
    x / 2
}

// A value of an unsafe fn type; calling it is an unsafe operation.
fn apply(f: unsafe fn(u32) -> u32, x: u32) -> u32 {
    unsafe f(x)
}

fn main() {
    let a = apply(halve, 10);
    print_buffer(f"{a}\n");
}
```

```text
5
```

`fn(..)` and `unsafe fn(..)` are different types, and neither converts into the other. Passing `halve` where a safe `fn(u32) -> u32` is expected is rejected:

```text
lib.kur:10:6: type mismatch: unsafe fn(u32) -> u32 and fn(u32) -> u32
```

and so is passing a safe function where an `unsafe fn` type is expected.

## Sizes, zero-size types and NonNull

```kursal
use std::io::print_buffer;
use std::mem::{alloca, sizeof};
use std::ptr::NonNull;
use std::option::Option;
use std::cap::Brand;

exposed struct Marker {}

forall 'k.
exposed struct Tagged {
    value: u32,
    marker: Brand['k],
    unit: (),
    nothing: Marker,
}

fn main() {
    // Zero-size types take no bytes, and neither do they in a struct.
    let a = sizeof[()]();
    let b = sizeof[Marker]();
    let c = sizeof[Tagged['static]]();
    // NonNull is never null, so Option of one needs no extra word.
    let d = sizeof[*u64]();
    let e = sizeof[Option[NonNull[u64]]]();

    let p = unsafe alloca[u64]();
    unsafe *p = 9;
    let n = match NonNull::new(p) {      // checked: None for a null pointer
        Some(nn) => {
            let raw = nn.as_ptr();       // back to *T is safe
            unsafe *raw
        },
        None => 0,
    };
    print_buffer(f"{a} {b} {c} {d} {e} {n}\n");
}
```

```text
0 0 4 8 8 9
```

`()`, an empty struct and a `Brand` take no bytes, and `Tagged['static]` is the size of its one `u32`. A `NonNull[T]` is a pointer that is never null, so `Option[NonNull[u64]]` is one pointer wide.

A raw read, write or `alloca` at a zero-size type is rejected, because there are no bytes to read. In generic code, a raw access at a type parameter needs the premise `Sized[T]`:

```kursal
forall T.
unsafe fn put(p: *T, v: T) {
    unsafe *p = v;
}
```

```text
lib.kur:3:5: a raw read, write or alloca at T needs Sized[T]
  3 |     unsafe *p = v;
    |     ^
```

## Casts

`as` between numbers is always safe and never needs `unsafe` (chapter 2). The other casts, which reinterpret bits, need it:

- a pointer to or from a pointer, a `NonNull` or an integer
- an *integer* to a plain struct of the same size: `unsafe (5u64 as Pair)` for a `Pair` of two `u32` fields compiles and gives a `Pair` whose first field is 5.

A pointer does not cast straight to a struct. The compiler says an unsafe cast converts a pointer only to or from a pointer or an integer.

What no cast can do is produce or take apart a package, a brand witness, a function value, a transform, a value of a type parameter or `Never`, nor a value whose layout holds an enum or `NonNull`. So casts cannot conjure a brand witness:

```kursal
forall 'k.
fn forge(n: u8) -> Key['k] {
    unsafe (n as Key['k])
}
```

```text
lib.kur:10:13: an unsafe cast cannot produce or take apart a package, a brand witness, a function value, a transform, a value of a type parameter or Never
  10 |     unsafe (n as Key['k])
     |             ^
```

Everything else about a cast is up to you: it reinterprets bytes, and you promise that the result is a valid value of the new type.

## Atomics, fences and volatile

Atomic operations are methods on `*T`, each one an unsafe operation. The ordering is written as a literal `Ordering::` variant. It cannot be passed in a variable:

```kursal
use std::io::print_buffer;
use std::mem::alloca;
use std::atomic::{Ordering, fence};

fn main() {
    let w = unsafe alloca[u32]();
    unsafe *w = 0;
    // Atomic operations are methods of *T; each is one unsafe operation,
    // and its ordering is written out as a literal variant.
    let before = unsafe w.fetch_add(5u32, Ordering::Relaxed);
    let (seen, won) = unsafe w.compare_exchange(5u32, 7u32, Ordering::AcqRel, Ordering::Acquire);
    let set = unsafe w.atomic_store(8u32, Ordering::Release);
    unsafe fence(Ordering::SeqCst);
    let now = unsafe w.atomic_load(Ordering::Acquire);
    // Volatile access: never removed or merged by the C compiler.
    let stored = unsafe w.store_volatile(9u32);
    let v = unsafe w.load_volatile();
    print_buffer(f"{before} {seen} {won} {now} {v}\n");
}
```

```text
0 5 true 8 9
```

This program runs on one thread on purpose, to show the operations. The repository's [`examples/atomics`](https://github.com/kursionlabs/kursal/tree/main/examples/atomics) is the two-thread program, with its reasoning. An ordering has to fit the operation: a load rejects `Release`, with `atomic load does not support ordering release`. Volatile is for memory the C compiler must not remove or merge accesses to, and not a way to share data between threads.

## The contract

The standard library writes down what each unsafe operation promises in [`lib/std/CONTRACTS.md`](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md). In short:

- A pointer you read or write points at live, initialized memory of the right type and alignment.
- Nothing frees memory that another owner still holds, and no capability (an `Exclusive!`, a `Ref` under a live brand) is forged over memory something else owns.
- `f(unsafe &*p)` also needs exclusivity: from the call until it returns, nothing reaches that memory except through the lent place. That means no other pointer, no `Ref`, no capability and no thread.
- A value holding a brand witness is read only from memory that a value of that type was moved into.
- A `NonNull` is never null.
- An extern function returns normally: no `longjmp`, and no exception unwinding through kursal frames. This is stated and not checked.

## What this does and does not give you

kursal gives you tools, namely linearity, places, brands and capabilities, for building abstractions that are safe to use. The checker holds safe code to the rules in this book. Unsafe code carries obligations that are stated and not checked, and a mistake in one is not caught by anything. The Lean proof mentioned in the [guide](/guide/kurs/) covers a restricted single-threaded core, with no atomics, no volatile, no `NonNull` and no extern callbacks, so everything in this chapter after `unsafe fn` values is outside it. The compilers and the checker are not proven either.

The discipline is to put each obligation in one place: next to the `unsafe` operation, in a comment a reviewer can hold the code to. Then wrap it, so that safe callers cannot get it wrong.

## Check by hand

Each `unsafe` site has its obligation written beside it. Each `unsafe fn` has a `Caller:` comment. Each atomic ordering pairs up, with `Release` on the writing side and `Acquire` on the reading side.

Next: [Calling C with extern →](/book/extern/)
