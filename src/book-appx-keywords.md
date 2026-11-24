+++
layout = "page.html"
section = "book"
title = "Appendix A: Keywords and operators"
eyebrow = "Book · Appendix A"
intro = "Every reserved word, and every operator from tightest to loosest."
permalink = "/book/keywords/"
+++

### Keywords

These words are reserved everywhere. None of them can name a variable, field, function, method or
type.

```
use      export   module   struct   tuple    enum     fn       extern   impl
trait    instance const    forall   where    as       exposed  unsafe   closure
exists   foreach  of       in       for      while    if       else     match
let      var      return   pack     true     false    self     _
```

- **`module` is reserved and has no use.** No form of the language contains it. As an item it gives
  ``lib.kur:1:1: `module` is a reserved keyword``, and as a name (`let module = 1u32;`) it is a
  syntax error.
- `self` is a keyword, not a name. It can only be a method's first parameter (`self`, `&self`,
  `self: T`), a path in an expression (`self.n`), or the pattern of a rebinding, `var self = self;`.
- `_` is the wildcard. It can be a pattern (`let _ = ...`), the last match arm (`_ =>`), a binder in
  a case (`Rect(w, _)`), or an
  unnamed place slot in a function type (`&_: C`).
- A keyword never takes the `!` of a linear type's name. `return!x` reads as `return !x`.
- These are ordinary names, not keywords: `package` (the root of the current package in a path),
  `Self` (a conventional trait parameter name), the primitive type names, and `Copy`, `Exposed`,
  `Sized` and `Never`, which are always in scope. `let package = 1u32;` compiles.
- The brand `'static` is predefined. It cannot be a brand parameter: `forall 'static.` is rejected
  with `type formation: static is not a parameter name`.

### Operators, from tightest to loosest

| Level | Operators | Associativity | Example and what it means |
|---|---|---|---|
| 1 | `Path.{ ... }` struct literal, `Path.( ... )` construction | none | `Point.{ x: 1, ..rest }`, `Option::Some.(x)` |
| 2 | postfix: `.name` field or method, `.N` tuple element, `( ... )` call, `?` | left to right | `half(n)? + 1` is `(half(n)?) + 1`. A `.N` cannot follow another `.N`: write `(p.0).1`, since `p.0.1` is a syntax error |
| 3 | prefix: `-` negate, `!` not, `*` raw read, `&` lend, `unsafe` | right to left (nest) | `-p.x` is `-(p.x)`. `&a.tick()` lends `a` as the receiver of `tick`. `unsafe` covers its operand only: `unsafe f(x)` covers the call |
| 4 | `as` Type | left to right | `!0u8 as u32` is `(!0u8) as u32`, which is 255. `x as u8 as u32` is `(x as u8) as u32` |
| 5 | `*` `/` `%` | left | `100 / 10 / 5` is 2 |
| 6 | `+` `-` | left | `10 - 3 - 2` is 5 |
| 7 | `<<` `>>` | left | `1 << 2 + 1` is `1 << 3` |
| 8 | `&` bitwise and | left | `6 & 1 << 1` is `6 & 2` |
| 9 | `^` | left | `6 ^ 3 & 1` is `6 ^ 1` |
| 10 | `\|` | left | `1 \| 1 ^ 1` is `1 \| 0` |
| 11 | `==` `!=` `<` `<=` `>` `>=` | **none: comparisons do not chain** | `1 < 2 < 3` is a syntax error. Write `a < b && b < c` |
| 12 | `&&` | left | `a && b` evaluates `b` only when `a` is true |
| 13 | `\|\|` | left | `true \|\| false && false` is `true \|\| (false && false)` |

**Bitwise operators bind tighter than comparisons**, unlike in C. `x & 1 == 1` means `(x & 1) == 1`,
and `a | b == 3` means `(a | b) == 3`.

**Whole-expression forms** are looser than every operator, and they appear only where a whole
expression is expected: an argument, an initializer, a block's tail, a match arm, a parenthesized
expression. These are block-likes (`{ }`, `if`, `match`, `while`, `for`, `foreach`), closures,
`return` and `pack`. As an operand of an operator, one needs parentheses: `1u32 + if c { 1 } else { 2 }`
is a syntax error, and `1u32 + (if c { 1 } else { 2 })` is fine. A closure body, a `return` value
and a `pack` value extend as far right as they can: `|x: u32| x + 1 * 2` is `|x| (x + (1 * 2))`.

**`&` lends.** The prefix `&` is accepted only as a call argument (`f(&x)`), on a method call's
receiver (`&x.m()`), as a match scrutinee (`match &x`), after `for x in`, and as an f-string's `{&x}`.
Anywhere else, the compiler gives ``& lends a place only as a call argument `f(&x)`, a receiver `&x.m()` or a match scrutinee `match &x` ``.
A lend in parentheses is no receiver: `(&x).m()` and `(unsafe &*p).m()` are rejected. Write
`&x.m()` and `T::m(unsafe &*p)`.

**`unsafe` scope.** Because `unsafe` is a prefix operator, `unsafe p as usize` authorizes only `p`,
and the cast is rejected with ``a safe `as` converts only between number types and from a NonNull to
its pointer; any other cast reinterprets bits and needs unsafe``. Write `unsafe (p as usize)`.
A store through a pointer is the statement `unsafe *p = v;`. `*p = v;` without it is a syntax error.

**Tokens that are not expression operators:**

| Token | Where it appears |
|---|---|
| `..` | an array's fill, `[0u8, ..]` (repeat the last element to the length); a spread in a struct literal, `Point.{ x: 0, ..rest }`; the rest of a struct pattern, `let { x, ..rest } = p;`. `1..3` is a syntax error. Ranges are library calls, such as `range(0, n)` |
| `..=` | an inclusive range in a match case only: `b'0'..=b'9' =>` |
| `=` | assignment, a statement: `x = e;`, `p.f = e;`, `(t.0).1 = e;`, `unsafe *p = e;` |
| `=>` | a match arm, and the body of a `foreach` type: `foreach F of S => B` |
| `->` | a result type; the determined parameters in `forall Self -> Out.` and in `Iterator[I -> u32]` |
| `::` | a path: `std::io::print_buffer`, `Counter::new()`, `Option[u32]::None` |
| `\|` in patterns | the alternatives of a match case: `b'a'..=b'z' \| b'A'..=b'Z' =>` |
| `\|...\|`, `\|\|` | a closure's parameters |
| `.{`, `.(` | struct literal and construction (one token each), so `if x {` and `match x {` never read `x {` as a literal |
| `!` after a type name | part of the name: `Buffer!`. After a name, `!=` is the operator, so `a!=b` is `a != b` |

There is no indexing operator. `a[i]` is not an expression, since `[` after a name starts type
arguments. There is no `+=` or other compound assignment, and no `++`.

Next: [Appendix B: Grammar summary →](/book/grammar/)
