+++
layout = "page.html"
title = "Linear types"
eyebrow = "Book · Part 1 · Chapter 6"
intro = "A type whose name ends in ! has to be used exactly once, on every path through the function."
permalink = "/book/linear/"
+++

The [quick guide](/guide/linear/) introduces linear types through a handle that has to be closed. This chapter is the reference: precisely what counts as a use, and the rules the checker applies.

## Declaring one

```kursal
// A ticket must be redeemed exactly once.
struct Ticket! {
    seat: u32,
}
```

The `!` is part of the name, everywhere the type is written: in its declaration, in a path, in a literal (`Ticket!.{ seat }`), in an import, and in an alias. Leave it off and you are naming a different thing: `unknown name Ticket; the linear type is Ticket!`.

A value of a linear type has to be **consumed** exactly once. These consume it:

- passing it by value to a function (including a method that takes `self`)
- returning it
- destructuring it with a pattern
- moving it into another value, such as a struct field or a closure capture

Reading a Copy field, as in `t.seat`, does not consume `t`.

## On every path

```kursal
use std::io::print_buffer;

// A ticket must be redeemed exactly once.
struct Ticket! {
    seat: u32,
}

fn issue(seat: u32) -> Ticket! {
    Ticket!.{ seat }
}

// Destructuring consumes the ticket.
fn redeem(t: Ticket!) -> u32 {
    let { seat } = t;
    seat
}

// Each branch consumes `t`.
fn redeem_or_refund(t: Ticket!, refund: bool) -> u32 {
    if refund {
        let { seat: _ } = t;
        0
    } else {
        redeem(t)
    }
}

// An early return consumes `t` before leaving.
fn first_row_only(t: Ticket!) -> u32 {
    if t.seat > 10 {
        redeem(t);
        return 0;
    }
    redeem(t)
}

fn main() {
    // A loop that consumes `current` puts a fresh one back before it repeats.
    var current = issue(1);
    var total = 0u32;
    var i = 0u32;
    while i < 3 {
        total = total + redeem(current);
        current = issue(total + 1);
        i = i + 1;
    }
    total = total + redeem_or_refund(current, false);
    total = total + first_row_only(issue(4)) + first_row_only(issue(40));
    print_buffer(f"{total}\n");
}
```

```text
19
```

Four rules show up here.

- **Branches agree.** Both arms of `redeem_or_refund` consume `t`. If one did not, the compiler rejects the function.
- **Every `return` leaves nothing behind.** `first_row_only` redeems `t` before it returns early.
- **A loop leaves what it found.** The body consumes `current`, so it puts a new ticket back before the loop goes round again.
- **Destructuring uses it up.** `let { seat } = t;` consumes `t`. `let { seat: _ } = t;` consumes it and throws the field away.

## The mistakes it catches

Each of these starts from the same declarations of `Ticket!`, `issue` and `redeem`.

A value that is never consumed:

```kursal
fn main() {
    let t = issue(3);
}
```

```text
lib.kur:5:5: demo::main: linear value 't' is not consumed before return
  5 |     let t = issue(3);
    |     ^
```

A value consumed twice:

```kursal
fn main() {
    let t = issue(3);
    let a = redeem(t);
    let b = redeem(t);
}
```

```text
lib.kur:7:20: demo::main: value 't' has been moved or is only partially available
  7 |     let b = redeem(t);
    |                    ^
```

An early return that skips the use:

```kursal
fn early(t: Ticket!) -> u32 {
    if t.seat > 10 {
        return 0;
    }
    redeem(t)
}
```

```text
lib.kur:4:1: demo::early: linear value 't' is not consumed before return
```

The compiler reports this one against the function, and the `return` that leaves `t` behind is the one inside the `if`.

A loop that consumes the value on each trip and never replaces it fails because the second trip would have nothing to consume. The compiler's message for that case names a block it generated for the loop. The fix is the one `main` used above, a fresh value put back before the loop repeats.

Some quieter ways to leak a value are also caught:

- `let _ = issue(1);` is rejected: a pattern cannot discard a linear value. Bind it and consume it.
- `issue(1);` as a statement is rejected: cannot discard a linear expression result.
- `t = issue(2);` over a `var t` that still holds a ticket is rejected: cannot overwrite live linear value `t`.
- A struct pattern that leaves out a linear field is rejected for the same reason as `let _`.

## Linear values spread

A struct that holds a linear field has to be linear itself, and say so:

```kursal
struct Booking! {
    ticket: Ticket!,
    paid: bool,
}

fn settle(b: Booking!) -> u32 {
    let { ticket, paid } = b;
    if paid { redeem(ticket) } else { redeem(ticket); 0 }
}
```

Declare `Booking` without the `!` and the compiler stops at the declaration:

```text
lib.kur:4:8: struct Booking holds a linear type in its field ticket; declare it Booking!
  4 | struct Booking {
    |        ^
```

This is the same rule for tuples and enums. The `!` is how you can tell from a declaration alone that a value of the type has to be used exactly once. A generic type like `Option[T]` is linear only when `T` is, and does not carry the `!` itself.

## && and || drop their right side

`ready && valid(t)` only evaluates `valid(t)` when `ready` is true. When it is false, `t` is never consumed. The checker rejects a linear value on the right of `&&` or `||`. Use an `if`, which consumes the value on both paths:

```kursal
fn check(ready: bool, t: Ticket!) -> bool {
    if ready { valid(t) } else { redeem(t); false }
}
```

## Check by hand

For each local that has a `!` type, follow every path from where it is bound to every exit: each arm of an `if` or `match`, each trip of a loop, each `return`. It must be consumed exactly once. The signatures tell you which calls consume (a parameter taken by value) and which only lend (a parameter marked `&`).

Next: [Generics and traits →](/book/traits/)
