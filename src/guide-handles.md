+++
layout = "page.html"
section = "guide"
title = "A handle is a number"
eyebrow = "Guide · 1 of 8"
intro = "A C-style handle has to be closed exactly once. Nothing in the program says so."
permalink = "/guide/handles/"
+++

Start with the oldest resource pattern there is. You open something and get a number back. You use the number. You close it. The number can be a file descriptor, a socket, an id in someone else's table.

```kursal
use std::io::print;

// A handle is a number, as a C file descriptor is.
struct Handle {
    id: u64,
}

fn open(id: u64) -> Handle {
    print(f"open {id}\n");
    Handle.{ id }
}

fn close(h: Handle) {
    let id = h.id;
    print(f"close {id}\n");
}

fn main() {
    let a = open(1);
    let b = open(2);
    close(a);
    close(a);  // closed twice
}              // b is never closed
```

It compiles, and it runs:

```
open 1
open 2
close 1
close 1
```

Two bugs are in plain sight. `a` is closed twice, and `b` is never closed. The compiler says nothing about either, because as far as it knows `Handle` is a struct holding a `u64`, and a struct without a `!` in its name is plain copyable data. Passing `a` to `close` copies it, so `a` is still there to be closed again.

This is not a flaw in the example. It is what a handle is when it is a number: a value you can copy, drop and invent. C programs live with this every day, and so do many good libraries, by discipline. The discipline is real work, and it is invisible in the code.

## What we want

We want the compiler to treat a handle as something that is **used exactly once**. Not copied, not forgotten. Exactly once, on every path through the function, including the early returns and the error branches.

That is a stronger property than "no use after close". It also catches the leak.

## Check it in your head

There is nothing to check yet, and that is the point of this page. To know whether `close` runs once for `a`, you have to read every function that ever sees it.

Next: [make a handle a type the compiler counts →](/guide/linear/)

Examples in the repository: [`examples/hello`](https://github.com/kursionlabs/kursal/tree/main/examples/hello) and [`examples/heap`](https://github.com/kursionlabs/kursal/tree/main/examples/heap).
