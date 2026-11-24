+++
layout = "page.html"
section = "more"
title = "Follow a buffer"
eyebrow = "Walkthrough"
intro = "A program reads a name and prints a greeting. Watch who is responsible for the bytes at every step."
permalink = "/walkthroughs/greeting/"
+++

The repository's greeting program reads a line from standard input. Its length is only known at runtime, so the library returns the bytes in an owned buffer. The buffer's type, `Buffer!`, tells the compiler that every path through the program has to account for it.

## Read the input

```kursal
let line = match read_line()? {
    Option::Some(line) => line,
    Option::None => Buffer!::new(),
};
```

An I/O error and end of input mean different things. The `?` returns an I/O error from the enclosing function. On success, the `match` either takes the buffer holding the line or makes an empty one at end of input. After this, both paths have produced exactly one owned value called `line`.

## Transfer, lend, release

```kursal
let name = capitalize(line);
let greeting = f"Hello, {&name}!\n";
name.destroy();
print_buffer(greeting)
```

Passing `line` to `capitalize` **transfers** ownership. That function builds a capitalized copy, releases the original, and returns the new buffer as `name`. Using `line` again here would be a compile error.

Formatting needs to read the bytes, so `&name` inside the format string **lends** the buffer for that one operation. Afterwards the caller owns two buffers and can release them independently. `name.destroy()` **consumes** the name, and passing `greeting` to `print_buffer` hands the second allocation to the output routine.

Delete the `name.destroy()` line and the compiler rejects the program, because a live linear value remains at return. You don't have to run the program to see the leak. You can read it off the function.

## Inside `capitalize`

From outside it is a simple exchange: a buffer in, a buffer out. Inside, the function has to look at the input one byte at a time. This is the line that opens it:

```kursal
let exists 'open1. (tag, bytes, restore) = name.open();
```

Read the three names left to right. The `tag` is permission to read. The `bytes` view says where to read. The `restore` value lets the function put the owner back together. The name `'open1` ties those three together for this particular opening, so if the function opened a second buffer, the first buffer's tag would be the wrong one for the second view.

The loop reads each byte through the tag and appends it to a fresh output buffer, uppercasing only the first byte. When the copy is done, `restore.restore(tag).destroy()` recovers the input buffer and frees it. Returning the output hands that allocation to the caller. That is why the returned name has its own storage and the function can release the original before returning.

## Run it

After [building the compiler](/start/), from the kursal repository root:

```sh
bin/kursal build examples/greet -o /tmp/greet
printf 'ada\n' | /tmp/greet
```

It prompts for a name and prints `Hello, Ada!`. The build also writes `/tmp/greet.c`. Before emitting it, the compiler lowers the branches and calls to its core language, [KURS](/compiler/), where it checks how each value moves along each path.

[Complete greeting program](https://github.com/kursionlabs/kursal/blob/main/examples/greet/lib.kur) · Next: [a graph that points back at itself](/walkthroughs/graph/)
