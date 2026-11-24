+++
layout = "page.html"
section = "guide"
title = "A graph"
eyebrow = "Guide · 4 of 8"
intro = "A cyclic graph needs pointers you can copy. Brands and capabilities decide who may use them."
permalink = "/guide/graph/"
+++

A graph node points at other nodes, possibly back at itself through a cycle. That needs two things that the last step cannot give:

- a pointer you can **copy** and store, and
- a way to say **who may read and write** through it, because copyable pointers on their own would be a free-for-all.

kursal splits the pointer from the authority to use it.

- `Ref[T, 'k]` names a place holding a `T` in a memory domain `'k`. It is copyable, and by itself it grants nothing.
- `Exclusive!['k]` is the one linear right to read and write domain `'k`.
- `let exists 'k.` opens a **brand**: a fresh `'k` that no other value has.

```kursal
use std::arena::Arena!;
use std::cap::Exclusive!;
use std::mem::Ref;
use std::io::print_buffer;
use std::option::Option;
use std::process::hash_seed;

// A node points at another through a `Ref`: Copy, and no authority of its own.
forall 'k.
exposed struct Node {
    id: u64,
    next: Option[Ref[Node['k], 'k]],
}

// Follows `steps` links from `at`. Reading needs the domain's capability.
forall 'k.
fn walk(&tag: Exclusive!['k], at: Ref[Node['k], 'k], steps: u32) {
    var here = at;
    var i = 0u32;
    while i < steps {
        let node = here.copy(&tag);
        print_buffer(f"{node.id} ");
        match node.next {
            Some(n) => { here = n; },
            None => { i = steps; },
        };
        i = i + 1;
    }
    print_buffer(f"\n");
}

fn main() {
    // A fresh brand 'k, the one capability for it, and an arena in it.
    let exists 'k. (tag, arena) = Arena!::new(hash_seed());
    let a = &arena.alloc(&tag, Node.{ id: 1, next: Option::None });
    let b = &arena.alloc(&tag, Node.{ id: 2, next: Option::Some.(a) });
    a.set(&tag, Node.{ id: 1, next: Option::Some.(b) });   // closes the cycle
    walk(&tag, a, 5);
    arena.destroy(tag);
}
```

It prints `1 2 1 2 1 `, with a trailing space and then a newline. The graph is a cycle, and `walk` goes around it five steps.

Two details of the syntax: in an expression you write `Option::Some.(x)` and `Option::None`. A bare `None` is `unknown name None`. In a `match` case, bare `Some(x)` works.

## What the brand does

Every access through a `Ref[_, 'k]` names a capability whose type has the same `'k`. The `'k` is fresh for this `let exists`, so a reference from one arena cannot be used with another arena's capability. The checker compares them as types:

```
lib.kur:8:13: brand mismatch: 'b and 'a; 'b was opened at 6:5, 'a at 5:5
```

Linearity does the rest. Destroying the arena consumes its capability, so any read afterwards has no capability to lend:

```
lib.kur:8:13: s4a::main: value 'tag' has been moved and cannot be lent
```

The repository has failing versions. `examples/bad/ref_after_remove_in.kur` reports `17:28: brand mismatch: 'b and 'a; 'b was opened at 15:5, 'a at 13:5`. `examples/bad/linear_in_arena.kur` reports `type argument must satisfy Copy`, since the arena holds copyable values. `examples/bad/function_value_at_two_brands.kur` reports `22:36: brand mismatch: Tag!['b] and Tag!['a]; 'b was opened at 20:5, 'a at 19:5`.

## What it costs and what it doesn't

- Brands and capabilities take no bytes. Their `sizeof` is 0 and they are erased in the generated C (see `examples/zero_size`). That is a statement about size, not a promise about speed.
- The arena holds only copyable values, read and written whole, and nothing is freed before `destroy`.
- A stale `Ref` can still exist after `destroy`. What is gone is any capability that could use it.
- A function value has no brand parameters of its own. Its brand is fixed where it is named.

## Check it in your head

Look at the signatures. Every use of a `Ref[_, 'k]` has to be paired with a capability whose type mentions the same `'k`. Each `let exists` brand matches nothing else, so mixing two domains shows up as a mismatch between two names you can read.

## What this leaves open

There is one writer at a time. How do several readers look at once, and how does the writer come back?

Next: [many readers →](/guide/readers/)

Examples: [`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph), [`examples/dlist`](https://github.com/kursionlabs/kursal/tree/main/examples/dlist), [`examples/skolems`](https://github.com/kursionlabs/kursal/tree/main/examples/skolems) and [`examples/arena_tables`](https://github.com/kursionlabs/kursal/tree/main/examples/arena_tables).
