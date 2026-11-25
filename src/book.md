+++
layout = "page.html"
section = "book"
title = "The kursal book"
eyebrow = "Layer 3 of 3"
intro = "The whole language, in the order you need it. Part 1 is the everyday language. Part 2 is resources: places, brands, capabilities, unsafe and threads."
permalink = "/book/"
+++

The [quick start](/start/) gets a program running and the [quick guide](/guide/) explains the ideas. This book is the language itself: every form you can write, what the compiler checks about it, and how you can tell by looking whether a piece of code will pass.

## How to read it

Each chapter introduces a few forms, shows a complete program for them, and shows what the compiler says when you get one wrong. Everything on these pages was built and run with the kursal compiler. The error messages are real ones, with each path shortened to the file's place in its package, such as `lib.kur:line:col` or `src/lib.kur:line:col`.

Most chapters end with a short **check by hand** note: what you would look at to decide, without the compiler, whether the code is accepted. That is the habit the language is built around.

The book covers the language only. Examples use the standard library (`print`, `Buffer!`, `range` and so on; `print(x)` takes any value of a type with a `Printable` instance, and a `Buffer!` printed this way is freed) and say in a line what each piece does, but they do not document it. The full library reference will live at docs.kursal.dev.

kursal has not had a 1.0 yet. Where a feature is likely to change, the chapter says so.

## Part 1: the everyday language

1. [Getting started](/book/start/): packages, `kursal build`, the shape of `main`, files as modules.
2. [Values and operators](/book/values/): numbers, bytes, strings, tuples, arrays, precedence and `as`.
3. [Bindings and control flow](/book/bindings/): `let` and `var`, functions, `if`, `while`, `return`, `const`, `!`.
4. [Structs, enums and match](/book/shapes/): declaring data, building it, taking it apart.
5. [Methods](/book/methods/): `impl`, `self` and `&self`, associated functions and constants.
6. [Linear types](/book/linear/): used exactly once, on every path.
7. [Generics and traits](/book/traits/): `forall`, `where`, instances, and when a call is resolved.
8. [Option, Result and `?`](/book/option/): absence and failure as values.
9. [Closures and function values](/book/closures/): captures, and what a linear capture does.
10. [`for` and f-strings](/book/iteration/): two pieces of syntax that call a trait.
11. [Modules, packages and encapsulation](/book/modules/): `use`, `export`, dependencies, and who may build a type.

## Part 2: resources and contracts

12. [Places and lending](/book/places/): `&` parameters, moving out and restoring, and why there are no references.
13. [Brands and existentials](/book/brands/): `'k`, `exists`, `pack`, and values that belong together.
14. [Capabilities in practice](/book/capabilities/): handles that grant nothing, linear capabilities that grant access.
15. [Unsafe and raw pointers](/book/unsafe/): one operation at a time, and the obligation each one carries.
16. [Calling C with extern](/book/extern/): declaring, linking and calling foreign functions.
17. [foreach traversal](/book/foreach/): code that visits every field. Advanced, and likely to change.
18. [Concurrency](/book/concurrency/): moving ownership into threads, and sharing through capabilities.
19. [How checking works](/book/checking/): local checking, place state, and the independent core checker.

## Appendices

- [A. Keywords and operators](/book/keywords/): every reserved word, and operator precedence.
- [B. Grammar summary](/book/grammar/): the surface syntax in one place.
- [C. Glossary](/book/glossary/): the terms this book uses.
