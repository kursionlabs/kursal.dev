+++
layout = "page.html"
title = "Closures and function values"
eyebrow = "Book · Part 1 · Chapter 9"
intro = "A closure carries the values it captured. If one of them is linear, the closure is too."
permalink = "/book/closures/"
+++

```kursal
use std::io::print_buffer;

fn double(x: u32) -> u32 { x * 2 }

// A plain function value.
fn apply_fn(f: fn(u32) -> u32, x: u32) -> u32 {
    f(x)
}

// A closure parameter called once: its environment is a hidden type parameter.
fn apply_once(f: closure(u32) -> u32, x: u32) -> u32 {
    f(x)
}

// Called twice, so the environment must be Copy; it is named to say so.
forall Env where Copy[Env].
fn apply_twice(f: closure[Env](u32) -> u32, x: u32) -> u32 {
    f(f(x))
}

fn main() {
    let offset = 10u32;
    let add = |x: u32| x + offset;          // captures `offset` by copy
    let a = apply_fn(double, 4);            // a named fn as a value
    let g = double;
    let b = g(5);
    let c = apply_once(add, 1);
    let d = apply_twice(|x| x + offset, 1);
    let e = apply_twice(|x| -> u32 {
        let y = x * 3;
        y + 1
    }, 2);
    print_buffer(f"{a} {b} {c} {d} {e}\n");
}
```

```text
8 10 11 21 22
```

## Writing a closure

- `|x| x + 1` and `|x: u32| x + 1`
- `|| 42`, with no parameters
- `|x| -> u32 { let y = x * 3; y + 1 }`, with a block body and a result type

A closure captures the local variables it mentions. A value that is Copy is captured by copy, and a linear value is **moved in**. Moving a linear value into a closure makes the closure itself linear, and it then has to be called, or handed on, exactly once.

## Two kinds of function value

A **function value** is written `fn(A) -> R`. A named function used without parentheses is one, as in `apply_fn(double, 4)` and `let g = double;`. It carries nothing with it.

A **closure** carries an environment, the values it captured. Its type is `closure[Env](A) -> R`, where `Env` is a type parameter for that environment. Two closures with the same signature but different captures have different `Env`.

As a parameter, you can leave `Env` unnamed and write `closure(A) -> R`, as `apply_once` does. The environment is then a hidden type parameter, and this form is only allowed for parameters. When a function needs to say something about the environment, it names it, as `apply_twice` does with `where Copy[Env]`.

A closure parameter does not accept a plain function value. To pass `double` to `apply_once`, wrap it: `apply_once(|x| double(x), 4)`.

## Calling more than once

Calling a closure uses it up unless its environment is Copy. That follows from the rule for linear values. A closure that captured a linear ticket is linear:

```kursal
let t = issue(4);
let r = apply_once(|x| x + redeem(t), 1);   // t moves into the closure, which is called once
```

Call it twice and the second call fails:

```kursal
let t = issue(4);
let f = |x: u32| x + redeem(t);
let a = f(1);
let b = f(2);
```

```text
lib.kur:8:13: demo::main: value 'f' has been moved or is only partially available
  8 |     let b = f(2);
    |             ^
```

Handing that closure to `apply_twice` fails at the call, with `type argument must satisfy Copy`. Inside a function, a `closure(...)` parameter that is called twice is rejected for the same reason, since nothing says its environment is Copy:

```kursal
fn apply_twice(f: closure(u32) -> u32, x: u32) -> u32 {
    f(f(x))
}
```

```text
lib.kur:2:7: demo::apply_twice: value 'f' has been moved or is only partially available
  2 |     f(f(x))
    |       ^
```

The fix is to name the environment and say it is Copy, as in the program at the top.

## What is not here

This chapter covers closures as arguments. Returning a closure from a function is not covered yet, because the way to write its type is still being settled.

## Check by hand

For a closure, list what it mentions from outside. If any of it is linear, the closure is linear and is called once or handed on. A function that calls its closure parameter more than once says `Copy[Env]`.

Next: [for and f-strings →](/book/iteration/)
