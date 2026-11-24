+++
layout = "page.html"
title = "Quick guide"
eyebrow = "Layer 2 of 3"
intro = "Eight short steps. Each starts with a job a program has to do, shows what goes wrong, and adds the one idea that fixes it."
permalink = "/guide/"
+++

This guide builds the language's central ideas in the order you would need them. It starts with a handle that is just a number, and ends at the small core language the checker really runs on. No step assumes more than the one before it, and each ends by naming the question the next one answers.

Every program on these pages was built and run with the Kursal compiler, and the error messages are real ones. Where a snippet is trimmed, it says so. Paths in messages are shortened to `lib.kur:line:col`.

The guide borrows its method from [Austral](https://austral-lang.org/)'s tutorial, which introduces linear types by need, one at a time. Austral was the spark for Kursal: it showed that you don't have to boil the ocean to get safety.

## The steps

1. [A handle is a number](/guide/handles/): a C-style handle that must be closed exactly once, and nothing that makes sure it is.
2. [Linear types](/guide/linear/): the same handle, now used exactly once on every path.
3. [Looking without consuming](/guide/places/): asking a handle a question without giving it away.
4. [A graph](/guide/graph/): pointers that can be copied, and a capability that controls who may read and write.
5. [Many readers](/guide/readers/): several walks over a shared graph, then the writer again.
6. [`unsafe` as a stated contract](/guide/unsafe/): calling C, reading raw memory, and saying what you promise.
7. [Your own resource](/guide/resource/): wrapping that contract once, so every safe caller is correct.
8. [The checker you can run in your head](/guide/kurs/): what is actually checked, and how small the checker is.

## What to expect from it

Kursal is not memory safe by default. The language gives libraries the tools to build resource-safe abstractions, and it checks that a program uses them consistently. The guide is honest about where that stops. Steps 6 and 7 are about exactly that boundary.

The thread through all eight steps is one test: *can I look at a piece of code and tell whether it will pass the checker?* Each step ends with a short hand check, the thing you would look at to answer that for the idea just introduced.

[Start with step 1 →](/guide/handles/)
