+++
layout = "page.html"
section = "book"
title = "Modules, packages and encapsulation"
eyebrow = "Book · Part 1 · Chapter 11"
intro = "How code is split across files and packages, and who is allowed to build and take apart a type."
permalink = "/book/modules/"
+++

## Importing

```kursal
use std::io::print;              // one name
use std::io::{eprint, print_buffer};    // several
use std::io::*;                  // everything in the module
use std::slice::Slice as View;   // under another name
use package::text as t;          // a module under another name
```

`package::` is the current package. A dependency is named by its key in the manifest, `std::` or `inventory::`. `export` takes the same forms and also makes the name a member of the module, so that other modules and packages can reach it through yours.

An alias keeps the `!` exactly when the original has one, because the `!` is part of the name:

```kursal
use inventory::stock::Stock! as Store!;    // fine
use inventory::stock::Stock! as Store;     // the alias Store of Stock! must end with !
```

## Packages

A manifest is checked when it is read, before its sources or dependencies are. A `[dependencies.NAME]` table has exactly one key, `path`: the dependency's directory, or its `kur.toml`, relative to the manifest. An executable needs an `entry`, and a library may not have one. Any other key is rejected:

```text
.../kur.toml: unknown manifest key version
```

Here is a library and an executable that uses it:

```toml
# inventory/kur.toml
[package]
name = "inventory"
kind = "library"
```

```kursal
// inventory/src/lib.kur
//! The root module re-exports what users of the package need.
export package::item::Item;
export package::stock;
```

```kursal
// inventory/src/item.kur
// `exposed`: any module may build an Item and read its fields.
exposed struct Item {
    id: u32,
    qty: u32,
}
```

```kursal
// inventory/src/stock/lib.kur
// A directory module: `stock/lib.kur` is module `stock`, and
// `stock/audit.kur` is its child `stock::audit`.
use package::item::Item;
use package::stock::audit::Record;

// No `exposed`: only this module sees the fields of a Stock!.
struct Stock! {
    total: u32,
    log: Record,
}

impl Stock! {
    fn new() -> Stock! {
        Stock!.{ total: 0, log: Record.{ entries: 0 } }
    }

    fn add(self, item: Item) -> Stock! {
        let { total, log } = self;
        Stock!.{ total: total + item.qty, log: Record.{ entries: log.entries + 1 } }
    }

    fn total(&self) -> u32 {
        self.total
    }

    fn close(self) -> u32 {
        let { total, log } = self;
        log.entries
    }
}
```

```kursal
// inventory/src/stock/audit.kur
// Exposed within `stock` and its children, and nowhere else.
exposed (package::stock) struct Record {
    entries: u32,
}
```

```toml
# app/kur.toml
[package]
name = "app"
kind = "executable"
entry = "main"
source_root = "src"

[dependencies.std]
path = "../kursal/lib/std"

[dependencies.inventory]
path = "../inventory"
```

```kursal
// app/src/lib.kur
use std::io::print_buffer;
use inventory::Item;
use inventory::stock::Stock! as Store!;   // an alias of a linear type keeps the `!`

fn main() {
    var s = Store!::new();
    s = s.add(Item.{ id: 1, qty: 5 });
    s = s.add(Item.{ id: 2, qty: 7 });
    let total = &s.total();
    let entries = s.close();
    print_buffer(f"{total} units in {entries} entries\n");
}
```

```text
12 units in 2 entries
```

## Who can see what

There are two separate questions, and they have separate answers.

**Which names can you reach?** Declarations (functions, structs, traits, constants) are always members of their module. You cannot mark one private.

- Inside one package, every module, its child modules and everything it imports can be reached by path.
- From another package, you can reach only a module's own declarations and what it `export`s. A child module has to be exported to be reachable, as `inventory` exports `stock` above. `stock` does not export `audit` in turn, so `use inventory::stock::audit::Record;` fails with `unknown or private member audit of stock`. Without the `export package::stock;` line, even `use inventory::stock::Stock!;` fails, with `unknown or private member stock of inventory`.

**Which modules can build and take apart a type?** That is its **shape**: constructing a value, reading its fields, destructuring it, and matching on it. It is decided by a modifier on the declaration:

- With no modifier, only the declaring module sees the shape.
- With `exposed`, every module does.
- With `exposed (path)`, the module `path` and everything below it do. The path has to be an enclosing module.

The type's name and its functions are usable wherever they are reachable, whatever the shape. `Stock!` has no modifier, so only the `stock` module can write `Stock!.{ .. }` or read `s.total`. A caller in another package has to go through the functions:

```kursal
use inventory::stock::Stock!;
fn main() {
    let s = Stock!::new();
    let t = s.total;
    let n = s.close();
}
```

```text
src/lib.kur:4:13: the shape of inventory::stock::Stock! is not exposed here
  4 |     let t = s.total;
    |             ^
```

This is what makes a linear type a real guarantee. Nobody outside `stock` can build a `Stock!` that skips `new`, and nobody can take one apart and keep the pieces, so the only things that can happen to a `Stock!` are the things `stock` offers. You can see that from the declaration's modifier and the `impl` block, without looking at the callers.

The same rule applies inside a package. Here `Gear` is exposed only under `engine`:

```kursal
// engine/part.kur
exposed (package::engine) struct Gear {
    teeth: u32,
}
```

```kursal
// lib.kur, outside engine
let g = Gear.{ teeth: 12 };
```

```text
lib.kur:5:13: the shape of demo::engine::part::Gear is not exposed here
  5 |     let g = Gear.{ teeth: 12 };
    |             ^
```

The fix is to call a function that `engine` provides (`package::engine::spin(12)`), which builds the gear where it is allowed to.

## Calling C

A package can bring C into the build. `c_sources` lists C files that are compiled into every executable that depends on the package, and `link_flags` are given to the C compiler after the generated code:

```toml
[package]
name = "cffi"
kind = "executable"
entry = "main"
source_root = "."
c_sources = ["triple.c"]
link_flags = ["-lm"]

[dependencies.std]
path = "../kursal/lib/std"
```

```kursal
use std::io::print_buffer;

extern "C" fn triple(x: u32) -> u32;
extern "C" fn root(x: f64) -> f64;

fn main() {
    // A call of a foreign function is an unsafe operation.
    let t = unsafe triple(14);
    let r = unsafe root(2.25);
    print_buffer(f"{t} {r}\n");
}
```

```text
42 1.5
```

The compiler cannot see into C, so a call has to say `unsafe`. Without it you get `calling an unsafe function needs unsafe`. Part 2 explains what `unsafe` promises and how the standard library wraps it once so callers do not have to.

## Check by hand

Every literal, field access, destructuring and `match` of a type sits in a module where that type's shape is exposed. Every path that crosses a package boundary goes through an `export`.

Next: [Places and lending →](/book/places/)
