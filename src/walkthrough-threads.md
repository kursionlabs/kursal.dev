+++
layout = "page.html"
section = "more"
title = "What if the thread doesn't start?"
eyebrow = "Walkthrough"
intro = "An error return can carry an obligation as well as an error code. This is the case where ownership is truly ambiguous."
permalink = "/walkthroughs/threads/"
+++

The thread example has two byte buffers. A worker sums the bytes in each buffer and frees it. On the happy path the division of labor is easy. The hard moment falls between preparing the work and starting the OS thread. By then the caller has already handed over the buffer. If the OS refuses to create the thread, who can still free it?

## Ownership moves before the worker runs

```kursal
let first = Buffer!::new().put("hello");
```

A buffer owns its allocation. Passing it to `sum_bytes` transfers the obligation to consume it. Wrapping that call in the closure `|| -> u32 { sum_bytes(first) }` moves the buffer into the closure the instant the closure is created. Reading `first` afterwards would be a second use, even if the worker hasn't run a single instruction yet.

## The error type needs room for the work

```kursal
let spawned_first = match thread::spawn(|| -> u32 { sum_bytes(first) }) {
    Result::Err(failed) => {
        let (f, error) = failed;
        let sum = f();
        trap()
    },
    Result::Ok(t) => t,
};
```

On success the caller gets a thread handle. On failure the library returns the unrun closure alongside the OS error. Returning only an error code would leave the library holding a closure that contains somebody else's resource. Handing the closure back lets the caller decide what to do with the work.

This particular program runs the closure synchronously and then traps, so the buffer is still summed and freed. Another program could use the result and carry on. The type forces the caller to account for the closure and leaves the recovery policy to the application.

## Joining is part of the interface

The successful branch produces a linear handle. Joining consumes the handle and yields the worker's result or an error. Here the result is an integer, but the thread API also handles a worker that returns an owned value, and requiring a join gives that value somewhere to go.

Two different questions are being answered here. The compiler checks that the caller transfers the buffer once and accounts for the handle. The library that binds the OS must separately make sure a successful start runs the closure and a failed start returns it intact. The linear interface states the contract clients can rely on. The implementation is where the contract with the host is upheld, and that is the place where `unsafe` obligations live.

[Complete thread example](https://github.com/kursionlabs/kursal/blob/main/examples/thread_sum/lib.kur) · [Thread library design](https://github.com/kursionlabs/kursal/blob/main/lib/thread/README.md)
