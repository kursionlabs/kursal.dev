+++
layout = "page.html"
section = "more"
title = "Who owns a graph that points back at itself?"
eyebrow = "Walkthrough"
intro = "If every edge owned its destination, a cycle would make cleanup awkward. Here is how kursal handles it without lifetimes, reference counts, or unsafe."
permalink = "/walkthroughs/graph/"
+++

If A owns B, B owns C, and C owns A, following the edges tells you nothing about when to free the graph. Yet for many programs the answer is simple: build the graph for one job, walk it a few times, and release the whole thing. The edges describe connections. The job decides how long those connections need to exist.

[`examples/graph`](https://github.com/kursionlabs/kursal/tree/main/examples/graph) puts nodes and edges in one arena, a collection of allocations released together. That choice fixes who frees a node, and it has a cost: even a node the walk can no longer reach occupies memory until the arena is destroyed. What remains is making that choice checkable.

## What an edge stores

```kursal
forall 'k.
exposed struct Edge {
    to: Ref[Node['k], 'k],
    next: Option[Ref[Edge['k], 'k]],
}
```

An edge holds a reference to its destination and an optional link to the next outgoing edge. Read `'k` as "the domain this graph belongs to." The repeated parameter ties the destination, the list link, and their references to one domain. Two separately created graphs with identically shaped nodes still can't be confused: permission to use the first doesn't satisfy a call that needs permission for the second.

## Adding an edge

```kursal
forall 'k.
fn connect(&mem: Mem!['k], from: Ref[Node['k], 'k], to: Ref[Node['k], 'k]) -> () {
    let node = &mem.get(from);
    let edge = &mem.alloc(Edge.{ to, next: node.edges });
    &mem.set(from, Node.{ id: node.id, edges: Option::Some.(edge) });
}
```

Insertion prepends an edge to a node's list. Reading the old head, allocating the new cell, and replacing the head all need the context `mem`, and the caller lends it for the call. Closing a cycle is just three calls:

```kursal
connect(&mem, n0, n1);
connect(&mem, n1, n2);
connect(&mem, n2, n0);
```

`n0` appears twice and that's fine, because a node reference can be copied. Copying one gives you another name for the node. It doesn't give you another writer. Many edges can point at the same node, while every change still goes through one context.

## Starting a walk

A traversal reads edges, and a traversal that could also edit them might change which nodes it is about to visit. So the caller narrows the interface first:

```kursal
let { tag, arena } = mem;
let exists 'q. (view, resume) = tag.share();
var view = view;
let from_zero = reachable(&view, n0, 5usize);
let from_three = reachable(&view, n3, 5usize);
```

The first line takes the context apart. The second consumes the exclusive token and returns a reader and a receipt. The new name `'q` identifies this reader in the type system. Both walks lend the same reader, and neither receives the arena or the writer. The node references didn't change. What changed is the set of operations available to the walk, and you can see that from the signature of `reachable` before you read its algorithm.

The walk still updates its own stack and visited marks. Those belong to the walk, so it can change them without any permission to change the graph.

Why give the reader its own identity when the graph already has a brand? Because a reader can split into two. If either half alone could recover the writer, one caller could change or destroy storage while another still held read access. So a split also returns a join receipt tied to those halves, and only reassembling the root reader lets you write again. This example needs just one reader, but its calls obey the same rule.

## Getting the writer back

```kursal
var mem = Mem!.{ tag: resume.resume(view), arena };
```

Handing the reader and its receipt back rebuilds the context. The program then adds one more edge, 3 → 4, and walks from node 0 again. This time the walk reaches 5 nodes instead of 4. The old reader was consumed by `resume`, so that third walk asks for a new one with another `tag.share()`. After it, `resume` gives back the exclusive tag, and `arena.destroy(tag)` releases nodes and edges together.

The transitions are all explicit. The payoff is that a reviewer can see what any function is allowed to do to the graph from its signature alone.

[Graph source](https://github.com/kursionlabs/kursal/blob/main/examples/graph/lib.kur) · [Capability implementation](https://github.com/kursionlabs/kursal/blob/main/lib/core/cap.kur) · Next: [what if a thread doesn't start?](/walkthroughs/threads/)
