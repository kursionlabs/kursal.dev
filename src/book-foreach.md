+++
layout = "page.html"
section = "book"
title = "foreach traversal"
eyebrow = "Book · Part 2 · Chapter 17"
intro = "Write code once that visits every field of a struct or element of a tuple. Advanced, and the chapter most likely to change."
permalink = "/book/foreach/"
+++

`foreach` is not a loop. It is a **compile-time expansion over a shape**: the compiler visits each component of a struct, tuple or array, runs the body once for each, and assembles the results into a value of the same shape. It is what a library uses to write "do this to every field" without reflection, including for data it has no names for.

This chapter is for library authors, and the rules are intricate. Expect them to change.

## Through a pointer

```kursal
use std::io::print_buffer;
use std::mem::alloca;

exposed struct Rec {
    a: u8,
    b: u32,
    c: u64,
}

// Through a pointer, a foreach computes each field's address and reads
// nothing. The result has one component per field of Rec.
fn addresses(p: *Rec) -> foreach *F of *Rec => usize {
    foreach f of p {
        unsafe (f as usize)
    }
}

// Generic over T: Exposed[*T] lets the traversal see T's shape.
forall T where Exposed[*T].
fn ones(p: *T) -> foreach *F of *T => u32 {
    foreach f of p {
        1u32
    }
}

fn main() {
    let p = unsafe alloca[Rec]();
    let base = unsafe (p as usize);
    let { a, b, c } = addresses(p);
    let { a: x, b: y, c: z } = ones(p);
    let n = x + y + z;
    print_buffer(f"{a - base} {b - base} {c - base} {n}\n");
}
```

```text
0 4 8 3
```

`foreach f of p` with `p: *Rec` runs the body once per field, handing it that field's pointer (`*F`). It reads nothing. The result type `foreach *F of *Rec => usize` says "one `usize` per component of `*Rec`", and the value is destructured by field name. The offsets 0, 4 and 8 are what this program printed, and the book makes no promise about field order or layout.

The generic `ones` needs the premise `Exposed[*T]`, which says the traversal may see `T`'s shape. Chapter 11 described shapes. A restricted type never satisfies it outside its own scope, and an enum never does. Without the premise the compiler rejects the traversal and says what to write:

```text
lib.kur:21:5: the shape of *T is not visible here: write `where Exposed[*T]`, or expose its declaration to this module
  21 |     foreach f of p {
     |     ^
```

## By value

By value, the body receives each component once, and the result is a value of a `foreach` type over the same source. Linear components are handed on exactly once:

```kursal
use std::io::print_buffer;

exposed struct Token! {
    n: u32,
}

// By value, a foreach gives the body each component once; the result is a
// value of a foreach type over the same source.
fn tag(x: Token!, y: Token!) -> foreach F of (Token!, Token!) => (F, u32) {
    foreach t of (x, y) { (t, 10u32) }
}

fn main() {
    let tagged = tag(Token!.{ n: 1 }, Token!.{ n: 2 });
    // A foreach over a value of a foreach type maps it, component by
    // component. The body is checked for any F, so it hands F on.
    let swapped = foreach p of tagged {
        let (t, w) = p;
        (w + 1, t)
    };
    let (first, second) = swapped;
    let (w1, t1) = first;
    let (w2, t2) = second;
    let { n: n1 } = t1;
    let { n: n2 } = t2;
    print_buffer(f"{w1} {n1} {w2} {n2}\n");
}
```

```text
11 1 11 2
```

The second `foreach` maps `tagged`, of type `foreach F of (Token!, Token!) => (F, u32)`, into `foreach F of (Token!, Token!) => (u32, F)`. The body is written once and checked once for *any* component type `F`, which might be linear, so it cannot drop its component. A body that replaces the component with `1u32` and discards `t` is rejected as leaving a linear value unconsumed. The repository's fuller version is [`examples/foreach_map`](https://github.com/kursionlabs/kursal/tree/main/examples/foreach_map).

## The rules

- **A `foreach` type is a type like any other.** It can be a parameter or result, a field, an array element, a pointee or a type argument. A declaration that holds a `foreach` over a type parameter is linear, because the parameter might be, so it needs a `!` in its name. A traversal cannot take a `foreach` type as its source: the compiler says `a foreach source cannot be a foreach type`.
- **`*F` binds each component's pointee**, so the source has to be written with pointer components: `*T`, or a tuple, struct or array of pointers. The compiler checks this where the type is written:

  ```kursal
  // `*F` names each component's pointee, but Rec's components are not pointers.
  fn sizes(r: Rec) -> foreach *F of Rec => usize {
      foreach f of r {
          0usize
      }
  }
  ```

  ```text
  lib.kur:8:21: foreach *F needs a source written with pointer components
    8 | fn sizes(r: Rec) -> foreach *F of Rec => usize {
      |                     ^
  ```
- **A traversal through a pointer to a sum is rejected.** Components of `*Option[u8]` depend on which variant is stored there, and only a read could find out. `foreach x of p` with `p: *Option[u8]` is rejected with `a foreach source cannot be a pointer to a sum`. Writing the type `foreach y of *E => u8` over an enum `E` is fine. It names one row for the pointer itself, and nothing is read through it.
- **In a written type, `foreach F of *P => B` is one row**, with `F` the pointer itself. Only the pointer pattern, `foreach *F of *P => B`, gives one row per pointee component. A traversal `foreach x of p` over a pointer value still goes through the pointer.
- **`sizeof` of a `foreach` type needs its source exposed**: `sizeof[foreach F of T => u8]` needs `where Exposed[T]`.
- **Generic traversal needs `Exposed[*T]`**, and the body is checked once for every `T`, not again where a function is called.
- **Through a pointer, `foreach` computes addresses only.** Anything done with them, a read or a cast, is its own unsafe operation, as `unsafe (f as usize)` is above.
- A closure body or a `foreach` body cannot mention a brand that its own block opened (chapter 13).

## Check by hand

The source is written with pointer components wherever the body uses `*F`. Every component that reaches the body is handed on or consumed.

Next: [Concurrency →](/book/concurrency/)
