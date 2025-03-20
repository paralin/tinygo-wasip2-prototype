# TinyGo Asyncify WebAssembly Implementation

This document explains the WebAssembly assembly code used for TinyGo's goroutine implementation on WebAssembly using the Asyncify transformation.

## Imports and Global Declarations

The file begins by declaring imports from the asyncify module:

```assembly
.globaltype __stack_pointer, i32

.functype start_unwind (i32) -> ()
.import_module start_unwind, asyncify
.import_name start_unwind, start_unwind

.functype stop_unwind () -> ()
.import_module stop_unwind, asyncify
.import_name stop_unwind, stop_unwind

.functype start_rewind (i32) -> ()
.import_module start_rewind, asyncify
.import_name start_rewind, start_rewind

.functype stop_rewind () -> ()
.import_module stop_rewind, asyncify
.import_name stop_rewind, stop_rewind
```

These declarations import the Asyncify functions that allow for stack unwinding and rewinding, which are essential for implementing cooperative multitasking in WebAssembly.

## Function: tinygo_unwind

```assembly
.global  tinygo_unwind
.hidden  tinygo_unwind
.type    tinygo_unwind,@function
tinygo_unwind: // func (state *stackState) unwind()
    .functype tinygo_unwind (i32) -> ()
```

This function implements `state.unwind()`, taking a pointer to a `stackState` struct.

```assembly
    // Check if we are rewinding.
    i32.const 0
    i32.load8_u tinygo_rewinding
    if // if tinygo_rewinding {
```

First, it checks if we're currently in the rewinding state by loading the `tinygo_rewinding` flag.

```assembly
    // Stop rewinding.
    call stop_rewind
    i32.const 0
    i32.const 0
    i32.store8 tinygo_rewinding // tinygo_rewinding = false;
```

If we are rewinding, it calls `stop_rewind()` to complete the rewind operation and sets the `tinygo_rewinding` flag to false.

```assembly
    else
    // Save the C stack pointer (destination structure pointer is in local 0).
    local.get 0
    global.get __stack_pointer
    i32.store 4 // state.csp = getCurrentStackPointer()
```

If we're not rewinding, it saves the current stack pointer to the `csp` field of the state struct.

```assembly
    // Ask asyncify to unwind.
    // When resuming, asyncify will return this function with tinygo_rewinding set to true.
    local.get 0
    call start_unwind // asyncify.start_unwind(state)
```

Then it calls `start_unwind()` to begin unwinding the stack. When this goroutine is resumed later, execution will return to this point with `tinygo_rewinding` set to true.

```assembly
    end_if
    return
    end_function
```

## Function: tinygo_launch

```assembly
.global tinygo_launch
.hidden tinygo_launch
.type tinygo_launch,@function
tinygo_launch: // func (state *state) launch()
    .functype tinygo_launch (i32) -> ()
```

This function implements `state.launch()`, which starts a new goroutine.

```assembly
    // Switch to the goroutine's C stack.
    global.get __stack_pointer // prev := getCurrentStackPointer()
    local.get 0
    i32.load 12
    global.set __stack_pointer // setStackPointer(state.csp)
```

First, it saves the current stack pointer and switches to the goroutine's stack by setting the stack pointer to `state.csp`.

```assembly
    // Get the argument pack and entry pointer.
    local.get 0
    i32.load 4 // args := state.args
    local.get 0
    i32.load 0 // fn := state.entry
```

It loads the function arguments and entry point from the state struct.

```assembly
    // Launch the entry function.
    call_indirect (i32) -> () // fn(args)
```

It then calls the entry function with the arguments.

```assembly
    // Stop unwinding.
    call stop_unwind
```

After the function returns, it calls `stop_unwind()` to complete any unwinding operation.

```assembly
    // Restore the C stack.
    global.set __stack_pointer // setStackPointer(prev)
    return
    end_function
```

Finally, it restores the original stack pointer and returns.

## Function: tinygo_rewind

```assembly
.global  tinygo_rewind
.hidden  tinygo_rewind
.type    tinygo_rewind,@function
tinygo_rewind: // func (state *state) rewind()
    .functype tinygo_rewind (i32) -> ()
```

This function implements `state.rewind()`, which resumes a previously paused goroutine.

```assembly
    // Switch to the goroutine's C stack.
    global.get __stack_pointer // prev := getCurrentStackPointer()
    local.get 0
    i32.load 12
    global.set __stack_pointer // setStackPointer(state.csp)
```

First, it saves the current stack pointer and switches to the goroutine's stack.

```assembly
    // Get the argument pack and entry pointer.
    local.get 0
    i32.load 4 // args := state.args
    local.get 0
    i32.load 0 // fn := state.entry
```

It loads the function arguments and entry point from the state struct.

```assembly
    // Prepare to rewind.
    i32.const 0
    i32.const 1
    i32.store8 tinygo_rewinding // tinygo_rewinding = true;
    local.get 0
    i32.const 8
    i32.add
    call start_rewind // asyncify.start_rewind(&state.stackState)
```

It sets the `tinygo_rewinding` flag to true and calls `start_rewind()` with the stack state pointer to begin the rewind operation.

```assembly
    // Launch the entry function.
    // This will actually rewind the call stack.
    call_indirect (i32) -> () // fn(args)
```

It calls the entry function again, but due to the asyncify transformation and the rewind operation, this will resume execution from the previously saved point rather than starting the function from the beginning.

```assembly
    // Stop unwinding.
    call stop_unwind
```

After the function returns, it calls `stop_unwind()` to complete any unwinding operation.

```assembly
    // Restore the C stack.
    global.set __stack_pointer // setStackPointer(prev)
    return
    end_function
```

Finally, it restores the original stack pointer and returns.

## Global Variable: tinygo_rewinding

```assembly
    .hidden tinygo_rewinding                # @tinygo_rewinding
    .type   tinygo_rewinding,@object
    .section        .bss.tinygo_rewinding,"",@
    .globl  tinygo_rewinding
tinygo_rewinding:
    .int8   0                               # 0x0
    .size   tinygo_rewinding, 1
```

This declares a global variable `tinygo_rewinding` that is used to track whether we're currently in the rewinding state. It's initialized to 0 (false).

## Summary

This WebAssembly assembly code implements the core functionality needed for TinyGo's goroutine system on WebAssembly:

1. `tinygo_unwind`: Pauses a goroutine by saving its stack state
2. `tinygo_launch`: Starts a new goroutine
3. `tinygo_rewind`: Resumes a previously paused goroutine

The implementation uses the Asyncify transformation, which allows WebAssembly code to save and restore its execution state, enabling cooperative multitasking in an environment that doesn't natively support it.
