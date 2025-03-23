WIT Type Representations
Similar to any other guest langauge, there are multiple type systems in play when dealing with JS WebAssembly components.

Types represented in WebAssembly Interface Types ("WIT") must be converted down to types that are familiar for Javascript, and Typescript (if dealing with jco types or jco guest-types subcommands).

This document details the type representations and usage for types that are defined in WIT and built into components.

Basic types
Here is a basic table of conversions between WIT types and JS types:

More complicated types that are built into WIT but require more work to translate are explained below.

WIT type JS Type
u8 number
u16 number
u32 number
u64 BigInt
s8 number
s16 number
s32 number
s64 BigInt
f32 number
f64 number
bool boolean
char string
string string
Variants (variant)
note

See the Variant section of the WIT IDL for more information on Variants

Variants are like basic enums in most languages with one exception; members of the variant can hold a single data type. Alternative variant members may hold different types to represent different cases. For example:

variant exit-code {
success,
failure-code(u32),
failure-msg(string),
}
WIT syntax
variant filter {
all,
none,
some(list<string>),
}
Jco Representation
Jco represents variants as objects with a tag that represents the variant, and data that represent the content:

For example, pseudo Typescript for the of the above filter variant would look like the following:

// Filter with all
{
tag: 'all';
}

// Filter with None
{
tag: 'none';
}

// Filter with some and a list of strings
{
tag: 'some';
data: string[];
}
note

WIT variant's options may only contain one piece of data.

You can work around this limitation of variants by having the contained type be a tuple, (e.g. tuple<string, u32, string>), or using a named record as the related data.

Records (record)
WIT Syntax
record person {
name: string,
age: u32,
favorite-color: option<string>,
}
Jco Representation
Jco represents records as the Javascript Object basic data type:

Given the WIT record above, you can expect to deal with an object similar to the following Typescript:

interface Person {
person: string;
age: number;
favoriteColor?: number;
}
note

If using jco guest-types or jco types, you will be able to use Typescript types that properly constrain the Typescript code you write.

Options (option)
WIT Syntax
option<u32, u32>
option<string, u32>
Jco Representation
Jco represents options as an optional value or undefined, so some examples:

Type Representation (TS) Example
option<u32> `number	undefined`
option<option<u32>> `{ tag: "some"	"none", val: number }`
warning

"single level" options are easy to reason about, but the doubly nested case (option<option<\_>>) is more complex.

Due to the important distinction between a missing optional versus an option that contains an empty value, doubly-nested (or more) options are encoded with the object encoding described above, rather than as an optional value.

options in context: Records
When used in the context of a record (which becomes a JS Object), optional values are represented as optional properties (i.e in TS a propName?: value).

options in context: Function arguments/return values
When used in the context of arguments or return to a function, single level options are represented as optional values:

Consider the following interface:

interface optional {
f: func(n: option<u32>) -> string;
}
An implementation of the function optional.f would look like the following Typescript:

function f(n?: number): string {
if (n === undefined) { return "no n provided"; }
return "n was provided";
}
Result (result)
Result types, as a general concept represent a result that may or may not be present, due to a failure. A result value either contains a value that represents a completed computation (SuccessType), or some "error" that indicates a failure (ErrorType).

You can think of the type of a Result as:

Result<SuccessType, ErrorType>
The value you ultimately deal with is one or the other -- either the successful result or the error that represents the failure.

WIT Syntax
result<\_, string>
result<, string>
result<t,e>
Jco representation
In Javsacript, computation that fails or errors are often represented as exceptions -- and depending on how the result is used, Jco adheres to that representations.

When used as an output to a function, throwing an error will suffice. Given the following WIT interface:

add-overflow: func(lhs: u32, rhs: u32) -> result<u32, string>;
The following JS function would satistfy the WIT interface:

function addOverflow(lhs, rhs) {
let sum = lhs + rhs;
if (Nan.isNan(sum)) {
throw "ERROR: addition produced non-number value";
} else if (sum > 4294967295) {
throw "ERROR: u32 overflow";
}
return sum;
}
While JS automatically converts numbers, we must be careful to not attempt passing a number that would not fit in a u32 (unsigned 32 bit integer) via WebAssembly.

[NOTE] How JS treats large numbers is not in focus here, but it is worth noting that Number.MAX_VALUE + Number.MAX_VALUE === Infinity.

Typescript Schema
type Result<T,E> = { tag: 'ok', val: T } | { tag: 'err', val: E };
results in context: Function return values
When a result is returned directly from a function, any thrown error of the function is treated as the result error type, while any direct return value is treated as the result success type.

Consider the following interface:

interface fallible {
f: func(n: u32) -> result<string, string>;
}
An implementation of the function fallible.f would look like the following Typescript:

function f(n: number): string {
if (n == 42) { return "correct"; }
throw "not correct";
}
results in context: Container types (record, optional, etc)
A result stored inside a container type or in non-function argument/return contexts will look like a variant type of the form { tag: 'ok', val: SuccessType } | { tag: 'err', val: ErrorType }.

For example, consider the following WIT interface:

interface fallible-reaction {
r: func(r: result<string, string>) -> string;
}
An implementation of the function fallible-reaction.r would look like the following Typescript:

type Result<T,E> = { tag: 'ok', val: T } | { tag: 'err', val: E };

function f(input: Result<string, string>): string {
switch (input.tag) {
case 'ok': return `SUCCESS, returned: [${input.val}]";
    case 'err': return `ERROR, returned: [${input.val}]";
// We we should never reach the case below
default: throw Error("something has gone seriously wrong");
}
}
result considerations: Idiomatic JS errors for Host implementations
When running a component in a JS host, it is likely for host functions to throw real JS errors (objects which are descendants of the Error global object), rather than the exact type expected by Jco.

This means that the default conversion mechanism for Jco would be a JS anti-pattern (i.e. throw 12345 versus throw new Error("error code 12345")).

To ensure smooth use of Jco-generated code from hosts, Error objects with a payload property will have the payload extracted as the result error type.

Consider the following WIT:

type error-code = u32;

interface only-throws {
just-throw: func() -> result<string, error-code>;
}
Consider the following host function adhering to the interface, and making use of idiomatic JS errors:

// The below code assumes interaction with a WIT which looks like a
function justThrow() {
const plainError = new Error("Error for JS users");
const errorWithPayload = Object.assign(plainError, { payload: 1111 });
throw errorWithPayload;
}
Tuples (tuple)
Tuples are a container type that has a fixed size, types somewhat analogous to a fixed size list.

Tuples can be combined with type renaming to produce types that carry some semantic meaning. For example:

type point = tuple<u32,u32>
Note that tuples can be combined with custom user-defined types like records and variants, options and results. For example:

variant example-var {
nothing,
value(u64),
}

record example-rec {
fst: string,
snd: u32,
}

type maybe-num = option<u32>;

type num-or-err-str = result<u32, string>;

type examples = tuple<example-rec, example-var, maybe-num, num-or-err-str>;
WIT Syntax
tuple<u32, u32>
tuple<string, u32>
Jco Representation
Jco represents tuples as lists (arrays), so some examples:

Type Representation (TS) Example
tuple<u32, u32> [number, number] tuple<u32, u32> -> [number, number]
tuple<string, u32> [string, number] tuple<string, u32> -> [string, number]
List (list)
WIT Syntax
list<u8>
list<string>
Jco Representation
Jco represents lists with native Javscript Arrays, with the exception of a list<u8>:

Type Representation (TS) Example
list<u8> Uint8Array list<u8> -> Uint8Array
list<t> T[] list<string> -> string[]
Resources (resource)
note

See the WIT IDL description of Resources for more information

Resources represent objects that can not be trivially serialized and send copied to another component or the host. Components or host expose resources almost as a reference to internal state that methods can be called on -- without providing the actual internals of the resource in question.

WIT Syntax
resource blob {
constructor(init: list<u8>);
write: func(bytes: list<u8>);
read: func(n: u32) -> list<u8>;
merge: static func(lhs: borrow<blob>, rhs: borrow<blob>) -> blob;
}
Jco representation
The example above could be represented with the following class in Typescript pseudo-code:

class Blob {
constructor(init: Uint8Array);

    write(bytes: Uint8Array);

    read(n: number): UInt8Array;

    static merge(lhs: Uint8Array, rhs: Uint8Array): Blob;

}

// ErrorCode represents the enum "wasi:filesystem/types@0.2.0#error-code".
//
// Error codes returned by functions, similar to `errno` in POSIX.
// Not all of these error codes are returned by the functions provided by this
// API; some are used in higher-level library layers, and others are provided
// merely for alignment with POSIX.
//
// enum error-code {
// access,
// would-block,
// already,
// bad-descriptor,
// busy,
// deadlock,
// quota,
// exist,
// file-too-large,
// illegal-byte-sequence,
// in-progress,
// interrupted,
// invalid,
// io,
// is-directory,
// loop,
// too-many-links,
// message-size,
// name-too-long,
// no-device,
// no-entry,
// no-lock,
// insufficient-memory,
// insufficient-space,
// not-directory,
// not-empty,
// not-recoverable,
// unsupported,
// no-tty,
// no-such-device,
// overflow,
// not-permitted,
// pipe,
// read-only,
// invalid-seek,
// text-file-busy,
// cross-device
// }
type ErrorCode uint8

const (
// Permission denied, similar to `EACCES` in POSIX.
ErrorCodeAccess ErrorCode = iota

    // Resource unavailable, or operation would block, similar to `EAGAIN` and `EWOULDBLOCK`
    // in POSIX.
    ErrorCodeWouldBlock

    // Connection already in progress, similar to `EALREADY` in POSIX.
    ErrorCodeAlready

    // Bad descriptor, similar to `EBADF` in POSIX.
    ErrorCodeBadDescriptor

    // Device or resource busy, similar to `EBUSY` in POSIX.
    ErrorCodeBusy

    // Resource deadlock would occur, similar to `EDEADLK` in POSIX.
    ErrorCodeDeadlock

    // Storage quota exceeded, similar to `EDQUOT` in POSIX.
    ErrorCodeQuota

    // File exists, similar to `EEXIST` in POSIX.
    ErrorCodeExist

    // File too large, similar to `EFBIG` in POSIX.
    ErrorCodeFileTooLarge

    // Illegal byte sequence, similar to `EILSEQ` in POSIX.
    ErrorCodeIllegalByteSequence

    // Operation in progress, similar to `EINPROGRESS` in POSIX.
    ErrorCodeInProgress

    // Interrupted function, similar to `EINTR` in POSIX.
    ErrorCodeInterrupted

    // Invalid argument, similar to `EINVAL` in POSIX.
    ErrorCodeInvalid

    // I/O error, similar to `EIO` in POSIX.
    ErrorCodeIO

    // Is a directory, similar to `EISDIR` in POSIX.
    ErrorCodeIsDirectory

    // Too many levels of symbolic links, similar to `ELOOP` in POSIX.
    ErrorCodeLoop

    // Too many links, similar to `EMLINK` in POSIX.
    ErrorCodeTooManyLinks

    // Message too large, similar to `EMSGSIZE` in POSIX.
    ErrorCodeMessageSize

    // Filename too long, similar to `ENAMETOOLONG` in POSIX.
    ErrorCodeNameTooLong

    // No such device, similar to `ENODEV` in POSIX.
    ErrorCodeNoDevice

    // No such file or directory, similar to `ENOENT` in POSIX.
    ErrorCodeNoEntry

    // No locks available, similar to `ENOLCK` in POSIX.
    ErrorCodeNoLock

    // Not enough space, similar to `ENOMEM` in POSIX.
    ErrorCodeInsufficientMemory

    // No space left on device, similar to `ENOSPC` in POSIX.
    ErrorCodeInsufficientSpace

    // Not a directory or a symbolic link to a directory, similar to `ENOTDIR` in POSIX.
    ErrorCodeNotDirectory

    // Directory not empty, similar to `ENOTEMPTY` in POSIX.
    ErrorCodeNotEmpty

    // State not recoverable, similar to `ENOTRECOVERABLE` in POSIX.
    ErrorCodeNotRecoverable

    // Not supported, similar to `ENOTSUP` and `ENOSYS` in POSIX.
    ErrorCodeUnsupported

    // Inappropriate I/O control operation, similar to `ENOTTY` in POSIX.
    ErrorCodeNoTTY

    // No such device or address, similar to `ENXIO` in POSIX.
    ErrorCodeNoSuchDevice

    // Value too large to be stored in data type, similar to `EOVERFLOW` in POSIX.
    ErrorCodeOverflow

    // Operation not permitted, similar to `EPERM` in POSIX.
    ErrorCodeNotPermitted

    // Broken pipe, similar to `EPIPE` in POSIX.
    ErrorCodePipe

    // Read-only file system, similar to `EROFS` in POSIX.
    ErrorCodeReadOnly

    // Invalid seek, similar to `ESPIPE` in POSIX.
    ErrorCodeInvalidSeek

    // Text file busy, similar to `ETXTBSY` in POSIX.
    ErrorCodeTextFileBusy

    // Cross-device link, similar to `EXDEV` in POSIX.
    ErrorCodeCrossDevice

)

var stringsErrorCode = [37]string{
"access",
"would-block",
"already",
"bad-descriptor",
"busy",
"deadlock",
"quota",
"exist",
"file-too-large",
"illegal-byte-sequence",
"in-progress",
"interrupted",
"invalid",
"io",
"is-directory",
"loop",
"too-many-links",
"message-size",
"name-too-long",
"no-device",
"no-entry",
"no-lock",
"insufficient-memory",
"insufficient-space",
"not-directory",
"not-empty",
"not-recoverable",
"unsupported",
"no-tty",
"no-such-device",
"overflow",
"not-permitted",
"pipe",
"read-only",
"invalid-seek",
"text-file-busy",
"cross-device",
}
