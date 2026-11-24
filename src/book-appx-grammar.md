+++
layout = "page.html"
section = "book"
title = "Appendix B: Grammar summary"
eyebrow = "Book · Appendix B"
intro = "An LL(1) summary of the surface syntax, with a built snippet for every production."
permalink = "/book/grammar/"
+++

The surface grammar is **LL(1)**: the current token alone decides every choice, and the parser
never backtracks. Where two forms share a beginning, as `(` does for unit, grouping and tuples, the
grammar is left-factored, and the choice is made by the token after the shared part. The `.{` and `.(`
tokens are what keep `if x { ... }` and `match x { ... }` unambiguous.

Notation: `[ x ]` is optional, `{ x }` is zero or more, `|` separates choices, and quoted text is a
token. `list(x)` stands for `[ x { "," x } [ "," ] ]`: possibly empty, with an optional trailing comma.
Comments marked **(later)** note what the grammar accepts but a later phase rejects. Those marked
**(accepted)** note something the grammar accepts that no phase rejects.

### Tokens

```ebnf
NAME        = letter { letter | digit | "_" } [ "!" ] ;   (* "!" makes a linear type's name; never before "=" *)
BRAND       = "'" ( letter | digit | "_" ) { letter | digit | "_" } ;
INT         = ( digits | "0x" hexdigits | "0o" octdigits | "0b" bindigits ) [ intsuffix ] ;   (* "_" separates digits *)
intsuffix   = "i8" | "i16" | "i32" | "i64" | "isize" | "u8" | "u16" | "u32" | "u64" | "usize" ;
FLOAT       = digits "." digits [ exponent ] [ fsuffix ]
            | digits exponent [ fsuffix ]
            | digits fsuffix ;                              (* a point needs digits on both sides *)
fsuffix     = "f32" | "f64" ;
BYTE        = "b'" ( char | escape ) "'" ;
STRING      = '"' { char | escape } '"' ;                    (* escape: \n \t \r \0 \\ \' \" \xHH *)
FSTRING     = 'f"' { char | escape | "{{" | "}}" | "{" expr "}" } '"' ;
TUPLE_INDEX = "." digits ;
(* Comments: "//" to the end of the line, and "/* ... */", which does not nest. *)
```

### Items

```ebnf
file        = { item } ;
item        = ( "use" | "export" ) use_tree ";"
            | const
            | [ forall ] item_body ;       (* forall before use or const: "`forall` comes before a struct, tuple, enum, function, impl, trait or instance" (later) *)
forall      = "forall" fparam { "," fparam } [ "->" fparam { "," fparam } ]
              [ "where" premise { "," premise } ] "." ;
fparam      = NAME | BRAND ;
premise     = path "[" type_args "]" ;

item_body   = aggregate
            | [ "unsafe" ] fn_decl
            | extern
            | "impl" type "{" { [ forall ] ( const | fn_decl ) } "}"
            | "trait" NAME "{" { fn_decl } "}"              (* each method is a signature ending in ";": a body is (later) *)
            | "instance" type "{" { fn_decl } "}"
            ;
            (* "module": a reserved keyword. "unsafe instance": "`unsafe` marks a function, not an instance" *)

use_tree    = NAME { "::" NAME } [ "::" ( "*" | "{" list(use_tree) "}" ) ] [ "as" NAME ] ;

aggregate   = [ "exposed" [ "(" path ")" ] ]
              ( "struct" NAME "{" list(field) "}"
              | "tuple"  NAME "(" list(type) ")" ";"
              | "enum"   NAME "{" list(variant) "}" ) ;     (* an enum with no variant: (later) *)
field       = NAME ":" type ;
variant     = NAME [ "(" type { "," type } [ "," ] ")" ] ;

fn_decl     = [ "unsafe" ] "fn" NAME "(" params ")" [ "->" type ] ( ";" | block ) ;                 (* ";" only in a trait, or in an extern: elsewhere "a function needs a body" (later) *)
params      = [ param { "," param } [ "," ] ] ;             (* "self" only as the first *)
param       = [ "&" ] ( "self" [ ":" type ] | NAME ":" ptype ) ;
              (* a trait's or instance's method writes "self: T": "parameter self needs a type" (later) *)

extern      = "extern" STRING "fn" NAME "(" params ")" [ "->" type ] ";" ;
              (* any string but "C": 'the only extern ABI is "C"' (later); forall: (later);
                 place, zero-size or safe-fn parameters, and some results: (later) *)

const       = "const" NAME ":" type "=" expr ";" ;          (* the value must be constant: (later) *)
```

### Types

```ebnf
type        = path [ "[" type_args "]" ]                    (* Counter!['k], Option[u32] *)
            | "*" type                                      (* raw pointer *)
            | "!"                                           (* Never *)
            | "(" ")" | "(" type ")" | "(" type "," list(type) ")"
            | "[" type ";" expr "]"                         (* array; the length is a constant *)
            | [ "unsafe" ] "fn" "(" list(slot) ")" "->" type
            | "closure" "[" type "]" "(" list(slot) ")" "->" type
            | "exists" brands type                          (* repeated, shadowing or unused binders: (later) *)
            | "foreach" [ "*" ] NAME "of" type "=>" type ;  (* not as a component; "*F" over a source
                                                               without written pointers: (later) *)
ptype       = type
            | "closure" "(" list(slot) ")" "->" type ;      (* environment left unnamed: parameters only *)
slot        = "&" ( NAME | "_" ) ":" type                   (* a place slot *)
            | ptype ;
type_args   = targ { "," targ } [ "->" targ { "," targ } ] [ "," ] ;
targ        = BRAND | "_" | type ;                          (* "_" outside an expression's path: (later) *)
brands      = BRAND { "," BRAND } "." ;
path        = NAME { "::" NAME } ;
```

### Statements

```ebnf
block       = "{" { statement } [ expr ] "}" ;              (* the bare expression last is the value *)
statement   = ( "let" | "var" ) [ "exists" brands ] pattern [ ":" type ] "=" expr ";"
            | const
            | block_like [ ";" ]          (* without ";" right before "}", it is the tail, except while and for *)
            | "unsafe" "*" unary "=" expr ";"               (* a store through a raw pointer *)
            | place "=" expr ";"
            | expr ";" ;
place       = ( NAME | "self" ) { "." NAME | TUPLE_INDEX } ; (* other left sides: a syntax error *)
            (* "return e" last in a block needs its ";":
               "a `return` at the end of a block ends with `;`" *)
```

### Patterns

```ebnf
pattern     = NAME
            | "self"                                        (* var self = self; *)
            | "_"
            | "(" ")"
            | "(" pattern "," list(pattern) ")"             (* a one-element tuple is (p,) *)
            | "[" pattern { "," pattern } [ "," ] "]"
            | "{" [ ".." NAME | field_pat { "," field_pat } [ "," ".." NAME ] [ "," ] ] "}" ;
field_pat   = NAME [ ":" pattern ] ;
            (* a pattern that drops a linear value: "a pattern cannot discard a linear value" (later) *)
```

### Expressions

```ebnf
expr        = block_like
            | closure
            | "return" [ expr ]
            | "pack" brands expr
            | or_expr ;

block_like  = block
            | "if" or_expr block [ "else" ( block | if_expr ) ]
            | "match" or_expr "{" { arm } [ "_" "=>" expr [ "," ] ] "}"   (* the "_" arm is last *)
            | "while" or_expr block
            | "for" NAME "in" or_expr block
            | "foreach" NAME [ ":" NAME ] "of" or_expr block ;
arm         = case { "|" case } "=>" expr [ "," ] ;
              (* the "," may be left out after a block-like body, or before "}" unless the body is a return *)
case        = lit [ "..=" lit ]
            | expr_path [ "(" list( NAME | "_" ) ")" ] ;    (* Option::Some(x), or the label alone: Some(x) *)
lit         = [ "-" ] ( INT | BYTE ) ;

closure     = ( "||" | "|" [ cparam { "," cparam } [ "," ] ] "|" ) ( "->" type block | expr ) ;
cparam      = [ "&" ] NAME [ ":" ptype ] ;

or_expr     = and_expr { "||" and_expr } ;
and_expr    = cmp_expr { "&&" cmp_expr } ;
cmp_expr    = bor_expr [ ( "==" | "!=" | "<" | "<=" | ">" | ">=" ) bor_expr ] ;   (* no chaining *)
bor_expr    = bxor_expr { "|" bxor_expr } ;
bxor_expr   = band_expr { "^" band_expr } ;
band_expr   = shift_expr { "&" shift_expr } ;
shift_expr  = add_expr { ( "<<" | ">>" ) add_expr } ;
add_expr    = mul_expr { ( "+" | "-" ) mul_expr } ;
mul_expr    = cast_expr { ( "*" | "/" | "%" ) cast_expr } ;
cast_expr   = unary { "as" type } ;
unary       = ( "-" | "!" | "*" | "&" | "unsafe" ) unary    (* "&" outside a lend position, and
                                                               "(&x).m()": (later) *)
            | postfix ;
postfix     = atom { "." NAME | TUPLE_INDEX | "(" list(expr) ")" | "?" } ;
              (* a TUPLE_INDEX never follows another directly *)
atom        = INT | FLOAT | BYTE | STRING | FSTRING | "true" | "false"
            | "(" ")" | "(" expr ")" | "(" expr "," list(expr) ")"
            | "[" [ expr { "," expr } [ "," ".." ] [ "," ] ] "]"           (* [a, b] or [a, ..] *)
            | expr_path [ ".{" [ ".." NAME | field_init { "," field_init } [ "," ".." NAME ] [ "," ] ] "}"
                        | ".(" list(expr) ")" ] ;
            (* ".(" on something that is not a tuple type or a variant, and "(" on a constructor: (later) *)
field_init  = NAME [ ":" expr ] ;                           (* Point.{ x, y: 2 } *)
expr_path   = segment { "::" segment } ;
segment     = ( NAME | "self" ) [ "[" type_args "]" ] ;    (* Option[u32]::None, first[_, u8] *)
```

Every production above was exercised by a program that builds with the compiler.

## What the grammar accepts and a later phase rejects

Each case below was built, and each is rejected after parsing with the message shown.

| Accepted by the grammar | Rejected with |
|---|---|
| `extern "system" fn ...` | `the only extern ABI is "C"` |
| `forall T.` before an `extern` | `extern id takes no type or brand parameters` |
| an extern's place, zero-size or safe-fn parameter, or its checked-only, enum or zero-size linear result | the rule's message, at the parameter or result |
| `fn f() -> i32;` outside a trait or extern | `a function needs a body; only a trait method or an extern is a signature` |
| `trait Show { fn show(self) -> i32 { 0 } }` | `a trait method is a signature; its body belongs in each instance` |
| `forall T. const X: i32 = 0;` | ``` `forall` comes before a struct, tuple, enum, function, impl, trait or instance ``` |
| `impl A { forall T. const C: i32 = 0; }` | ``` in an impl, `forall` comes before a method ``` |
| `let x: Option[_] = ...` | `_ stands for a type argument only in an expression, where inference fills it in` |
| `*p = 1u8;` | ``a store through a raw pointer is written `unsafe *p = v;` `` |
| `fn area(self) -> Out;` in a trait or instance | `parameter self needs a type` |
| `const ORIGIN: Point = Point.{ x: 0 };` | `not a constant expression` |
| `[u8; LIMIT as usize]` | `an array length cannot use arithmetic on usize or isize` |
| `enum E {}` | `enum E has no variant; an enum has at least one` |
| `let r = &a;` | ``& lends a place only as a call argument `f(&x)`, ...`` |
| `(&a).tick()`, `(unsafe &*c).tick()` | `a lend in parentheses is no receiver: ...` |
| `f.(1)` with `f` a function | ``` `f` is not a tuple or an enum variant; write `f(...)` ``` |
| `Option::Some(x)` as a call | ``` `Option::Some` is a constructor; write `Option::Some.(...)` ``` |
| `exists 'k, 'k. ...`, a binder that shadows, an unused binder | `an exists type repeats a binder`, `exists binder 'k shadows a brand in scope`, `type formation: existential brand binder is unused` |
| `foreach *F of Rec => usize` | `foreach *F needs a source written with pointer components` |
| `foreach *F of *Option[u8] => u8` | `a foreach source cannot be a pointer to a sum` |
| a struct field of a `foreach` type | `a component is a foreach type, which is only the type of a whole value, parameter or result` |
| `where Exposed[T, T]` | `Exposed takes 1 type argument, got 2` |
| `let x! = 1u32;` | `only a linear type's name ends with !` |
| `let _ = issue(1);` with a linear value | `a pattern cannot discard a linear value` |

The grammar accepts `let self = 1u32;` in a free function and binds a local named `self`. Nothing rejects it, and nothing uses it.

Next: [Appendix C: Glossary →](/book/glossary/)
