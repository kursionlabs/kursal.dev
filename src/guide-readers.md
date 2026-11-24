+++
layout = "page.html"
section = "guide"
title = "Many readers"
eyebrow = "Guide · 5 of 8"
intro = "Two walks read the shared graph, then the program writes to it again."
permalink = "/guide/readers/"
+++

Reading a graph does not need exclusive rights. Many readers at once is fine, as long as nobody writes while they do. Kursal expresses that with a **read tree**.

Sharing turns the writer into the root of a tree of read-only capabilities. The root can be split into two halves, each of which can read, and each split hands back a **receipt** for putting the halves back together. Once everything has been joined back into the root, the writer can resume.

The imports and `Node` are as in step 4, plus `Shared!`:

```kursal
// Any node of the read tree lets `walk` read; none lets it write.
forall 'k, 'q.
fn walk(&view: Shared!['k, 'q], at: Ref[Node['k], 'k], steps: u32) -> u64 {
    var here = at;
    var sum = 0u64;
    var i = 0u32;
    while i < steps {
        let node = here.read(&view);
        sum = sum + node.id;
        match node.next {
            Some(n) => { here = n; },
            None => { i = steps; },
        };
        i = i + 1;
    }
    sum
}

fn main() {
    let exists 'k. (tag, arena) = Arena!::new(hash_seed());
    let a = &arena.alloc(&tag, Node.{ id: 1, next: Option::None });
    let b = &arena.alloc(&tag, Node.{ id: 2, next: Option::Some.(a) });
    a.set(&tag, Node.{ id: 1, next: Option::Some.(b) });

    // Share: the writer becomes the root of a read tree, split in two.
    let exists 'q. (root, resume) = tag.share();
    let exists 'l, 'r. (left, right, join) = root.split();
    let from_a = walk(&left, a, 3);
    let from_b = walk(&right, b, 3);

    // Thaw: both halves go back through the receipts, then the writer is back.
    let tag = resume.resume(join.join(left, right));
    a.set(&tag, Node.{ id: 10, next: Option::Some.(b) });
    let after = walk_once(&tag, a);
    arena.destroy(tag);
    print_buffer(f"from a: {from_a}, from b: {from_b}, a after the write: {after}\n");
}

forall 'k.
fn walk_once(&tag: Exclusive!['k], at: Ref[Node['k], 'k]) -> u64 {
    at.copy(&tag).id
}
```

It prints `from a: 4, from b: 5, a after the write: 10`.

## What the checker refuses

Writing through a reader has no way to type-check:

```
lib.kur:43:5: no instance of Access[Shared!['k, 'l], 'k, _]
```

In plain words: writing needs something that holds the domain's `Exclusive!['k]`; that is what the trait `Access` describes. A `Shared!` reader holds no `Exclusive!`, so there is no `Access` instance for it and the call cannot type-check.

Resuming from only one leaf is also rejected, because the root's brand and the leaf's brand are different:

```
lib.kur:45:15: brand mismatch: Shared!['k, 'l] and Shared!['k, 'q]; 'l was opened at 40:5, 'q at 39:5
```

## Fine print

- A read tree is a type-level permission. It is not thread synchronization, and capabilities have no send rule. Do not read "readers" as "threads".
- There is no scoped "with readers" form. The protocol is flat: share, split, read, join, resume.

## Check it in your head

Every `split` returns a `join` receipt that names the parent and both children, and `resume` takes exactly the root's brand. So the writer can come back only after every reader has been joined, and you can see that by following the receipts.

## What this leaves open

All of this so far is library code. The arena, the capabilities and the read tree are written in Kursal on top of something. How does that code touch raw memory and C?

Next: [`unsafe`, as a stated contract →](/guide/unsafe/)

Examples: [`examples/mem_shared_view`](https://github.com/kursionlabs/kursal/tree/main/examples/mem_shared_view), [`examples/generic_capabilities`](https://github.com/kursionlabs/kursal/tree/main/examples/generic_capabilities) and [`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph). The doc comments in [`lib/core/cap.kur`](https://github.com/kursionlabs/kursal/blob/main/lib/core/cap.kur) explain the lineage and the join receipts.
