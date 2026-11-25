+++
layout = "page.html"
section = "book"
title = "Structs, enums and match"
eyebrow = "Book · Part 1 · Chapter 4"
intro = "Three ways to declare data, one way to build it, and match to take it apart."
permalink = "/book/shapes/"
+++

## Declaring and building

```kursal
use std::io::print;

struct Point {
    x: i32,
    y: i32,
}

tuple Meters(u32);

enum Shape {
    Dot,
    Circle(u32),
    Rect(u32, u32),
}

fn area(s: Shape) -> u32 {
    match s {
        Dot => 0,
        Circle(r) => 3 * r * r,
        Rect(w, h) => w * h,
    }
}

fn sides(s: Shape) -> u32 {
    match s {
        Rect(_, _) => 4,
        Dot | Circle => 0,
    }
}

fn main() {
    let p = Point.{ x: 1, y: 2 };
    let y = 7i32;
    let q = Point.{ x: 5, y };           // field shorthand
    let { x, ..rest } = p;               // take x, keep the other fields as `rest`
    let moved = Point.{ x: x + 10, ..rest };
    let len = Meters.(42);
    let shapes = (Shape::Dot, Shape::Circle.(2), Shape::Rect.(3, 4));
    print(f"{q.x} {q.y} {moved.x} {moved.y} {len.0}\n");
    print(f"{area(shapes.0)} {area(shapes.1)} {area(shapes.2)} {sides(shapes.2)}\n");
}
```

```text
5 7 11 2 42
0 12 12 4
```

- A **struct** has named fields: `struct Point { x: i32, y: i32 }`.
- A **tuple** declaration gives a tuple its own name: `tuple Meters(u32);`, with a semicolon. It is a different type from the anonymous `(u32,)` and from any other declaration with the same contents, so a `Meters` cannot be passed where a `Feet` is expected.
- An **enum** lists its variants, each with no payload or a tuple of payloads. It needs at least one.

Values are built with a dot before the brackets. A struct uses braces, `Point.{ x: 1, y: 2 }`, and a field whose variable has the same name can be written once (`Point.{ x: 5, y }`). A tuple declaration or a variant uses parentheses, `Meters.(42)` and `Shape::Circle.(2)`. A variant with no payload is just its path, `Shape::Dot`. This is the one form of construction. `Meters(42)` is rejected with ``` `Meters` is a constructor; write `Meters.(...)` ```. A missing field is an error, `missing field y`.

## Spread

`..rest` means "the other fields". It exists only inside braces, in a struct pattern and in a struct literal:

```kursal
let { x, ..rest } = p;
let moved = Point.{ x: x + 10, ..rest };
```

The first line takes `x` out of `p` and keeps the remaining fields together as `rest`. The second builds a new `Point` from `rest` with a different `x`. A spread names a bundle that a pattern made, not an arbitrary value, so `Point.{ x: 0, ..f(p) }` is a syntax error. Tuple patterns and `Name.(..)` take no spread.

Fields you leave out of a struct pattern are dropped, which is fine for ordinary values. Chapter 6 shows why that is an error for a linear one.

Tuple declarations destructure just like tuples:

```kursal
tuple Rgb(u8, u8, u8);

fn main() {
    let c = Rgb.(1, 2, 3);
    let (r, g, b) = c;
}
```

## match

`match` picks the first case that fits and evaluates to that case's value. A case is one of:

- a variant's **bare label**, with names for its payload: `Circle(r)`, `Rect(w, h)`, `Dot`
- an integer or byte literal, possibly negative: `0`, `b'a'`
- a range, written `a..=b`, which includes both ends
- `_`, which matches anything

Cases can be grouped with `|`. In a group, a payload variant is written without binders, as `Dot | Circle` above. Write the label bare, as in `Circle(r)`. The compiler looks the label up in the type of what you are matching. A misspelled label is an error, not a catch-all name.

```kursal
use std::str::Str;

fn kind(b: u8) -> Str['static] {
    match b {
        b'0'..=b'9' => "digit",
        b'a'..=b'z' | b'A'..=b'Z' => "letter",
        b' ' | b'\t' | b'\n' => "space",
        _ => "other",
    }
}

fn sign(n: i32) -> i32 {
    match n {
        -2147483648..=-1 => -1,
        0 => 0,
        _ => 1,
    }
}
```

```text
digit letter space other
-1 0 1
```

(with `kind(b'7')`, `kind(b'q')`, `kind(b' ')`, `kind(b'#')` and `sign(-5)`, `sign(0)`, `sign(9)`.)

### What the checker requires

- An enum match lists every variant, or ends with `_`. A match that leaves a variant out is rejected, and the message names it: `a match must cover every enum variant; it misses Dot and Rect`.
- An integer or byte match always ends with `_`, even when its ranges happen to cover the whole type, and `_` has to be the last case.
- Ranges and literals must not overlap, and a variant may not appear twice.
- A `bool` cannot be matched. Use `if`.

### What a case cannot do

A case binds names or `_`, and nothing more. There are no nested patterns, so `Some(Some(x))` is a syntax error, and no guards. To look inside a payload, match again inside the arm, as chapter 8 does. Writing a lent match, `match &s { ... }`, lets you look at a value without consuming it. Like every lend, it needs `s` to be a `var`. Places in chapter 12 cover it.

## Type aliases

`type Name = Type;` gives a type a second name. An alias is transparent: it **is** the type it stands for, and the two mix freely. It can be generic, as in `forall 'k. type Bytes = Slice[u8, 'k];`. An `impl` written through an alias is an impl of the expanded type. `type` is a reserved keyword.

An alias has a few rules, each with its own error:

- Every parameter is used: `type alias Tagged does not use its parameter Tag`.
- No cycles: `type alias List refers to itself through Next`.
- The `!` is there exactly when the type is linear: `type alias Handles stands for a linear type; name it Handles!`, and `type alias Count! stands for a type that is not linear; name it Count`.
- It is never exposed: `a type alias is never exposed: it has no representation of its own`.
- It takes no premises or determined parameters: `type alias Twice takes no premises or determined parameters`.
- It names a type only: `Bytes is a type alias; it stands only where a type is written`.

## Check by hand

Every enum match names all the variants or ends with `_`, and every integer match ends with `_`. Every literal supplies all of a struct's fields.

Next: [Methods →](/book/methods/)
