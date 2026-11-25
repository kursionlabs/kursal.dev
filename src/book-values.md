+++
layout = "page.html"
section = "book"
title = "Values and operators"
eyebrow = "Book · Part 1 · Chapter 2"
intro = "Numbers, bytes, strings, tuples and arrays, and the operators that combine them. kursal converts nothing for you."
permalink = "/book/values/"
+++

## Literals

```kursal
use std::io::print;

fn main() {
    let a = 0xffu32;
    let b = 0o17u8;
    let c = 0b1010_1010u8;
    let d = 1_000_000u64;
    let e: i32 = -42;
    let f = 2.5e3f64;
    let g: f32 = 0.1;
    let byte = b'A';
    let nl = b'\n';
    let ok = true;
    print(f"{a} {b} {c} {d} {e}\n");
    print(f"{f} {g} {byte} {nl} {ok}\n");
}
```

```text
255 15 170 1000000 -42
2500 0.1 65 10 true
```

Integers can be written in decimal, hex (`0x`), octal (`0o`) or binary (`0b`), with `_` between digits. The integer types are `i8`, `i16`, `i32`, `i64`, `isize`, `u8`, `u16`, `u32`, `u64` and `usize`, and the float types are `f32` and `f64`. `bool` has `true` and `false`. A byte literal like `b'A'` is a `u8`, which is why it prints as a number, and its character has to be ASCII. A float needs digits on both sides of the point, so `2.5` is a float and `2.` is not.

A bare literal has no default type. `let n = 5;` on its own is an error, `an integer literal's type is not determined; write a suffix`, because nothing says whether `n` is a `u8` or an `i64`. Give it a suffix (`5u32`), an annotation (`let n: u32 = 5;`), or use it where a type is already fixed, as `let e: i32 = -42` does. A literal that does not fit its type is rejected: `let x: u8 = 256;` gives `literal 256 does not fit u8`.

## Tuples and arrays

```kursal
use std::io::print;

fn main() {
    let pair = (3u32, true);
    let triple: (u8, i64, bool) = (1, -2, false);
    let unit = ();
    print(f"{pair.0} {pair.1} {triple.1}\n");
    let nested = ((1u32, 2u32), 3u32);
    let inner = nested.0;
    print(f"{inner.1} {nested.1}\n");
    let xs = [10u32, 20, 30];
    let [first, second, third] = xs;
    let zeros: [u8; 4] = [0, ..];
    let mixed: [u32; 5] = [7, 8, ..];
    let [p, q, r, s, t] = mixed;
    print(f"{first} {second} {third} {p} {q} {r} {s} {t}\n");
    let (x, y) = pair;
    print(f"{x} {y}\n");
}
```

```text
3 true -2
2 3
10 20 30 7 8 8 8 8
3 true
```

A tuple is written with parentheses and its elements are reached with `.0`, `.1` and so on. `()` is the unit type and its one value. A chain like `nested.0.1` does not parse, so name the middle step as above or write `(nested.0).1`.

An array `[T; N]` has a length that is part of its type, and at least one element: `[T; 0]` and the empty literal `[]` are rejected with `an array has at least one element`. `[0, ..]` fills the whole array by repeating the last element you wrote, so `[7, 8, ..]` is `7, 8, 8, 8, 8`. There is no indexing syntax: `xs[i]` is not an expression. You build an array, pass it around whole, and take it apart with a pattern like `let [a, b, c] = xs;`.

## Strings

```kursal
use std::io::print;
use std::slice::Slice;

fn main() {
    let s: Slice[u8, 'static] = "tab:\there, quote:\" hex:\x41 backslash:\\\n";
    print(s);
    print("multi
line\n");
}
```

```text
tab:	here, quote:" hex:A backslash:\
multi
line
```

A string literal is a `Str['static]`, which is a name for `Slice[u8, 'static]`: a view of bytes that lives for the whole program. kursal has no `char` type and no built-in `String`. Text is bytes. The escapes are `\n \t \r \0 \\ \' \"` and `\xHH` up to `\x7f`. A literal may span lines. The `'static` is a brand, and Part 2 explains them. For now it is what you write when you need to name the type of a literal. Each literal's bytes are followed by one zero byte, so they also read as a C string, and the slice's length is still the literal's own.

## Operators

From loosest to tightest:

1. `||`
2. `&&`
3. comparisons: `== != < <= > >=`
4. `|`
5. `^`
6. `&`
7. `<<` `>>`
8. `+` `-`
9. `*` `/` `%`
10. `as`
11. unary `-` `!` `*` `&` and `unsafe`
12. postfix: `.field`, calls, `?`, `.0`

Two things differ from C. The bitwise operators bind tighter than comparison, and comparisons do not chain.

```kursal
use std::io::print;

fn main() {
    let flags = 0b0110u8;
    // `&` binds tighter than `==`, so no parentheses are needed.
    let has_bit = flags & 0b0100 == 0b0100;
    let shifted = 1u32 << 4 + 1;      // `+` binds tighter than `<<`: 1 << 5
    let mixed = 2u32 + 3 * 4;          // 14
    let both = 3u32 < 4 && !(2u32 > 5);
    let xor = 0xf0u8 ^ 0xffu8;
    print(f"{has_bit} {shifted} {mixed} {both} {xor}\n");
}
```

```text
true 32 14 true 15
```

`!` on a `bool` is logical not, and on an integer it flips every bit, so `!0u8` is `255`.

```kursal
fn in_order(a: u32, b: u32, c: u32) -> bool {
    a < b < c
}
```

```text
lib.kur:2:11: syntax error
  2 |     a < b < c
    |           ^
```

Write `a < b && b < c`.

## No implicit conversions

Both sides of an arithmetic operator must have the same type:

```kursal
fn add(a: u32, b: u64) -> u64 {
    a + b
}
```

```text
lib.kur:2:5: type mismatch: u64 and u32
  2 |     a + b
    |     ^
```

The same goes for the two sides of a shift. To mix widths, convert with `as`, which works between number types only:

```kursal
use std::io::print;

fn main() {
    let wide = 300u32;
    let narrow = wide as u8;           // 44: keeps the low bits
    let neg = -1i32 as u32;            // 4294967295
    let f = 3.99f64 as i32;            // 3: toward zero
    let sat = 1e20f64 as i32;          // saturates
    let back = 7u8 as f64;
    print(f"{narrow} {neg} {f} {sat} {back}\n");
}
```

```text
44 4294967295 3 2147483647 7
```

- Integer to integer keeps the low bits.
- Float to integer goes toward zero, saturates at the ends, and turns NaN into 0.
- Integer to float rounds to the nearest value.

`as` binds tighter than the arithmetic operators, so `a + b as u64` converts only `b`. `bool` is not a number, so `true as u8` is rejected. Write `if b { 1u8 } else { 0 }`.

## Integer arithmetic

Every integer operation is defined for every pair of operands. No input is undefined behaviour. For a type of N bits:

- `+`, `-` and `*` wrap modulo 2^N, signed and unsigned alike. `127i8 + 1i8` is `-128` and `0u8 - 1u8` is `255`. Nothing is detected or reported when an operation wraps.
- `-x` means `0 - x`, so negating the smallest value of a signed type gives that same value back.
- `/` rounds toward zero, so `-7i32 / 2i32` is `-3`. The smallest signed value divided by `-1` wraps to the smallest value.
- `%` is `x - (x / y) * y`, so it takes the sign of `x`: `-7i32 % 2i32` is `-1`. The smallest signed value `% -1` is `0`.
- `/` or `%` by zero **traps**: the program stops. It does not produce an error value. The trap happens wherever the operation is evaluated, even when its result is not used.
- In `<<` and `>>`, the shift amount is taken modulo N, as a two's-complement value. An amount of N or more, or a negative one, shifts by its low bits: `1u64 << 65u64` is `2` and `1i8 << -1i8` is `-128`.
- `>>` on a signed type is arithmetic: `-128i8 >> 1i8` is `-64`.

Constant expressions give the same results as the same code at run time. The one difference is that dividing by a constant zero is rejected when you build:

```text
constant division by zero
```

For `usize` and `isize`, only a literal or constant `0` divisor is caught at compile time. A divisor that only becomes zero when it is computed traps at run time.

## Check by hand

Every arithmetic operator has the same type on both sides. You can see that from the signatures and the suffixes on the literals. Wherever a `/` or `%` appears, its divisor is the place the program can stop.

Next: [Bindings and control flow →](/book/bindings/)
