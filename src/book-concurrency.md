+++
layout = "page.html"
section = "book"
title = "Concurrency"
eyebrow = "Book · Part 2 · Chapter 18"
intro = "Threads are a library. The language's part is what a closure can hold: values move in, and capabilities move in with them."
permalink = "/book/concurrency/"
+++

`std::thread::spawn(f)` runs a closure on a new operating-system thread. It returns `Result[Thread![Ret], (closure, Error)]`, and `join` on the thread returns `Result[Ret, Error]`. Both are library code with the unsafe parts inside std. The language has no `Send` or `Sync` traits. What makes `spawn` safe is what a closure is able to hold.

## Moving ownership into a thread

```kursal
use std::io::print_buffer;
use std::process::trap;
use std::thread;

exposed struct Job! {
    items: u32,
}

fn main() {
    let job = Job!.{ items: 5 };
    let rate = 3u32;   // Copy: the thread gets its own copy
    // The closure captures `job`, a linear value, by moving it in, so the
    // closure is linear and `job` is the new thread's alone.
    let t = match thread::spawn(|| -> u32 {
        let { items } = job;
        items * rate
    }) {
        Ok(t) => t,
        Err(failed) => {
            let (f, error) = failed;
            let unused = f();
            trap()
        },
    };
    let total = match t.join() {
        Ok(v) => v,
        Err(error) => 0,
    };
    print_buffer(f"{total} {rate}\n");
}
```

```text
15 3
```

Chapter 9 said a closure that captures a linear value is linear. Here that is the whole mechanism: `job` moves into the closure, the closure moves into the thread, and the spawner cannot touch `job` again. Try:

```text
lib.kur:25:28: demo::main: value 'job' has been moved or is only partially available
  25 |     let { items: again } = job;   // job moved into the thread
     |                            ^
```

A `Copy` capture such as `rate` is plain data, and the thread gets its own copy. That is also why a thread cannot change the spawner's variable. The closure holds a copy, and assigning to it is rejected:

```text
lib.kur:7:9: hits is captured as a copy, which cannot be assigned
  7 |         hits = hits + 1;
    |         ^
```

If `spawn` fails, it hands the closure back, unrun, so nothing captured is lost. The program decides what to do. Both examples here call it and `trap()`. There is no `detach`: every thread's result has to reach a `join`, so a linear result cannot be stranded.

## Sharing goes through capabilities

Two threads reading one arena share it through the tree of readers from chapter 14. Each thread receives one `Shared!` leaf, reads, and hands the leaf back through `join`:

```kursal
use std::io::print_buffer;
use std::arena::Arena!;
use std::cap::Shared!;
use std::mem::Ref;
use std::process::{hash_seed, trap};
use std::thread;
use std::thread::Thread!;

// Reads `at` on a new thread through one shared-read node, and hands the
// node back with the value. Generic over the brands, so the closure can
// mention them.
forall 'k, 'q.
fn read_on_thread(node: Shared!['k, 'q], at: Ref[u32, 'k]) -> Thread![(u32, Shared!['k, 'q])] {
    match thread::spawn(|| -> (u32, Shared!['k, 'q]) {
        var node = node;
        let v = at.read(&node);
        (v, node)
    }) {
        Ok(t) => t,
        Err(failed) => {
            let (f, error) = failed;
            let unused = f();
            trap()
        },
    }
}

forall R.
fn joined(t: Thread![R]) -> R {
    match t.join() {
        Ok(v) => v,
        Err(error) => trap(),
    }
}

fn main() {
    var exists 'k. (tag, arena) = Arena!::new(hash_seed());
    let a = &arena.alloc(&tag, 40u32);
    let b = &arena.alloc(&tag, 2u32);
    // The writer becomes a tree of two readers, one per thread.
    let exists 'q. (root, resume) = tag.share();
    let exists 'l, 'r. (left, right, join) = root.split();
    let tl = read_on_thread(left, a);
    let tr = read_on_thread(right, b);
    let (x, left) = joined(tl);
    let (y, right) = joined(tr);
    // Only with both readers back can the writer, and so the arena's end,
    // come back.
    let tag = resume.resume(join.join(left, right));
    arena.destroy(tag);
    print_buffer(f"{x + y}\n");
}
```

```text
42
```

Two details are the language's, and worth understanding.

**`read_on_thread` is generic over the brands.** A closure cannot mention a brand that its own block opened (chapter 13). `main` opened `'k` and `'q`, so spawning straight from `main` with those capabilities is rejected:

```text
lib.kur:43:34: a closure or foreach body cannot mention the block-local brand 'k
  43 |     let tl = match thread::spawn(|| {
     |                                  ^
```

The helper is generic over `'k` and `'q`, so inside it the brands are parameters and the closure may name them. The caller supplies the real brands.

**`var node = node;` inside the closure.** A closure cannot lend a capture (chapter 12), and `at.read(&node)` lends `node`. Rebinding it as a local `var` inside the closure gives it something to lend.

The writer comes back only after both leaves have been joined and resumed. While the readers are out on their threads there is no writer anywhere in the program, because it was consumed by `share`.

## What this says, and what it does not

For safe code, the claim is this: a thread receives values by move or capabilities by move, and safe code has no shared mutable access without a capability. What the project does not claim is freedom from data races for programs that use raw pointers or atomics across threads. Those are unsafe obligations, as in chapter 15, and the [`examples/atomics`](https://github.com/kursionlabs/kursal/tree/main/examples/atomics) program shows how one is written down. The Lean proof mentioned in the guide covers a single-threaded core. Atomics are outside it.

There is no thread pool, no channel and no mutex in the language. Those would be libraries built from the same pieces.

## Check by hand

For each spawned closure, list what it captures. Linear captures move in and are gone from the spawner. Copy captures are plain data. A raw pointer in the capture list is an unsafe obligation to check, along with every atomic ordering used on it.

Next: [How checking works →](/book/checking/)
