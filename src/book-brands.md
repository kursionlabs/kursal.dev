+++
layout = "page.html"
section = "book"
title = "Brands and existentials"
eyebrow = "Book · Part 2 · Chapter 13"
intro = "A brand is a compile-time name that ties values to one domain. It grants nothing by itself, and a fresh one can only be made sealed."
permalink = "/book/brands/"
+++

Linear types say a value is used once. Places say who may change it. Neither says that two values **belong together**: that this ticket is for that counter, or this reference points into that arena. A **brand** is how a type says it. It is a name that exists only at compile time, written with a tick, `'k`, and carried as a type parameter.

## A ticket for one counter

```kursal
use std::io::print_buffer;
use std::cap::{Brand, fresh};
use std::slice::Slice;

// A ticket for one counter. The brand ties each ticket to its counter.
forall 'k.
exposed struct Ticket {
    marker: Brand['k],
}

forall 'k.
exposed struct Counter! {
    n: u32,
    marker: Brand['k],
}

// A new counter and its ticket, under a brand no other value has.
fn open_counter() -> exists 'k. (Counter!['k], Ticket['k]) {
    let exists 'k. b: Brand['k] = fresh();
    pack 'k. (Counter!.{ n: 0, marker: b }, Ticket.{ marker: b })
}

// Accepts only a ticket of this counter's brand.
forall 'k.
fn punch(&c: Counter!['k], t: Ticket['k]) -> u32 {
    c.n = c.n + 1;
    c.n
}

forall 'k.
fn close(c: Counter!['k]) -> u32 {
    let { n, marker } = c;
    n
}

// A string literal is a slice under the brand 'static.
fn greeting() -> Slice[u8, 'static] {
    "hi"
}

fn main() {
    var exists 'a. (c, ticket) = open_counter();
    punch(&c, ticket);
    punch(&c, ticket);   // a Ticket is Copy; it names the brand, grants nothing else
    let n = close(c);
    let g = greeting();
    print_buffer(f"{n} {g.len()}\n");
}
```

```text
2 2
```

The pieces:

- `forall 'k.` introduces a brand parameter, just as `forall T.` introduces a type parameter. Brand arguments go in the same square brackets as type arguments: `Counter!['k]`.
- `Brand['k]` is the brand's **witness**, a value that is `Copy`, takes no bytes, and grants nothing by itself. A struct that holds one is how a value carries the brand.
- `fresh()` makes a new brand, and it comes **sealed**: its type is `exists 'k. Brand['k]`.
- `exists 'k. T` is a type for "some brand, which I won't name". `pack 'k. value` builds one. `let exists 'k. b = fresh();` opens it under a name of your own, here inside `open_counter`, and `var exists 'a. (c, ticket) = open_counter();` does the same in `main`. It is a `var exists` because `c` is lent afterwards.

A brand names a domain, such as a region of memory or another resource, so the checker can tell two values apart. It says nothing about how long anything lives.

String literals use the brand `'static`, which is why `Slice[u8, 'static]` has appeared since chapter 2. Its witness is `unsafe static_brand()`, with the obligation that what it brands lives forever.

## Two brands don't mix

Each call of `open_counter` gives a counter and ticket under their own brand. A ticket from one counter cannot punch another:

```kursal
fn main() {
    var exists 'a. (c1, t1) = open_counter();
    var exists 'b. (c2, t2) = open_counter();
    punch(&c1, t2);   // t2 is a ticket of c2's brand
    let n = close(c1) + close(c2);
}
```

```text
lib.kur:38:5: brand mismatch: Ticket['b] and Ticket['a]; 'b was opened at 37:5, 'a at 36:5
  38 |     punch(&c1, t2);   // t2 is a ticket of c2's brand
     |     ^
```

(The numbers count the declarations above `greeting`, which precede this `main`.) The message says where each brand was opened. That is why every opening has to use a new name, and why you cannot open a second brand called `'a` while the first is in scope.

A brand also cannot leave the place it was opened. If `open_counter` is called inside a function and the ticket is returned, there is nothing in the function's signature to name its brand, and the compiler says `brand 'k is not in scope`. If the function is generic over a brand `'k`, and the ticket came from a brand opened inside, the two differ and the result is a brand mismatch.

## A brand-parameterised trait

A trait can take a brand like any other parameter. This one records a reading into a sink of the same brand:

```kursal
use std::io::print_buffer;
use std::cap::{Brand, fresh};

forall 'k.
exposed struct Meter! {
    total: u32,
    marker: Brand['k],
}

forall 'k.
exposed struct Reading {
    value: u32,
    marker: Brand['k],
}

// A trait over a type and a brand: a value is recorded into a sink of the
// same brand.
forall S, 'k.
trait Record {
    fn record(&sink: S, r: Reading['k]) -> ();
}

forall 'k.
instance Record[Meter!['k], 'k] {
    fn record(&sink: Meter!['k], r: Reading['k]) -> () {
        sink.total = sink.total + r.value;
    }
}

// Generic over any sink that records readings of brand 'k.
forall S, 'k where Record[S, 'k].
fn record_all(&sink: S, a: Reading['k], b: Reading['k]) -> () {
    Record::record(&sink, a);
    Record::record(&sink, b);
}

fn main() {
    let exists 'k. b: Brand['k] = fresh();
    var m = Meter!.{ total: 0, marker: b };
    record_all(&m, Reading.{ value: 3, marker: b }, Reading.{ value: 4, marker: b });
    let { total, marker } = m;
    print_buffer(f"{total}\n");
}
```

```text
7
```

## Rules for names

- Every opening (`let exists` or `var exists`) and every `exists` binder is a **new** name: never `'static`, a brand parameter, an earlier opening still in scope, or an enclosing binder. One name then means one brand inside a function, which is what lets the messages say where each was opened.
- `exists` appears only in a result type.
- A function value's type (`fn(..) -> R`) quantifies no brands. Using a function as a value fixes its brands once.
- **A closure cannot mention a brand that its own block opened.** The closure may run later, or on another thread, and nothing in its type could say which brand it means:

```kursal
use std::cap::{Brand, fresh};

forall 'k.
fn call(f: closure() -> Brand['k]) -> Brand['k] {
    f()
}

fn main() -> i32 {
    let exists 'k. b: Brand['k] = fresh();
    let c = call(|| b);
    0
}
```

```text
lib.kur:10:18: a closure or foreach body cannot mention the block-local brand 'k
  10 |     let c = call(|| b);
     |                  ^
```

The way round it is a function generic over the brand. `call` above is generic over `'k`, so a closure inside a function like it may mention `'k` freely. Chapter 18 uses exactly this to give a thread a capability.

## What a brand is not

A brand is a compile-time name and not a runtime tag. It does not prevent aliasing by itself, and it is not a lifetime. It only makes the domains of two values **provably equal or provably unrelated**. What a brand lets someone *do* comes from a linear value that carries it, which is the next chapter.

## Check by hand

Each function that returns an `exists` builds it with `pack` from a brand minted inside it. Every opening uses a name that is not yet in scope.

Next: [Capabilities in practice →](/book/capabilities/)
