+++
layout = "page.html"
section = "book"
title = "Generics and traits"
eyebrow = "Book · Part 1 · Chapter 7"
intro = "forall for code that works on many types, traits for what those types can do. Every call is resolved from what you can see."
permalink = "/book/traits/"
+++

## forall

A generic item starts with `forall`, which introduces its type parameters, then the item:

```kursal
use std::io::print_buffer;

forall T.
struct Pair {
    first: T,
    second: T,
}

forall T.
fn swap(p: Pair[T]) -> Pair[T] {
    let { first, second } = p;
    Pair.{ first: second, second: first }
}

// Using a value twice needs `Copy[T]`.
forall T where Copy[T].
fn dup(x: T) -> Pair[T] {
    Pair.{ first: x, second: x }
}

fn main() {
    let p = swap(Pair.{ first: 1u32, second: 2u32 });
    let d = dup(7u8);
    print_buffer(f"{p.first} {p.second} {d.second}\n");
}
```

```text
2 1 7
```

Type arguments go in square brackets, `Pair[T]`, and are usually inferred at a call. The same `forall` prefix works on `struct`, `enum`, `tuple`, `trait`, `instance` and `impl`.

### A type parameter might be linear

A type parameter can stand for a linear type, so inside a generic function the compiler cannot assume it may copy a value. `dup` is allowed to use `x` twice because it says `where Copy[T]`. Without that line it fails:

```kursal
forall T.
fn dup(x: T) -> (T, T) {
    (x, x)
}
```

```text
lib.kur:3:9: demo::dup: value 'x' has been moved or is only partially available
  3 |     (x, x)
    |         ^
```

Calling `dup` with a linear argument then fails at the call, because the argument does not satisfy the premise: `type argument must satisfy Copy`. Dropping a value of type `T` needs `Copy[T]` too. That is the rule that makes generic code safe for linear types without a separate set of containers.

## Traits

A trait names a set of functions. An instance says how one type provides them.

```kursal
forall Self.
trait Area {
    fn area(self: Self) -> u32;
}

struct Square { side: u32 }
struct Rect { w: u32, h: u32 }

instance Area[Square] {
    fn area(self: Square) -> u32 { self.side * self.side }
}

instance Area[Rect] {
    fn area(self: Rect) -> u32 { self.w * self.h }
}

forall S where Area[S].
fn total(a: S, b: S) -> u32 {
    a.area() + b.area()
}
```

The trait's parameters are introduced with `forall` like any generic item (`Self` is only a conventional name). `where Area[S]` is a **premise**: `total` works for every `S` that has an `Area` instance, and the caller has to be able to show one. A method of a trait with one input is called with a dot, `a.area()`. Calling `total(5u32, 6u32)` fails with `no instance of Area[u32]`.

Dispatch is static. The compiler picks the instance at each call and there are no trait objects or default methods.

### Several parameters

A trait can have more than one parameter. A dot call can only pick an instance from a single input, so for a trait with several, name the trait at the call:

```kursal
forall From, To.
trait Convert {
    fn convert(x: From) -> To;
}

instance Convert[u32, u64] {
    fn convert(x: u32) -> u64 { x as u64 }
}

let c = Convert[u32, u64]::convert(9);
```

A parameter can also be **determined** by the others. `Self -> Unit` below says the measured type fixes the unit, so a call needs only `Self`:

```kursal
forall Self -> Unit.
trait Measure {
    fn measure(self: Self) -> Unit;
}

struct Rope { cm: u32 }
struct Jug { ml: u64 }

instance Measure[Rope -> u32] {
    fn measure(self: Rope) -> u32 { self.cm }
}

instance Measure[Jug -> u64] {
    fn measure(self: Jug) -> u64 { self.ml }
}
```

`Rope.{ cm: 150 }.measure()` is a `u32` and `Jug.{ ml: 2000 }.measure()` is a `u64`. This is how a trait can say "the item type of this iterator", which chapter 10 uses.

### Methods for every type that qualifies

An `impl` can itself be generic. This adds `doubled` to every type that measures in `u32`:

```kursal
forall M where Measure[M -> u32].
impl M {
    fn doubled(self) -> u32 { self.measure() * 2 }
}
```

`Rope.{ cm: 21 }.doubled()` is `42`.

You can always write the trait's name instead of a dot: `Measure::measure(Rope.{ cm: 5 })`.

## Only what is imported

A method call through a trait works when the trait is visible where you call it. If the trait lives in another module, import it:

```kursal
use std::io::print_buffer;
use package::geo::Square;

fn main() {
    let s = Square.{ side: 3 };
    print_buffer(f"{s.area()}\n");
}
```

```text
lib.kur:6:21: Square has no method area
  6 |     print_buffer(f"{s.area()}\n");
    |                     ^
```

`Area` is declared next to `Square` in `geo`, but it was not imported here. Write `use package::geo::{Square, Area};` and the call works. Calling it by its full path, `package::geo::Area::area(s)`, also works without the import. The point is that you can decide what `s.area()` means by reading the imports of the file in front of you.

## One instance per case

Two instances of a trait may not overlap, anywhere in the program. There is no specialization, so a general instance and a specific one cannot coexist:

```kursal
forall Self.
trait Describe {
    fn code(self: Self) -> u32;
}

forall T.
instance Describe[T] {
    fn code(self: T) -> u32 { 0 }
}

instance Describe[u32] {
    fn code(self: u32) -> u32 { self }
}
```

```text
lib.kur:11:1: overlapping instances of Describe: (u32) and (T)
  11 | instance Describe[u32] {
     | ^
```

## Check by hand

For each call of a generic function, its `where` premises are either your own premises or have an instance you can find. For each dotted trait call, the trait is imported, and you can name the one instance it picks.

Next: [Option, Result and ? →](/book/option/)
