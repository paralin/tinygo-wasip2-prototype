export function instantiate(getCoreModule, imports, instantiateCore = WebAssembly.instantiate) {
  
  class ComponentError extends Error {
    constructor (value) {
      const enumerable = typeof value !== 'string';
      super(enumerable ? `${String(value)} (see error.payload)` : value);
      Object.defineProperty(this, 'payload', { value, enumerable });
    }
  }
  
  let curResourceBorrows = [];
  
  let dv = new DataView(new ArrayBuffer());
  const dataView = mem => dv.buffer === mem.buffer ? dv : dv = new DataView(mem.buffer);
  
  const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
  let _fs;
  async function fetchCompile (url) {
    if (isNode) {
      _fs = _fs || await import('node:fs/promises');
      return WebAssembly.compile(await _fs.readFile(url));
    }
    return fetch(url).then(WebAssembly.compileStreaming);
  }
  
  function getErrorPayload(e) {
    if (e && hasOwnProperty.call(e, 'payload')) return e.payload;
    if (e instanceof Error) throw e;
    return e;
  }
  
  const handleTables = [];
  
  const hasOwnProperty = Object.prototype.hasOwnProperty;
  
  const T_FLAG = 1 << 30;
  
  function rscTableCreateOwn (table, rep) {
    const free = table[0] & ~T_FLAG;
    if (free === 0) {
      table.push(0);
      table.push(rep | T_FLAG);
      return (table.length >> 1) - 1;
    }
    table[0] = table[free << 1];
    table[free << 1] = 0;
    table[(free << 1) + 1] = rep | T_FLAG;
    return free;
  }
  
  function rscTableRemove (table, handle) {
    const scope = table[handle << 1];
    const val = table[(handle << 1) + 1];
    const own = (val & T_FLAG) !== 0;
    const rep = val & ~T_FLAG;
    if (val === 0 || (scope & T_FLAG) !== 0) throw new TypeError('Invalid handle');
    table[handle << 1] = table[0] | T_FLAG;
    table[0] = handle | T_FLAG;
    return { rep, scope, own };
  }
  
  const symbolCabiDispose = Symbol.for('cabiDispose');
  
  const symbolRscHandle = Symbol('handle');
  
  const symbolRscRep = Symbol.for('cabiRep');
  
  const symbolDispose = Symbol.dispose || Symbol.for('dispose');
  
  const toUint64 = val => BigInt.asUintN(64, BigInt(val));
  
  function toUint32(val) {
    return val >>> 0;
  }
  
  const utf8Decoder = new TextDecoder();
  
  const utf8Encoder = new TextEncoder();
  
  let utf8EncodedLen = 0;
  function utf8Encode(s, realloc, memory) {
    if (typeof s !== 'string') throw new TypeError('expected a string');
    if (s.length === 0) {
      utf8EncodedLen = 0;
      return 1;
    }
    let buf = utf8Encoder.encode(s);
    let ptr = realloc(0, 0, 1, buf.length);
    new Uint8Array(memory.buffer).set(buf, ptr);
    utf8EncodedLen = buf.length;
    return ptr;
  }
  
  
  if (!getCoreModule) getCoreModule = (name) => fetchCompile(new URL(`./${name}`, import.meta.url));
  const module0 = getCoreModule('main.core.wasm');
  const module1 = getCoreModule('main.core2.wasm');
  const module2 = getCoreModule('main.core3.wasm');
  const module3 = getCoreModule('main.core4.wasm');
  
  const { getArguments, getEnvironment, initialCwd } = imports['wasi:cli/environment'];
  const { getStderr } = imports['wasi:cli/stderr'];
  const { getStdin } = imports['wasi:cli/stdin'];
  const { getStdout } = imports['wasi:cli/stdout'];
  const { now } = imports['wasi:clocks/monotonic-clock'];
  const { now: now$1 } = imports['wasi:clocks/wall-clock'];
  const { getDirectories } = imports['wasi:filesystem/preopens'];
  const { Descriptor, DirectoryEntryStream } = imports['wasi:filesystem/types'];
  const { Error: Error$1 } = imports['wasi:io/error'];
  const { InputStream, OutputStream } = imports['wasi:io/streams'];
  const { getRandomBytes, getRandomU64 } = imports['wasi:random/random'];
  let gen = (function* init () {
    let exports0;
    const handleTable2 = [T_FLAG, 0];
    const captureTable2= new Map();
    let captureCnt2 = 0;
    handleTables[2] = handleTable2;
    
    function trampoline2() {
      const ret = getStdout();
      if (!(ret instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
      }
      var handle0 = ret[symbolRscHandle];
      if (!handle0) {
        const rep = ret[symbolRscRep] || ++captureCnt2;
        captureTable2.set(rep, ret);
        handle0 = rscTableCreateOwn(handleTable2, rep);
      }
      return handle0;
    }
    
    
    function trampoline3() {
      const ret = now();
      return toUint64(ret);
    }
    
    
    function trampoline4() {
      const ret = getRandomU64();
      return toUint64(ret);
    }
    
    
    function trampoline5() {
      const ret = getStderr();
      if (!(ret instanceof OutputStream)) {
        throw new TypeError('Resource error: Not a valid "OutputStream" resource.');
      }
      var handle0 = ret[symbolRscHandle];
      if (!handle0) {
        const rep = ret[symbolRscRep] || ++captureCnt2;
        captureTable2.set(rep, ret);
        handle0 = rscTableCreateOwn(handleTable2, rep);
      }
      return handle0;
    }
    
    const handleTable1 = [T_FLAG, 0];
    const captureTable1= new Map();
    let captureCnt1 = 0;
    handleTables[1] = handleTable1;
    
    function trampoline6() {
      const ret = getStdin();
      if (!(ret instanceof InputStream)) {
        throw new TypeError('Resource error: Not a valid "InputStream" resource.');
      }
      var handle0 = ret[symbolRscHandle];
      if (!handle0) {
        const rep = ret[symbolRscRep] || ++captureCnt1;
        captureTable1.set(rep, ret);
        handle0 = rscTableCreateOwn(handleTable1, rep);
      }
      return handle0;
    }
    
    let exports1;
    let memory0;
    let realloc0;
    
    function trampoline9(arg0) {
      const ret = getEnvironment();
      var vec3 = ret;
      var len3 = vec3.length;
      var result3 = realloc0(0, 0, 4, len3 * 16);
      for (let i = 0; i < vec3.length; i++) {
        const e = vec3[i];
        const base = result3 + i * 16;var [tuple0_0, tuple0_1] = e;
        var ptr1 = utf8Encode(tuple0_0, realloc0, memory0);
        var len1 = utf8EncodedLen;
        dataView(memory0).setInt32(base + 4, len1, true);
        dataView(memory0).setInt32(base + 0, ptr1, true);
        var ptr2 = utf8Encode(tuple0_1, realloc0, memory0);
        var len2 = utf8EncodedLen;
        dataView(memory0).setInt32(base + 12, len2, true);
        dataView(memory0).setInt32(base + 8, ptr2, true);
      }
      dataView(memory0).setInt32(arg0 + 4, len3, true);
      dataView(memory0).setInt32(arg0 + 0, result3, true);
    }
    
    
    function trampoline10(arg0) {
      const ret = getArguments();
      var vec1 = ret;
      var len1 = vec1.length;
      var result1 = realloc0(0, 0, 4, len1 * 8);
      for (let i = 0; i < vec1.length; i++) {
        const e = vec1[i];
        const base = result1 + i * 8;var ptr0 = utf8Encode(e, realloc0, memory0);
        var len0 = utf8EncodedLen;
        dataView(memory0).setInt32(base + 4, len0, true);
        dataView(memory0).setInt32(base + 0, ptr0, true);
      }
      dataView(memory0).setInt32(arg0 + 4, len1, true);
      dataView(memory0).setInt32(arg0 + 0, result1, true);
    }
    
    
    function trampoline11(arg0) {
      const ret = initialCwd();
      var variant1 = ret;
      if (variant1 === null || variant1=== undefined) {
        dataView(memory0).setInt8(arg0 + 0, 0, true);
      } else {
        const e = variant1;
        dataView(memory0).setInt8(arg0 + 0, 1, true);
        var ptr0 = utf8Encode(e, realloc0, memory0);
        var len0 = utf8EncodedLen;
        dataView(memory0).setInt32(arg0 + 8, len0, true);
        dataView(memory0).setInt32(arg0 + 4, ptr0, true);
      }
    }
    
    const handleTable0 = [T_FLAG, 0];
    const captureTable0= new Map();
    let captureCnt0 = 0;
    handleTables[0] = handleTable0;
    
    function trampoline12(arg0, arg1, arg2) {
      var handle1 = arg0;
      var rep2 = handleTable1[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable1.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(InputStream.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.blockingRead(BigInt.asUintN(64, arg1))};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant6 = ret;
      switch (variant6.tag) {
        case 'ok': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg2 + 0, 0, true);
          var val3 = e;
          var len3 = val3.byteLength;
          var ptr3 = realloc0(0, 0, 1, len3 * 1);
          var src3 = new Uint8Array(val3.buffer || val3, val3.byteOffset, len3 * 1);
          (new Uint8Array(memory0.buffer, ptr3, len3 * 1)).set(src3);
          dataView(memory0).setInt32(arg2 + 8, len3, true);
          dataView(memory0).setInt32(arg2 + 4, ptr3, true);
          break;
        }
        case 'err': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg2 + 0, 1, true);
          var variant5 = e;
          switch (variant5.tag) {
            case 'last-operation-failed': {
              const e = variant5.val;
              dataView(memory0).setInt8(arg2 + 4, 0, true);
              if (!(e instanceof Error$1)) {
                throw new TypeError('Resource error: Not a valid "Error" resource.');
              }
              var handle4 = e[symbolRscHandle];
              if (!handle4) {
                const rep = e[symbolRscRep] || ++captureCnt0;
                captureTable0.set(rep, e);
                handle4 = rscTableCreateOwn(handleTable0, rep);
              }
              dataView(memory0).setInt32(arg2 + 8, handle4, true);
              break;
            }
            case 'closed': {
              dataView(memory0).setInt8(arg2 + 4, 1, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
            }
          }
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline13(arg0, arg1) {
      var handle1 = arg0;
      var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable2.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(OutputStream.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.blockingFlush()};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg1 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg1 + 0, 1, true);
          var variant4 = e;
          switch (variant4.tag) {
            case 'last-operation-failed': {
              const e = variant4.val;
              dataView(memory0).setInt8(arg1 + 4, 0, true);
              if (!(e instanceof Error$1)) {
                throw new TypeError('Resource error: Not a valid "Error" resource.');
              }
              var handle3 = e[symbolRscHandle];
              if (!handle3) {
                const rep = e[symbolRscRep] || ++captureCnt0;
                captureTable0.set(rep, e);
                handle3 = rscTableCreateOwn(handleTable0, rep);
              }
              dataView(memory0).setInt32(arg1 + 8, handle3, true);
              break;
            }
            case 'closed': {
              dataView(memory0).setInt8(arg1 + 4, 1, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant4.tag)}\` (received \`${variant4}\`) specified for \`StreamError\``);
            }
          }
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline14(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable2[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable2.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(OutputStream.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.blockingWriteAndFlush(result3)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant6 = ret;
      switch (variant6.tag) {
        case 'ok': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var variant5 = e;
          switch (variant5.tag) {
            case 'last-operation-failed': {
              const e = variant5.val;
              dataView(memory0).setInt8(arg3 + 4, 0, true);
              if (!(e instanceof Error$1)) {
                throw new TypeError('Resource error: Not a valid "Error" resource.');
              }
              var handle4 = e[symbolRscHandle];
              if (!handle4) {
                const rep = e[symbolRscRep] || ++captureCnt0;
                captureTable0.set(rep, e);
                handle4 = rscTableCreateOwn(handleTable0, rep);
              }
              dataView(memory0).setInt32(arg3 + 8, handle4, true);
              break;
            }
            case 'closed': {
              dataView(memory0).setInt8(arg3 + 4, 1, true);
              break;
            }
            default: {
              throw new TypeError(`invalid variant tag value \`${JSON.stringify(variant5.tag)}\` (received \`${variant5}\`) specified for \`StreamError\``);
            }
          }
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline15(arg0) {
      const ret = now$1();
      var {seconds: v0_0, nanoseconds: v0_1 } = ret;
      dataView(memory0).setBigInt64(arg0 + 0, toUint64(v0_0), true);
      dataView(memory0).setInt32(arg0 + 8, toUint32(v0_1), true);
    }
    
    
    function trampoline16(arg0, arg1) {
      const ret = getRandomBytes(BigInt.asUintN(64, arg0));
      var val0 = ret;
      var len0 = val0.byteLength;
      var ptr0 = realloc0(0, 0, 1, len0 * 1);
      var src0 = new Uint8Array(val0.buffer || val0, val0.byteOffset, len0 * 1);
      (new Uint8Array(memory0.buffer, ptr0, len0 * 1)).set(src0);
      dataView(memory0).setInt32(arg1 + 4, len0, true);
      dataView(memory0).setInt32(arg1 + 0, ptr0, true);
    }
    
    const handleTable3 = [T_FLAG, 0];
    const captureTable3= new Map();
    let captureCnt3 = 0;
    handleTables[3] = handleTable3;
    
    function trampoline17(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.createDirectoryAt(result3)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var val4 = e;
          let enum4;
          switch (val4) {
            case 'access': {
              enum4 = 0;
              break;
            }
            case 'would-block': {
              enum4 = 1;
              break;
            }
            case 'already': {
              enum4 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum4 = 3;
              break;
            }
            case 'busy': {
              enum4 = 4;
              break;
            }
            case 'deadlock': {
              enum4 = 5;
              break;
            }
            case 'quota': {
              enum4 = 6;
              break;
            }
            case 'exist': {
              enum4 = 7;
              break;
            }
            case 'file-too-large': {
              enum4 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum4 = 9;
              break;
            }
            case 'in-progress': {
              enum4 = 10;
              break;
            }
            case 'interrupted': {
              enum4 = 11;
              break;
            }
            case 'invalid': {
              enum4 = 12;
              break;
            }
            case 'io': {
              enum4 = 13;
              break;
            }
            case 'is-directory': {
              enum4 = 14;
              break;
            }
            case 'loop': {
              enum4 = 15;
              break;
            }
            case 'too-many-links': {
              enum4 = 16;
              break;
            }
            case 'message-size': {
              enum4 = 17;
              break;
            }
            case 'name-too-long': {
              enum4 = 18;
              break;
            }
            case 'no-device': {
              enum4 = 19;
              break;
            }
            case 'no-entry': {
              enum4 = 20;
              break;
            }
            case 'no-lock': {
              enum4 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum4 = 22;
              break;
            }
            case 'insufficient-space': {
              enum4 = 23;
              break;
            }
            case 'not-directory': {
              enum4 = 24;
              break;
            }
            case 'not-empty': {
              enum4 = 25;
              break;
            }
            case 'not-recoverable': {
              enum4 = 26;
              break;
            }
            case 'unsupported': {
              enum4 = 27;
              break;
            }
            case 'no-tty': {
              enum4 = 28;
              break;
            }
            case 'no-such-device': {
              enum4 = 29;
              break;
            }
            case 'overflow': {
              enum4 = 30;
              break;
            }
            case 'not-permitted': {
              enum4 = 31;
              break;
            }
            case 'pipe': {
              enum4 = 32;
              break;
            }
            case 'read-only': {
              enum4 = 33;
              break;
            }
            case 'invalid-seek': {
              enum4 = 34;
              break;
            }
            case 'text-file-busy': {
              enum4 = 35;
              break;
            }
            case 'cross-device': {
              enum4 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg3 + 1, enum4, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline18(arg0, arg1, arg2, arg3, arg4, arg5, arg6, arg7) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      if ((arg1 & 4294967294) !== 0) {
        throw new TypeError('flags have extraneous bits set');
      }
      var flags3 = {
        symlinkFollow: Boolean(arg1 & 1),
      };
      var ptr4 = arg2;
      var len4 = arg3;
      var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
      var handle6 = arg4;
      var rep7 = handleTable3[(handle6 << 1) + 1] & ~T_FLAG;
      var rsc5 = captureTable3.get(rep7);
      if (!rsc5) {
        rsc5 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc5, symbolRscHandle, { writable: true, value: handle6});
        Object.defineProperty(rsc5, symbolRscRep, { writable: true, value: rep7});
      }
      curResourceBorrows.push(rsc5);
      var ptr8 = arg5;
      var len8 = arg6;
      var result8 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr8, len8));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.linkAt(flags3, result4, rsc5, result8)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant10 = ret;
      switch (variant10.tag) {
        case 'ok': {
          const e = variant10.val;
          dataView(memory0).setInt8(arg7 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant10.val;
          dataView(memory0).setInt8(arg7 + 0, 1, true);
          var val9 = e;
          let enum9;
          switch (val9) {
            case 'access': {
              enum9 = 0;
              break;
            }
            case 'would-block': {
              enum9 = 1;
              break;
            }
            case 'already': {
              enum9 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum9 = 3;
              break;
            }
            case 'busy': {
              enum9 = 4;
              break;
            }
            case 'deadlock': {
              enum9 = 5;
              break;
            }
            case 'quota': {
              enum9 = 6;
              break;
            }
            case 'exist': {
              enum9 = 7;
              break;
            }
            case 'file-too-large': {
              enum9 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum9 = 9;
              break;
            }
            case 'in-progress': {
              enum9 = 10;
              break;
            }
            case 'interrupted': {
              enum9 = 11;
              break;
            }
            case 'invalid': {
              enum9 = 12;
              break;
            }
            case 'io': {
              enum9 = 13;
              break;
            }
            case 'is-directory': {
              enum9 = 14;
              break;
            }
            case 'loop': {
              enum9 = 15;
              break;
            }
            case 'too-many-links': {
              enum9 = 16;
              break;
            }
            case 'message-size': {
              enum9 = 17;
              break;
            }
            case 'name-too-long': {
              enum9 = 18;
              break;
            }
            case 'no-device': {
              enum9 = 19;
              break;
            }
            case 'no-entry': {
              enum9 = 20;
              break;
            }
            case 'no-lock': {
              enum9 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum9 = 22;
              break;
            }
            case 'insufficient-space': {
              enum9 = 23;
              break;
            }
            case 'not-directory': {
              enum9 = 24;
              break;
            }
            case 'not-empty': {
              enum9 = 25;
              break;
            }
            case 'not-recoverable': {
              enum9 = 26;
              break;
            }
            case 'unsupported': {
              enum9 = 27;
              break;
            }
            case 'no-tty': {
              enum9 = 28;
              break;
            }
            case 'no-such-device': {
              enum9 = 29;
              break;
            }
            case 'overflow': {
              enum9 = 30;
              break;
            }
            case 'not-permitted': {
              enum9 = 31;
              break;
            }
            case 'pipe': {
              enum9 = 32;
              break;
            }
            case 'read-only': {
              enum9 = 33;
              break;
            }
            case 'invalid-seek': {
              enum9 = 34;
              break;
            }
            case 'text-file-busy': {
              enum9 = 35;
              break;
            }
            case 'cross-device': {
              enum9 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val9}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg7 + 1, enum9, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline19(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      if ((arg1 & 4294967294) !== 0) {
        throw new TypeError('flags have extraneous bits set');
      }
      var flags3 = {
        symlinkFollow: Boolean(arg1 & 1),
      };
      var ptr4 = arg2;
      var len4 = arg3;
      var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
      if ((arg4 & 4294967280) !== 0) {
        throw new TypeError('flags have extraneous bits set');
      }
      var flags5 = {
        create: Boolean(arg4 & 1),
        directory: Boolean(arg4 & 2),
        exclusive: Boolean(arg4 & 4),
        truncate: Boolean(arg4 & 8),
      };
      if ((arg5 & 4294967232) !== 0) {
        throw new TypeError('flags have extraneous bits set');
      }
      var flags6 = {
        read: Boolean(arg5 & 1),
        write: Boolean(arg5 & 2),
        fileIntegritySync: Boolean(arg5 & 4),
        dataIntegritySync: Boolean(arg5 & 8),
        requestedWriteSync: Boolean(arg5 & 16),
        mutateDirectory: Boolean(arg5 & 32),
      };
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.openAt(flags3, result4, flags5, flags6)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant9 = ret;
      switch (variant9.tag) {
        case 'ok': {
          const e = variant9.val;
          dataView(memory0).setInt8(arg6 + 0, 0, true);
          if (!(e instanceof Descriptor)) {
            throw new TypeError('Resource error: Not a valid "Descriptor" resource.');
          }
          var handle7 = e[symbolRscHandle];
          if (!handle7) {
            const rep = e[symbolRscRep] || ++captureCnt3;
            captureTable3.set(rep, e);
            handle7 = rscTableCreateOwn(handleTable3, rep);
          }
          dataView(memory0).setInt32(arg6 + 4, handle7, true);
          break;
        }
        case 'err': {
          const e = variant9.val;
          dataView(memory0).setInt8(arg6 + 0, 1, true);
          var val8 = e;
          let enum8;
          switch (val8) {
            case 'access': {
              enum8 = 0;
              break;
            }
            case 'would-block': {
              enum8 = 1;
              break;
            }
            case 'already': {
              enum8 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum8 = 3;
              break;
            }
            case 'busy': {
              enum8 = 4;
              break;
            }
            case 'deadlock': {
              enum8 = 5;
              break;
            }
            case 'quota': {
              enum8 = 6;
              break;
            }
            case 'exist': {
              enum8 = 7;
              break;
            }
            case 'file-too-large': {
              enum8 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum8 = 9;
              break;
            }
            case 'in-progress': {
              enum8 = 10;
              break;
            }
            case 'interrupted': {
              enum8 = 11;
              break;
            }
            case 'invalid': {
              enum8 = 12;
              break;
            }
            case 'io': {
              enum8 = 13;
              break;
            }
            case 'is-directory': {
              enum8 = 14;
              break;
            }
            case 'loop': {
              enum8 = 15;
              break;
            }
            case 'too-many-links': {
              enum8 = 16;
              break;
            }
            case 'message-size': {
              enum8 = 17;
              break;
            }
            case 'name-too-long': {
              enum8 = 18;
              break;
            }
            case 'no-device': {
              enum8 = 19;
              break;
            }
            case 'no-entry': {
              enum8 = 20;
              break;
            }
            case 'no-lock': {
              enum8 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum8 = 22;
              break;
            }
            case 'insufficient-space': {
              enum8 = 23;
              break;
            }
            case 'not-directory': {
              enum8 = 24;
              break;
            }
            case 'not-empty': {
              enum8 = 25;
              break;
            }
            case 'not-recoverable': {
              enum8 = 26;
              break;
            }
            case 'unsupported': {
              enum8 = 27;
              break;
            }
            case 'no-tty': {
              enum8 = 28;
              break;
            }
            case 'no-such-device': {
              enum8 = 29;
              break;
            }
            case 'overflow': {
              enum8 = 30;
              break;
            }
            case 'not-permitted': {
              enum8 = 31;
              break;
            }
            case 'pipe': {
              enum8 = 32;
              break;
            }
            case 'read-only': {
              enum8 = 33;
              break;
            }
            case 'invalid-seek': {
              enum8 = 34;
              break;
            }
            case 'text-file-busy': {
              enum8 = 35;
              break;
            }
            case 'cross-device': {
              enum8 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val8}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg6 + 4, enum8, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline20(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.read(BigInt.asUintN(64, arg1), BigInt.asUintN(64, arg2))};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant6 = ret;
      switch (variant6.tag) {
        case 'ok': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          var [tuple3_0, tuple3_1] = e;
          var val4 = tuple3_0;
          var len4 = val4.byteLength;
          var ptr4 = realloc0(0, 0, 1, len4 * 1);
          var src4 = new Uint8Array(val4.buffer || val4, val4.byteOffset, len4 * 1);
          (new Uint8Array(memory0.buffer, ptr4, len4 * 1)).set(src4);
          dataView(memory0).setInt32(arg3 + 8, len4, true);
          dataView(memory0).setInt32(arg3 + 4, ptr4, true);
          dataView(memory0).setInt8(arg3 + 12, tuple3_1 ? 1 : 0, true);
          break;
        }
        case 'err': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var val5 = e;
          let enum5;
          switch (val5) {
            case 'access': {
              enum5 = 0;
              break;
            }
            case 'would-block': {
              enum5 = 1;
              break;
            }
            case 'already': {
              enum5 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum5 = 3;
              break;
            }
            case 'busy': {
              enum5 = 4;
              break;
            }
            case 'deadlock': {
              enum5 = 5;
              break;
            }
            case 'quota': {
              enum5 = 6;
              break;
            }
            case 'exist': {
              enum5 = 7;
              break;
            }
            case 'file-too-large': {
              enum5 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum5 = 9;
              break;
            }
            case 'in-progress': {
              enum5 = 10;
              break;
            }
            case 'interrupted': {
              enum5 = 11;
              break;
            }
            case 'invalid': {
              enum5 = 12;
              break;
            }
            case 'io': {
              enum5 = 13;
              break;
            }
            case 'is-directory': {
              enum5 = 14;
              break;
            }
            case 'loop': {
              enum5 = 15;
              break;
            }
            case 'too-many-links': {
              enum5 = 16;
              break;
            }
            case 'message-size': {
              enum5 = 17;
              break;
            }
            case 'name-too-long': {
              enum5 = 18;
              break;
            }
            case 'no-device': {
              enum5 = 19;
              break;
            }
            case 'no-entry': {
              enum5 = 20;
              break;
            }
            case 'no-lock': {
              enum5 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum5 = 22;
              break;
            }
            case 'insufficient-space': {
              enum5 = 23;
              break;
            }
            case 'not-directory': {
              enum5 = 24;
              break;
            }
            case 'not-empty': {
              enum5 = 25;
              break;
            }
            case 'not-recoverable': {
              enum5 = 26;
              break;
            }
            case 'unsupported': {
              enum5 = 27;
              break;
            }
            case 'no-tty': {
              enum5 = 28;
              break;
            }
            case 'no-such-device': {
              enum5 = 29;
              break;
            }
            case 'overflow': {
              enum5 = 30;
              break;
            }
            case 'not-permitted': {
              enum5 = 31;
              break;
            }
            case 'pipe': {
              enum5 = 32;
              break;
            }
            case 'read-only': {
              enum5 = 33;
              break;
            }
            case 'invalid-seek': {
              enum5 = 34;
              break;
            }
            case 'text-file-busy': {
              enum5 = 35;
              break;
            }
            case 'cross-device': {
              enum5 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val5}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg3 + 4, enum5, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    const handleTable4 = [T_FLAG, 0];
    const captureTable4= new Map();
    let captureCnt4 = 0;
    handleTables[4] = handleTable4;
    
    function trampoline21(arg0, arg1) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.readDirectory()};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg1 + 0, 0, true);
          if (!(e instanceof DirectoryEntryStream)) {
            throw new TypeError('Resource error: Not a valid "DirectoryEntryStream" resource.');
          }
          var handle3 = e[symbolRscHandle];
          if (!handle3) {
            const rep = e[symbolRscRep] || ++captureCnt4;
            captureTable4.set(rep, e);
            handle3 = rscTableCreateOwn(handleTable4, rep);
          }
          dataView(memory0).setInt32(arg1 + 4, handle3, true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg1 + 0, 1, true);
          var val4 = e;
          let enum4;
          switch (val4) {
            case 'access': {
              enum4 = 0;
              break;
            }
            case 'would-block': {
              enum4 = 1;
              break;
            }
            case 'already': {
              enum4 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum4 = 3;
              break;
            }
            case 'busy': {
              enum4 = 4;
              break;
            }
            case 'deadlock': {
              enum4 = 5;
              break;
            }
            case 'quota': {
              enum4 = 6;
              break;
            }
            case 'exist': {
              enum4 = 7;
              break;
            }
            case 'file-too-large': {
              enum4 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum4 = 9;
              break;
            }
            case 'in-progress': {
              enum4 = 10;
              break;
            }
            case 'interrupted': {
              enum4 = 11;
              break;
            }
            case 'invalid': {
              enum4 = 12;
              break;
            }
            case 'io': {
              enum4 = 13;
              break;
            }
            case 'is-directory': {
              enum4 = 14;
              break;
            }
            case 'loop': {
              enum4 = 15;
              break;
            }
            case 'too-many-links': {
              enum4 = 16;
              break;
            }
            case 'message-size': {
              enum4 = 17;
              break;
            }
            case 'name-too-long': {
              enum4 = 18;
              break;
            }
            case 'no-device': {
              enum4 = 19;
              break;
            }
            case 'no-entry': {
              enum4 = 20;
              break;
            }
            case 'no-lock': {
              enum4 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum4 = 22;
              break;
            }
            case 'insufficient-space': {
              enum4 = 23;
              break;
            }
            case 'not-directory': {
              enum4 = 24;
              break;
            }
            case 'not-empty': {
              enum4 = 25;
              break;
            }
            case 'not-recoverable': {
              enum4 = 26;
              break;
            }
            case 'unsupported': {
              enum4 = 27;
              break;
            }
            case 'no-tty': {
              enum4 = 28;
              break;
            }
            case 'no-such-device': {
              enum4 = 29;
              break;
            }
            case 'overflow': {
              enum4 = 30;
              break;
            }
            case 'not-permitted': {
              enum4 = 31;
              break;
            }
            case 'pipe': {
              enum4 = 32;
              break;
            }
            case 'read-only': {
              enum4 = 33;
              break;
            }
            case 'invalid-seek': {
              enum4 = 34;
              break;
            }
            case 'text-file-busy': {
              enum4 = 35;
              break;
            }
            case 'cross-device': {
              enum4 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg1 + 4, enum4, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline22(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.readlinkAt(result3)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant6 = ret;
      switch (variant6.tag) {
        case 'ok': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          var ptr4 = utf8Encode(e, realloc0, memory0);
          var len4 = utf8EncodedLen;
          dataView(memory0).setInt32(arg3 + 8, len4, true);
          dataView(memory0).setInt32(arg3 + 4, ptr4, true);
          break;
        }
        case 'err': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var val5 = e;
          let enum5;
          switch (val5) {
            case 'access': {
              enum5 = 0;
              break;
            }
            case 'would-block': {
              enum5 = 1;
              break;
            }
            case 'already': {
              enum5 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum5 = 3;
              break;
            }
            case 'busy': {
              enum5 = 4;
              break;
            }
            case 'deadlock': {
              enum5 = 5;
              break;
            }
            case 'quota': {
              enum5 = 6;
              break;
            }
            case 'exist': {
              enum5 = 7;
              break;
            }
            case 'file-too-large': {
              enum5 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum5 = 9;
              break;
            }
            case 'in-progress': {
              enum5 = 10;
              break;
            }
            case 'interrupted': {
              enum5 = 11;
              break;
            }
            case 'invalid': {
              enum5 = 12;
              break;
            }
            case 'io': {
              enum5 = 13;
              break;
            }
            case 'is-directory': {
              enum5 = 14;
              break;
            }
            case 'loop': {
              enum5 = 15;
              break;
            }
            case 'too-many-links': {
              enum5 = 16;
              break;
            }
            case 'message-size': {
              enum5 = 17;
              break;
            }
            case 'name-too-long': {
              enum5 = 18;
              break;
            }
            case 'no-device': {
              enum5 = 19;
              break;
            }
            case 'no-entry': {
              enum5 = 20;
              break;
            }
            case 'no-lock': {
              enum5 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum5 = 22;
              break;
            }
            case 'insufficient-space': {
              enum5 = 23;
              break;
            }
            case 'not-directory': {
              enum5 = 24;
              break;
            }
            case 'not-empty': {
              enum5 = 25;
              break;
            }
            case 'not-recoverable': {
              enum5 = 26;
              break;
            }
            case 'unsupported': {
              enum5 = 27;
              break;
            }
            case 'no-tty': {
              enum5 = 28;
              break;
            }
            case 'no-such-device': {
              enum5 = 29;
              break;
            }
            case 'overflow': {
              enum5 = 30;
              break;
            }
            case 'not-permitted': {
              enum5 = 31;
              break;
            }
            case 'pipe': {
              enum5 = 32;
              break;
            }
            case 'read-only': {
              enum5 = 33;
              break;
            }
            case 'invalid-seek': {
              enum5 = 34;
              break;
            }
            case 'text-file-busy': {
              enum5 = 35;
              break;
            }
            case 'cross-device': {
              enum5 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val5}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg3 + 4, enum5, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline23(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.removeDirectoryAt(result3)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var val4 = e;
          let enum4;
          switch (val4) {
            case 'access': {
              enum4 = 0;
              break;
            }
            case 'would-block': {
              enum4 = 1;
              break;
            }
            case 'already': {
              enum4 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum4 = 3;
              break;
            }
            case 'busy': {
              enum4 = 4;
              break;
            }
            case 'deadlock': {
              enum4 = 5;
              break;
            }
            case 'quota': {
              enum4 = 6;
              break;
            }
            case 'exist': {
              enum4 = 7;
              break;
            }
            case 'file-too-large': {
              enum4 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum4 = 9;
              break;
            }
            case 'in-progress': {
              enum4 = 10;
              break;
            }
            case 'interrupted': {
              enum4 = 11;
              break;
            }
            case 'invalid': {
              enum4 = 12;
              break;
            }
            case 'io': {
              enum4 = 13;
              break;
            }
            case 'is-directory': {
              enum4 = 14;
              break;
            }
            case 'loop': {
              enum4 = 15;
              break;
            }
            case 'too-many-links': {
              enum4 = 16;
              break;
            }
            case 'message-size': {
              enum4 = 17;
              break;
            }
            case 'name-too-long': {
              enum4 = 18;
              break;
            }
            case 'no-device': {
              enum4 = 19;
              break;
            }
            case 'no-entry': {
              enum4 = 20;
              break;
            }
            case 'no-lock': {
              enum4 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum4 = 22;
              break;
            }
            case 'insufficient-space': {
              enum4 = 23;
              break;
            }
            case 'not-directory': {
              enum4 = 24;
              break;
            }
            case 'not-empty': {
              enum4 = 25;
              break;
            }
            case 'not-recoverable': {
              enum4 = 26;
              break;
            }
            case 'unsupported': {
              enum4 = 27;
              break;
            }
            case 'no-tty': {
              enum4 = 28;
              break;
            }
            case 'no-such-device': {
              enum4 = 29;
              break;
            }
            case 'overflow': {
              enum4 = 30;
              break;
            }
            case 'not-permitted': {
              enum4 = 31;
              break;
            }
            case 'pipe': {
              enum4 = 32;
              break;
            }
            case 'read-only': {
              enum4 = 33;
              break;
            }
            case 'invalid-seek': {
              enum4 = 34;
              break;
            }
            case 'text-file-busy': {
              enum4 = 35;
              break;
            }
            case 'cross-device': {
              enum4 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg3 + 1, enum4, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline24(arg0, arg1, arg2, arg3, arg4, arg5, arg6) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      var handle5 = arg3;
      var rep6 = handleTable3[(handle5 << 1) + 1] & ~T_FLAG;
      var rsc4 = captureTable3.get(rep6);
      if (!rsc4) {
        rsc4 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc4, symbolRscHandle, { writable: true, value: handle5});
        Object.defineProperty(rsc4, symbolRscRep, { writable: true, value: rep6});
      }
      curResourceBorrows.push(rsc4);
      var ptr7 = arg4;
      var len7 = arg5;
      var result7 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr7, len7));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.renameAt(result3, rsc4, result7)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant9 = ret;
      switch (variant9.tag) {
        case 'ok': {
          const e = variant9.val;
          dataView(memory0).setInt8(arg6 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant9.val;
          dataView(memory0).setInt8(arg6 + 0, 1, true);
          var val8 = e;
          let enum8;
          switch (val8) {
            case 'access': {
              enum8 = 0;
              break;
            }
            case 'would-block': {
              enum8 = 1;
              break;
            }
            case 'already': {
              enum8 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum8 = 3;
              break;
            }
            case 'busy': {
              enum8 = 4;
              break;
            }
            case 'deadlock': {
              enum8 = 5;
              break;
            }
            case 'quota': {
              enum8 = 6;
              break;
            }
            case 'exist': {
              enum8 = 7;
              break;
            }
            case 'file-too-large': {
              enum8 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum8 = 9;
              break;
            }
            case 'in-progress': {
              enum8 = 10;
              break;
            }
            case 'interrupted': {
              enum8 = 11;
              break;
            }
            case 'invalid': {
              enum8 = 12;
              break;
            }
            case 'io': {
              enum8 = 13;
              break;
            }
            case 'is-directory': {
              enum8 = 14;
              break;
            }
            case 'loop': {
              enum8 = 15;
              break;
            }
            case 'too-many-links': {
              enum8 = 16;
              break;
            }
            case 'message-size': {
              enum8 = 17;
              break;
            }
            case 'name-too-long': {
              enum8 = 18;
              break;
            }
            case 'no-device': {
              enum8 = 19;
              break;
            }
            case 'no-entry': {
              enum8 = 20;
              break;
            }
            case 'no-lock': {
              enum8 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum8 = 22;
              break;
            }
            case 'insufficient-space': {
              enum8 = 23;
              break;
            }
            case 'not-directory': {
              enum8 = 24;
              break;
            }
            case 'not-empty': {
              enum8 = 25;
              break;
            }
            case 'not-recoverable': {
              enum8 = 26;
              break;
            }
            case 'unsupported': {
              enum8 = 27;
              break;
            }
            case 'no-tty': {
              enum8 = 28;
              break;
            }
            case 'no-such-device': {
              enum8 = 29;
              break;
            }
            case 'overflow': {
              enum8 = 30;
              break;
            }
            case 'not-permitted': {
              enum8 = 31;
              break;
            }
            case 'pipe': {
              enum8 = 32;
              break;
            }
            case 'read-only': {
              enum8 = 33;
              break;
            }
            case 'invalid-seek': {
              enum8 = 34;
              break;
            }
            case 'text-file-busy': {
              enum8 = 35;
              break;
            }
            case 'cross-device': {
              enum8 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val8}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg6 + 1, enum8, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline25(arg0, arg1) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.stat()};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant12 = ret;
      switch (variant12.tag) {
        case 'ok': {
          const e = variant12.val;
          dataView(memory0).setInt8(arg1 + 0, 0, true);
          var {type: v3_0, linkCount: v3_1, size: v3_2, dataAccessTimestamp: v3_3, dataModificationTimestamp: v3_4, statusChangeTimestamp: v3_5 } = e;
          var val4 = v3_0;
          let enum4;
          switch (val4) {
            case 'unknown': {
              enum4 = 0;
              break;
            }
            case 'block-device': {
              enum4 = 1;
              break;
            }
            case 'character-device': {
              enum4 = 2;
              break;
            }
            case 'directory': {
              enum4 = 3;
              break;
            }
            case 'fifo': {
              enum4 = 4;
              break;
            }
            case 'symbolic-link': {
              enum4 = 5;
              break;
            }
            case 'regular-file': {
              enum4 = 6;
              break;
            }
            case 'socket': {
              enum4 = 7;
              break;
            }
            default: {
              if ((v3_0) instanceof Error) {
                console.error(v3_0);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of descriptor-type`);
            }
          }
          dataView(memory0).setInt8(arg1 + 8, enum4, true);
          dataView(memory0).setBigInt64(arg1 + 16, toUint64(v3_1), true);
          dataView(memory0).setBigInt64(arg1 + 24, toUint64(v3_2), true);
          var variant6 = v3_3;
          if (variant6 === null || variant6=== undefined) {
            dataView(memory0).setInt8(arg1 + 32, 0, true);
          } else {
            const e = variant6;
            dataView(memory0).setInt8(arg1 + 32, 1, true);
            var {seconds: v5_0, nanoseconds: v5_1 } = e;
            dataView(memory0).setBigInt64(arg1 + 40, toUint64(v5_0), true);
            dataView(memory0).setInt32(arg1 + 48, toUint32(v5_1), true);
          }
          var variant8 = v3_4;
          if (variant8 === null || variant8=== undefined) {
            dataView(memory0).setInt8(arg1 + 56, 0, true);
          } else {
            const e = variant8;
            dataView(memory0).setInt8(arg1 + 56, 1, true);
            var {seconds: v7_0, nanoseconds: v7_1 } = e;
            dataView(memory0).setBigInt64(arg1 + 64, toUint64(v7_0), true);
            dataView(memory0).setInt32(arg1 + 72, toUint32(v7_1), true);
          }
          var variant10 = v3_5;
          if (variant10 === null || variant10=== undefined) {
            dataView(memory0).setInt8(arg1 + 80, 0, true);
          } else {
            const e = variant10;
            dataView(memory0).setInt8(arg1 + 80, 1, true);
            var {seconds: v9_0, nanoseconds: v9_1 } = e;
            dataView(memory0).setBigInt64(arg1 + 88, toUint64(v9_0), true);
            dataView(memory0).setInt32(arg1 + 96, toUint32(v9_1), true);
          }
          break;
        }
        case 'err': {
          const e = variant12.val;
          dataView(memory0).setInt8(arg1 + 0, 1, true);
          var val11 = e;
          let enum11;
          switch (val11) {
            case 'access': {
              enum11 = 0;
              break;
            }
            case 'would-block': {
              enum11 = 1;
              break;
            }
            case 'already': {
              enum11 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum11 = 3;
              break;
            }
            case 'busy': {
              enum11 = 4;
              break;
            }
            case 'deadlock': {
              enum11 = 5;
              break;
            }
            case 'quota': {
              enum11 = 6;
              break;
            }
            case 'exist': {
              enum11 = 7;
              break;
            }
            case 'file-too-large': {
              enum11 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum11 = 9;
              break;
            }
            case 'in-progress': {
              enum11 = 10;
              break;
            }
            case 'interrupted': {
              enum11 = 11;
              break;
            }
            case 'invalid': {
              enum11 = 12;
              break;
            }
            case 'io': {
              enum11 = 13;
              break;
            }
            case 'is-directory': {
              enum11 = 14;
              break;
            }
            case 'loop': {
              enum11 = 15;
              break;
            }
            case 'too-many-links': {
              enum11 = 16;
              break;
            }
            case 'message-size': {
              enum11 = 17;
              break;
            }
            case 'name-too-long': {
              enum11 = 18;
              break;
            }
            case 'no-device': {
              enum11 = 19;
              break;
            }
            case 'no-entry': {
              enum11 = 20;
              break;
            }
            case 'no-lock': {
              enum11 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum11 = 22;
              break;
            }
            case 'insufficient-space': {
              enum11 = 23;
              break;
            }
            case 'not-directory': {
              enum11 = 24;
              break;
            }
            case 'not-empty': {
              enum11 = 25;
              break;
            }
            case 'not-recoverable': {
              enum11 = 26;
              break;
            }
            case 'unsupported': {
              enum11 = 27;
              break;
            }
            case 'no-tty': {
              enum11 = 28;
              break;
            }
            case 'no-such-device': {
              enum11 = 29;
              break;
            }
            case 'overflow': {
              enum11 = 30;
              break;
            }
            case 'not-permitted': {
              enum11 = 31;
              break;
            }
            case 'pipe': {
              enum11 = 32;
              break;
            }
            case 'read-only': {
              enum11 = 33;
              break;
            }
            case 'invalid-seek': {
              enum11 = 34;
              break;
            }
            case 'text-file-busy': {
              enum11 = 35;
              break;
            }
            case 'cross-device': {
              enum11 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val11}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg1 + 8, enum11, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline26(arg0, arg1, arg2, arg3, arg4) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      if ((arg1 & 4294967294) !== 0) {
        throw new TypeError('flags have extraneous bits set');
      }
      var flags3 = {
        symlinkFollow: Boolean(arg1 & 1),
      };
      var ptr4 = arg2;
      var len4 = arg3;
      var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.statAt(flags3, result4)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant14 = ret;
      switch (variant14.tag) {
        case 'ok': {
          const e = variant14.val;
          dataView(memory0).setInt8(arg4 + 0, 0, true);
          var {type: v5_0, linkCount: v5_1, size: v5_2, dataAccessTimestamp: v5_3, dataModificationTimestamp: v5_4, statusChangeTimestamp: v5_5 } = e;
          var val6 = v5_0;
          let enum6;
          switch (val6) {
            case 'unknown': {
              enum6 = 0;
              break;
            }
            case 'block-device': {
              enum6 = 1;
              break;
            }
            case 'character-device': {
              enum6 = 2;
              break;
            }
            case 'directory': {
              enum6 = 3;
              break;
            }
            case 'fifo': {
              enum6 = 4;
              break;
            }
            case 'symbolic-link': {
              enum6 = 5;
              break;
            }
            case 'regular-file': {
              enum6 = 6;
              break;
            }
            case 'socket': {
              enum6 = 7;
              break;
            }
            default: {
              if ((v5_0) instanceof Error) {
                console.error(v5_0);
              }
              
              throw new TypeError(`"${val6}" is not one of the cases of descriptor-type`);
            }
          }
          dataView(memory0).setInt8(arg4 + 8, enum6, true);
          dataView(memory0).setBigInt64(arg4 + 16, toUint64(v5_1), true);
          dataView(memory0).setBigInt64(arg4 + 24, toUint64(v5_2), true);
          var variant8 = v5_3;
          if (variant8 === null || variant8=== undefined) {
            dataView(memory0).setInt8(arg4 + 32, 0, true);
          } else {
            const e = variant8;
            dataView(memory0).setInt8(arg4 + 32, 1, true);
            var {seconds: v7_0, nanoseconds: v7_1 } = e;
            dataView(memory0).setBigInt64(arg4 + 40, toUint64(v7_0), true);
            dataView(memory0).setInt32(arg4 + 48, toUint32(v7_1), true);
          }
          var variant10 = v5_4;
          if (variant10 === null || variant10=== undefined) {
            dataView(memory0).setInt8(arg4 + 56, 0, true);
          } else {
            const e = variant10;
            dataView(memory0).setInt8(arg4 + 56, 1, true);
            var {seconds: v9_0, nanoseconds: v9_1 } = e;
            dataView(memory0).setBigInt64(arg4 + 64, toUint64(v9_0), true);
            dataView(memory0).setInt32(arg4 + 72, toUint32(v9_1), true);
          }
          var variant12 = v5_5;
          if (variant12 === null || variant12=== undefined) {
            dataView(memory0).setInt8(arg4 + 80, 0, true);
          } else {
            const e = variant12;
            dataView(memory0).setInt8(arg4 + 80, 1, true);
            var {seconds: v11_0, nanoseconds: v11_1 } = e;
            dataView(memory0).setBigInt64(arg4 + 88, toUint64(v11_0), true);
            dataView(memory0).setInt32(arg4 + 96, toUint32(v11_1), true);
          }
          break;
        }
        case 'err': {
          const e = variant14.val;
          dataView(memory0).setInt8(arg4 + 0, 1, true);
          var val13 = e;
          let enum13;
          switch (val13) {
            case 'access': {
              enum13 = 0;
              break;
            }
            case 'would-block': {
              enum13 = 1;
              break;
            }
            case 'already': {
              enum13 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum13 = 3;
              break;
            }
            case 'busy': {
              enum13 = 4;
              break;
            }
            case 'deadlock': {
              enum13 = 5;
              break;
            }
            case 'quota': {
              enum13 = 6;
              break;
            }
            case 'exist': {
              enum13 = 7;
              break;
            }
            case 'file-too-large': {
              enum13 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum13 = 9;
              break;
            }
            case 'in-progress': {
              enum13 = 10;
              break;
            }
            case 'interrupted': {
              enum13 = 11;
              break;
            }
            case 'invalid': {
              enum13 = 12;
              break;
            }
            case 'io': {
              enum13 = 13;
              break;
            }
            case 'is-directory': {
              enum13 = 14;
              break;
            }
            case 'loop': {
              enum13 = 15;
              break;
            }
            case 'too-many-links': {
              enum13 = 16;
              break;
            }
            case 'message-size': {
              enum13 = 17;
              break;
            }
            case 'name-too-long': {
              enum13 = 18;
              break;
            }
            case 'no-device': {
              enum13 = 19;
              break;
            }
            case 'no-entry': {
              enum13 = 20;
              break;
            }
            case 'no-lock': {
              enum13 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum13 = 22;
              break;
            }
            case 'insufficient-space': {
              enum13 = 23;
              break;
            }
            case 'not-directory': {
              enum13 = 24;
              break;
            }
            case 'not-empty': {
              enum13 = 25;
              break;
            }
            case 'not-recoverable': {
              enum13 = 26;
              break;
            }
            case 'unsupported': {
              enum13 = 27;
              break;
            }
            case 'no-tty': {
              enum13 = 28;
              break;
            }
            case 'no-such-device': {
              enum13 = 29;
              break;
            }
            case 'overflow': {
              enum13 = 30;
              break;
            }
            case 'not-permitted': {
              enum13 = 31;
              break;
            }
            case 'pipe': {
              enum13 = 32;
              break;
            }
            case 'read-only': {
              enum13 = 33;
              break;
            }
            case 'invalid-seek': {
              enum13 = 34;
              break;
            }
            case 'text-file-busy': {
              enum13 = 35;
              break;
            }
            case 'cross-device': {
              enum13 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val13}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg4 + 8, enum13, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline27(arg0, arg1, arg2, arg3, arg4, arg5) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      var ptr4 = arg3;
      var len4 = arg4;
      var result4 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr4, len4));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.symlinkAt(result3, result4)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant6 = ret;
      switch (variant6.tag) {
        case 'ok': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg5 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant6.val;
          dataView(memory0).setInt8(arg5 + 0, 1, true);
          var val5 = e;
          let enum5;
          switch (val5) {
            case 'access': {
              enum5 = 0;
              break;
            }
            case 'would-block': {
              enum5 = 1;
              break;
            }
            case 'already': {
              enum5 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum5 = 3;
              break;
            }
            case 'busy': {
              enum5 = 4;
              break;
            }
            case 'deadlock': {
              enum5 = 5;
              break;
            }
            case 'quota': {
              enum5 = 6;
              break;
            }
            case 'exist': {
              enum5 = 7;
              break;
            }
            case 'file-too-large': {
              enum5 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum5 = 9;
              break;
            }
            case 'in-progress': {
              enum5 = 10;
              break;
            }
            case 'interrupted': {
              enum5 = 11;
              break;
            }
            case 'invalid': {
              enum5 = 12;
              break;
            }
            case 'io': {
              enum5 = 13;
              break;
            }
            case 'is-directory': {
              enum5 = 14;
              break;
            }
            case 'loop': {
              enum5 = 15;
              break;
            }
            case 'too-many-links': {
              enum5 = 16;
              break;
            }
            case 'message-size': {
              enum5 = 17;
              break;
            }
            case 'name-too-long': {
              enum5 = 18;
              break;
            }
            case 'no-device': {
              enum5 = 19;
              break;
            }
            case 'no-entry': {
              enum5 = 20;
              break;
            }
            case 'no-lock': {
              enum5 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum5 = 22;
              break;
            }
            case 'insufficient-space': {
              enum5 = 23;
              break;
            }
            case 'not-directory': {
              enum5 = 24;
              break;
            }
            case 'not-empty': {
              enum5 = 25;
              break;
            }
            case 'not-recoverable': {
              enum5 = 26;
              break;
            }
            case 'unsupported': {
              enum5 = 27;
              break;
            }
            case 'no-tty': {
              enum5 = 28;
              break;
            }
            case 'no-such-device': {
              enum5 = 29;
              break;
            }
            case 'overflow': {
              enum5 = 30;
              break;
            }
            case 'not-permitted': {
              enum5 = 31;
              break;
            }
            case 'pipe': {
              enum5 = 32;
              break;
            }
            case 'read-only': {
              enum5 = 33;
              break;
            }
            case 'invalid-seek': {
              enum5 = 34;
              break;
            }
            case 'text-file-busy': {
              enum5 = 35;
              break;
            }
            case 'cross-device': {
              enum5 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val5}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg5 + 1, enum5, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline28(arg0, arg1) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.syncData()};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant4 = ret;
      switch (variant4.tag) {
        case 'ok': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant4.val;
          dataView(memory0).setInt8(arg1 + 0, 1, true);
          var val3 = e;
          let enum3;
          switch (val3) {
            case 'access': {
              enum3 = 0;
              break;
            }
            case 'would-block': {
              enum3 = 1;
              break;
            }
            case 'already': {
              enum3 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum3 = 3;
              break;
            }
            case 'busy': {
              enum3 = 4;
              break;
            }
            case 'deadlock': {
              enum3 = 5;
              break;
            }
            case 'quota': {
              enum3 = 6;
              break;
            }
            case 'exist': {
              enum3 = 7;
              break;
            }
            case 'file-too-large': {
              enum3 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum3 = 9;
              break;
            }
            case 'in-progress': {
              enum3 = 10;
              break;
            }
            case 'interrupted': {
              enum3 = 11;
              break;
            }
            case 'invalid': {
              enum3 = 12;
              break;
            }
            case 'io': {
              enum3 = 13;
              break;
            }
            case 'is-directory': {
              enum3 = 14;
              break;
            }
            case 'loop': {
              enum3 = 15;
              break;
            }
            case 'too-many-links': {
              enum3 = 16;
              break;
            }
            case 'message-size': {
              enum3 = 17;
              break;
            }
            case 'name-too-long': {
              enum3 = 18;
              break;
            }
            case 'no-device': {
              enum3 = 19;
              break;
            }
            case 'no-entry': {
              enum3 = 20;
              break;
            }
            case 'no-lock': {
              enum3 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum3 = 22;
              break;
            }
            case 'insufficient-space': {
              enum3 = 23;
              break;
            }
            case 'not-directory': {
              enum3 = 24;
              break;
            }
            case 'not-empty': {
              enum3 = 25;
              break;
            }
            case 'not-recoverable': {
              enum3 = 26;
              break;
            }
            case 'unsupported': {
              enum3 = 27;
              break;
            }
            case 'no-tty': {
              enum3 = 28;
              break;
            }
            case 'no-such-device': {
              enum3 = 29;
              break;
            }
            case 'overflow': {
              enum3 = 30;
              break;
            }
            case 'not-permitted': {
              enum3 = 31;
              break;
            }
            case 'pipe': {
              enum3 = 32;
              break;
            }
            case 'read-only': {
              enum3 = 33;
              break;
            }
            case 'invalid-seek': {
              enum3 = 34;
              break;
            }
            case 'text-file-busy': {
              enum3 = 35;
              break;
            }
            case 'cross-device': {
              enum3 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val3}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg1 + 1, enum3, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline29(arg0, arg1, arg2, arg3) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = utf8Decoder.decode(new Uint8Array(memory0.buffer, ptr3, len3));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.unlinkFileAt(result3)};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 0, true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg3 + 0, 1, true);
          var val4 = e;
          let enum4;
          switch (val4) {
            case 'access': {
              enum4 = 0;
              break;
            }
            case 'would-block': {
              enum4 = 1;
              break;
            }
            case 'already': {
              enum4 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum4 = 3;
              break;
            }
            case 'busy': {
              enum4 = 4;
              break;
            }
            case 'deadlock': {
              enum4 = 5;
              break;
            }
            case 'quota': {
              enum4 = 6;
              break;
            }
            case 'exist': {
              enum4 = 7;
              break;
            }
            case 'file-too-large': {
              enum4 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum4 = 9;
              break;
            }
            case 'in-progress': {
              enum4 = 10;
              break;
            }
            case 'interrupted': {
              enum4 = 11;
              break;
            }
            case 'invalid': {
              enum4 = 12;
              break;
            }
            case 'io': {
              enum4 = 13;
              break;
            }
            case 'is-directory': {
              enum4 = 14;
              break;
            }
            case 'loop': {
              enum4 = 15;
              break;
            }
            case 'too-many-links': {
              enum4 = 16;
              break;
            }
            case 'message-size': {
              enum4 = 17;
              break;
            }
            case 'name-too-long': {
              enum4 = 18;
              break;
            }
            case 'no-device': {
              enum4 = 19;
              break;
            }
            case 'no-entry': {
              enum4 = 20;
              break;
            }
            case 'no-lock': {
              enum4 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum4 = 22;
              break;
            }
            case 'insufficient-space': {
              enum4 = 23;
              break;
            }
            case 'not-directory': {
              enum4 = 24;
              break;
            }
            case 'not-empty': {
              enum4 = 25;
              break;
            }
            case 'not-recoverable': {
              enum4 = 26;
              break;
            }
            case 'unsupported': {
              enum4 = 27;
              break;
            }
            case 'no-tty': {
              enum4 = 28;
              break;
            }
            case 'no-such-device': {
              enum4 = 29;
              break;
            }
            case 'overflow': {
              enum4 = 30;
              break;
            }
            case 'not-permitted': {
              enum4 = 31;
              break;
            }
            case 'pipe': {
              enum4 = 32;
              break;
            }
            case 'read-only': {
              enum4 = 33;
              break;
            }
            case 'invalid-seek': {
              enum4 = 34;
              break;
            }
            case 'text-file-busy': {
              enum4 = 35;
              break;
            }
            case 'cross-device': {
              enum4 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg3 + 1, enum4, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline30(arg0, arg1, arg2, arg3, arg4) {
      var handle1 = arg0;
      var rep2 = handleTable3[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable3.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(Descriptor.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      var ptr3 = arg1;
      var len3 = arg2;
      var result3 = new Uint8Array(memory0.buffer.slice(ptr3, ptr3 + len3 * 1));
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.write(result3, BigInt.asUintN(64, arg3))};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant5 = ret;
      switch (variant5.tag) {
        case 'ok': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg4 + 0, 0, true);
          dataView(memory0).setBigInt64(arg4 + 8, toUint64(e), true);
          break;
        }
        case 'err': {
          const e = variant5.val;
          dataView(memory0).setInt8(arg4 + 0, 1, true);
          var val4 = e;
          let enum4;
          switch (val4) {
            case 'access': {
              enum4 = 0;
              break;
            }
            case 'would-block': {
              enum4 = 1;
              break;
            }
            case 'already': {
              enum4 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum4 = 3;
              break;
            }
            case 'busy': {
              enum4 = 4;
              break;
            }
            case 'deadlock': {
              enum4 = 5;
              break;
            }
            case 'quota': {
              enum4 = 6;
              break;
            }
            case 'exist': {
              enum4 = 7;
              break;
            }
            case 'file-too-large': {
              enum4 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum4 = 9;
              break;
            }
            case 'in-progress': {
              enum4 = 10;
              break;
            }
            case 'interrupted': {
              enum4 = 11;
              break;
            }
            case 'invalid': {
              enum4 = 12;
              break;
            }
            case 'io': {
              enum4 = 13;
              break;
            }
            case 'is-directory': {
              enum4 = 14;
              break;
            }
            case 'loop': {
              enum4 = 15;
              break;
            }
            case 'too-many-links': {
              enum4 = 16;
              break;
            }
            case 'message-size': {
              enum4 = 17;
              break;
            }
            case 'name-too-long': {
              enum4 = 18;
              break;
            }
            case 'no-device': {
              enum4 = 19;
              break;
            }
            case 'no-entry': {
              enum4 = 20;
              break;
            }
            case 'no-lock': {
              enum4 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum4 = 22;
              break;
            }
            case 'insufficient-space': {
              enum4 = 23;
              break;
            }
            case 'not-directory': {
              enum4 = 24;
              break;
            }
            case 'not-empty': {
              enum4 = 25;
              break;
            }
            case 'not-recoverable': {
              enum4 = 26;
              break;
            }
            case 'unsupported': {
              enum4 = 27;
              break;
            }
            case 'no-tty': {
              enum4 = 28;
              break;
            }
            case 'no-such-device': {
              enum4 = 29;
              break;
            }
            case 'overflow': {
              enum4 = 30;
              break;
            }
            case 'not-permitted': {
              enum4 = 31;
              break;
            }
            case 'pipe': {
              enum4 = 32;
              break;
            }
            case 'read-only': {
              enum4 = 33;
              break;
            }
            case 'invalid-seek': {
              enum4 = 34;
              break;
            }
            case 'text-file-busy': {
              enum4 = 35;
              break;
            }
            case 'cross-device': {
              enum4 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val4}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg4 + 8, enum4, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline31(arg0, arg1) {
      var handle1 = arg0;
      var rep2 = handleTable4[(handle1 << 1) + 1] & ~T_FLAG;
      var rsc0 = captureTable4.get(rep2);
      if (!rsc0) {
        rsc0 = Object.create(DirectoryEntryStream.prototype);
        Object.defineProperty(rsc0, symbolRscHandle, { writable: true, value: handle1});
        Object.defineProperty(rsc0, symbolRscRep, { writable: true, value: rep2});
      }
      curResourceBorrows.push(rsc0);
      let ret;
      try {
        ret = { tag: 'ok', val: rsc0.readDirectoryEntry()};
      } catch (e) {
        ret = { tag: 'err', val: getErrorPayload(e) };
      }
      for (const rsc of curResourceBorrows) {
        rsc[symbolRscHandle] = undefined;
      }
      curResourceBorrows = [];
      var variant8 = ret;
      switch (variant8.tag) {
        case 'ok': {
          const e = variant8.val;
          dataView(memory0).setInt8(arg1 + 0, 0, true);
          var variant6 = e;
          if (variant6 === null || variant6=== undefined) {
            dataView(memory0).setInt8(arg1 + 4, 0, true);
          } else {
            const e = variant6;
            dataView(memory0).setInt8(arg1 + 4, 1, true);
            var {type: v3_0, name: v3_1 } = e;
            var val4 = v3_0;
            let enum4;
            switch (val4) {
              case 'unknown': {
                enum4 = 0;
                break;
              }
              case 'block-device': {
                enum4 = 1;
                break;
              }
              case 'character-device': {
                enum4 = 2;
                break;
              }
              case 'directory': {
                enum4 = 3;
                break;
              }
              case 'fifo': {
                enum4 = 4;
                break;
              }
              case 'symbolic-link': {
                enum4 = 5;
                break;
              }
              case 'regular-file': {
                enum4 = 6;
                break;
              }
              case 'socket': {
                enum4 = 7;
                break;
              }
              default: {
                if ((v3_0) instanceof Error) {
                  console.error(v3_0);
                }
                
                throw new TypeError(`"${val4}" is not one of the cases of descriptor-type`);
              }
            }
            dataView(memory0).setInt8(arg1 + 8, enum4, true);
            var ptr5 = utf8Encode(v3_1, realloc0, memory0);
            var len5 = utf8EncodedLen;
            dataView(memory0).setInt32(arg1 + 16, len5, true);
            dataView(memory0).setInt32(arg1 + 12, ptr5, true);
          }
          break;
        }
        case 'err': {
          const e = variant8.val;
          dataView(memory0).setInt8(arg1 + 0, 1, true);
          var val7 = e;
          let enum7;
          switch (val7) {
            case 'access': {
              enum7 = 0;
              break;
            }
            case 'would-block': {
              enum7 = 1;
              break;
            }
            case 'already': {
              enum7 = 2;
              break;
            }
            case 'bad-descriptor': {
              enum7 = 3;
              break;
            }
            case 'busy': {
              enum7 = 4;
              break;
            }
            case 'deadlock': {
              enum7 = 5;
              break;
            }
            case 'quota': {
              enum7 = 6;
              break;
            }
            case 'exist': {
              enum7 = 7;
              break;
            }
            case 'file-too-large': {
              enum7 = 8;
              break;
            }
            case 'illegal-byte-sequence': {
              enum7 = 9;
              break;
            }
            case 'in-progress': {
              enum7 = 10;
              break;
            }
            case 'interrupted': {
              enum7 = 11;
              break;
            }
            case 'invalid': {
              enum7 = 12;
              break;
            }
            case 'io': {
              enum7 = 13;
              break;
            }
            case 'is-directory': {
              enum7 = 14;
              break;
            }
            case 'loop': {
              enum7 = 15;
              break;
            }
            case 'too-many-links': {
              enum7 = 16;
              break;
            }
            case 'message-size': {
              enum7 = 17;
              break;
            }
            case 'name-too-long': {
              enum7 = 18;
              break;
            }
            case 'no-device': {
              enum7 = 19;
              break;
            }
            case 'no-entry': {
              enum7 = 20;
              break;
            }
            case 'no-lock': {
              enum7 = 21;
              break;
            }
            case 'insufficient-memory': {
              enum7 = 22;
              break;
            }
            case 'insufficient-space': {
              enum7 = 23;
              break;
            }
            case 'not-directory': {
              enum7 = 24;
              break;
            }
            case 'not-empty': {
              enum7 = 25;
              break;
            }
            case 'not-recoverable': {
              enum7 = 26;
              break;
            }
            case 'unsupported': {
              enum7 = 27;
              break;
            }
            case 'no-tty': {
              enum7 = 28;
              break;
            }
            case 'no-such-device': {
              enum7 = 29;
              break;
            }
            case 'overflow': {
              enum7 = 30;
              break;
            }
            case 'not-permitted': {
              enum7 = 31;
              break;
            }
            case 'pipe': {
              enum7 = 32;
              break;
            }
            case 'read-only': {
              enum7 = 33;
              break;
            }
            case 'invalid-seek': {
              enum7 = 34;
              break;
            }
            case 'text-file-busy': {
              enum7 = 35;
              break;
            }
            case 'cross-device': {
              enum7 = 36;
              break;
            }
            default: {
              if ((e) instanceof Error) {
                console.error(e);
              }
              
              throw new TypeError(`"${val7}" is not one of the cases of error-code`);
            }
          }
          dataView(memory0).setInt8(arg1 + 4, enum7, true);
          break;
        }
        default: {
          throw new TypeError('invalid variant specified for result');
        }
      }
    }
    
    
    function trampoline32(arg0) {
      const ret = getDirectories();
      var vec3 = ret;
      var len3 = vec3.length;
      var result3 = realloc0(0, 0, 4, len3 * 12);
      for (let i = 0; i < vec3.length; i++) {
        const e = vec3[i];
        const base = result3 + i * 12;var [tuple0_0, tuple0_1] = e;
        if (!(tuple0_0 instanceof Descriptor)) {
          throw new TypeError('Resource error: Not a valid "Descriptor" resource.');
        }
        var handle1 = tuple0_0[symbolRscHandle];
        if (!handle1) {
          const rep = tuple0_0[symbolRscRep] || ++captureCnt3;
          captureTable3.set(rep, tuple0_0);
          handle1 = rscTableCreateOwn(handleTable3, rep);
        }
        dataView(memory0).setInt32(base + 0, handle1, true);
        var ptr2 = utf8Encode(tuple0_1, realloc0, memory0);
        var len2 = utf8EncodedLen;
        dataView(memory0).setInt32(base + 8, len2, true);
        dataView(memory0).setInt32(base + 4, ptr2, true);
      }
      dataView(memory0).setInt32(arg0 + 4, len3, true);
      dataView(memory0).setInt32(arg0 + 0, result3, true);
    }
    
    let exports2;
    let exports3;
    function trampoline0(handle) {
      const handleEntry = rscTableRemove(handleTable1, handle);
      if (handleEntry.own) {
        
        const rsc = captureTable1.get(handleEntry.rep);
        if (rsc) {
          if (rsc[symbolDispose]) rsc[symbolDispose]();
          captureTable1.delete(handleEntry.rep);
        } else if (InputStream[symbolCabiDispose]) {
          InputStream[symbolCabiDispose](handleEntry.rep);
        }
      }
    }
    function trampoline1(handle) {
      const handleEntry = rscTableRemove(handleTable2, handle);
      if (handleEntry.own) {
        
        const rsc = captureTable2.get(handleEntry.rep);
        if (rsc) {
          if (rsc[symbolDispose]) rsc[symbolDispose]();
          captureTable2.delete(handleEntry.rep);
        } else if (OutputStream[symbolCabiDispose]) {
          OutputStream[symbolCabiDispose](handleEntry.rep);
        }
      }
    }
    function trampoline7(handle) {
      const handleEntry = rscTableRemove(handleTable3, handle);
      if (handleEntry.own) {
        
        const rsc = captureTable3.get(handleEntry.rep);
        if (rsc) {
          if (rsc[symbolDispose]) rsc[symbolDispose]();
          captureTable3.delete(handleEntry.rep);
        } else if (Descriptor[symbolCabiDispose]) {
          Descriptor[symbolCabiDispose](handleEntry.rep);
        }
      }
    }
    function trampoline8(handle) {
      const handleEntry = rscTableRemove(handleTable4, handle);
      if (handleEntry.own) {
        
        const rsc = captureTable4.get(handleEntry.rep);
        if (rsc) {
          if (rsc[symbolDispose]) rsc[symbolDispose]();
          captureTable4.delete(handleEntry.rep);
        } else if (DirectoryEntryStream[symbolCabiDispose]) {
          DirectoryEntryStream[symbolCabiDispose](handleEntry.rep);
        }
      }
    }
    Promise.all([module0, module1, module2, module3]).catch(() => {});
    ({ exports: exports0 } = yield instantiateCore(yield module1));
    ({ exports: exports1 } = yield instantiateCore(yield module0, {
      'wasi:cli/environment@0.2.0': {
        'get-arguments': exports0['1'],
        'get-environment': exports0['0'],
        'initial-cwd': exports0['2'],
      },
      'wasi:cli/stderr@0.2.0': {
        'get-stderr': trampoline5,
      },
      'wasi:cli/stdin@0.2.0': {
        'get-stdin': trampoline6,
      },
      'wasi:cli/stdout@0.2.0': {
        'get-stdout': trampoline2,
      },
      'wasi:clocks/monotonic-clock@0.2.0': {
        now: trampoline3,
      },
      'wasi:clocks/wall-clock@0.2.0': {
        now: exports0['6'],
      },
      'wasi:filesystem/preopens@0.2.0': {
        'get-directories': exports0['23'],
      },
      'wasi:filesystem/types@0.2.0': {
        '[method]descriptor.create-directory-at': exports0['8'],
        '[method]descriptor.link-at': exports0['9'],
        '[method]descriptor.open-at': exports0['10'],
        '[method]descriptor.read': exports0['11'],
        '[method]descriptor.read-directory': exports0['12'],
        '[method]descriptor.readlink-at': exports0['13'],
        '[method]descriptor.remove-directory-at': exports0['14'],
        '[method]descriptor.rename-at': exports0['15'],
        '[method]descriptor.stat': exports0['16'],
        '[method]descriptor.stat-at': exports0['17'],
        '[method]descriptor.symlink-at': exports0['18'],
        '[method]descriptor.sync-data': exports0['19'],
        '[method]descriptor.unlink-file-at': exports0['20'],
        '[method]descriptor.write': exports0['21'],
        '[method]directory-entry-stream.read-directory-entry': exports0['22'],
        '[resource-drop]descriptor': trampoline7,
        '[resource-drop]directory-entry-stream': trampoline8,
      },
      'wasi:io/streams@0.2.0': {
        '[method]input-stream.blocking-read': exports0['3'],
        '[method]output-stream.blocking-flush': exports0['4'],
        '[method]output-stream.blocking-write-and-flush': exports0['5'],
        '[resource-drop]input-stream': trampoline0,
        '[resource-drop]output-stream': trampoline1,
      },
      'wasi:random/random@0.2.0': {
        'get-random-bytes': exports0['7'],
        'get-random-u64': trampoline4,
      },
    }));
    memory0 = exports1.memory;
    realloc0 = exports1.cabi_realloc;
    ({ exports: exports2 } = yield instantiateCore(yield module2, {
      '': {
        $imports: exports0.$imports,
        '0': trampoline9,
        '1': trampoline10,
        '10': trampoline19,
        '11': trampoline20,
        '12': trampoline21,
        '13': trampoline22,
        '14': trampoline23,
        '15': trampoline24,
        '16': trampoline25,
        '17': trampoline26,
        '18': trampoline27,
        '19': trampoline28,
        '2': trampoline11,
        '20': trampoline29,
        '21': trampoline30,
        '22': trampoline31,
        '23': trampoline32,
        '3': trampoline12,
        '4': trampoline13,
        '5': trampoline14,
        '6': trampoline15,
        '7': trampoline16,
        '8': trampoline17,
        '9': trampoline18,
      },
    }));
    ({ exports: exports3 } = yield instantiateCore(yield module3, {
      '': {
        '': exports1._initialize,
      },
    }));
    let run020Run;
    
    function run() {
      const ret = run020Run();
      let variant0;
      switch (ret) {
        case 0: {
          variant0= {
            tag: 'ok',
            val: undefined
          };
          break;
        }
        case 1: {
          variant0= {
            tag: 'err',
            val: undefined
          };
          break;
        }
        default: {
          throw new TypeError('invalid variant discriminant for expected');
        }
      }
      const retVal = variant0;
      if (typeof retVal === 'object' && retVal.tag === 'err') {
        throw new ComponentError(retVal.val);
      }
      return retVal.val;
    }
    run020Run = exports1['wasi:cli/run@0.2.0#run'];
    const run020 = {
      run: run,
      
    };
    
    return { run: run020, 'wasi:cli/run@0.2.0': run020,  };
  })();
  let promise, resolve, reject;
  function runNext (value) {
    try {
      let done;
      do {
        ({ value, done } = gen.next(value));
      } while (!(value instanceof Promise) && !done);
      if (done) {
        if (resolve) return resolve(value);
        else return value;
      }
      if (!promise) promise = new Promise((_resolve, _reject) => (resolve = _resolve, reject = _reject));
      value.then(nextVal => done ? resolve() : runNext(nextVal), reject);
    }
    catch (e) {
      if (reject) reject(e);
      else throw e;
    }
  }
  const maybeSyncReturn = runNext(null);
  return promise || maybeSyncReturn;
}
