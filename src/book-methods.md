+++
layout = "page.html"
section = "book"
title = "Methods"
eyebrow = "Book · Part 1 · Chapter 5"
intro = "An impl block attaches functions to a type. Whether a call reads the value or changes it is visible at the call site."
permalink = "/book/methods/"
+++

```kursal
use std::io::print;

struct Counter {
    count: u32,
    step: u32,
}

impl Counter {
    const DEFAULT_STEP: u32 = 1;

    fn new() -> Counter {
        Counter.{ count: 0, step: Counter::DEFAULT_STEP }
    }

    fn with_step(step: u32) -> Counter {
        Counter.{ count: 0, step }
    }

    // `self` by value: reads a copy.
    fn get(self) -> u32 {
        self.count
    }

    // `&self`: the caller's counter is changed in place.
    fn tick(&self) {
        self.count = self.count + self.step;
    }
}

fn main() {
    var a = Counter::new();
    var b = Counter::with_step(5);
    &a.tick();
    &a.tick();
    &b.tick();
    print(f"{a.get()} {Counter::get(b)} {Counter::DEFAULT_STEP}\n");
}
```

```text
2 5 1
```

## impl

`impl Counter { ... }` holds functions and constants belonging to `Counter`. You call a function with a path, `Counter::new()`, and a constant the same way, `Counter::DEFAULT_STEP`. Any function in the block can be called this way, including one that takes a receiver: `Counter::get(b)` is the same call as `b.get()`.

A function whose first parameter is `self` is a **method**, and can also be called with a dot, `a.get()`.

## self and &self

There are two receivers, and they say different things about the call.

- `self` takes the value. The method gets its own copy, or, for a value that must be used once, it consumes it. `get` above reads a copy of the counter.
- `&self` lends the value. The method works on the caller's own counter, in place, and the caller still has it afterwards.

At the call site, a lending method is called with an `&` in front: `&a.tick()`. Leave it off and the compiler stops you:

```text
lib.kur:33:5: tick takes its receiver by &
  33 |     a.tick();
     |     ^
```

That `&` is the point. When you read `a.tick()` you cannot tell whether `a` will change, so the language makes you write `&a.tick()` when it will. The call and the method's signature are all you need to judge it.

Lending requires a `var`, whether or not the method changes anything. `&a.tick()` is accepted only because `a` is a `var`. With `let a = Counter::new();` the compiler stops at the lend:

```text
lib.kur:33:6: a is not a var; a lent place must be a var
  33 |     &a.tick();
     |      ^
```

A `let` never changes once it is bound. Neither does a receiver taken by value: inside a method that takes `self`, calling a `&self` method on it needs a `var` first. `var self = self;` makes one, as `var x = x;` does for any parameter, and then `&self.tick();` lends it.

There is no `&mut` and no reference type. `&` appears at a call to say "lend this", and in a signature to say "this parameter is lent". Part 2 returns to it.

An `impl` for a named type has to be in the same package as the type, so you cannot add inherent methods to another package's type: `impl Buffer! { ... }` in your package gives `an inherent impl of Buffer! belongs in the package that declares it`. (Impls over a type parameter work differently, and chapter 7 covers them.) The primitive types get theirs from the core library, and `impl u32` gives `an inherent impl of u32 belongs in core`. To give someone else's type new behaviour, write a trait (chapter 7).

`self` can only be the first parameter. A generic type's methods are written in an `impl` with a `forall` in front, and chapter 7 shows that. There is no method privacy: every function in an `impl` can be called wherever the type's name is visible.

## Check by hand

For each call of a method, read the method's first parameter. `self` consumes or copies, and `&self` needs the `&` at the call and changes the receiver in place.

Next: [Linear types →](/book/linear/)
