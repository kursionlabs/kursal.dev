+++
layout = "page.html"
section = "book"
title = "for and f-strings"
eyebrow = "Book · Part 1 · Chapter 10"
intro = "Two pieces of syntax that are really calls to a trait: for calls Iterator, and an f-string calls Format."
permalink = "/book/iteration/"
+++

## for

```kursal
use std::io::print_buffer;
use std::iter::{Iterator, range};
use std::option::Option;

// Counts down from `n` to 1.
struct Countdown { n: u32 }

instance Iterator[Countdown -> u32] {
    fn next(&it: Countdown) -> Option[u32] {
        if it.n == 0 {
            Option::None
        } else {
            let v = it.n;
            it = Countdown.{ n: v - 1 };
            Option::Some.(v)
        }
    }
}

fn main() {
    var c = Countdown.{ n: 3 };
    for x in &c {
        print_buffer(f"{x}...");
    }
    print_buffer(f"liftoff\n");
    var total = 0usize;
    var r = range(1, 5);
    for i in &r {
        total = total + i;
    }
    print_buffer(f"sum 1..5 = {total}\n");
}
```

```text
3...2...1...liftoff
sum 1..5 = 10
```

`for x in &it { body }` calls `next` on the iterator again and again, and runs the body for each `Some(x)`, until it gets `None`. It is a `while` loop around a `match` on what `next` returns, written once. The standard library's `Iterator` trait is how it knows what to call: an instance `Iterator[I -> T]` says that iterating an `I` produces items of type `T`, the determined parameter from chapter 7. `range(1, 5)` is an iterator over `usize` that stops before its end.

The `&` matters. A `for` **lends** its iterator, because `next` takes it by `&`. The iterator has to be a place you can lend, a `var`, and when the loop ends it still holds the exhausted iterator. Leave the `&` off and the compiler tells you:

```text
lib.kur:4:5: a for loop lends its iterator: `for x in &it`
  4 |     for i in range(1, 5) {
    |     ^
```

The binder is a single name, with no patterns, and the body has type `()`. The binder is not a `var`: to change it or lend it in the body, write `var i = i;` first. Leave early with `return`, since there is no `break`. You only need to import `Iterator` to write an instance of it, and the `for` itself needs no import.

The `&it: Countdown` parameter in `next` is a **lent** parameter: the function may change `it` and the caller gets the change back. Part 2 covers lending in full.

## f-strings

An f-string splices values into text:

```kursal
use std::io::print_buffer;
use std::buffer::Buffer!;
use std::fmt::{Format, Writable};

struct Point { x: i32, y: i32 }

// `{p}` in an f-string calls this instance, for any writer W.
forall W where Writable[W].
instance Format[Point, W] {
    fn format(p: Point, out: W) -> (Point, W) {
        let { x, y } = p;
        (p, f"({x}, {y})".write(out))
    }
}

fn main() {
    let p = Point.{ x: 3, y: -4 };
    var name = Buffer!::new().push_static("Ada");   // a linear, owned string
    let line = f"{&name} is at {p}; braces: {{}}\n";
    name.destroy();
    print_buffer(line);
}
```

```text
Ada is at (3, -4); braces: {}
```

- An f-string produces a `Buffer!`, an owned byte buffer. It is linear, so it has to be used: print it, pass it on, or `.destroy()` it.
- Each `{expr}` calls `Format` for the type of the expression, and the expression can be any expression, a call included. `{{` and `}}` are literal braces. There are no width or precision specifiers.
- The library gives `Format` instances for all the integers, `f32`, `f64`, `bool`, `Slice[u8, 'static]` (string literals), readable byte views, `std::io::Error`, and `Buffer!` (written `{&b}`).
- A linear value has to be written `{&name}`, which lends it to the formatter and leaves it for you to consume afterwards. Like every lend it needs a `var`, which is why `name` above is one. Splicing it in without the `&` would use it up, and the compiler rejects that and tells you to lend it.
- `f"...".write(out)` writes into any `Writable` instead of making a new buffer. That is how a `Format` instance for your own type writes its text into whichever writer it is given, as above.

If a type has no `Format` instance you get the error you would expect:

```text
lib.kur:5:21: no instance of Format[Point, Buffer!]
  5 |     print_buffer(f"{p}\n");
    |                     ^
```

## Check by hand

For a `for`, the type after `in &` is a `var` with an `Iterator` instance. For each `{x}` in an f-string, the type of `x` has a `Format` instance, or it is linear and written `{&x}`.

Next: [Modules, packages and encapsulation →](/book/modules/)
