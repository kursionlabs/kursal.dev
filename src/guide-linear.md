+++
layout = "page.html"
section = "guide"
title = "Linear types"
eyebrow = "Guide · 2 of 8"
intro = "Put a ! on the type and the same handle must be used exactly once on every path."
permalink = "/guide/linear/"
+++

Change the declaration to `struct Handle!`. The `!` is part of the name, so you can see it wherever the type is written. A type with `!` is **linear**: a value of it has to be used exactly once.

Using it up means moving it on (passing it to a function, returning it, or putting it into another value) or taking it apart. So `close` has to destructure the handle instead of reading a field:

```kursal
use std::io::print;

// The `!` is part of the name: a `Handle!` is used exactly once.
struct Handle! {
    id: u64,
}

fn open(id: u64) -> Handle! {
    print(f"open {id}\n");
    Handle!.{ id }
}

// Taking the handle apart is what uses it up.
fn close(h: Handle!) {
    let { id } = h;
    print(f"close {id}\n");
}

fn main() {
    let a = open(1);
    let b = open(2);
    close(a);
    if b.id > 1 {
        close(b);
    } else {
        close(b);
    }
    var h = open(3);
    var i = 0u32;
    while i < 2 {
        close(h);
        h = open(4 + i as u64);
        i = i + 1;
    }
    close(h);
}
```

It prints `open 1`, `open 2`, `close 1`, `close 2`, `open 3`, `close 3`, `open 4`, `close 4`, `open 5`, `close 5`, one per line. Both branches of the `if` close `b`. The loop closes the handle and opens a new one before the next turn, and the last one is closed after it.

## The mistakes now fail

If `close` keeps its old body, `let id = h.id;`, reading a field does not use the handle up:

```
lib.kur:16:1: step2bad::close: linear value 'h' is not consumed before return
```

With `close` fixed, the double close in the first version is rejected:

```
lib.kur:22:11: step2bad::main: value 'a' has been moved or is only partially available
```

And once the second `close(a)` is deleted, the forgotten `b` is:

```
lib.kur:22:1: step2bad::main: linear value 'b' is not consumed before return
```

The repository has these as ready-made failing programs. `examples/bad/leaked_handle.kur` reports `linear value 'h' is not consumed before return`. `examples/bad/double_use_handle.kur` reports `value 'h' has been moved`. A branch that closes on one side only, as in `examples/bad/branch_inconsistent.kur`, reports `linear value 'h' remains live on some paths`. A loop that consumes without replacing, as in `examples/bad/while_consume_without_replacement.kur`, reports `linear value 'h' remains live where the loop at 25:5 starts, but not when it repeats`.

Linearity spreads to whatever holds a linear value. A struct with a `Handle!` field has to be declared with a `!` too, and the compiler says so: `struct Pair holds a linear type in its field left; declare it Pair!`.

## Some fine print

- Destructuring or passing a value consumes it. Reading a field of a plain, copyable value does not.
- Every early `return` has to dispose of every linear value that is live at that point.
- In generic code, a type parameter `T` may be linear unless the function says `Copy[T]`. So inside generic code, linearity is not visible at the use.

Linear types are not a new idea here. [Austral](https://austral-lang.org/) showed how far this one idea goes on its own, and that is the spark kursal started from.

## Check it in your head

For each name whose type ends in `!`, follow every path from where it is bound to each exit. It has to be used exactly once. A loop body has to leave it as it found it. All you need is the function and the `!` on type names.

## What this leaves open

Linear values are strict. To ask a handle anything, even where it is positioned, you have to hand it over. You would have to give it back along with the answer.

Next: [look without consuming →](/guide/places/)

Examples: [`examples/linear`](https://github.com/kursionlabs/kursal/tree/main/examples/linear) and [`examples/greet`](https://github.com/kursionlabs/kursal/tree/main/examples/greet).
