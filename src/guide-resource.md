+++
layout = "page.html"
title = "Your own resource"
eyebrow = "Guide · 7 of 8"
intro = "Wrap a heap counter once, behind a module, so every safe caller is correct."
permalink = "/guide/resource/"
+++

The `unsafe` contract in the last step is stated at each use. A resource module states it once, at the boundary, and makes the type system hold it for everyone outside. Three pieces do that.

- **Encapsulation.** A struct that is not `exposed` cannot be built or taken apart outside its module. Callers can only get one by calling the module's functions.
- **A sealed brand.** A function returning `exists 'r. ...` and finishing with `pack 'r.` hands back a brand that nobody can name in advance.
- **`close` wants the capability back.** To free the resource, you have to hand over the capability for its brand, which means nobody else holds it.

The package has two modules. `kur.toml` sets `entry = "app::main"`, and `lib.kur` is `use package::counter; use package::app;`. The counter module is `examples/generic_capabilities/lib.kur`, trimmed:

```kursal
// ... (from examples/generic_capabilities/lib.kur, trimmed)
forall 'r.
struct CounterOwner! {
    storage: Uninit!,
    marker: Brand['r],
}

forall 'r.
struct CounterView {
    ptr: *u32,
    marker: Brand['r],
}

fn new_counter(initial: u32) -> exists 'r. (CounterOwner!['r], CounterView['r], Exclusive!['r]) {
    // ... unsafe allocation and initialization, then:
    let exists 'r. (brand, exclusive) = Exclusive!::fresh();
    pack 'r. (CounterOwner!.{ storage, marker: brand }, CounterView.{ ptr, marker: brand }, exclusive)
}

forall 'r.
impl CounterOwner!['r] {
    fn close(self, exclusive: Exclusive!['r]) -> () { /* ... frees, retires */ }
}

forall 'r.
impl CounterView['r] {
    forall 'q.
    fn read(self, &shared: Shared!['r, 'q]) -> u32 { /* ... unsafe *ptr */ }
    fn write(self, &exclusive: Exclusive!['r], value: u32) -> () { /* ... */ }
}
```

And the application, which uses no `unsafe` at all:

```kursal
use std::io::print_buffer;
use package::counter::new_counter;

fn main() {
    let exists 'r. (owner, view, exclusive) = new_counter(10);
    view.write(&exclusive, 32);
    let exists 'q. (root, resume) = exclusive.share();
    let exists 'a, 'b. (left, right, join) = root.split();
    let a = view.read(&left);
    let b = view.read(&right);
    let exclusive = resume.resume(join.join(left, right));
    owner.close(exclusive);
    print_buffer(f"{a} + {b}\n");
}
```

It prints `32 + 32`.

The owner is a linear value, so it has to be closed. The view is copyable, so any number of places can hold it, but a view alone reads or writes nothing: every access wants a capability for the same brand. The `exists` seals that brand, so a view from one counter cannot be used with another's capability.

## What the checker refuses

From outside the module you cannot take a view apart or forge a capability:

```
app.kur:7:5: the shape of step7a::counter::CounterView is not exposed here
app.kur:8:18: the shape of core::cap::Exclusive! is not exposed here
```

The first is `let { ptr, marker } = view;`, and the second is a forged `Exclusive!.{ marker: k }`. The same refusal is how `std::io::File!` is protected; `examples/bad/forged_file.kur` reports `the shape of std::io::File! is not exposed here`.

Closing the counter while readers are still out is rejected, because the capability they were split from is not back yet:

```
app.kur:9:17: step7c::app::main: value 'exclusive' has been moved or is only partially available
```

The repository has more such programs: `examples/bad/implicit_package_open.kur` (`pattern does not match exists '1. (Tag!['1], u32)`), `unbound_result_brand.kur` (`brand '1 is not in scope`) and `release_linear.kur`.

The same pattern, in the standard library, is `Owned!`, then `open`, which gives an `Allocation!` and a `Region!`, then the `Allocation!`'s `close(region)`, which gives back the `Owned!`, and `into_value`.

## What it is not

- Privacy covers struct shapes and modules. There is no item-level privacy. A module's internal raw-pointer helpers are guarded by being `unsafe fn`, not by being hidden.
- Capabilities prove how access tokens are used. They do not prove that a pointer or an OS object was uniquely owned when it was branded. The resource module's unsafe constructor still has to establish that, which is the contract from the last step.
- `Exclusive!::fresh` is the only source of an `Exclusive!`.

So this does not make a resource correct. It makes **one small place** responsible for it, and makes the rest of the program unable to get it wrong in the ways this page lists.

## Check it in your head

From the signatures alone: `new_counter`'s brand is fresh, because it is sealed in `exists`. `close` needs `Exclusive!['r]`. And `share` and `resume` make that capability unavailable while any reader lives. You do not need to read the unsafe bodies to know what a caller can and cannot do.

## What this leaves open

We have said what the checker does. What is actually checked, and how small is it?

Next: [the checker you can run in your head →](/guide/kurs/)

Examples: [`examples/generic_capabilities`](https://github.com/kursionlabs/kursal/tree/main/examples/generic_capabilities), [`examples/stock`](https://github.com/kursionlabs/kursal/tree/main/examples/stock), [`examples/shop`](https://github.com/kursionlabs/kursal/tree/main/examples/shop), [`examples/mem_counter`](https://github.com/kursionlabs/kursal/tree/main/examples/mem_counter) and [`examples/mem_shared_sum`](https://github.com/kursionlabs/kursal/tree/main/examples/mem_shared_sum). See also [`lib/core/mem.kur`](https://github.com/kursionlabs/kursal/blob/main/lib/core/mem.kur) and [`lib/core/cap.kur`](https://github.com/kursionlabs/kursal/blob/main/lib/core/cap.kur).
