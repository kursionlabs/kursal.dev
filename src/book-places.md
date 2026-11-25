+++
layout = "page.html"
section = "book"
title = "Places and lending"
eyebrow = "Book · Part 2 · Chapter 12"
intro = "A function can work on the caller's own variable without owning it and without a reference type. Lending is a mode of a parameter."
permalink = "/book/places/"
+++

Part 1 used `&` twice without the whole story: `&a.tick()` in chapter 5, and `for x in &it` in chapter 10. This chapter is the whole story. A **place** is a variable, a field of one, or a parameter. To **lend** a place is to let a callee read and change it for the length of one call. The callee does not get a pointer it can keep. When the call returns, the place is the caller's again, with whatever the callee put in it.

There is no reference type and no `&mut`. `&` appears in a signature to say "this parameter is lent", and at a call to say "I am lending this".

The structs in this chapter are `exposed` (chapter 11) so that every example can be one file.

## The forms

```kursal
use std::io::print;

exposed struct Counter {
    n: u32,
}

impl Counter {
    // `&self`: the method changes the caller's counter in place.
    fn tick(&self) -> u32 {
        self.n = self.n + 1;
        self.n
    }
}

exposed struct Pair {
    left: Counter,
    right: Counter,
}

// A place parameter: the callee's changes to `c` are the caller's.
fn bump_twice(&c: Counter) -> u32 {
    &c.tick();
    &c.tick()
}

fn main() {
    var a = Counter.{ n: 0 };
    let one = &a.tick();          // lend `a` to a `&self` method
    let three = bump_twice(&a);   // lend `a` to a place parameter
    var p = Pair.{ left: Counter.{ n: 10 }, right: Counter.{ n: 20 } };
    let l = &p.left.tick();       // lend a field of a var
    let r = &p.right.tick();
    print(f"{one} {three} {a.n} {l} {r}\n");
}
```

```text
1 3 3 11 21
```

- `fn f(&c: Counter)` declares a **place parameter**. Inside the function, `c` is the caller's variable, and assigning to it or its fields changes the caller's.
- `&self` is the same thing for a method's receiver.
- At a call, `f(&a)` lends `a`, and `&a.tick()` lends `a` as the receiver.

A lent place has to be a `var`, a place parameter, or the binder of a lent match (below). A `let` binding never changes after it is bound, and lending would let the callee change it:

```kursal
fn main() -> i32 {
    let a = Counter.{ n: 0 };
    (&a.tick() as i32)
}
```

```text
lib.kur:14:7: a is not a var; a lent place must be a var
  14 |     (&a.tick() as i32)
     |       ^
```

The numbers count the declarations that come first in each failing example in this chapter: `Counter` for most of them, and `Token!` and `Slot!` for `take_token`. The fix is `var a`. A by-value parameter is not a var either: `fn bump(c: Counter) { &c.tick() }` is rejected with `c is not a var`. Ask for a place with `&c: Counter` if the function needs to change the caller's value.

## Lending is not storing

A lend lasts for one call. It cannot be kept, returned or captured:

```kursal
fn main() -> i32 {
    var a = Counter.{ n: 0 };
    let r = &a;
    0
}
```

```text
lib.kur:14:13: & lends a place only as a call argument `f(&x)`, a receiver `&x.m()` or a match scrutinee `match &x`
  14 |     let r = &a;
     |             ^
```

Writing `&Counter` as a return type is a syntax error. Those are the same fact seen twice: the `&` is an argument mode, not a type, so there is nothing for a lifetime to describe.

A closure holds its own value of what it mentions, a copy or the value moved in (chapter 9), so it cannot lend or assign them either. A closure that has to change something takes it as a place parameter instead, which is the last example below.

```kursal
fn main() -> i32 {
    var a = Counter.{ n: 0 };
    let next = || &a.tick();
    (next() as i32)
}
```

```text
lib.kur:14:20: a is captured, and a body cannot lend what it captures; lend it outside, or give a closure a place parameter for it
  14 |     let next = || &a.tick();
     |                    ^
```

Assigning to a captured variable fails the same way, with `a is captured, and a body cannot assign what it captures; assign it outside, or give a closure a place parameter for it`.

## Taking a place apart and putting it back

A callee may move a value out of a place parameter, as long as a value is back in it before the function returns:

```kursal
use std::io::print;

exposed struct Token! {
    id: u32,
}

exposed struct Slot! {
    token: Token!,
    uses: u32,
}

// Takes the token out of the slot, hands back a new one, and returns the old
// id. `s` is moved out whole and put back before the function returns.
fn swap_token(&s: Slot!, fresh: Token!) -> u32 {
    let { token, uses } = s;          // `s` is now moved out
    let { id } = token;
    s = Slot!.{ token: fresh, uses: uses + 1 };   // ... and restored
    id
}

fn main() {
    var slot = Slot!.{ token: Token!.{ id: 1 }, uses: 0 };
    let old = swap_token(&slot, Token!.{ id: 2 });
    let { token, uses } = slot;
    let { id } = token;
    print(f"old {old}, new {id}, uses {uses}\n");
}
```

```text
old 1, new 2, uses 1
```

This is how a linear value can be looked at and changed without being handed over. The caller sees the place full again after the call. Leave the place empty and the function is rejected:

```kursal
// Moves the slot out and never puts it back.
fn take_token(&s: Slot!) -> Token! {
    let { token, uses } = s;
    token
}
```

```text
lib.kur:13:5: demo::take_token: lent value 's' must be restored before return
  13 |     token
     |     ^
```

## Lending on every path

Branches may each lend a place, and both sides of `&&` may too. A match can lend what it looks at, and the case's binder is then a place whose changes land in the original:

```kursal
use std::io::print;
use std::option::Option;

exposed struct Counter {
    n: u32,
}

impl Counter {
    fn tick(&self) -> u32 {
        self.n = self.n + 1;
        self.n
    }

    fn below(&self, limit: u32) -> bool {
        self.n < limit
    }
}

fn main() {
    var a = Counter.{ n: 0 };
    // Each branch of an `if` may lend `a`.
    let x = if a.n == 0 { &a.tick() } else { &a.tick() + 100 };
    // So may both sides of `&&`; the right side lends only when the left is true.
    let both = &a.below(5) && &a.below(3);
    // A match on a lent place: a case's binder is a place too.
    var slot = Option::Some.(Counter.{ n: 7 });
    let y = match &slot {
        Some(c) => &c.tick(),
        None => 0,
    };
    let z = match slot {
        Some(c) => c.n,
        None => 0,
    };
    print(f"{x} {both} {y} {z} {a.n}\n");
}
```

```text
1 true 8 8 1
```

`match &slot` lends `slot`, so `&c.tick()` inside the case changed the counter stored in `slot`, and the later by-value match reads 8.

## Patterns for var, disjoint fields, closures

`var` takes the same patterns as `let`, and every name it binds is a `var`. Two disjoint fields of one `var` can be lent in the same call. A closure that must change something takes it as a place parameter, written `closure[Env](&_: Counter) -> u32`, and the closure itself is written `|&k| &k.tick()`.

```kursal
use std::io::print;

exposed struct Counter {
    n: u32,
}

impl Counter {
    fn tick(&self) -> u32 {
        self.n = self.n + 1;
        self.n
    }
}

exposed struct Pair {
    left: Counter,
    right: Counter,
}

fn add(&x: Counter, &y: Counter) -> u32 {
    &x.tick() + &y.tick()
}

// A closure that changes something takes it as a place parameter.
forall Env where Copy[Env].
fn twice(&c: Counter, step: closure[Env](&_: Counter) -> u32) -> u32 {
    step(&c) + step(&c)
}

fn main() {
    // `var` takes `let`'s patterns, and every name it binds is a var.
    var (a, b) = (Counter.{ n: 0 }, Counter.{ n: 100 });
    var [c, d] = [Counter.{ n: 5 }, Counter.{ n: 6 }];
    &a.tick();
    &b.tick();
    &c.tick();
    &d.tick();
    // Two disjoint fields of one var may be lent in the same call.
    var p = Pair.{ left: Counter.{ n: 1 }, right: Counter.{ n: 2 } };
    let s = add(&p.left, &p.right);
    let t = twice(&a, |&k| &k.tick());
    print(f"{a.n} {b.n} {c.n} {d.n} {s} {t}\n");
}
```

```text
3 101 6 7 5 5
```

`twice` calls its closure twice, so the environment has to be `Copy`, as in chapter 9.

## Two lends must not overlap

One call cannot lend the same place twice, or a place together with one of its own fields:

```kursal
fn add(&x: Counter, &y: Counter) -> u32 {
    &x.tick() + &y.tick()
}

fn main() -> i32 {
    var a = Counter.{ n: 0 };
    (add(&a, &a) as i32)
}
```

```text
lib.kur:18:6: demo::main: 'a' overlaps another place the same call lends
  18 |     (add(&a, &a) as i32)
     |      ^
```

`both(&p, &p.left)` fails the same way, with `'p.left' overlaps another place the same call lends`. What is allowed is a call that lends a place again inside its own arguments, because the inner call finishes before the outer one lends: `&a.add(&a.tick())` is fine.

This is the rule the fuzzing story on the [compiler page](/compiler/) mentions. It is what lets a callee change a place parameter without anything else in the call being able to see the same memory.

## Check by hand

Every `&x` has a `var`, a place parameter, `&self` or a lent-match binder at its root. Every function that moves a place parameter out writes it back on every path. No call lends the same place twice.

Next: [Brands and existentials →](/book/brands/)
