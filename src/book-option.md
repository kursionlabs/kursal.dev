+++
layout = "page.html"
title = "Option, Result and ?"
eyebrow = "Book · Part 1 · Chapter 8"
intro = "Absence and failure are ordinary enums. The ? operator hands them up the call stack without hiding where."
permalink = "/book/option/"
+++

`Option[T]` is either `Some(T)` or `None`. `Result[T, E]` is either `Ok(T)` or `Err(E)`. They are enums in the standard library, matched and built like any other enum, and they must be imported:

```kursal
use std::option::{Option, Result};
```

## Building and matching

A variant is built with its path and a dot-paren, `Option::Some.(n)`, `Result::Err.(e)`. A unit variant has no payload, `Option::None`. In a `match` the cases are bare labels, `Some(n)`, `None`, `Ok(v)`, `Err(e)`, as chapter 4 showed.

```kursal
use std::io::print_buffer;
use std::option::{Option, Result};

enum ParseError {
    Empty,
    BadDigit(u8),
}

fn digit(b: u8) -> Result[u32, ParseError] {
    if b >= b'0' && b <= b'9' {
        Result::Ok.((b - b'0') as u32)
    } else {
        Result::Err.(ParseError::BadDigit.(b))
    }
}

// `?` returns the Err from `two_digits` unchanged.
fn two_digits(hi: u8, lo: u8) -> Result[u32, ParseError] {
    let h = digit(hi)?;
    let l = digit(lo)?;
    Result::Ok.(h * 10 + l)
}

fn half(n: u32) -> Option[u32] {
    if n % 2 == 0 { Option::Some.(n / 2) } else { Option::None }
}

fn quarter(n: u32) -> Option[u32] {
    let h = half(n)?;
    half(h)
}

fn show(r: Result[u32, ParseError]) {
    match r {
        Ok(n) => print_buffer(f"ok {n}\n"),
        Err(e) => match e {
            Empty => print_buffer(f"empty\n"),
            BadDigit(b) => print_buffer(f"bad digit {b}\n"),
        },
    };
}

fn main() {
    show(two_digits(b'4', b'2'));
    show(two_digits(b'4', b'x'));
    let q = quarter(20).unwrap_or(0);
    let none = quarter(6).is_none();
    print_buffer(f"{q} {none}\n");
}
```

```text
ok 42
bad digit 120
5 true
```

Matching inside an arm, as `show` does for the error, is how you look at a nested value. There are no nested patterns. `unwrap_or` and `is_none` are two of the standard library's helpers on `Option`. They need the payload type to be `Copy`.

## The ? operator

`x?` looks at an `Option` or a `Result`:

- If it is `Some(v)` or `Ok(v)`, the expression is `v`.
- If it is `None` or `Err(e)`, the enclosing function returns right there with `None` or `Err(e)`, with `e` unchanged.

So `two_digits` reads as a straight line, and each `?` is a visible place where the function can leave. For `?` to work, the operand and the function's result have to be the same type, error type included. Mixing is rejected:

```kursal
fn checked(n: u32) -> Result[u32, u8] {
    let h = half(n)?;      // half returns an Option
    Result::Ok.(h)
}
```

```text
lib.kur:6:13: ? needs the operand and the function result to be the same direct Option/Result type
  6 |     let h = half(n)?;
    |             ^
```

There is no automatic conversion of errors either. A `Result[u32, u8]` cannot be propagated by `?` out of a function returning `Result[u32, u16]`:

```text
lib.kur:6:13: type mismatch: u8 and u16
  6 |     let s = small(n)?;
    |             ^
```

When you want to change the error, match, convert it yourself and build the new `Err`. It keeps every conversion in the text of the function.

`?` is only for `Option` and `Result`, and this is how `main` can return `Result[(), Error]` and stop with a message, as in chapter 1.

## Check by hand

For each `?`, look at the declared type of its operand and the declared result type of the function. They must be the same type with the same error type.

Next: [Closures and function values →](/book/closures/)
