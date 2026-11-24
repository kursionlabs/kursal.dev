+++
layout = "page.html"
section = "book"
title = "Capabilities in practice"
eyebrow = "Book · Part 2 · Chapter 14"
intro = "A reference that grants nothing, a linear capability that grants access, and a brand that ties them together."
permalink = "/book/capabilities/"
+++

Most of this chapter is the standard library, and not the language. It shows what the language's pieces add up to. The [quick guide](/guide/graph/) builds the same ideas step by step, and this chapter pins down the vocabulary.

## The pattern

1. A **Copy handle** names something and grants nothing. In std's arena it is `Ref[T, 'k]`, which can be copied freely, stored in other values and put into cycles.
2. A **linear capability** grants access. `Exclusive!['k]` lets its holder read and write what brand `'k` covers. `Shared!['k, 'q]` is a node of a tree of readers.
3. A **brand** `'k` ties the two. A `Ref[T, 'k]` can only be used with a capability for `'k`.

Because the capability is linear and the handle is not, copying handles is free and the question "who may touch this memory right now?" has one answer in the program text: whoever holds the capability.

## One arena, one writer, a tree of readers

`std::arena::Arena!::new(seed)` returns `exists 'k. (Exclusive!['k], Arena!['k])`. `alloc` stores a Copy value and returns a `Ref[T, 'k]`. `copy` and `set` need the writer, and `read` needs any reader. These four are library functions.

```kursal
use std::io::print_buffer;
use std::arena::Arena!;
use std::process::hash_seed;

fn main() {
    // An arena and the one Exclusive! capability of its fresh brand 'k.
    var exists 'k. (tag, arena) = Arena!::new(hash_seed());
    // A Ref is Copy and grants nothing; each access shows the capability.
    let a = &arena.alloc(&tag, 10u32);
    let b = &arena.alloc(&tag, 20u32);
    a.set(&tag, a.copy(&tag) + 1);           // writing needs &Exclusive!

    // Trade the writer for a tree of readers, and split it in two.
    let exists 'q. (root, resume) = tag.share();
    var exists 'l, 'r. (left, right, join) = root.split();
    let sum = a.read(&left) + b.read(&right); // either leaf may read

    // Only the two leaves of this split rejoin, and only the root resumes.
    let tag = resume.resume(join.join(left, right));
    arena.destroy(tag);
    print_buffer(f"{sum}\n");
}
```

```text
31
```

Read it as a protocol.

- `a.set(&tag, ..)` lends the writer to one call. Without it there is no way to write.
- `tag.share()` **consumes** the writer and gives back the root of a read tree, `root`, and a `resume` token for getting the writer back.
- `root.split()` consumes the root and gives two leaves and a `join`. Either leaf may read. Neither may write.
- `join.join(left, right)` takes the two leaves back, and `resume.resume(..)` turns the root back into the writer. Only then can `arena.destroy(tag)` run.

While readers are out there is no writer, because the writer was consumed. The checker never reasons about data races. It sees a linear value that was handed over.

Writing with a leaf fails because a reader has no write access. `set` takes any context that lends the writer, which std expresses with its `Access` trait (`core::cap`), and a `Shared!` leaf is not such a context.

Resuming from the wrong thing is an ordinary brand mismatch:

```kursal
let tag = resume.resume(left);
```

```text
lib.kur:19:15: brand mismatch: Shared!['k, 'l] and Shared!['k, 'q]; 'l was opened at 15:5, 'q at 14:5
  19 |     let tag = resume.resume(left);
     |               ^
```

There is no special rule for it. `resume` wants the root's brand `'q`, and `left` is a leaf of brand `'l`.

## A capability cannot be forged

The capability types hide their shape. Only the module that declares them can build one, and the only safe way to get one comes with a fresh brand. Building one from a brand read off a `Ref` fails:

```text
lib.kur:21:19: the shape of core::cap::Exclusive! is not exposed here
  21 |     arena.destroy(Exclusive!.{ marker: a.into_parts().1 });
     |                   ^
```

That is the encapsulation of chapter 11 doing the work of a capability system. A brand witness plus a hidden shape is all it takes.

## A bigger example

[`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph) builds a cyclic graph in one arena with no `unsafe`, walks the cycle, and edits the graph again. It prints:

```text
from node 0, around the cycle 0 -> 1 -> 2 -> 0 and on to 3: 4 nodes
from node 3: 1 node
from node 0, once 3 -> 4 is added: 5 nodes
```

Its wrapper type takes its capability and arena apart inside a `&self` method, uses them, and puts them back (`self = Mem!.{ tag, arena };`), which is the "move out and restore" of chapter 12.
[`examples/generic_capabilities`](https://github.com/kursionlabs/kursal/tree/main/examples/generic_capabilities) shows a user-written resource over a raw heap pointer, gated by the same capabilities.

## What the language does not do

The types prove how access tokens are used. They do not prove that a pointer or an operating-system object was uniquely owned when it was branded. **A resource's own module must make every safe access path demand the capability.** That is the library author's obligation, and it is checked by hand. A shape visible only inside a package, written `exposed (package)`, is how a library keeps its own capability internals out of reach.

Capabilities are not a runtime mechanism either. They take no space, and nothing is checked when the program runs.

## Check by hand

For a library author: every function that touches the protected memory takes the capability of the right brand, and no function turns a `Brand['k]` into a capability. For a user: read what each call needs, and where the capability goes between uses.

Next: [Unsafe and raw pointers →](/book/unsafe/)
