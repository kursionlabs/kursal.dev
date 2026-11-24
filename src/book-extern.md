+++
layout = "page.html"
section = "book"
title = "Calling C with extern"
eyebrow = "Book · Part 2 · Chapter 16"
intro = "Declare a C function, link it in, and call it as an unsafe operation. The compiler checks the declaration's shape and not that it matches the C."
permalink = "/book/extern/"
+++

## Declaring, linking, calling

`extern "C" fn name(params) -> R;` declares a function defined in C. A package brings C into the build with `c_sources` (C files compiled into every executable that depends on the package) and `link_flags` (arguments given to the C compiler after the generated code, one each, with no shell involved). A dependency's flags are passed too.

```toml
[package]
name = "ffi"
kind = "executable"
entry = "main"
source_root = "."
c_sources = ["scale.c"]
link_flags = ["-lm"]

[dependencies.std]
path = "../kursal/lib/std"
```

```c
#include <stdint.h>

uint32_t scale_add(uint32_t x, uint32_t k) { return x * k + 1; }

uint32_t apply_twice(uint32_t (*f)(uint32_t), uint32_t x) { return f(f(x)); }
```

```kursal
use std::io::print_buffer;

// Declarations of functions defined in scale.c, which c_sources compiles in.
extern "C" fn scale_add(x: u32, k: u32) -> u32;
// A function type in an extern's signature is an `unsafe fn` type.
extern "C" fn apply_twice(f: unsafe fn(u32) -> u32, x: u32) -> u32;
// From the C math library, linked by link_flags.
extern "C" fn sqrt(x: f64) -> f64;

// An `unsafe fn` that C may call back.
unsafe fn inc(x: u32) -> u32 {
    x + 1
}

fn main() {
    let a = unsafe scale_add(4, 10);       // calling an extern is unsafe
    let b = unsafe apply_twice(inc, 5);
    let r = unsafe sqrt(2.25);
    print_buffer(f"{a} {b} {r}\n");
}
```

```text
41 7 1.5
```

Calling an extern is an unsafe operation, always, as chapter 15 described. Leave `unsafe` off:

```kursal
extern "C" fn abs(x: i32) -> i32;

fn main() -> i32 {
    abs(-3)
}
```

```text
lib.kur:4:5: calling an unsafe function requires unsafe authorization
  4 |     abs(-3)
    |     ^
```

The declaration always says `"C"`. That is the only form to write.

## What the compiler checks in a declaration

C takes bytes and returns bytes, so the compiler rejects declarations that could not mean the same thing on both sides:

- **A function type in the signature is an `unsafe fn` type.** C neither makes nor calls a safe function value, and a safe `fn(u32) -> u32` there is rejected.
- **No place parameters.** `extern "C" fn bump(&x: u32)` is rejected: foreign code takes values and lends nothing back.
- **No type or brand parameters**, so no `forall` on an extern.
- **No zero-size parameter.** `extern "C" fn f(x: ())` is rejected: a zero-size type has no memory form.
- **No result that only checked code can make:** a package, a brand witness, a safe function value, a transform or `Never`. C's bytes cannot make what only the checker can vouch for.
- **No enum or `NonNull` in a result**, because the compiler chooses their layout: `-> Option[u32]` is rejected.
- **A zero-size result must be `Copy`.** `()` acts as `void`. A zero-size linear result is rejected, because foreign code would be making a resource from nothing.

A rejected extern gets a message that names the rule, for example `extern bump takes a place parameter; foreign code takes values`.

## What is not checked

The compiler does not check that your declaration matches the C definition: the types, the number of arguments, widths and signedness, and the calling convention. A wrong declaration is a wrong program, and nothing will say so. It also cannot check that the C code returns normally. The C side must not `longjmp` or unwind into kursal frames.

So a safe wrapper around an extern is where the obligation lives. Write the C prototype next to the declaration, state what the C function promises, and give callers a function that cannot be called wrongly. That is the pattern the standard library follows for libc.

## Check by hand

Each extern declaration matches its C prototype exactly, in widths, signedness and pointer levels. Every callback you hand to C is an `unsafe fn` whose own obligation the C code meets. The C side never unwinds into kursal.

Next: [foreach traversal →](/book/foreach/)
