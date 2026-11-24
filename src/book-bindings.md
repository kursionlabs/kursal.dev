+++
layout = "page.html"
title = "Bindings and control flow"
eyebrow = "Book · Part 1 · Chapter 3"
intro = "let and var, functions, if as an expression, one kind of loop, and the type of something that never returns."
permalink = "/book/bindings/"
+++

## A tour in one program

```kursal
use std::io::print_buffer;
use std::process::trap;

const LIMIT: u32 = 100;

fn classify(n: u32) -> u32 {
    if n == 0 {
        0
    } else if n < 10 {
        1
    } else {
        2
    }
}

// The first divisor of n above 1, by an early return from a loop.
fn smallest_factor(n: u32) -> u32 {
    var d = 2u32;
    while d * d <= n {
        if n % d == 0 {
            return d;
        }
        d = d + 1;
    }
    n
}

fn checked_half(n: u32) -> u32 {
    if n % 2 == 1 {
        trap()
    } else {
        n / 2
    }
}

fn main() {
    const STEP: u32 = 7;
    var total = 0u32;
    var i = 0u32;
    while i < LIMIT {
        total = total + classify(i);
        i = i + STEP;
    }
    let label = if total > 20 { "big" } else { "small" };
    let x = 5u32;
    let x = x * 3;      // shadows the first x
    print_buffer(f"{total} {label} {x} {smallest_factor(91)} {checked_half(10)}\n");
}
```

```text
27 big 15 7 5
```

## let and var

`let` makes a binding that cannot be assigned to. `var` makes one that can. You assign with `=` to a `var`, to a field of one (`p.x = 1`), or to a tuple element (`(p.0).1 = 1`).

```kursal
fn main() {
    let count = 0u32;
    count = count + 1;
}
```

```text
lib.kur:3:5: count is not a var
  3 |     count = count + 1;
    |     ^
```

There is no `+=` or other compound assignment, so write `count = count + 1`. Function parameters are immutable in the same way. What you can do is shadow one: `let n = n * 2;` makes a new `n`. Shadowing works for any name and the old binding is simply out of reach afterwards, which is why the program above can have two `x`.

A `let` can also take a pattern: a name, `_`, a tuple `(a, b)`, an array `[a, b, c]`, or a struct pattern `{ x, y: py, ..rest }`. Chapter 4 covers the last.

## Functions

```kursal
fn name(a: T, b: U) -> R { body }
```

The body is a block, and a block's value is its last expression, without a semicolon. A function with no `->` returns `()`. `return value;` leaves early, and it needs its own semicolon. Writing `return n` as the last thing in a block, with no `;`, is a syntax error.

Every parameter type and the return type are written out. Local bindings and closures can have their types inferred.

## if, else, while

`if` and `match` are expressions. When you use the value, every branch has to produce one, so an `if` with no `else` cannot be the value of a function that returns a `u32`. The condition has to be a `bool`, with no parentheses needed.

```kursal
let label = if total > 20 { "big" } else { "small" };
```

The only loop keyword is `while`. There is no `loop`, `break` or `continue`, and you leave a loop early with `return` (as `smallest_factor` does). Chapter 10 adds `for`, which is built on a trait, and Part 2 adds `foreach` for walking a data structure. A `while` always has the type `()`, even one that never ends.

## const

`const NAME: T = expr;` works at module level, inside a block (like `STEP` above) and inside an `impl`. It is evaluated at compile time.

## Functions that do not return

The type `!`, also spelled `Never`, belongs to an expression that never produces a value. `trap()` stops the program, and so does `std::process::exit(status)`. Because such a call never comes back, it fits anywhere a value of any type is expected, including the `else` branch below:

```kursal
use std::io::{eprint, print_buffer};
use std::process::exit;
use std::slice::Slice;

fn die(msg: Slice[u8, 'static]) -> ! {
    eprint(msg);
    exit(2)
}

fn parse_digit(b: u8) -> u32 {
    if b >= b'0' && b <= b'9' {
        (b - b'0') as u32
    } else {
        die("not a digit\n")
    }
}

fn main() {
    print_buffer(f"{parse_digit(b'7')}\n");
    print_buffer(f"{parse_digit(b'x')}\n");
}
```

```text
7
not a digit
```

The second line goes to standard error and the exit status is 2. `trap` also needs an import: `use std::process::trap;`.

## Check by hand

For each function, every `return` and the block's last expression have the declared result type. Each name you assign to is a `var`, or a parameter that is lent for writing (Part 2).

Next: [Structs, enums and match →](/book/shapes/)
