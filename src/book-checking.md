+++
layout = "page.html"
section = "book"
title = "How checking works"
eyebrow = "Book · Part 2 · Chapter 19"
intro = "Everything the checker does comes down to one test you can run yourself: from one function and the signatures it calls, can you tell whether it passes?"
permalink = "/book/checking/"
+++

The earlier chapters each ended with a short check by hand. This chapter says why that is possible, and what is checking when you cannot.

## Local checking

A function is checked from its own body and the **signatures** of what it calls, never their bodies. A call to `swap_token(&slot, t)` is checked against `(&s: Slot!, fresh: Token!) -> u32`: `slot` has to be a var and full, `t` is consumed, and `slot` is full again afterwards. Whatever `swap_token` does inside was checked once, when `swap_token` itself was checked.

That is what lets you read code the way the checker does. Changing a function's body can never break a caller, and changing its signature is the only thing that can.

## Place state

Inside a function, every local and every place parameter is a place that is full, empty (moved out) or partly moved. Each block of the lowered function states which places are empty when it begins, and each jump is checked against the state its target expects. An `if` or `match` arm, and a loop body, must leave the state the join point or the next iteration expects.

That is why "lend on every branch", "restore before return" and "consume on every path" are checkable without looking at callers. They are all the same fact: at each point where control meets, the state is the same.

## Generic code is checked once

`forall T` means "for every `T`", linear types included, unless a premise such as `Copy[T]`, `Sized[T]`, `Exposed[*T]` or a trait says otherwise. Where a generic function is called, the compiler checks only that the arguments satisfy its premises. The body is not checked again for them. That is why diagnostics never depend on which instantiations a program happens to use.

```kursal
// Only ever called at u32, but checked for every T.
forall T.
fn twice(x: T) -> (T, T) {
    (x, x)
}

fn main() -> i32 {
    let (a, b) = twice(7u32);
    (a + b) as i32
}
```

```text
lib.kur:4:9: demo::twice: value 'x' has been moved or is only partially available
  4 |     (x, x)
    |         ^
```

`twice` is rejected even though the program only calls it at `u32`. With `where Copy[T]` it is accepted, and the premise is then checked at each call, against the signature alone:

```text
lib.kur:11:18: type argument must satisfy Copy
  11 |     let (a, b) = twice(Token!.{ n: 1 });
     |                  ^
```

## Two stages, two checkers

The compiler reads your program in a front end: parsing, name resolution, type inference, and lowering to a small core language called KURS. A separate checker then checks the KURS against the core rules **before any C is written**. KURS makes control flow, evaluation order and each block's place state explicit, and the checker works on that and nothing else.

The front end is meant to reject a bad program first, with a message about your source. The core checker is a second line of defence, independent of the front end. Compiler testing counts "the front end accepted it and the checker rejected it" as a bug, and that is how holes like the `f(&x, &x)` overlap of chapter 12 were found.

You can run the stages yourself. For the `swap_token` program of chapter 12, in a package directory `kursdemo` whose package is also named `kursdemo`:

```sh
kursal lower kursdemo > prog.kurs
kursal check prog.kurs
```

`kursal lower` writes the program as KURS. `kursal check` re-checks it and prints nothing when it is sound. `kursal readable` prints it in a form meant for people. If someone deletes the one instruction that puts `s` back before `swap_token` returns, the checker, which knows nothing about your source, still notices:

```text
kursdemo::swap_token/entry: linear_value_never_consumed
```

## Reading diagnostics

- `file:line:col: message`, followed by the source line, is an error found by the front end.
- A `package::function:` prefix inside it, as in `demo::twice: value 'x' has been moved...`, comes from the pass that tracks ownership and places: moved values, values not consumed, places not restored, overlapping lends.
- `type formation: ...` at a source position comes from the core checker's rules about which types may be written.
- A bare `package::function/block: some_code` with no source position is the core checker speaking about generated KURS.
- Some linear errors name a block the compiler generated, such as the join of an `if` or the head of a `while`. Read it as "the value is still live on some path into that construct", and find the path in your source.

The diagnostics are the compiler's text and may be reworded. They are for reading and are not stable codes, so this book does not publish an index of them.

## What this does and does not claim

Every program is re-checked in the core language by a checker independent of the front end, before C is emitted. A Lean proof covers the design of a restricted, single-threaded, value-only core, without place parameters, atomics, volatile accesses, `NonNull` or extern callbacks. The compilers and the checker are not proven, and the checker is trusted code. Unsafe code and extern declarations carry obligations that are stated in [`CONTRACTS.md`](https://github.com/kursionlabs/kursal/blob/main/lib/std/CONTRACTS.md) and are not checked.

What kursal gives you is tools for building abstractions that are resource-safe, linearity, places, brands and capabilities, and rules local enough that you can apply them by hand. There is no whole-program analysis and no inference across function boundaries.

## Check by hand

Nothing extra. The point of the chapter is the locality test: from one function and the signatures it calls, a reader can tell whether it passes.

The [source map](/source/) says where each stage lives in the repository, and the [compiler page](/compiler/) describes the pipeline.
