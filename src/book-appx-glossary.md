+++
layout = "page.html"
section = "book"
title = "Appendix C: Glossary"
eyebrow = "Book · Appendix C"
intro = "The terms this book uses, in a line or two each."
permalink = "/book/glossary/"
+++

**Brand.** A compile-time name, written with a tick (`'k`), that a type carries as a parameter to say
that values belong together: this ticket is for that counter, this `Ref` points into that arena. It
says nothing about how long anything lives, and it costs nothing at run time.

**Brand parameter.** A brand introduced by `forall 'k.` on a function, type, trait or instance, just
as `forall T.` introduces a type parameter. Brand arguments go in the same brackets as type
arguments: `Counter!['k]`.

**`'static`.** The predefined brand of things that live for the whole program, such as string
literals (`Slice[u8, 'static]`). Its witness comes from `unsafe static_brand()`.

**Witness.** A value of type `Brand['k]`. It is `Copy`, takes no bytes and grants nothing by itself.
A struct holds one to carry a brand.

**Package (exists type).** A value of type `exists 'k. T`: a `T` under a brand that is hidden. `fresh()`
returns one, `exists 'k. Brand['k]`, and so does any constructor that makes a new domain, such as
`Arena!::new`. (The word also means a unit of compilation; see "Module, package, manifest".)

**Pack.** `pack 'k. value` builds an `exists 'k. T` from a value whose type mentions `'k`, hiding the
brand.

**Opening.** `let exists 'k. x = e;`, or `var exists 'k. x = e;` when what it binds will be lent,
names the brand of a package and binds its value. Each opening and each `exists` binder must be a
new name: not `'static`, not a brand parameter, not an earlier opening still in scope, not an
enclosing binder. That is how messages can say where each brand was opened.

**Block-local brand.** A brand opened in a block. A closure or `foreach` body written in that block
cannot mention it. A function generic over the brand can, which is how a thread body gets a branded
capability.

**Capability.** A linear value that grants access to what a brand covers. In the standard library,
`Exclusive!['k]` grants reading and writing, and `Shared!['k, 'q]` is a node in a tree of readers
that grants reading. They are a library pattern built from brands and linearity, not a runtime
mechanism, and they take no space.

**Handle.** A `Copy` value that names something but grants nothing, such as `Ref[T, 'k]` into an
arena. A handle is used together with a capability of the same brand.

**Linear type.** A type whose values must be used exactly once on every path. A declared type is
linear when its name ends in `!` (`Buffer!`, `Ticket!`), and one that holds a linear field must say
so. A generic type such as `Option[T]` is linear exactly when its argument is.

**Consume.** To use up a linear value: pass it by value, return it, move it into another value, or
take it apart with a pattern. Reading a field of it does not consume it.

**Copy.** A built-in premise, `Copy[T]`, that says a `T` may be duplicated and dropped. Every type
without a linear part satisfies it. A type parameter does not, unless the function says
`where Copy[T]`. No program writes an instance of it.

**Place.** A variable, a field of one, or a parameter: something that holds a value and can be lent
or assigned.

**Lend.** Hand a place to a call for the length of that call, so the callee can read and change it
and the caller has it back afterwards. It is written `&` at the call: `f(&x)`, `&x.m()`, `match &x`,
`for v in &it`, `{&x}` in an f-string. A lend is not a reference. It cannot be stored, returned or
captured.

**Place parameter.** A parameter declared with `&`, as in `fn f(&c: Counter)` or `&self`. Inside the
function it is the caller's place. The function may move the value out, as long as a value is back
before it returns.

**var.** A binding that can be assigned and lent. `let` bindings, by-value parameters (`self`
included) and a `for` binder are not vars. `var x = x;` makes one from any of them.

**Capture.** A local that a closure or `foreach` body mentions. A closure copies a `Copy` capture and
moves a linear one in, which makes the closure linear. Neither body can assign or lend what it
captures, and a `foreach` body's captures must be `Copy`, because it runs once per component.

**Closure.** A function value with an environment, written `|x| x + 1`. Its type is
`closure[Env](A) -> R`, or `closure(A) -> R` as a parameter that leaves `Env` unnamed. Calling it
twice needs `Copy[Env]`.

**Function value.** A named function used as a value, of type `fn(A) -> R` or `unsafe fn(A) -> R`.
It carries no environment. The two types do not convert into each other.

**Premise.** A requirement in a `forall ... where` clause, such as `Copy[T]`, `Sized[T]`,
`Exposed[*T]` or `Area[S]`. The body may rely on it, and each call is checked to satisfy it from the
signature alone. The body is never checked again per instantiation.

**Trait.** A named interface, declared with `trait` after a `forall` that names its parameters. A
`forall Self -> Out.` makes `Out` determined by `Self`.

**Instance.** `instance Trait[Type] { ... }`, the implementation of a trait at particular types.
Instances are program-wide and may not overlap.

**Shape.** A type's representation: its fields or variants. Building a value with a literal, reading
a field, destructuring and matching all need the shape.

**Exposed (keyword).** `exposed` before a declaration makes its shape visible to every module, and
`exposed (path)` to that module and the modules below it. Without it only the declaring module sees
the shape: elsewhere, `the shape of X is not exposed here`.

**Exposed (premise).** `Exposed[T]` says that generic code may see `T`'s shape, which a `foreach`
traversal needs. A type whose shape is restricted never satisfies it outside its scope, and an enum
never does.

**Sized.** `Sized[T]` says that `T` has a non-zero size in memory. Generic code needs it for a raw
read, write or `alloca` at `T`.

**Zero-size type.** A type that takes no bytes: `()`, an empty struct, a brand witness, a capability.
It has no memory form, so it cannot be read through a pointer or passed to C.

**Never.** The type `!`, of an expression that does not finish, such as a call of `trap()`. A
function returning `!` can stand in any expression position.

**foreach.** A compile-time expansion over a shape, not a loop. `foreach x of v { ... }` runs the
body once for each component of a struct, tuple or array value, or of what a pointer points to,
and assembles the results into a value of the same shape.

**foreach type.** The type of what a `foreach` makes: `foreach F of S => B` is one `B` per component
`F` of `S`, and `foreach *F of S => B` binds each component's pointee when `S` is written with
pointer components. It is always the type of a whole value, parameter or result, never a field.

**unsafe operation.** An operation whose correctness the compiler cannot check: calling an `unsafe fn`
or an extern, reading or writing through a raw pointer, `alloca`, a bit-reinterpreting cast, lending
a pointer's target, `static_brand`, atomics, volatile accesses and fences. Each is marked with its
own `unsafe` prefix. There are no unsafe blocks.

**unsafe fn.** A function whose caller takes on an obligation, so calling it is an unsafe operation.
Its body is not an unsafe context: each unsafe operation in it carries its own `unsafe`.

**Raw pointer.** `*T`, an address with no guarantees. `NonNull[T]` is the same, but never null.

**extern.** `extern "C" fn name(...) -> R;` declares a C function. `"C"` is the only ABI. Every call
is unsafe, and the signature may not use places, zero-size parameters, safe function types, or
results that only checked code can make.

**Contract.** The obligation that an unsafe operation or `unsafe fn` carries, stated in writing and
not checked. The standard library's are in `lib/std/CONTRACTS.md`.

**Module, package, manifest.** Each `.kur` file is a module, named by its path. A package is a
directory of modules with a `kur.toml` manifest that names its kind, entry and dependencies.
`package::` names the current package in a path.

**Front end.** The compiler's first stage: parsing, name resolution, type inference, and the pass
that tracks ownership and places, then lowering to KURS. Its errors have the form
`file:line:col: message`.

**KURS.** The small core language that every program is lowered to. Each block in it states its
complete place state: what is full, what is empty, what is lent. `kursal lower` prints it, and
`kursal readable` prints a form meant for people.

**Checker.** The core checker, which checks KURS against the core rules before any C is written,
independently of the front end. `kursal check` runs it. Front end accepted, checker rejected counts
as a compiler bug. The checker is tested and fuzzed, not proven.

**Lean proof.** A mechanized soundness proof (`kursal-proof`, in Lean 4) of the design of a
restricted core: value-only KURS on a single thread, without places, atomics, volatile accesses,
`NonNull` or extern callbacks. It proves neither compiler nor the checker. The surface language and
the extensions listed are outside it.

Back to the [book contents](/book/).
