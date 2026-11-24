+++
layout = "page.html"
section = "more"
title = "What each idea catches"
eyebrow = "Understand"
intro = "The compiler's actual messages, grouped by the idea that produces them, and how the ideas depend on one another."
description = "What kursal's linear types, places, brands, capabilities, encapsulation, and unsafe contracts each catch, and how they fit together."
permalink = "/ideas/"
+++

Each idea in kursal exists to rule out a specific mistake. Here is what the mistakes look like in practice. Messages are copied from the compiler, with long paths shortened. The [guide](/guide/) builds every one of them from scratch.

| You wrote | The compiler says | Idea |
| --- | --- | --- |
| A handle that is never closed | `linear value 'h' is not consumed before return` | [Linear types](/guide/linear/) |
| A handle closed twice | `value 'a' has been moved or is only partially available` | [Linear types](/guide/linear/) |
| A branch that closes it on one side only | `linear value 'h' remains live on some paths to …` | [Linear types](/guide/linear/) |
| A callee that keeps a lent value | `lent value 'h' must be restored before return` | [Places](/guide/places/) |
| The same place lent twice in one call | `'h' overlaps another place the same call lends` | [Places](/guide/places/) |
| A stale reference after the container changed | `brand mismatch: 'b and 'a; 'b was opened at 15:5, 'a at 13:5` | [Brands](/guide/graph/) |
| A write through a read-only capability | `no instance of Access[Shared!['k, 'l], 'k, _]` | [Capabilities](/guide/readers/) |
| Closing a resource while readers are out | `value 'exclusive' has been moved or is only partially available` | [Capabilities, through linearity](/guide/resource/) |
| Taking apart a type you don't own | `the shape of std::io::File! is not exposed here` | [Encapsulation](/guide/resource/) |
| A raw operation without `unsafe` | `calling an unsafe function requires unsafe authorization` | [Contracts](/guide/unsafe/) |

The write-through-a-reader message is the least friendly one. It means the call needs something that holds the domain's `Exclusive!`, and a reader holds none.

## How the ideas depend on each other

The ideas aren't a menu. Each one is there because the one before it leaves a gap, and several only work in combination.

**Linear types make places worth having.** Without lending, looking at a linear value means handing it in and getting it back with the answer. `&` lets a function inspect or update a resource and return it untouched, so linear values stay practical.

**Linear types are what make capabilities mean something.** The right to write a memory domain, `Exclusive!`, is itself linear. Sharing it consumes it, and the only way to get it back is to join every reader and hand the root to the receipt. If it were an ordinary copyable value, anyone could keep a spare and the rest of the scheme would fall apart.

**Brands make copying safe.** A `Ref` can be copied freely because it carries a brand and grants nothing. The brand ties it to a capability for the same domain. When a container hands itself back under a new brand, every old `Ref` stops type-checking, which is how a stale pointer becomes a compile error.

**Encapsulation keeps the brand honest.** A module returns its brand sealed in `exists`, so no caller can name it in advance, and hides the struct shapes, its own and `Exclusive!`’s, that would let a caller forge a handle or a capability. That is how a resource module makes its guarantees hold for every caller instead of only the careful ones.

**`unsafe` is where the contract is stated.** Under every safe abstraction there is a small amount of raw memory work, marked at each site. The module states its promise once. Capabilities then prove how access tokens are used, and the module's constructor is what establishes that the underlying pointer really was uniquely owned.

**KURS checks all of it again.** Every idea lowers to the same small core, where each block says what is full, empty and lent. A front-end bug that lets a bad program through shows up as a disagreement with the core checker, not as a miscompiled program.

## The test behind all of it

Each rule has to pass one test: can you look at a function and tell whether the checker will accept it? Linearity is visible in type names. A call is judged from the call site and the callee's signature, never the callee's body. A struct's shape can only be built or taken apart in its own module unless it is `exposed`.

The test is about locality, not simplicity. Whether a line is legal can depend on what the code above it moved or lent, and on which trait instances exist elsewhere in the program. It never depends on another function's body. That is the line the language holds, and it is why features are cut when they would break it.
