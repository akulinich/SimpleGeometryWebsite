// This code implements the `-sMODULARIZE` settings by taking the generated
// JS program code (INNER_JS_CODE) and wrapping it in a factory function.

// When targeting node and ES6 we use `await import ..` in the generated code
// so the outer function needs to be marked as async.
async function Module(moduleArg = {}) {
  var moduleRtn;

// include: shell.js
// include: minimum_runtime_check.js
(function() {
  // "30.0.0" -> 300000
  function humanReadableVersionToPacked(str) {
    str = str.split('-')[0]; // Remove any trailing part from e.g. "12.53.3-alpha"
    var vers = str.split('.').slice(0, 3);
    while(vers.length < 3) vers.push('00');
    vers = vers.map((n, i, arr) => n.padStart(2, '0'));
    return vers.join('');
  }
  // 300000 -> "30.0.0"
  var packedVersionToHumanReadable = n => [n / 10000 | 0, (n / 100 | 0) % 100, n % 100].join('.');

  var TARGET_NOT_SUPPORTED = 2147483647;

  // Note: We use a typeof check here instead of optional chaining using
  // globalThis because older browsers might not have globalThis defined.
  var currentNodeVersion = typeof process !== 'undefined' && process.versions?.node ? humanReadableVersionToPacked(process.versions.node) : TARGET_NOT_SUPPORTED;
  if (currentNodeVersion < TARGET_NOT_SUPPORTED) {
    throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');
  }
  if (currentNodeVersion < 2147483647) {
    throw new Error(`This emscripten-generated code requires node v${ packedVersionToHumanReadable(2147483647) } (detected v${packedVersionToHumanReadable(currentNodeVersion)})`);
  }

  var userAgent = typeof navigator !== 'undefined' && navigator.userAgent;
  if (!userAgent) {
    return;
  }

  var currentSafariVersion = userAgent.includes("Safari/") && !userAgent.includes("Chrome/") && userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/) ? humanReadableVersionToPacked(userAgent.match(/Version\/(\d+\.?\d*\.?\d*)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentSafariVersion < 150000) {
    throw new Error(`This emscripten-generated code requires Safari v${ packedVersionToHumanReadable(150000) } (detected v${currentSafariVersion})`);
  }

  var currentFirefoxVersion = userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Firefox\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentFirefoxVersion < 79) {
    throw new Error(`This emscripten-generated code requires Firefox v79 (detected v${currentFirefoxVersion})`);
  }

  var currentChromeVersion = userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/) ? parseFloat(userAgent.match(/Chrome\/(\d+(?:\.\d+)?)/)[1]) : TARGET_NOT_SUPPORTED;
  if (currentChromeVersion < 85) {
    throw new Error(`This emscripten-generated code requires Chrome v85 (detected v${currentChromeVersion})`);
  }
})();

// end include: minimum_runtime_check.js
// The Module object: Our interface to the outside world. We import
// and export values on it. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(moduleArg) => Promise<Module>
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to check if Module already exists (e.g. case 3 above).
// Substitution will be replaced with actual code on later stage of the build,
// this way Closure Compiler will not mangle it (e.g. case 4. above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module = moduleArg;

// Determine the runtime environment we are in. You can customize this by
// setting the ENVIRONMENT setting at compile time (see settings.js).

// Attempt to auto-detect the environment
var ENVIRONMENT_IS_WEB = !!globalThis.window;
var ENVIRONMENT_IS_WORKER = !!globalThis.WorkerGlobalScope;
// N.b. Electron.js environment is simultaneously a NODE-environment, but
// also a web environment.
var ENVIRONMENT_IS_NODE = globalThis.process?.versions?.node && globalThis.process?.type != 'renderer';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

// --pre-jses are emitted after the Module integration code, so that they can
// refer to Module (if they choose; they can also define Module)


var arguments_ = [];
var thisProgram = './this.program';
var quit_ = (status, toThrow) => {
  throw toThrow;
};

var _scriptName = import.meta.url;

// `/` should be present at the end if `scriptDirectory` is not empty
var scriptDirectory = '';
function locateFile(path) {
  if (Module['locateFile']) {
    return Module['locateFile'](path, scriptDirectory);
  }
  return scriptDirectory + path;
}

// Hooks that are implemented differently in different runtime environments.
var readAsync, readBinary;

if (ENVIRONMENT_IS_SHELL) {

} else

// Note that this includes Node.js workers when relevant (pthreads is enabled).
// Node.js workers are detected as a combination of ENVIRONMENT_IS_WORKER and
// ENVIRONMENT_IS_NODE.
if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  try {
    scriptDirectory = new URL('.', _scriptName).href; // includes trailing slash
  } catch {
    // Must be a `blob:` or `data:` URL (e.g. `blob:http://site.com/etc/etc`), we cannot
    // infer anything from them.
  }

  if (!(globalThis.window || globalThis.WorkerGlobalScope)) throw new Error('not compiled for this environment (did you build to HTML and try to run it not on the web, or set ENVIRONMENT to something - like node - and run it someplace else - like on the web?)');

  {
// include: web_or_worker_shell_read.js
if (ENVIRONMENT_IS_WORKER) {
    readBinary = (url) => {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url, false);
      xhr.responseType = 'arraybuffer';
      xhr.send(null);
      return new Uint8Array(/** @type{!ArrayBuffer} */(xhr.response));
    };
  }

  readAsync = async (url) => {
    assert(!isFileURI(url), "readAsync does not work with file:// URLs");
    var response = await fetch(url, { credentials: 'same-origin' });
    if (response.ok) {
      return response.arrayBuffer();
    }
    throw new Error(response.status + ' : ' + response.url);
  };
// end include: web_or_worker_shell_read.js
  }
} else
{
  throw new Error('environment detection error');
}

var out = console.log.bind(console);
var err = console.error.bind(console);

var IDBFS = 'IDBFS is no longer included by default; build with -lidbfs.js';
var PROXYFS = 'PROXYFS is no longer included by default; build with -lproxyfs.js';
var WORKERFS = 'WORKERFS is no longer included by default; build with -lworkerfs.js';
var FETCHFS = 'FETCHFS is no longer included by default; build with -lfetchfs.js';
var ICASEFS = 'ICASEFS is no longer included by default; build with -licasefs.js';
var JSFILEFS = 'JSFILEFS is no longer included by default; build with -ljsfilefs.js';
var OPFS = 'OPFS is no longer included by default; build with -lopfs.js';

var NODEFS = 'NODEFS is no longer included by default; build with -lnodefs.js';

// perform assertions in shell.js after we set up out() and err(), as otherwise
// if an assertion fails it cannot print the message

assert(!ENVIRONMENT_IS_NODE, 'node environment detected but not enabled at build time (add `node` to `-sENVIRONMENT` to enable)');

assert(!ENVIRONMENT_IS_SHELL, 'shell environment detected but not enabled at build time (add `shell` to `-sENVIRONMENT` to enable)');

// end include: shell.js

// include: preamble.js
// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in:
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at:
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

var wasmBinary;

if (!globalThis.WebAssembly) {
  err('no native wasm support detected');
}

// Wasm globals

//========================================
// Runtime essentials
//========================================

// whether we are quitting the application. no code should run after this.
// set in exit() and abort()
var ABORT = false;

// set by exit() and abort().  Passed to 'onExit' handler.
// NOTE: This is also used as the process return code in shell environments
// but only when noExitRuntime is false.
var EXITSTATUS;

// In STRICT mode, we only define assert() when ASSERTIONS is set.  i.e. we
// don't define it at all in release modes.  This matches the behaviour of
// MINIMAL_RUNTIME.
// TODO(sbc): Make this the default even without STRICT enabled.
/** @type {function(*, string=)} */
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed' + (text ? ': ' + text : ''));
  }
}

// We used to include malloc/free by default in the past. Show a helpful error in
// builds with assertions.

/**
 * Indicates whether filename is delivered via file protocol (as opposed to http/https)
 * @noinline
 */
var isFileURI = (filename) => filename.startsWith('file://');

// include: runtime_common.js
// include: runtime_stack_check.js
// Initializes the stack cookie. Called at the startup of main and at the startup of each thread in pthreads mode.
function writeStackCookie() {
  var max = _emscripten_stack_get_end();
  assert((max & 3) == 0);
  // If the stack ends at address zero we write our cookies 4 bytes into the
  // stack.  This prevents interference with SAFE_HEAP and ASAN which also
  // monitor writes to address zero.
  if (max == 0) {
    max += 4;
  }
  // The stack grow downwards towards _emscripten_stack_get_end.
  // We write cookies to the final two words in the stack and detect if they are
  // ever overwritten.
  HEAPU32[((max)>>2)] = 0x02135467;
  HEAPU32[(((max)+(4))>>2)] = 0x89BACDFE;
  // Also test the global address 0 for integrity.
  HEAPU32[((0)>>2)] = 1668509029;
}

function checkStackCookie() {
  if (ABORT) return;
  var max = _emscripten_stack_get_end();
  // See writeStackCookie().
  if (max == 0) {
    max += 4;
  }
  var cookie1 = HEAPU32[((max)>>2)];
  var cookie2 = HEAPU32[(((max)+(4))>>2)];
  if (cookie1 != 0x02135467 || cookie2 != 0x89BACDFE) {
    abort(`Stack overflow! Stack cookie has been overwritten at ${ptrToString(max)}, expected hex dwords 0x89BACDFE and 0x2135467, but received ${ptrToString(cookie2)} ${ptrToString(cookie1)}`);
  }
  // Also test the global address 0 for integrity.
  if (HEAPU32[((0)>>2)] != 0x63736d65 /* 'emsc' */) {
    abort('Runtime error: The application has corrupted its heap memory area (address zero)!');
  }
}
// end include: runtime_stack_check.js
// include: runtime_exceptions.js
// Base Emscripten EH error class
class EmscriptenEH {}

class EmscriptenSjLj extends EmscriptenEH {}

// end include: runtime_exceptions.js
// include: runtime_debug.js
var runtimeDebug = true; // Switch to false at runtime to disable logging at the right times

// Used by XXXXX_DEBUG settings to output debug messages.
function dbg(...args) {
  if (!runtimeDebug && typeof runtimeDebug != 'undefined') return;
  // TODO(sbc): Make this configurable somehow.  Its not always convenient for
  // logging to show up as warnings.
  console.warn(...args);
}

// Endianness check
(() => {
  var h16 = new Int16Array(1);
  var h8 = new Int8Array(h16.buffer);
  h16[0] = 0x6373;
  if (h8[0] !== 0x73 || h8[1] !== 0x63) abort('Runtime error: expected the system to be little-endian! (Run with -sSUPPORT_BIG_ENDIAN to bypass)');
})();

function consumedModuleProp(prop) {
  if (!Object.getOwnPropertyDescriptor(Module, prop)) {
    Object.defineProperty(Module, prop, {
      configurable: true,
      set() {
        abort(`Attempt to set \`Module.${prop}\` after it has already been processed.  This can happen, for example, when code is injected via '--post-js' rather than '--pre-js'`);

      }
    });
  }
}

function makeInvalidEarlyAccess(name) {
  return () => assert(false, `call to '${name}' via reference taken before Wasm module initialization`);

}

function ignoredModuleProp(prop) {
  if (Object.getOwnPropertyDescriptor(Module, prop)) {
    abort(`\`Module.${prop}\` was supplied but \`${prop}\` not included in INCOMING_MODULE_JS_API`);
  }
}

// forcing the filesystem exports a few things by default
function isExportedByForceFilesystem(name) {
  return name === 'FS_createPath' ||
         name === 'FS_createDataFile' ||
         name === 'FS_createPreloadedFile' ||
         name === 'FS_preloadFile' ||
         name === 'FS_unlink' ||
         name === 'addRunDependency' ||
         // The old FS has some functionality that WasmFS lacks.
         name === 'FS_createLazyFile' ||
         name === 'FS_createDevice' ||
         name === 'removeRunDependency';
}

function missingLibrarySymbol(sym) {

  // Any symbol that is not included from the JS library is also (by definition)
  // not exported on the Module object.
  unexportedRuntimeSymbol(sym);
}

function unexportedRuntimeSymbol(sym) {
  if (!Object.getOwnPropertyDescriptor(Module, sym)) {
    Object.defineProperty(Module, sym, {
      configurable: true,
      get() {
        var msg = `'${sym}' was not exported. add it to EXPORTED_RUNTIME_METHODS (see the Emscripten FAQ)`;
        if (isExportedByForceFilesystem(sym)) {
          msg += '. Alternatively, forcing filesystem support (-sFORCE_FILESYSTEM) can export this for you';
        }
        abort(msg);
      },
    });
  }
}

// end include: runtime_debug.js
// include: binaryDecode.js
// Prevent Closure from minifying the binaryDecode() function, or otherwise
// Closure may analyze through the WASM_BINARY_DATA placeholder string into this
// function, leading into incorrect results.
/** @noinline */
function binaryDecode(bin) {
  for (var i = 0, l = bin.length, o = new Uint8Array(l), c; i < l; ++i) {
    c = bin.charCodeAt(i);
    o[i] = ~c >> 8 & c; // Recover the null byte in a manner that is compatible with https://crbug.com/453961758
  }
  return o;
}
// end include: binaryDecode.js
var readyPromiseResolve, readyPromiseReject;

// Memory management

var runtimeInitialized = false;



function updateMemoryViews() {
  var b = wasmMemory.buffer;
  HEAP8 = new Int8Array(b);
  HEAP16 = new Int16Array(b);
  HEAPU8 = new Uint8Array(b);
  HEAPU16 = new Uint16Array(b);
  Module['HEAP32'] = HEAP32 = new Int32Array(b);
  HEAPU32 = new Uint32Array(b);
  Module['HEAPF32'] = HEAPF32 = new Float32Array(b);
  HEAPF64 = new Float64Array(b);
  HEAP64 = new BigInt64Array(b);
  HEAPU64 = new BigUint64Array(b);
}

// include: memoryprofiler.js
// end include: memoryprofiler.js
// end include: runtime_common.js
assert(globalThis.Int32Array && globalThis.Float64Array && Int32Array.prototype.subarray && Int32Array.prototype.set,
       'JS engine does not provide full typed array support');

function preRun() {
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  consumedModuleProp('preRun');
  // Begin ATPRERUNS hooks
  callRuntimeCallbacks(onPreRuns);
  // End ATPRERUNS hooks
}

function initRuntime() {
  assert(!runtimeInitialized);
  runtimeInitialized = true;

  checkStackCookie();

  // No ATINITS hooks

  wasmExports['__wasm_call_ctors']();

  // No ATPOSTCTORS hooks
}

function postRun() {
  checkStackCookie();
   // PThreads reuse the runtime from the main thread.

  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  consumedModuleProp('postRun');

  // Begin ATPOSTRUNS hooks
  callRuntimeCallbacks(onPostRuns);
  // End ATPOSTRUNS hooks
}

/**
 * @param {string|number=} what
 */
function abort(what) {
  Module['onAbort']?.(what);

  what = `Aborted(${what})`;
  // TODO(sbc): Should we remove printing and leave it up to whoever
  // catches the exception?
  err(what);

  ABORT = true;

  // Use a wasm runtime error, because a JS error might be seen as a foreign
  // exception, which means we'd run destructors on it. We need the error to
  // simply make the program stop.
  // FIXME This approach does not work in Wasm EH because it currently does not assume
  // all RuntimeErrors are from traps; it decides whether a RuntimeError is from
  // a trap or not based on a hidden field within the object. So at the moment
  // we don't have a way of throwing a wasm trap from JS. TODO Make a JS API that
  // allows this in the wasm spec.

  // Suppress closure compiler warning here. Closure compiler's builtin extern
  // definition for WebAssembly.RuntimeError claims it takes no arguments even
  // though it can.
  // TODO(https://github.com/google/closure-compiler/pull/3913): Remove if/when upstream closure gets fixed.
  /** @suppress {checkTypes} */
  var e = new WebAssembly.RuntimeError(what);

  readyPromiseReject?.(e);
  // Throw the error whether or not MODULARIZE is set because abort is used
  // in code paths apart from instantiation where an exception is expected
  // to be thrown when abort is called.
  throw e;
}

// show errors on likely calls to FS when it was not included
function fsMissing() {
  abort('Filesystem support (FS) was not included. The problem is that you are using files from JS, but files were not used from C/C++, so filesystem support was not auto-included. You can force-include filesystem support with -sFORCE_FILESYSTEM');
}
var FS = {
  init: fsMissing,
  createDataFile: fsMissing,
  createPreloadedFile: fsMissing,
  createLazyFile: fsMissing,
  open: fsMissing,
  mkdev: fsMissing,
  registerDevice:  fsMissing,
  analyzePath: fsMissing,
  ErrnoError: fsMissing,
};


function createExportWrapper(name, nargs) {
  return (...args) => {
    assert(runtimeInitialized, `native function \`${name}\` called before runtime initialization`);
    var f = wasmExports[name];
    assert(f, `exported native function \`${name}\` not found`);
    // Only assert for too many arguments. Too few can be valid since the missing arguments will be zero filled.
    assert(args.length <= nargs, `native function \`${name}\` called with ${args.length} args but expects ${nargs}`);
    return f(...args);
  };
}

var wasmBinaryFile;

function findWasmBinary() {
  return binaryDecode(' asm   ³``|` `  ` ` ` `~~` ```~``|`}` ` `~`~~`||```~`~`|~`~~ `~~|¥env__cxa_throw env	_abort_js wasi_snapshot_preview1fd_close 	wasi_snapshot_preview1fd_write \nwasi_snapshot_preview1fd_seek envemscripten_resize_heap 	æä 		\r						 						 							 \n\n  	\n  				  			 	   \n 	 	  									  \n										pAA A Åmemory __wasm_call_ctors convex_hull malloc  free_buffer free ¢__indirect_function_table fflush çstrerror éemscripten_stack_get_end «emscripten_stack_get_base ªemscripten_stack_init ¨emscripten_stack_get_free ©_emscripten_stack_restore ä_emscripten_stack_alloc åemscripten_stack_get_current æ	4 AÞÚ}~ÊÍËÌÐÙ×ÓÎØÖÔÜÝàáâ\nØä ¨­\n(}}# Ak! $    6x  6t  6p@@ (tAHAqE\r @@ (tA JAqE\r  (tAt  !A !  6l@ (tA JAqE\r  (l! (x! (tAt!@ E\r    ü\n   (t! (p 6   (l6| (t!	 Aà j 	  A 6\\@@ (\\ (tHAqE\r (\\!\n (\\! Aà j   \n6   (\\Aj6\\   Aø j6X  Aø j6T  Aà j 6P  Aà j 6L  AØ j6D  AÔ j6H (P! (L!\r  )D7  \r Aj   AØ j6<  AÔ j6@ (tAt! A0j   A 6, A 6(@@ (( (tHAqE\r@ (,AN!A ! Aq! !@ E\r  (,Ak! A0j  ( ! (,Ak! A0j  ( ! ((! Aà j  ( ! A<j    A ·e!@ AqE\r   (,Aj6, ((! Aà j  ( ! (,!  Aj6, A0j   6   ((Aj6(   (tAk6$  (,Aj6 @@ ($A NAqE\r@ (, ( N!A ! Aq! !@ E\r  (,Ak!  A0j   ( !! (,Ak!" A0j " ( !# ($!$ Aà j $ ( !% A<j ! # % A ·e!@ AqE\r   (,Aj6, ($!& Aà j & ( !\' (,!(  (Aj6, A0j (  \'6   ($Aj6$   (,Ak6  (At  6 A 6@@ ( (HAqE\r (!) A0j ) ( !* AØ j * !+ ( (AtAtj +8  (!, A0j , ( !- AÔ j - !. ( (AtAjAtj .8   (Aj6  (!/ (p /6   (6| A0j  Aà j  (|!0 Aj$  0Ê# A k! $    6  6 (!  6 A 6  A 6 A 6   Aj   (! Aj  @ (A KAqE\r   (   (  Aj  Aj  (! A j$  /# Ak!   6  6 ((  (AtjR# Ak! $    6 (!   (   6 (! Aj$  R# Ak! $    6 (!   (  6 (! Aj$  W# Ak! $    6  6  (6  (6  ( (    Aj$ à|# A k! $    6  6  6  6 (!  (  ( »9  ( ( »9  (  ( » +¡! ( ( » + ¡! ( ( » + ¡ (  ( » +¡¢  ¢ ! A j$  8# Ak!   6  6 (( (  (AtAtj* ;# Ak!   6  6 (( (  (AtAjAtj* L# Ak! $    6 (! Aj   Aj  Aj$  <# Ak! $    6 (!   Aj$  1# Ak!   6  6 (!  (6  I# Ak! $    6  6  (6   (  Aj$ # Ak! $    6  6 (!@ (  KAqE\r     (!   ¡   ( 6   ( 6  (  (Atj6 A ¢  Aj$ ³# A k! $    6  6 (! (! Aj  £   (6  (6@@ ( (GAqE\r  (¤ ¥  (Aj!  6  6  Aj¦  A j$ !# Ak!   6 (A: e# Ak! $    6 (!  6A !Aÿ@ -  AÿqGAq\r    (! Aj$  Î# A0k! $    6,  6(  6$  (,6   ((6 (  (Å   (,6 (Æ !  ((6  (Æ  ($Ç   (,6 (Æ !  ((6  (Æ  ($È  A0j$ # Ak!   6 (O# Ak! $    6  6 (! Aj Ä  (! Aj$  y# Ak! $    6 (!@ ( ( A GAqE\r  ( ¼  ( ½  (  ( (  ( ­ ¾  Aj$ 5# Ak! $    6 (¢  Aj$ # Ak!   6 (8# Ak!  6   6 (!  (6  A :  \\# Ak! $    6  (§ 6 ¨ 6 Aj Aj© ( ! Aj$   A§ ª  P# Ak! $   6  6   ( (« 6    (6 Aj$ e# Ak! $    6  6 (!  ¬  ­ Atj ¬  (Atj®  Aj$ ~# Ak! $    6  6  6 (!  (6   ((6  (( (Atj6 (  (¸  Aj$  # Ak!   6 (A# Ak! $    6  6 ( (¹  Aj$ # Ak! $    6 (!  6 (! (  6@ ( (GAqE\r  (  ( ( ( kAuº  (! Aj$  9# Ak! $    6 (° ! Aj$  	 ± E# Ak! $    6  6 ( (¯ ! Aj$  K# Ak! $    6AÈ !  (³  A A   g# Ak! $    6  6 (!@ ( § KAqE\r ´   (Aµ ! Aj$  <# Ak! $    6 (( ¤ ! Aj$  ,# Ak!   6 (! ( ( kAuk# Ak! $    6  6  6 (! ¬  ¬  ­ Atj ( (·  Aj$ p# Ak! $    6  6 (! (!@@ Aj  ² AqE\r  (! (! ! Aj$  # Ak!   6Aÿÿÿÿ	 Aÿÿÿÿ9# Ak!   6  6  6 ((  (( IAqV# Ak! $    6  6 (!  (¼  Aô Aj6  Aj$  ,AÈ !   Û   A A   # Ak! $    6  6  (At6 @@ (¶ AqE\r   (  (´ 6  ( ° 6 (! Aj$  "# Ak!   6 (AKAq,# Ak!   6  6  6  6 q# Ak! $    6  6 (!  ¬  » Atj ¬  » Atj (Atj®  Aj$ (# Ak!   6  6 (A 6 e# Ak! $    6  6 (!  ¬  (Atj ¬  » Atj®  Aj$ ,# Ak!   6 (! ( ( kAuX# Ak! $    6 (!  » 6  ( ¿   (º  Aj$ a# Ak! $    6 (!  ¬  » Atj ¬  ­ Atj®  Aj$ M# Ak! $    6  6  6 ( ( (À  Aj$ # Ak! $    6  6 (!  (6@@ ( (GAqE\r (A|j!  6  ¤ Á    (6 Aj$ J# Ak! $    6  6  6 ( (AÃ  Aj$ A# Ak! $    6  6 ( (Â  Aj$ # Ak!   6  6# Ak! $    6  6  6  (At6 @@ (¶ AqE\r  ( (  (¸  ( ( ³  Aj$ 1# Ak!   6  6 (!  (6  # Ak!   6  6C# Ak! $    6  (6 (Ì ! Aj$  # Ak! $    6  6  6@@ ( (FAqE\r   ( (kAuÉ Ê At6  ( ( ( ( AAqË  Aj$ %# Ak!   6  6  6# Ak!   6 (@# Ak! $    6 (Í !A k! Aj$  Æ\n"# AÀ k! $    6<  68  64  60  : / A6( A6$@@  (8 (<kAm6  ( ! AK@@@@@@    (4! (8A|j!  68@  (  (<( Î AqE\r  A<j A8jÏ  (<!	 (<Aj!\n (8A|j!  68 	 \n  (4Ð  (<! (<Aj!\r (<Aj! (8A|j!  68  \r   (4Ñ  (<! (<Aj! (<Aj! (<Aj! (8A|j!  68      (4Ò @ ( AHAqE\r A !Aÿ@@ - / AÿqGAqE\r  (< (8 (4Ó  (< (8 (4Ô @ (0\r  (< (8 (8 (4Õ   (0Aj60  ( Am6@@ ( AJAqE\r  (< (< (Atj (8A|j (4Ð  (<Aj (< (AkAtj (8Axj (4Ð  (<Aj (< (AjAtj (8Atj (4Ð  (< (AkAtj (< (Atj (< (AjAtj (4Ð   (< (Atj6 A<j AjÖ  (< (Atj (< (8A|j (4Ð A !Aÿ@ - / AÿqGAq\r  (4 (<A|j(  (<( Î Aq\r   (< (8 (4× 6<@@A AqE\r  (<! (8! (4! Aj   Ø  (<! (8! (4! Aj   Ù   (6A !Aÿ@ -  AÿqGAqE\r   (< ( (4Ú Aq: @ (Aj (8 (4Ú AqE\r A !Aÿ@ -  AÿqGAqE\r   (68A !Aÿ@ -  AÿqGAqE\r  (Aj!    6   6< (<!! (!" (4!# (0!$A !%Aÿ ! " # $ - / %AÿqGAqË  A : / (Aj!&  &6  &6<  AÀ j$ 9# Ak! $    6 Ajó ! Aj$  &# Ak!   6 (! gA  â# Ak! $    6  6  6 (! (  (  (  ( ]!A! Aq! !@ \r  (  (  (  ( [!	A !\n 	Aq! \n!@ E\r  ( (  ( ( ]! ! Aq!\r Aj$  \rG# Ak! $    6  6 ((  (( Û  Aj$ þ# A k! $    6  6  6  6@@ ( ((  (( Î Aq\r @ ( ((  (( Î Aq\r  A Aq:  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ  AAq: @ ( ((  (( Î AqE\r  Aj AjÏ  AAq:  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ  AAq:  - Aq! A j$  ý# A k! $    6  6  6  6  6 ( ( ( (Ð @ ( ((  (( Î AqE\r  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ  A j$ ¼# A k! $    6  6  6  6  6  6 ( ( ( ( (Ñ @ ( ((  (( Î AqE\r  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ @ ( ((  (( Î AqE\r  Aj AjÏ  A j$ \n# A k! $    6  6  6@@ ( (FAqE\r   (6  (Aj6@ ( (GAqE\r  (6  (A|j6@ ( ((  (( Î AqE\r   AjÜ ( 6  (6  (6@ AjÜ ( ! ( 6   (6 ( (G!A ! Aq! !@ E\r  (!	 (!\n (A|j!  6 	 \n ( Î ! Aq\r  (! ( 6   (Aj6  A j$ Î# A k! $    6  6  6@@ ( (FAqE\r   (A|j6  (Aj6@ ( (GAqE\r  (A|j6@ ( ((  (( Î AqE\r   AjÜ ( 6  (6   (6@ Ü ( ! ( 6   ( 6 (! (! ( A|j!  6    ( Î Aq\r  (! ( 6   (Aj6  A j$ ¿# A k! $    6  6  6  6@@ ( (FAqE\r   ( (Ý 6 ( (Þ   ( ( ( (ß 6 ( (Þ   (6 (! A j$  G# Ak! $    6  6 ((  (( Û  Aj$ ³	# A k! $    6  6  6  (6  (6  AjÜ ( 6@@ ( ( (A|j( Î AqE\r @  (Aj6 ( ( (( Î AsAq\r @ (Aj!  6  (I!A ! Aq! !@ E\r  ( ( (( Î As!@ AqE\r @ ( (IAqE\r @  (A|j6 ( ( (( Î Aq\r @@ ( (IAqE\r Aj AjÏ @  (Aj6 ( ( (( Î AsAq\r @  (A|j6 ( ( (( Î Aq\r    (A|j6@ ( (GAqE\r  AjÜ ( !	 ( 	6  (!\n ( \n6  (! A j$  Â# AÀ k! $   6<  68  64  (<60  (86,  A<jÜ ( 6(@@ (4 (( (8A|j( Î AqE\r @  (<Aj6< (4 (( (<( Î AsAq\r @ (<Aj!  6<  (8I!A ! Aq! !	@ E\r  (4 (( (<( Î As!	@ 	AqE\r @ (< (8IAqE\r @  (8A|j68 (4 (( (8( Î Aq\r   (< (8OAq: \'A !\nAÿ@ - \' \nAÿqGAq\r  A<j A8jÏ   (<Aj6<  (8A|j6  B 7 B 7@@ (  (<kAuAÿ NAqE\r@ )B QAqE\r  (< (4 A(j Ajà @ )B QAqE\r  (  (4 A(j Ajá  (< (  Aj Ajâ  )B Q!AÀ A  Aq!  (< Atj6< )B Q!\rAÀ A  \rAq!  ( A  kAtj6   (4! A<j A j  A(j Aj Ajã  A<j A j Aj Ajä   (<A|j6@ (0 (GAqE\r  AjÜ ( ! (0 6  ((! ( 6    Aj A\'jå  AÀ j$ ¬	# A k! $   6  6  6  (6  (6  AjÜ ( 6@  (Aj6 ( ((  (Î Aq\r @@ ( (A|jFAqE\r @ ( (I!A ! Aq! !@ E\r  (!	 (A|j!\n  \n6 	 \n(  (Î As!@ AqE\r @  (A|j6 ( ((  (Î AsAq\r   ( (OAq: @@ ( (IAqE\r Aj AjÏ @  (Aj6 ( ((  (Î Aq\r @  (A|j6 ( ((  (Î AsAq\r    (A|j6 @ ( ( GAqE\r  Ü ( ! ( 6  (! (  6     Ajå  A j$ Ú# A0k! $    6(  6$  6  ($ ((kAm! AK@@@@@@@    AAq: / ( ! ($A|j!  6$@  (  ((( Î AqE\r  A(j A$jÏ  AAq: / ((! ((Aj! ($A|j!	  	6$   	 ( Ð  AAq: / ((!\n ((Aj! ((Aj! ($A|j!\r  \r6$ \n   \r ( Ñ  AAq: / ((! ((Aj! ((Aj! ((Aj! ($A|j!  6$      ( Ò  AAq: /  ((Aj6 (( ((Aj ( ( Ð  A6 A 6  (Aj6@@ ( ($GAqE\r@ (  ((  (( Î AqE\r   AjÜ ( 6  (6  (6@ AjÜ ( ! ( 6   (6 ( ((G!A ! Aq! !@ E\r  ( ! (! (A|j!  6   ( Î ! Aq\r  (! ( 6  (Aj!  6@ AFAqE\r  (Aj!  6   ($FAq: /  (6  (Aj6  AAq: / - /Aq! A0j$  A# Ak! $    6  6 ( (æ  Aj$ <# Ak! $    6ç  (( ! Aj$  ## Ak!   6  6 (# Ak!   6  6»# A k! $    6  6  6  6@@ ( (FAqE\r   ( (Ý 6 ( ( (è   ( (kAu6  (6@@ ( (GAqE\r@ ( ((  (( Î AqE\r  Aj AjÏ  ( ( ( (é   (Aj6  ( ( (ê   (6 (! A j$  ß~# A k! $    6  6  6  6  (6 A 6@@ (AÀ HAqE\r  ( ((  (( Î AsAq: A !Aÿ -  AÿqGAq­ 5! (!   ) 7   (Aj6  (Aj6  A j$ Ü~# A k! $    6  6  6  6  (6 A 6@@ (AÀ HAqE\r  ( ((  (( Î Aq: A !Aÿ -  AÿqGAq­ 5! (!   ) 7   (Aj6  (A|j6  A j$ ~# A k! $    6  6  6  6@ () B R!A ! Aq! !@ E\r  () B R!@ AqE\r   () î 6 () ï !	 ( 	7   () î 6 () ï !\n ( \n7   ( (Atj6 (! (!  A  kAtj6  Aj ð  A j$ ~~# AÀ k! $    6<  68  64  60  6,  6(  (8(  (<( kAuAj6$@@ (,) B QAqE\r  (() B QAqE\r   ($Am6   ($ ( k6@@ (,) B QAqE\r   ($AÀ k6  AÀ 6 AÀ 6   ($AÀ k6@ (,) B QAqE\r   (<( 6 A 6@@ ( ( HAqE\r  (4 ((  (0( Î AsAq: A !Aÿ -  AÿqGAq­ 5! (,!	 	  	) 7   (Aj6  (Aj6 @ (() B QAqE\r   (8( 6 A 6@@ ( (HAqE\r  (4 ((  (0( Î Aq: A !\nAÿ -  \nAÿqGAq­ 5! ((!   ) 7   (A|j6  (Aj6  (<(  (8(  (, ((â @@ (,) B QAqE\r  ( !\rA !\r \r! (<!  (  Atj6 @@ (() B QAqE\r  (!A ! ! (8!  ( A  kAtj6  AÀ j$ í~~# A k! $    6  6  6  6@@ () B RAqE\r @@ () B RAqE\r () ñ ! A? k6 5!B B}! (!   ) 7   ((  (Atj6@ ( (( GAqE\r  (!	 Aj 	Ï  (!\n \n \n( A|j6   (( Aj! ( 6 @ () B RAqE\r @@ () B RAqE\r () ñ ! A? k6 5!\rB \rB}! (!   ) 7  (( ! (!  A  kAtj6 @ (  (( GAqE\r  (!  Ï  (!  ( Aj6   A j$ D# Ak! $   6  6   ( (ò  Aj$ P# Ak!   6  6  (( 6 (( ! ( 6  (! ( 6  ¼# A k! $    6  6  6  (6  ( (kAu6@ (AJAqE\r   (AkAm6@@ (A NAqE\r ( ( ( ( (Atjé   (Aj6  A j$ # A k! $    6  6  6  6  ( (kAu6@@@ (AHAq\r  (AkAm (HAqE\r  (AtAj6  ( (Atj6@ (Aj (HAqE\r  ( ((  ((Î AqE\r   (Aj6  (Aj6@ ( ((  (( Î AqE\r   AjÜ ( 6@@ AjÜ ( ! ( 6   (6@ (AkAm (HAqE\r   (AtAj6  ( (Atj6@ (Aj (HAqE\r  ( ((  ((Î AqE\r   (Aj6  (Aj6 ( ((  (Î AsAq\r  (! ( 6  A j$ ¾# A k! $    6  6  6  (6  (6  ( (kAu6@@ (AJAqE\r ( ( ( (ë   (A|j6  (Aj6  ( ( (È  A j$ # A k! $    6  6  6  6  (6@ (AJAqE\r   AjÜ ( 6  ( ( (ì 6  (A|j6@@ ( (FAqE\r  (! ( 6  AjÜ ( ! ( 6   (Aj6 (! ( 6  ( ( ( ( (kAuí  A j$ # A k! $    6  6  6  (6  (6 A 6 (Aj!  ( Atj6  (AtAj6@ (Aj (HAqE\r  ( ((  ((Î AqE\r   (Aj6  (Aj6 AjÜ ( ! ( 6   (6@ ( (AkAmJAqE\r  (! A j$   Ç# A k! $    6  6  6  6@ (AJAqE\r   (AkAm6  ( (Atj6 (! (( ! (A|j!  6@   ( Î AqE\r   AjÜ ( 6@@ AjÜ ( ! ( 6   (6@ (\r   (AkAm6  ( (Atj6 ( ((  (Î Aq\r  (!	 ( 	6  A j$ :~# Ak!   7 )! z§! B Q!AÀ   Aq9~# Ak!   7 )! )! )!  B  }G# Ak! $    6  6 ((  (( Û  Aj$ :~# Ak!   7 )! y§! B Q!AÀ   Aq^# Ak!   6  6  6 (!  (( 6  (!A !Aÿ  -   AÿqGAq:  9# Ak! $    6 (ô ! Aj$  F# Ak! $    6  (( 6 (õ ! Aj$  ?# Ak! $    6 Ajö ¤ ! Aj$  # Ak!   6 ((  A 	     @    ü\n    @ AI\r     ù    j!@@   sAq\r @@  Aq\r   !@ \r   !  !@  -  :   Aj! Aj"AqE\r  I\r  A|q!@ AÀ I\r   A@j"K\r @  ( 6   (6  (6  (6  (6  (6  (6  (6  ( 6   ($6$  ((6(  (,6,  (060  (464  (868  (<6< AÀ j! AÀ j" M\r   O\r@  ( 6  Aj! Aj" I\r @ AO\r   !@ AO\r   ! A|j!  !@  -  :    - :   - :   - :  Aj! Aj" M\r @  O\r @  -  :   Aj! Aj" G\r    @  \r A ÷   6 A      (<ü  û # A k"$    ("6  (!  6  6   k"6  j! Aj!A!@@@@@  (< AjA Aj û E\r  !@  ("F\r@ AJ\r  ! AA   ("K"	j" (   A  	k"j6  AA 	j" (  k6   k! !  (<   	k" Aj û E\r  AG\r    (,"6   6     (0j6 !A !  A 6  B 7    ( A r6  AF\r   (k! A j$  K# Ak"$     Aÿq Aj û ! )! Aj$ B     (<  ÿ  A*   A N ! A A 6¼ A   6¤ A A A k6À A A (ô 6Ä  A    A  A  A  \\    (H"Aj r6H@  ( "AqE\r    A r6 A  B 7    (,"6   6     (0j6A é A G!@@@  AqE\r  E\r  Aÿq!@  -   F\r Aj"A G!  Aj" AqE\r \r  E\r@  -   AÿqF\r  AI\r  AÿqAl!@A  (  s"k rAxqAxG\r  Aj!  A|j"AK\r  E\r Aÿq!@@  -   G\r     Aj!  Aj"\r A   A   "  k  ¬A!@@  E\r  Aÿ M\r@@A (ø ( \r  AqA¿F\r÷ A6 @ AÿK\r    A?qAr:    AvAÀr:  A@@ A°I\r  A@qAÀG\r   A?qAr:    AvAàr:     AvA?qAr: A@ A|jAÿÿ?K\r    A?qAr:    AvAðr:     AvA?qAr:    AvA?qAr: A÷ A6 A!    :  A @  \r A    A  ~@  ½"B4§Aÿq"AÿF\r @ \r @@  D        b\r A !  D      ðC¢  !  ( A@j!  6     Axj6  BÿÿÿÿÿÿÿBð?¿!   æ@@ ("\r A !  \r (!@   ("kM\r      ($  @@ (PA H\r  E\r  !@@   j"Aj-  A\nF\r Aj"E\r      ($  " I\r  k! (!  !A !   ú   ( j6  j! ,@    l"  " G\r  A    nò~@ E\r    :     j"Aj :   AI\r    :    :  A}j :   A~j :   AI\r    :  A|j :   A	I\r   A   kAq"j" AÿqAl"6    kA|q"j"A|j 6  A	I\r   6  6 Axj 6  Atj 6  AI\r   6  6  6  6 Apj 6  Alj 6  Ahj 6  Adj 6   AqAr"k"A I\r  ­B~!  j!@  7  7  7  7  A j! A`j"AK\r   æ# AÐk"$   6Ì A jA A(ü   (Ì6È@@A   AÈj AÐ j A j   A N\r A!     ( "A_q6 @@@@  (0\r   AÐ 60  A 6  B 7  (,!   6,A !  (\rA!   \r    AÈj AÐ j A j   ! A q!@ E\r   A A   ($    A 60   6,  A 6  (!  B 7 A !    ( " r6 A  A q!  AÐj$   ~# AÀ k"$   6< A)j! A\'j!	 A(j!\nA !A !@@@@@A !\r@ ! \r AÿÿÿÿsJ\r \r j! !\r@@@@@@ -  "E\r @@@@ Aÿq"\r  \r! A%G\r \r!@@ - A%F\r  ! \rAj!\r - ! Aj"! A%F\r  \r k"\r Aÿÿÿÿs"J\r\n@  E\r     \r  \r\r  6< Aj!\rA!@ , APj"A	K\r  - A$G\r  Aj!\rA! !  \r6<A !@@ \r,  "A`j"AM\r  \r!A ! \r!A t"AÑqE\r @  \rAj"6<  r! \r, "A`j"A O\r !\rA t"AÑq\r @@ A*G\r @@ , APj"\rA	K\r  - A$G\r @@  \r   \rAtjA\n6 A !  \rAtj( ! Aj!A! \r Aj!@  \r   6<A !A !  ( "\rAj6  \r( !A !  6< AJ\rA  k! AÀ r! A<j "A H\r (<!A !\rA!@@ -  A.F\r A !@ - A*G\r @@ , APj"A	K\r  - A$G\r @@  \r   AtjA\n6 A !  Atj( ! Aj! \r Aj!@  \r A !  ( "Aj6  ( !  6< AJ!  Aj6<A! A<j ! (<!@ \r!A! ",  "\rAjAFI\r Aj! A:l \rjAÏ j-  "\rAjAÿqAI\r   6<@@ \rAF\r  \rE\r\r@ A H\r @  \r   Atj \r6 \r   Atj) 70  E\r	 A0j \r    AJ\rA !\r  E\r	  -  A q\r Aÿÿ{q"  AÀ q!A !A ! \n!@@@@@@@@@@@@@@@@@ -  "À"\rASq \r AqAF \r "\rA¨j!	\n  \n!@ \rA¿j  \rAÓ F\rA !A ! )0!A !\r@@@@@@@   (0 6  (0 6  (0 ¬7  (0 ;  (0 :   (0 6  (0 ¬7  A AK! Ar!Aø !\rA !A ! )0" \n \rA q ! P\r AqE\r \rAvA j!A!A !A ! )0" \n ! AqE\r   k"\r  \rJ!@ )0"BU\r  B  }"70A!A !@ AqE\r A!A !A A  Aq"!  \n !  A Hq\r Aÿÿ{q  !@ B R\r  \r  \n! \n!A !  \n k Pj"\r  \rJ!\r - 0!\r (0"\rAô  \r!   Aÿÿÿÿ AÿÿÿÿI "\rj!@ AL\r  ! \r!\r ! \r! -  \r )0"PE\rA !\r	@ E\r  (0!A !\r  A  A    A 6  >  Aj60 Aj!A!A !\r@@ ( "E\r Aj  "A H\r   \rkK\r Aj!  \rj"\r I\r A=! \rA H\r\r  A   \r  @ \r\r A !\rA ! (0!@ ( "E\r Aj  " j" \rK\r   Aj   Aj!  \rI\r   A   \r AÀ s   \r  \rJ!\r	  A Hq\r\nA=!   +0    \r   "\rA N\r \r- ! \rAj!\r   \r\n E\rA!\r@@  \rAtj( "E\r  \rAtj    A! \rAj"\rA\nG\r @ \rA\nI\r A!@  \rAtj( \rA! \rAj"\rA\nF\r A!  \r: \'A! 	! \n! ! \n!   k"  J" AÿÿÿÿsJ\rA=!   j"  J"\r K\r  A  \r          A0 \r  As   A0  A         A  \r  AÀ s  (<!A !A=!÷  6 A! AÀ j$   @  -  A q\r      {A !@  ( ",  APj"A	M\r A @A!@ AÌ³æ K\r A  A\nl"j  AÿÿÿÿsK!   Aj"6  , ! ! ! APj"A\nI\r  ¾ @@@@@@@@@@@@@@@@@@@ Awj 	\n\r  ( "Aj6    ( 6   ( "Aj6    4 7   ( "Aj6    5 7   ( "Aj6    4 7   ( "Aj6    5 7   ( AjAxq"Aj6    ) 7   ( "Aj6    2 7   ( "Aj6    3 7   ( "Aj6    0  7   ( "Aj6    1  7   ( AjAxq"Aj6    ) 7   ( "Aj6    5 7   ( AjAxq"Aj6    ) 7   ( AjAxq"Aj6    ) 7   ( "Aj6    4 7   ( "Aj6    5 7   ( AjAxq"Aj6    + 9       5 @  P\r @ Aj"  §Aq- à  r:    B" B R\r  . @  P\r @ Aj"  §AqA0r:    B" B R\r  {~@  BT\r @ Aj"  " B\n" B\n~}§A0r:   BÿÿÿÿV\r @  P\r   §!@ Aj"  A\nn"A\nlkA0r:   A	K! ! \r  # Ak"$ @  L\r  AÀq\r     k"A AI" @ \r @   A  A~j"AÿK\r       Aj$      A A  Ä~~|# A°k"$ A ! A 6,@@  "BU\r A!	A !\n " !@ AqE\r A!	A !\nA A  Aq"	!\n 	E!@@ Bøÿ Bøÿ R\r   A   	Aj" Aÿÿ{q    \n 	   Aü AÆ  A q"A AÊ    bA   A    AÀ s     J!\r Aj!@@@@  A,j "  "D        a\r   (,"Aj6, A r"Aá G\r A r"Aá F\rA  A H! (,!  Acj"6,A  A H! D      °A¢! A0jA A  A Hj"!@  ü"6  Aj!  ¸¡D    eÍÍA¢"D        b\r @@ AN\r  ! ! ! ! !@ A AI!@ A|j" I\r  ­!B !@  5   |" BëÜ"BëÜ~}>  A|j" O\r  BëÜT\r  A|j" > @@ " M\r A|j"( E\r   (, k"6, ! A J\r @ AJ\r  AjA	nAj! Aæ F!@A  k"A	 A	I!\r@@  I\r A A ( !AëÜ \rv!A \rtAs!A ! !@  ( " \rv j6   q l! Aj" I\r A A ( ! E\r   6  Aj!  (, \rj"6,   j" " Atj   kAu J! A H\r A !@  O\r   kAuA	l!A\n! ( "A\nI\r @ Aj!  A\nl"O\r @ A   Aæ Fk A G Aç Fqk"  kAuA	lAwjN\r  A0jA`A¤b A Hj AÈ j"A	m"Atj!\rA\n!@  A	lk"AJ\r @ A\nl! Aj"AG\r  \rAj!@@ \r( "  n" lk"\r   F\r@@ Aq\r D      @C! AëÜG\r \r M\r \rA|j-  AqE\rD     @C!D      à?D      ð?D      ø?  FD      ø?  Av"F  I!@ \r  \n-  A-G\r  ! ! \r  k"6     a\r  \r  j"6 @ AëÜI\r @ \rA 6 @ \rA|j"\r O\r  A|j"A 6  \r \r( Aj"6  AÿëÜK\r   kAuA	l!A\n! ( "A\nI\r @ Aj!  A\nl"O\r  \rAj"   K!@@ " M"\r A|j"( E\r @@ Aç F\r  Aq! AsA A " J A{Jq"\r j!AA~ \r j! Aq"\r Aw!@ \r  A|j( "\rE\r A\n!A ! \rA\np\r @ "Aj! \r A\nl"pE\r  As!  kAuA	l!@ A_qAÆ G\r A !   jAwj"A  A J"  H!A !   j jAwj"A  A J"  H!A!\r AýÿÿÿAþÿÿÿ  r"J\r  A GjAj!@@ A_q"AÆ G\r   AÿÿÿÿsJ\r A  A J!@   Au"s k­  "kAJ\r @ Aj"A0:    kAH\r  A~j" :  A!\r AjA-A+ A H:    k" AÿÿÿÿsJ\rA!\r  j" 	AÿÿÿÿsJ\r  A    	j"     \n 	   A0   As @@@@ AÆ G\r  AjA	r!    K"!@ 5   !@@  F\r   AjM\r@ Aj"A0:    AjK\r   G\r  Aj"A0:       k  Aj" M\r @ E\r   Aò A   O\r AH\r@@ 5   " AjM\r @ Aj"A0:    AjK\r     A	 A	H  Awj! Aj" O\r A	J! ! \r @ A H\r   Aj  K!\r AjA	r! !@@ 5   " G\r  Aj"A0:  @@  F\r   AjM\r@ Aj"A0:    AjK\r    A  Aj!  rE\r   Aò A      k"   J   k! Aj" \rO\r AJ\r   A0 AjAA       k  !  A0 A	jA	A    A    AÀ s     J!\r \n AtAuA	qj!@ AK\r A k!D      0@!@ D      0@¢! Aj"\r @ -  A-G\r    ¡ !    ¡!@ (," Au"s k­  " G\r  Aj"A0:   (,! 	Ar! A q! A~j" Aj:   AjA-A+ A H:   AH AqEq! Aj!@ " ü"Aà j-   r:    ·¡D      0@¢!@ Aj" AjkAG\r  D        a q\r  A.:  Aj! D        b\r A!\r Aûÿÿÿ 	  k"jkJ\r   A    j Aj  Ajk" A~j H  "j"         A0   As    Aj    A0  kA A         A    AÀ s     J!\r A°j$  \r.  ( AjAxq"Aj6    )  )® 9    ½ø&# Ak"$ @@@@@  AôK\r @A (Ð "A  AjAøq  AI"Av"v" AqE\r @@  AsAq j"At"Aø j" ( "(" G\r A  A~ wq6Ð   A (à I\r  ( G\r   6   6 Aj!   Ar6  j" (Ar6 A (Ø "M\r@  E\r @@   tA t" A   krqh"At"Aø j" ( " ("G\r A  A~ wq"6Ð  A (à I\r (  G\r  6  6   Ar6   j"  k"Ar6   j 6 @ E\r  AxqAø j!A (ä !@@ A Avt"q\r A   r6Ð  ! ("A (à I\r  6  6  6  6  Aj! A  6ä A  6Ø A (Ô "	E\r 	hAt(  "(Axq k! !@@@ (" \r  (" E\r  (Axq k"   I"!    !  !  A (à "\nI\r (!@@ ("  F\r  (" \nI\r ( G\r  ( G\r   6   6@@@ ("E\r  Aj! ("E\r Aj!@ ! " Aj!  ("\r   Aj!  ("\r   \nI\r A 6 A ! @ E\r @@  ("At"(  G\r  A  j  6   \rA  	A~ wq6Ô   \nI\r@@ ( G\r    6   6  E\r   \nI\r   6@ ("E\r   \nI\r   6   6 ("E\r   \nI\r   6   6@@ AK\r    j" Ar6   j"   (Ar6  Ar6  j" Ar6  j 6 @ E\r  AxqAø j!A (ä ! @@A Avt" q\r A   r6Ð  ! (" \nI\r   6   6   6   6A  6ä A  6Ø  Aj! A!  A¿K\r   Aj"Axq!A (Ô "E\r A!@  AôÿÿK\r  A& Avg" kvAq  AtkA>j!A  k!@@@@ At(  "\r A ! A !A !  A A Avk AFt!A !@@ (Axq k" O\r  ! ! \r A ! ! !    ("   AvAqj("F   !  At! ! \r @   r\r A !A t" A   kr q" E\r  hAt(  !   E\r@  (Axq k" I!@  ("\r   (!   !    ! !  \r  E\r  A (Ø  kO\r  A (à "I\r (!@@ ("  F\r  (" I\r ( G\r  ( G\r   6   6@@@ ("E\r  Aj! ("E\r Aj!@ ! " Aj!  ("\r   Aj!  ("\r   I\r A 6 A ! @ E\r @@  ("At"(  G\r  A  j  6   \rA  A~ wq"6Ô   I\r@@ ( G\r    6   6  E\r   I\r   6@ ("E\r   I\r   6   6 ("E\r   I\r   6   6@@ AK\r    j" Ar6   j"   (Ar6  Ar6  j" Ar6  j 6 @ AÿK\r  AøqAø j! @@A (Ð "A Avt"q\r A   r6Ð   !  (" I\r   6  6   6  6A! @ AÿÿÿK\r  A& Avg" kvAq  AtrA>s!    6 B 7  AtA  j!@@@ A  t"q\r A   r6Ô   6   6 A A  Avk  AFt!  ( !@ "(Axq F\r  Av!  At!   Aqj"("\r  Aj"  I\r   6   6  6  6  I\r ("  I\r   6  6 A 6  6   6 Aj! @A (Ø "  I\r A (ä !@@   k"AI\r   j" Ar6   j 6   Ar6   Ar6   j"   (Ar6A !A !A  6Ø A  6ä  Aj! @A (Ü " M\r A   k"6Ü A A (è "  j"6è   Ar6   Ar6  Aj! @@A (¨¡ E\r A (°¡ !A B7´¡ A B 7¬¡ A  AjApqAØªÕªs6¨¡ A A 6¼¡ A A 6¡ A !A !   A/j"j"A  k"q" M\rA ! @A (¡ "E\r A (¡ " j" M\r  K\r@@@A - ¡ Aq\r @@@@@A (è "E\r A¡ ! @@   ( "I\r     (jI\r  (" \r A § "AF\r !@A (¬¡ " Aj" qE\r   k  jA   kqj!  M\r@A (¡ " E\r A (¡ " j" M\r   K\r § "  G\r  k q"§ "  (   (jF\r !   AF\r@  A0jI\r   !  kA (°¡ "jA  kq"§ AF\r  j!  ! AG\rA A (¡ Ar6¡  § !A § !  AF\r  AF\r   O\r   k" A(jM\rA A (¡  j" 6¡ @  A (¡ M\r A   6¡ @@@@A (è "E\r A¡ ! @   ( "  ("jF\r  (" \r @@A (à " E\r    O\rA  6à A ! A  6¡ A  6¡ A A6ð A A (¨¡ 6ô A A 6¡ @  At" Aø j"6   6   Aj" A G\r A  AXj" Ax kAq"k"6Ü A   j"6è   Ar6   jA(6A A (¸¡ 6ì   O\r   I\r   (Aq\r     j6A  Ax kAq" j"6è A A (Ü  j"  k" 6Ü    Ar6  jA(6A A (¸¡ 6ì @ A (à O\r A  6à   j!A¡ ! @@@  ( " F\r  (" \r   - AqE\rA¡ ! @@@   ( "I\r     (j"I\r  (!  A  AXj" Ax kAq"k"6Ü A   j"6è   Ar6   jA(6A A (¸¡ 6ì   A\' kAqjAQj"    AjI"A6 A )¡ 7 A )¡ 7A  Aj6¡ A  6¡ A  6¡ A A 6¡  Aj! @  A6  Aj!  Aj!   I\r   F\r   (A~q6   k"Ar6  6 @@ AÿK\r  AøqAø j! @@A (Ð "A Avt"q\r A   r6Ð   !  ("A (à I\r   6  6A!A!A! @ AÿÿÿK\r  A& Avg" kvAq  AtrA>s!    6 B 7  AtA  j!@@@A (Ô "A  t"q\r A   r6Ô   6   6 A A  Avk  AFt!  ( !@ "(Axq F\r  Av!  At!   Aqj"("\r  Aj" A (à I\r   6   6A!A! ! !  A (à "I\r ("  I\r   6  6   6A ! A!A!  j 6   j  6 A (Ü "  M\r A    k"6Ü A A (è "  j"6è   Ar6   Ar6  Aj! ÷ A06 A ! ø     6     ( j6   ¡ !  Aj$   \n  Ax  kAqj" Ar6 Ax kAqj"  j"k! @@@ A (è G\r A  6è A A (Ü   j"6Ü   Ar6@ A (ä G\r A  6ä A A (Ø   j"6Ø   Ar6  j 6 @ ("AqAG\r  (!@@ AÿK\r @ (" AøqAø j"F\r  A (à I\r ( G\r@  G\r A A (Ð A~ Avwq6Ð @  F\r  A (à I\r ( G\r  6  6 (!@@  F\r  ("A (à I\r ( G\r ( G\r  6  6@@@ ("E\r  Aj! ("E\r Aj!@ !	 "Aj! ("\r  Aj! ("\r  	A (à I\r 	A 6 A ! E\r @@  ("At"(  G\r  A  j 6  \rA A (Ô A~ wq6Ô  A (à I\r@@ ( G\r   6  6 E\r A (à "I\r  6@ ("E\r   I\r  6  6 ("E\r   I\r  6  6 Axq"  j!   j"(!  A~q6   Ar6   j  6 @  AÿK\r   AøqAø j!@@A (Ð "A  Avt" q\r A    r6Ð  !  (" A (à I\r  6   6  6   6A!@  AÿÿÿK\r   A&  Avg"kvAq AtrA>s!  6 B 7 AtA  j!@@@A (Ô "A t"q\r A   r6Ô   6   6  A A Avk AFt! ( !@ "(Axq  F\r Av! At!  Aqj"("\r  Aj"A (à I\r  6   6  6  6 A (à " I\r ("  I\r  6  6 A 6  6  6 Ajø  Ä\n@@  E\r   Axj"A (à "I\r  A|j( "AqAF\r  Axq" j!@ Aq\r  AqE\r  ( "k" I\r   j! @ A (ä F\r  (!@ AÿK\r @ (" AøqAø j"F\r   I\r ( G\r@  G\r A A (Ð A~ Avwq6Ð @  F\r   I\r ( G\r  6  6 (!@@  F\r  (" I\r ( G\r ( G\r  6  6@@@ ("E\r  Aj! ("E\r Aj!@ ! "Aj! ("\r  Aj! ("\r   I\r A 6 A ! E\r@@  ("At"(  G\r  A  j 6  \rA A (Ô A~ wq6Ô   I\r@@ ( G\r   6  6 E\r  I\r  6@ ("E\r   I\r  6  6 ("E\r  I\r  6  6 ("AqAG\r A   6Ø   A~q6   Ar6   6   O\r ("AqE\r@@ Aq\r @ A (è G\r A  6è A A (Ü   j" 6Ü    Ar6 A (ä G\rA A 6Ø A A 6ä @ A (ä "	G\r A  6ä A A (Ø   j" 6Ø    Ar6   j  6  (!@@ AÿK\r @ (" AøqAø j"F\r   I\r ( G\r@  G\r A A (Ð A~ Avwq6Ð @  F\r   I\r ( G\r  6  6 (!\n@@  F\r  (" I\r ( G\r ( G\r  6  6@@@ ("E\r  Aj! ("E\r Aj!@ ! "Aj! ("\r  Aj! ("\r   I\r A 6 A ! \nE\r @@  ("At"(  G\r  A  j 6  \rA A (Ô A~ wq6Ô  \n I\r@@ \n( G\r  \n 6 \n 6 E\r  I\r  \n6@ ("E\r   I\r  6  6 ("E\r   I\r  6  6  Axq  j" Ar6   j  6   	G\rA   6Ø   A~q6   Ar6   j  6 @  AÿK\r   AøqAø j!@@A (Ð "A  Avt" q\r A    r6Ð  !  ("  I\r  6   6  6   6A!@  AÿÿÿK\r   A&  Avg"kvAq AtrA>s!  6 B 7 AtA  j!@@@@A (Ô "A t"q\r A   r6Ô   6 A! A!  A A Avk AFt! ( !@ "(Axq  F\r Av! At!  Aqj"("\r  Aj"  I\r   6 A! A! ! ! !  I\r (" I\r  6  6A !A! A!  j 6   6   j 6 A A (ð Aj"A 6ð ø  ±A!@@  A  AK" Ajq\r  ! @ " At!   I\r @ A@  kI\r ÷ A06 A @A AjAxq AI"  jAj  "\r A  Axj!@@  Aj q\r  !  A|j"( "Axq   jAjA   kqAxj"A     kAKj"  k"k!@ Aq\r  ( !   6    j6      (AqrAr6   j" (Ar6   ( AqrAr6   j" (Ar6  ¥ @  ("AqE\r  Axq" AjM\r     AqrAr6   j"  k"Ar6   j" (Ar6  ¥   Ajx@@@ AG\r    !A! Aq\r Av"E\r iAK\r@ A@ kM\r A0 A AK £ !@ \r A0   6 A ! ø	   j!@@@@  ("AqE\r A (à ! AqE\r    ( "k" A (à "I\r  j!@  A (ä F\r   (!@ AÿK\r @  (" AøqAø j"F\r   I\r (  G\r@  G\r A A (Ð A~ Avwq6Ð @  F\r   I\r (  G\r  6  6  (!@@   F\r   (" I\r (  G\r (  G\r  6  6@@@  ("E\r   Aj!  ("E\r  Aj!@ ! "Aj! ("\r  Aj! ("\r   I\r A 6 A ! E\r@@    ("At"(  G\r  A  j 6  \rA A (Ô A~ wq6Ô   I\r@@ (  G\r   6  6 E\r  I\r  6@  ("E\r   I\r  6  6  ("E\r  I\r  6  6 ("AqAG\r A  6Ø   A~q6   Ar6  6   I\r@@ ("Aq\r @ A (è G\r A   6è A A (Ü  j"6Ü    Ar6  A (ä G\rA A 6Ø A A 6ä @ A (ä "	G\r A   6ä A A (Ø  j"6Ø    Ar6   j 6  (!@@ AÿK\r @ (" AøqAø j"F\r   I\r ( G\r@  G\r A A (Ð A~ Avwq6Ð @  F\r   I\r ( G\r  6  6 (!\n@@  F\r  (" I\r ( G\r ( G\r  6  6@@@ ("E\r  Aj! ("E\r Aj!@ ! "Aj! ("\r  Aj! ("\r   I\r A 6 A ! \nE\r @@  ("At"(  G\r  A  j 6  \rA A (Ô A~ wq6Ô  \n I\r@@ \n( G\r  \n 6 \n 6 E\r  I\r  \n6@ ("E\r   I\r  6  6 ("E\r   I\r  6  6   Axq j"Ar6   j 6    	G\rA  6Ø   A~q6   Ar6   j 6 @ AÿK\r  AøqAø j!@@A (Ð "A Avt"q\r A   r6Ð  ! (" I\r   6   6   6   6A!@ AÿÿÿK\r  A& Avg"kvAq AtrA>s!   6  B 7 AtA  j!@@@A (Ô "A t"q\r A   r6Ô    6    6 A A Avk AFt! ( !@ "(Axq F\r Av! At!  Aqj"("\r  Aj" I\r   6    6    6    6  I\r (" I\r   6   6  A 6   6   6ø   ? Atd~@@  ­B|BøÿÿÿA (ü " ­|"BÿÿÿÿV\r ¦  §"O\r  \r÷ A06 AA  6ü     A $ A AjApq$  # # k #  # S~@@ AÀ qE\r   A@j­!B ! E\r  AÀ  k­  ­"!  !   7    7S~@@ AÀ qE\r   A@j­!B ! E\r  AÀ  k­  ­"!  !   7    7©~# A k"$  Bÿÿÿÿÿÿ?!@@ B0Bÿÿ"§"AÿjAýK\r   B< B! Aj­!@@  Bÿÿÿÿÿÿÿÿ" BT\r  B|!  BR\r  B |!B   BÿÿÿÿÿÿÿV"!  ­ |!@   P\r  BÿÿR\r   B< BB! Bÿ!@ AþM\r Bÿ!B ! @Aø Aø  P"" k"Að L\r B ! B !  BÀ  !A !@  F\r  Aj   A k¬  ) )B R!     ­  ) "B< )B! @@ Bÿÿÿÿÿÿÿÿ ­"BT\r   B|!  BR\r   B  |!   B    BÿÿÿÿÿÿÿV"!  ­! A j$  B4 B  ¿T# Ak"$ A !@  Aq\r    p\r  Aj   ¤ ! A  (  ! Aj$   @  ± " \r ¹    >  A  AK!@@   "\rÇ " E\r      \n   ¢ \n   ²  @   µ "\r ¹   L A AK!  A  AK! @@   ¶ "\rÇ "E\r     $      jAjA   kq"  K¯ \n   ¢     ·  A A Å    !@@  AqE\r @  -  \r     k  !@ Aj"AqE\r -  \r @ "Aj!A ( "k rAxqAxF\r @ "Aj! -  \r    kS º "A\rj° "A 6  6  6  Aj!@ Aj"E\r    ü\n     6       AÄ Aj6   Aj »   ³# Ak"$   : @@  ("\r @   E\r A!  (!@  (" F\r   (P Aÿq"F\r    Aj6  :  @   AjA  ($  AF\r A! - ! Aj$   A    À {@@ (L"A H\r  E\r Aÿÿÿÿq (G\r@  Aÿq" (PF\r  (" (F\r   Aj6   :     ½    Á @ AÌ j"Â E\r  ¾ @@  Aÿq" (PF\r  (" (F\r   Aj6   :    ½ !@ Ã AqE\r  Ä      ( "Aÿÿÿÿ 6    ( !  A 6  \r   A ]# Ak"$   6A ( "    @    º jAj-  A\nF\r A\n ¿ ø  W# Ak"$ Aû AAA ( "   6     A\n ¿ ø   A (À¡    AÐ j  AÐ jY -  !@  -  "E\r   AÿqG\r @ - !  - "E\r Aj!  Aj!   AÿqF\r   Aÿqk\n   ã      ã A³    ã A³ 3 @ \r   ( (F@   G\r A  ( (É E# AÐ k"$ @@@  ( (G\r A!A ! Að A  A Ñ "E\r  ( "E\r AjA A8ü  A: K A6    6  6 A6D  Aj A ( (  @ (,"AG\r   ($6  AF! AÐ j$   AÎ 6 Aç6 A¼ 6 A  Æ  ø# AÀ k"$     ( "Axj( "j!@@ A|j( "( (G\r A !@ A H\r  A  A  kF! A~F\r B 7  6  6   6  6 B 7 B 7$ B 7, A 6< B74  Aj  AA  ( (   A  (AF!@ A H\r    k" H\r  B 7  6  6  6  6 B 7 B 7$ B 7, A 6< B74  Aj  AA  ( (   (\r B 7  6  6   6  6 B 7 B 7$ B 7, B 7 3 A 6< A: ;  Aj AA  ( (  A !@@ ((  (A  ($AFA  ( AFA  (,AF!@ (AF\r @ (,E\r A !@ ( AF\r A !A ! ($AG\r (! AÀ j$  w@ ($"\r   6  6 A6$  (86@@ ( (8G\r  ( G\r  (AG\r  6 A: 6 A6  Aj6$# @  ( ((G\r     Ò D @  ( ((G\r     Ò   ("      ( (    A: 5@  (G\r  A: 4@@ ("\r  A6$  6  6 AG\r (0AF\r@  G\r @ ("AG\r   6 ! (0AG\r AF\r  ($Aj6$ A: 6ª @@   ( Ï E\r   (G\r (AF\r  6@   (  Ï E\r @@  (F\r   (G\r AG\r A6   6 @ (,AF\r  A ;4  ("    A   ( (  @ - 5AG\r  A6, - 4E\r A6,  6  ((Aj6( ($AG\r (AG\r A: 6  ("       ( (  ± @@   ( Ï E\r   (G\r (AF\r  6   (  Ï E\r @@  (F\r   (G\r AG\r A6   6  6   ((Aj6(@ ($AG\r  (AG\r  A: 6 A6,L @   ( Ï E\r      Õ   ("        ( (  \' @   ( Ï E\r      Õ       AÔ Aj6      Ú   A³  A $   AÄ Aj6   Ajß   Ú 4  ( "A|j" ( Aj"6 @ AJ\r  Atj²      Þ   A³    (   Þ   A³    \n   $ #   kApq"$   # @  \r A !@A ( E\r A ( ç !@A (ð E\r A (ð ç  r!@ ( " E\r @@  (  (F\r   ç  r!  (8" \r   @  (  (F\r   A A   ($    (\r A@  ("  ("F\r     k¬A  ((    A 6  B 7  B 7A EA® !@  AK\r @@  \r A !   At/À " E\r  Aô j!      è  Aà-+   0X0x -0X+0X 0X-0x+0x 0x %s:%d: %s vector Unknown error /emsdk/emscripten/system/lib/libcxxabi/src/private_typeinfo.cpp nan bad_array_new_length inf bad_alloc was thrown in -fno-exceptions mode NAN INF catching a class without an object? . (null) libc++abi:   `\r                 	             \n\n\n  	  	                               \r \r   	   	                                               	                                                  	                                                   	                                              	                                                      	                                                   	         0123456789ABCDEF ü ¨ N10__cxxabiv116__shim_type_infoE     , ð N10__cxxabiv117__class_type_infoE            	   \n         \r                     \n                   ¬   N10__cxxabiv120__si_class_type_infoE                  X ð St9exception      è St9bad_alloc     (   St20bad_array_new_length        X           d è St11logic_error                 X St12length_error    X ° St9type_info       N ë§~ uú ¹,ý·z¼ Ì¢ =I×  *_·úXÙýÊ½áÍÜ@x }gaì å\nÔ Ì>Ov¯  D ® ®` úw!ë+ `A ©£nN                                                        *                    \'9H                                  8R`S  Ê        »Ûë+;PSuccess Illegal byte sequence Domain error Result not representable Not a tty Permission denied Operation not permitted No such file or directory No such process File exists Value too large for defined data type No space left on device Out of memory Resource busy Interrupted system call Resource temporarily unavailable Invalid seek Cross-device link Read-only file system Directory not empty Connection reset by peer Operation timed out Connection refused Host is down Host is unreachable Address in use Broken pipe I/O error No such device or address Block device required No such device Not a directory Is a directory Text file busy Exec format error Invalid argument Argument list too long Symbolic link loop Filename too long Too many open files in system No file descriptors available Bad file descriptor No child process Bad address File too large Too many links No locks available Resource deadlock would occur State not recoverable Owner died Operation canceled Function not implemented No message of desired type Identifier removed Device not a stream No data available Device timeout Out of streams resources Link has been severed Protocol error Bad message File descriptor in bad state Not a socket Destination address required Message too large Protocol wrong type for socket Protocol not available Protocol not supported Socket type not supported Not supported Protocol family not supported Address family not supported by protocol Address not available Network is down Network unreachable Connection reset by network Connection aborted No buffer space available Socket is connected Socket not connected Cannot send after socket shutdown Operation already in progress Operation in progress Stale file handle Remote I/O error Quota exceeded No medium found Wrong medium type Multihop attempted Required key not available Key has expired Key has been revoked Key was rejected by service  Aà                                                                     ÿÿÿÿÿÿÿÿ                                                            `\r     ¸ Ð  target_features+bulk-memory+bulk-memory-opt+call-indirect-overlong+\nmultivalue+mutable-globals+nontrapping-fptoint+reference-types+sign-ext');
}

function getBinarySync(file) {
  return file;
}

async function getWasmBinary(binaryFile) {

  // Otherwise, getBinarySync should be able to get it synchronously
  return getBinarySync(binaryFile);
}

async function instantiateArrayBuffer(binaryFile, imports) {
  try {
    var binary = await getWasmBinary(binaryFile);
    var instance = await WebAssembly.instantiate(binary, imports);
    return instance;
  } catch (reason) {
    err(`failed to asynchronously prepare wasm: ${reason}`);

    // Warn on some common problems.
    if (isFileURI(binaryFile)) {
      err(`warning: Loading from a file URI (${binaryFile}) is not supported in most browsers. See https://emscripten.org/docs/getting_started/FAQ.html#how-do-i-run-a-local-webserver-for-testing-why-does-my-program-stall-in-downloading-or-preparing`);
    }
    abort(reason);
  }
}

async function instantiateAsync(binary, binaryFile, imports) {
  return instantiateArrayBuffer(binaryFile, imports);
}

function getWasmImports() {
  // prepare imports
  var imports = {
    'env': wasmImports,
    'wasi_snapshot_preview1': wasmImports,
  };
  return imports;
}

// Create the wasm instance.
// Receives the wasm imports, returns the exports.
async function createWasm() {
  // Load the wasm module and create an instance of using native support in the JS engine.
  // handle a generated wasm instance, receiving its exports and
  // performing other necessary setup
  /** @param {WebAssembly.Module=} module*/
  function receiveInstance(instance, module) {
    wasmExports = instance.exports;

    assignWasmExports(wasmExports);

    updateMemoryViews();

    return wasmExports;
  }

  // Prefer streaming instantiation if available.
  // Async compilation can be confusing when an error on the page overwrites Module
  // (for example, if the order of elements is wrong, and the one defining Module is
  // later), so we save Module and check it later.
  var trueModule = Module;
  function receiveInstantiationResult(result) {
    // 'result' is a ResultObject object which has both the module and instance.
    // receiveInstance() will swap in the exports (to Module.asm) so they can be called
    assert(Module === trueModule, 'the Module object should not be replaced during async compilation - perhaps the order of HTML elements is wrong?');
    trueModule = null;
    // TODO: Due to Closure regression https://github.com/google/closure-compiler/issues/3193, the above line no longer optimizes out down to the following line.
    // When the regression is fixed, can restore the above PTHREADS-enabled path.
    return receiveInstance(result['instance']);
  }

  var info = getWasmImports();

  // User shell pages can write their own Module.instantiateWasm = function(imports, successCallback) callback
  // to manually instantiate the Wasm module themselves. This allows pages to
  // run the instantiation parallel to any other async startup actions they are
  // performing.
  // Also pthreads and wasm workers initialize the wasm instance through this
  // path.
  if (Module['instantiateWasm']) {
    return new Promise((resolve, reject) => {
      try {
        Module['instantiateWasm'](info, (inst, mod) => {
          resolve(receiveInstance(inst, mod));
        });
      } catch(e) {
        err(`Module.instantiateWasm callback failed with error: ${e}`);
        reject(e);
      }
    });
  }

  wasmBinaryFile ??= findWasmBinary();
  var result = await instantiateAsync(wasmBinary, wasmBinaryFile, info);
  var exports = receiveInstantiationResult(result);
  return exports;
}

// end include: preamble.js

// Begin JS library code


  class ExitStatus {
      name = 'ExitStatus';
      constructor(status) {
        this.message = `Program terminated with exit(${status})`;
        this.status = status;
      }
    }

  /** @type {!Int16Array} */
  var HEAP16;

  /** @type {!Int32Array} */
  var HEAP32;

  /** not-@type {!BigInt64Array} */
  var HEAP64;

  /** @type {!Int8Array} */
  var HEAP8;

  /** @type {!Float32Array} */
  var HEAPF32;

  /** @type {!Float64Array} */
  var HEAPF64;

  /** @type {!Uint16Array} */
  var HEAPU16;

  /** @type {!Uint32Array} */
  var HEAPU32;

  /** not-@type {!BigUint64Array} */
  var HEAPU64;

  /** @type {!Uint8Array} */
  var HEAPU8;

  var callRuntimeCallbacks = (callbacks) => {
      while (callbacks.length > 0) {
        // Pass the module as the first argument.
        callbacks.shift()(Module);
      }
    };
  var onPostRuns = [];
  var addOnPostRun = (cb) => onPostRuns.push(cb);

  var onPreRuns = [];
  var addOnPreRun = (cb) => onPreRuns.push(cb);


  
    /**
   * @param {number} ptr
   * @param {string} type
   */
  function getValue(ptr, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': return HEAP8[ptr];
      case 'i8': return HEAP8[ptr];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP64[((ptr)>>3)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      case '*': return HEAPU32[((ptr)>>2)];
      default: abort(`invalid type for getValue: ${type}`);
    }
  }

  var noExitRuntime = true;

  function ptrToString(ptr) {
      assert(typeof ptr === 'number', `ptrToString expects a number, got ${typeof ptr}`);
      // Convert to 32-bit unsigned value
      ptr >>>= 0;
      return '0x' + ptr.toString(16).padStart(8, '0');
    }

  
    /**
   * @param {number} ptr
   * @param {number} value
   * @param {string} type
   */
  function setValue(ptr, value, type = 'i8') {
    if (type.endsWith('*')) type = '*';
    switch (type) {
      case 'i1': HEAP8[ptr] = value; break;
      case 'i8': HEAP8[ptr] = value; break;
      case 'i16': HEAP16[((ptr)>>1)] = value; break;
      case 'i32': HEAP32[((ptr)>>2)] = value; break;
      case 'i64': HEAP64[((ptr)>>3)] = BigInt(value); break;
      case 'float': HEAPF32[((ptr)>>2)] = value; break;
      case 'double': HEAPF64[((ptr)>>3)] = value; break;
      case '*': HEAPU32[((ptr)>>2)] = value; break;
      default: abort(`invalid type for setValue: ${type}`);
    }
  }

  var stackRestore = (val) => __emscripten_stack_restore(val);

  var stackSave = () => _emscripten_stack_get_current();

  var warnOnce = (text) => {
      warnOnce.shown ||= {};
      if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text);
      }
    };

  

  class ExceptionInfo {
      // excPtr - Thrown object pointer to wrap. Metadata pointer is calculated from it.
      constructor(excPtr) {
        this.excPtr = excPtr;
        this.ptr = excPtr - 24;
      }
  
      set_type(type) {
        HEAPU32[(((this.ptr)+(4))>>2)] = type;
      }
  
      get_type() {
        return HEAPU32[(((this.ptr)+(4))>>2)];
      }
  
      set_destructor(destructor) {
        HEAPU32[(((this.ptr)+(8))>>2)] = destructor;
      }
  
      get_destructor() {
        return HEAPU32[(((this.ptr)+(8))>>2)];
      }
  
      set_caught(caught) {
        caught = caught ? 1 : 0;
        HEAP8[(this.ptr)+(12)] = caught;
      }
  
      get_caught() {
        return HEAP8[(this.ptr)+(12)] != 0;
      }
  
      set_rethrown(rethrown) {
        rethrown = rethrown ? 1 : 0;
        HEAP8[(this.ptr)+(13)] = rethrown;
      }
  
      get_rethrown() {
        return HEAP8[(this.ptr)+(13)] != 0;
      }
  
      // Initialize native structure fields. Should be called once after allocated.
      init(type, destructor) {
        this.set_adjusted_ptr(0);
        this.set_type(type);
        this.set_destructor(destructor);
      }
  
      set_adjusted_ptr(adjustedPtr) {
        HEAPU32[(((this.ptr)+(16))>>2)] = adjustedPtr;
      }
  
      get_adjusted_ptr() {
        return HEAPU32[(((this.ptr)+(16))>>2)];
      }
    }
  
  var uncaughtExceptionCount = 0;
  var ___cxa_throw = (ptr, type, destructor) => {
      var info = new ExceptionInfo(ptr);
      // Initialize ExceptionInfo content after it was allocated in __cxa_allocate_exception.
      info.init(type, destructor);
      uncaughtExceptionCount++;
      assert(false, 'Exception thrown, but exception catching is not enabled. Compile with -sNO_DISABLE_EXCEPTION_CATCHING or -sEXCEPTION_CATCHING_ALLOWED=[..] to catch.');
    };

  var __abort_js = () =>
      abort('native code called abort()');

  var getHeapMax = () =>
      // Stay one Wasm page short of 4GB: while e.g. Chrome is able to allocate
      // full 4GB Wasm memories, the size will wrap back to 0 bytes in Wasm side
      // for any code that deals with heap sizes, which would require special
      // casing all heap size related code to treat 0 specially.
      2147483648;
  
  var alignMemory = (size, alignment) => {
      assert(alignment, "alignment argument is required");
      return Math.ceil(size / alignment) * alignment;
    };
  
  var growMemory = (size) => {
      var oldHeapSize = wasmMemory.buffer.byteLength;
      var pages = ((size - oldHeapSize + 65535) / 65536) | 0;
      try {
        // round size grow request up to wasm page size (fixed 64KB per spec)
        wasmMemory.grow(pages); // .grow() takes a delta compared to the previous size
        updateMemoryViews();
        return 1 /*success*/;
      } catch(e) {
        err(`growMemory: Attempted to grow heap from ${oldHeapSize} bytes to ${size} bytes, but got error: ${e}`);
      }
      // implicit 0 return to save code size (caller will cast "undefined" into 0
      // anyhow)
    };
  var _emscripten_resize_heap = (requestedSize) => {
      var oldSize = HEAPU8.length;
      // With CAN_ADDRESS_2GB or MEMORY64, pointers are already unsigned.
      requestedSize >>>= 0;
      // With multithreaded builds, races can happen (another thread might increase the size
      // in between), so return a failure, and let the caller retry.
      assert(requestedSize > oldSize);
  
      // Memory resize rules:
      // 1.  Always increase heap size to at least the requested size, rounded up
      //     to next page multiple.
      // 2a. If MEMORY_GROWTH_LINEAR_STEP == -1, excessively resize the heap
      //     geometrically: increase the heap size according to
      //     MEMORY_GROWTH_GEOMETRIC_STEP factor (default +20%), At most
      //     overreserve by MEMORY_GROWTH_GEOMETRIC_CAP bytes (default 96MB).
      // 2b. If MEMORY_GROWTH_LINEAR_STEP != -1, excessively resize the heap
      //     linearly: increase the heap size by at least
      //     MEMORY_GROWTH_LINEAR_STEP bytes.
      // 3.  Max size for the heap is capped at 2048MB-WASM_PAGE_SIZE, or by
      //     MAXIMUM_MEMORY, or by ASAN limit, depending on which is smallest
      // 4.  If we were unable to allocate as much memory, it may be due to
      //     over-eager decision to excessively reserve due to (3) above.
      //     Hence if an allocation fails, cut down on the amount of excess
      //     growth, in an attempt to succeed to perform a smaller allocation.
  
      // A limit is set for how much we can grow. We should not exceed that
      // (the wasm binary specifies it, so if we tried, we'd fail anyhow).
      var maxHeapSize = getHeapMax();
      if (requestedSize > maxHeapSize) {
        err(`Cannot enlarge memory, requested ${requestedSize} bytes, but the limit is ${maxHeapSize} bytes!`);
        return false;
      }
  
      // Loop through potential heap size increases. If we attempt a too eager
      // reservation that fails, cut down on the attempted size and reserve a
      // smaller bump instead. (max 3 times, chosen somewhat arbitrarily)
      for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
        var overGrownHeapSize = oldSize * (1 + 0.2 / cutDown); // ensure geometric growth
        // but limit overreserving (default to capping at +96MB overgrowth at most)
        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296 );
  
        var newSize = Math.min(maxHeapSize, alignMemory(Math.max(requestedSize, overGrownHeapSize), 65536));
  
        var replacement = growMemory(newSize);
        if (replacement) {
  
          return true;
        }
      }
      err(`Failed to grow the heap from ${oldSize} bytes to ${newSize} bytes, not enough memory!`);
      return false;
    };

  var UTF8Decoder = globalThis.TextDecoder && new TextDecoder();
  
  var findStringEnd = (heapOrArray, idx, maxBytesToRead, ignoreNul) => {
      var maxIdx = idx + maxBytesToRead;
      if (ignoreNul) return maxIdx;
      // TextDecoder needs to know the byte length in advance, it doesn't stop on
      // null terminator by itself.
      // As a tiny code save trick, compare idx against maxIdx using a negation,
      // so that maxBytesToRead=undefined/NaN means Infinity.
      while (heapOrArray[idx] && !(idx >= maxIdx)) ++idx;
      return idx;
    };
  
  
    /**
   * Given a pointer 'idx' to a null-terminated UTF8-encoded string in the given
   * array that contains uint8 values, returns a copy of that string as a
   * Javascript String object.
   * heapOrArray is either a regular array, or a JavaScript typed array view.
   * @param {number=} idx
   * @param {number=} maxBytesToRead
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ArrayToString = (heapOrArray, idx = 0, maxBytesToRead, ignoreNul) => {
  
      var endPtr = findStringEnd(heapOrArray, idx, maxBytesToRead, ignoreNul);
  
      // When using conditional TextDecoder, skip it for short strings as the overhead of the native call is not worth it.
      if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr));
      }
      var str = '';
      while (idx < endPtr) {
        // For UTF8 byte structure, see:
        // http://en.wikipedia.org/wiki/UTF-8#Description
        // https://www.ietf.org/rfc/rfc2279.txt
        // https://tools.ietf.org/html/rfc3629
        var u0 = heapOrArray[idx++];
        if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
        var u1 = heapOrArray[idx++] & 63;
        if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
        var u2 = heapOrArray[idx++] & 63;
        if ((u0 & 0xF0) == 0xE0) {
          u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
        } else {
          if ((u0 & 0xF8) != 0xF0) warnOnce(`Invalid UTF-8 leading byte ${ptrToString(u0)} encountered when deserializing a UTF-8 string in wasm memory to a JS string!`);
          u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | (heapOrArray[idx++] & 63);
        }
  
        if (u0 < 0x10000) {
          str += String.fromCharCode(u0);
        } else {
          var ch = u0 - 0x10000;
          str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
        }
      }
      return str;
    };
  
    /**
   * Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the
   * emscripten HEAP, returns a copy of that string as a Javascript String object.
   *
   * @param {number} ptr
   * @param {number=} maxBytesToRead - An optional length that specifies the
   *   maximum number of bytes to read. You can omit this parameter to scan the
   *   string until the first 0 byte. If maxBytesToRead is passed, and the string
   *   at [ptr, ptr+maxBytesToReadr[ contains a null byte in the middle, then the
   *   string will cut short at that byte index.
   * @param {boolean=} ignoreNul - If true, the function will not stop on a NUL character.
   * @return {string}
   */
  var UTF8ToString = (ptr, maxBytesToRead, ignoreNul) => {
      assert(typeof ptr == 'number', `UTF8ToString expects a number (got ${typeof ptr})`);
      return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead, ignoreNul) : '';
    };
  var SYSCALLS = {
  varargs:undefined,
  getStr(ptr) {
        var ret = UTF8ToString(ptr);
        return ret;
      },
  };
  var _fd_close = (fd) => {
      abort('fd_close called without SYSCALLS_REQUIRE_FILESYSTEM');
    };

  var INT53_MAX = 9007199254740992;
  
  var INT53_MIN = -9007199254740992;
  var bigintToI53Checked = (num) => (num < INT53_MIN || num > INT53_MAX) ? NaN : Number(num);
  function _fd_seek(fd, offset, whence, newOffset) {
    offset = bigintToI53Checked(offset);
  
  
      return 70;
    ;
  }

  var printCharBuffers = [null,[],[]];
  
  var printChar = (stream, curr) => {
      var buffer = printCharBuffers[stream];
      assert(buffer);
      if (curr === 0 || curr === 10) {
        (stream === 1 ? out : err)(UTF8ArrayToString(buffer));
        buffer.length = 0;
      } else {
        buffer.push(curr);
      }
    };
  
  var flush_NO_FILESYSTEM = () => {
      // flush anything remaining in the buffers during shutdown
      _fflush(0);
      if (printCharBuffers[1].length) printChar(1, 10);
      if (printCharBuffers[2].length) printChar(2, 10);
    };
  
  
  var _fd_write = (fd, iov, iovcnt, pnum) => {
      // hack to support printf in SYSCALLS_REQUIRE_FILESYSTEM=0
      var num = 0;
      for (var i = 0; i < iovcnt; i++) {
        var ptr = HEAPU32[((iov)>>2)];
        var len = HEAPU32[(((iov)+(4))>>2)];
        iov += 8;
        for (var j = 0; j < len; j++) {
          printChar(fd, HEAPU8[ptr+j]);
        }
        num += len;
      }
      HEAPU32[((pnum)>>2)] = num;
      return 0;
    };


// End JS library code

// include: postlibrary.js
// This file is included after the automatically-generated JS library code
// but before the wasm module is created.

{

  // Begin ATMODULES hooks
  if (Module['noExitRuntime']) noExitRuntime = Module['noExitRuntime'];
if (Module['print']) out = Module['print'];
if (Module['printErr']) err = Module['printErr'];
if (Module['wasmBinary']) wasmBinary = Module['wasmBinary'];

Module['FS_createDataFile'] = FS.createDataFile;
Module['FS_createPreloadedFile'] = FS.createPreloadedFile;

  // End ATMODULES hooks

  checkIncomingModuleAPI();

  if (Module['arguments']) arguments_ = Module['arguments'];
  if (Module['thisProgram']) thisProgram = Module['thisProgram'];

  // Assertions on removed incoming Module JS APIs.
  assert(typeof Module['memoryInitializerPrefixURL'] == 'undefined', 'Module.memoryInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['pthreadMainPrefixURL'] == 'undefined', 'Module.pthreadMainPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['cdInitializerPrefixURL'] == 'undefined', 'Module.cdInitializerPrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['filePackagePrefixURL'] == 'undefined', 'Module.filePackagePrefixURL option was removed, use Module.locateFile instead');
  assert(typeof Module['read'] == 'undefined', 'Module.read option was removed');
  assert(typeof Module['readAsync'] == 'undefined', 'Module.readAsync option was removed (modify readAsync in JS)');
  assert(typeof Module['readBinary'] == 'undefined', 'Module.readBinary option was removed (modify readBinary in JS)');
  assert(typeof Module['setWindowTitle'] == 'undefined', 'Module.setWindowTitle option was removed (modify emscripten_set_window_title in JS)');
  assert(typeof Module['TOTAL_MEMORY'] == 'undefined', 'Module.TOTAL_MEMORY has been renamed Module.INITIAL_MEMORY');
  assert(typeof Module['ENVIRONMENT'] == 'undefined', 'Module.ENVIRONMENT has been deprecated. To force the environment, use the ENVIRONMENT compile-time option (for example, -sENVIRONMENT=web or -sENVIRONMENT=node)');
  assert(typeof Module['STACK_SIZE'] == 'undefined', 'STACK_SIZE can no longer be set at runtime.  Use -sSTACK_SIZE at link time')
  // If memory is defined in wasm, the user can't provide it, or set INITIAL_MEMORY
  assert(typeof Module['wasmMemory'] == 'undefined', 'Use of `wasmMemory` detected.  Use -sIMPORTED_MEMORY to define wasmMemory externally');
  assert(typeof Module['INITIAL_MEMORY'] == 'undefined', 'Detected runtime INITIAL_MEMORY setting.  Use -sIMPORTED_MEMORY to define wasmMemory dynamically');

  if (Module['preInit']) {
    if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
    while (Module['preInit'].length > 0) {
      Module['preInit'].shift()();
    }
  }
  consumedModuleProp('preInit');
}

// Begin runtime exports
  var missingLibrarySymbols = [
  'writeI53ToI64',
  'writeI53ToI64Clamped',
  'writeI53ToI64Signaling',
  'writeI53ToU64Clamped',
  'writeI53ToU64Signaling',
  'readI53FromI64',
  'readI53FromU64',
  'convertI32PairToI53',
  'convertI32PairToI53Checked',
  'convertU32PairToI53',
  'stackAlloc',
  'getTempRet0',
  'setTempRet0',
  'createNamedFunction',
  'zeroMemory',
  'exitJS',
  'withStackSave',
  'strError',
  'inetPton4',
  'inetNtop4',
  'inetPton6',
  'inetNtop6',
  'readSockaddr',
  'writeSockaddr',
  'readEmAsmArgs',
  'jstoi_q',
  'getExecutableName',
  'autoResumeAudioContext',
  'getDynCaller',
  'dynCall',
  'handleException',
  'keepRuntimeAlive',
  'runtimeKeepalivePush',
  'runtimeKeepalivePop',
  'callUserCallback',
  'maybeExit',
  'asyncLoad',
  'asmjsMangle',
  'mmapAlloc',
  'HandleAllocator',
  'getUniqueRunDependency',
  'addRunDependency',
  'removeRunDependency',
  'addOnInit',
  'addOnPostCtor',
  'addOnPreMain',
  'addOnExit',
  'STACK_SIZE',
  'STACK_ALIGN',
  'POINTER_SIZE',
  'ASSERTIONS',
  'ccall',
  'cwrap',
  'convertJsFunctionToWasm',
  'getEmptyTableSlot',
  'updateTableMap',
  'getFunctionAddress',
  'addFunction',
  'removeFunction',
  'stringToUTF8Array',
  'stringToUTF8',
  'lengthBytesUTF8',
  'intArrayFromString',
  'intArrayToString',
  'AsciiToString',
  'stringToAscii',
  'UTF16ToString',
  'stringToUTF16',
  'lengthBytesUTF16',
  'UTF32ToString',
  'stringToUTF32',
  'lengthBytesUTF32',
  'stringToNewUTF8',
  'stringToUTF8OnStack',
  'writeArrayToMemory',
  'registerKeyEventCallback',
  'maybeCStringToJsString',
  'findEventTarget',
  'getBoundingClientRect',
  'fillMouseEventData',
  'registerMouseEventCallback',
  'registerWheelEventCallback',
  'registerUiEventCallback',
  'registerFocusEventCallback',
  'fillDeviceOrientationEventData',
  'registerDeviceOrientationEventCallback',
  'fillDeviceMotionEventData',
  'registerDeviceMotionEventCallback',
  'screenOrientation',
  'fillOrientationChangeEventData',
  'registerOrientationChangeEventCallback',
  'fillFullscreenChangeEventData',
  'registerFullscreenChangeEventCallback',
  'JSEvents_requestFullscreen',
  'JSEvents_resizeCanvasForFullscreen',
  'registerRestoreOldStyle',
  'hideEverythingExceptGivenElement',
  'restoreHiddenElements',
  'setLetterbox',
  'softFullscreenResizeWebGLRenderTarget',
  'doRequestFullscreen',
  'fillPointerlockChangeEventData',
  'registerPointerlockChangeEventCallback',
  'registerPointerlockErrorEventCallback',
  'requestPointerLock',
  'fillVisibilityChangeEventData',
  'registerVisibilityChangeEventCallback',
  'registerTouchEventCallback',
  'fillGamepadEventData',
  'registerGamepadEventCallback',
  'registerBeforeUnloadEventCallback',
  'fillBatteryEventData',
  'registerBatteryEventCallback',
  'setCanvasElementSize',
  'getCanvasElementSize',
  'jsStackTrace',
  'getCallstack',
  'convertPCtoSourceLocation',
  'getEnvStrings',
  'checkWasiClock',
  'wasiRightsToMuslOFlags',
  'wasiOFlagsToMuslOFlags',
  'initRandomFill',
  'randomFill',
  'safeSetTimeout',
  'setImmediateWrapped',
  'safeRequestAnimationFrame',
  'clearImmediateWrapped',
  'registerPostMainLoop',
  'registerPreMainLoop',
  'getPromise',
  'makePromise',
  'idsToPromises',
  'makePromiseCallback',
  'findMatchingCatch',
  'incrementUncaughtExceptionCount',
  'decrementUncaughtExceptionCount',
  'Browser_asyncPrepareDataCounter',
  'isLeapYear',
  'ydayFromDate',
  'arraySum',
  'addDays',
  'getSocketFromFD',
  'getSocketAddress',
  'FS_createPreloadedFile',
  'FS_preloadFile',
  'FS_modeStringToFlags',
  'FS_getMode',
  'FS_fileDataToTypedArray',
  'FS_stdin_getChar',
  'FS_mkdirTree',
  '_setNetworkCallback',
  'heapObjectForWebGLType',
  'toTypedArrayIndex',
  'webgl_enable_ANGLE_instanced_arrays',
  'webgl_enable_OES_vertex_array_object',
  'webgl_enable_WEBGL_draw_buffers',
  'webgl_enable_WEBGL_multi_draw',
  'webgl_enable_EXT_polygon_offset_clamp',
  'webgl_enable_EXT_clip_control',
  'webgl_enable_WEBGL_polygon_mode',
  'emscriptenWebGLGet',
  'computeUnpackAlignedImageSize',
  'colorChannelsInGlTextureFormat',
  'emscriptenWebGLGetTexPixelData',
  'emscriptenWebGLGetUniform',
  'webglGetUniformLocation',
  'webglPrepareUniformLocationsBeforeFirstUse',
  'webglGetLeftBracePos',
  'emscriptenWebGLGetVertexAttrib',
  '__glGetActiveAttribOrUniform',
  'writeGLArray',
  'registerWebGlEventCallback',
  'runAndAbortIfError',
  'ALLOC_NORMAL',
  'ALLOC_STACK',
  'allocate',
  'writeStringToMemory',
  'writeAsciiToMemory',
  'allocateUTF8',
  'allocateUTF8OnStack',
  'demangle',
  'stackTrace',
  'getNativeTypeSize',
];
missingLibrarySymbols.forEach(missingLibrarySymbol)

  var unexportedSymbols = [
  'run',
  'out',
  'err',
  'callMain',
  'abort',
  'wasmExports',
  'writeStackCookie',
  'checkStackCookie',
  'INT53_MAX',
  'INT53_MIN',
  'bigintToI53Checked',
  'HEAP8',
  'HEAPU8',
  'HEAP16',
  'HEAPU16',
  'HEAPU32',
  'HEAPF64',
  'HEAP64',
  'HEAPU64',
  'stackSave',
  'stackRestore',
  'ptrToString',
  'getHeapMax',
  'growMemory',
  'ENV',
  'ERRNO_CODES',
  'DNS',
  'Protocols',
  'Sockets',
  'timers',
  'warnOnce',
  'readEmAsmArgsArray',
  'alignMemory',
  'wasmTable',
  'wasmMemory',
  'noExitRuntime',
  'addOnPreRun',
  'addOnPostRun',
  'freeTableIndexes',
  'functionsInTableMap',
  'setValue',
  'getValue',
  'PATH',
  'PATH_FS',
  'UTF8Decoder',
  'UTF8ArrayToString',
  'UTF8ToString',
  'UTF16Decoder',
  'JSEvents',
  'specialHTMLTargets',
  'findCanvasEventTarget',
  'currentFullscreenStrategy',
  'restoreOldWindowedStyle',
  'UNWIND_CACHE',
  'ExitStatus',
  'flush_NO_FILESYSTEM',
  'emSetImmediate',
  'emClearImmediate_deps',
  'emClearImmediate',
  'promiseMap',
  'uncaughtExceptionCount',
  'exceptionCaught',
  'ExceptionInfo',
  'Browser',
  'requestFullscreen',
  'requestFullScreen',
  'setCanvasSize',
  'getUserMedia',
  'createContext',
  'getPreloadedImageData__data',
  'wget',
  'MONTH_DAYS_REGULAR',
  'MONTH_DAYS_LEAP',
  'MONTH_DAYS_REGULAR_CUMULATIVE',
  'MONTH_DAYS_LEAP_CUMULATIVE',
  'SYSCALLS',
  'preloadPlugins',
  'FS_stdin_getChar_buffer',
  'FS_unlink',
  'FS_createPath',
  'FS_createDevice',
  'FS_readFile',
  'FS',
  'FS_root',
  'FS_mounts',
  'FS_devices',
  'FS_streams',
  'FS_nextInode',
  'FS_nameTable',
  'FS_currentPath',
  'FS_initialized',
  'FS_ignorePermissions',
  'FS_filesystems',
  'FS_syncFSRequests',
  'FS_lookupPath',
  'FS_getPath',
  'FS_hashName',
  'FS_hashAddNode',
  'FS_hashRemoveNode',
  'FS_lookupNode',
  'FS_createNode',
  'FS_destroyNode',
  'FS_isRoot',
  'FS_isMountpoint',
  'FS_isFile',
  'FS_isDir',
  'FS_isLink',
  'FS_isChrdev',
  'FS_isBlkdev',
  'FS_isFIFO',
  'FS_isSocket',
  'FS_flagsToPermissionString',
  'FS_nodePermissions',
  'FS_mayLookup',
  'FS_mayCreate',
  'FS_mayDelete',
  'FS_mayOpen',
  'FS_checkOpExists',
  'FS_nextfd',
  'FS_getStreamChecked',
  'FS_getStream',
  'FS_createStream',
  'FS_closeStream',
  'FS_dupStream',
  'FS_doSetAttr',
  'FS_chrdev_stream_ops',
  'FS_major',
  'FS_minor',
  'FS_makedev',
  'FS_registerDevice',
  'FS_getDevice',
  'FS_getMounts',
  'FS_syncfs',
  'FS_mount',
  'FS_unmount',
  'FS_lookup',
  'FS_mknod',
  'FS_statfs',
  'FS_statfsStream',
  'FS_statfsNode',
  'FS_create',
  'FS_mkdir',
  'FS_mkdev',
  'FS_symlink',
  'FS_rename',
  'FS_rmdir',
  'FS_readdir',
  'FS_readlink',
  'FS_stat',
  'FS_fstat',
  'FS_lstat',
  'FS_doChmod',
  'FS_chmod',
  'FS_lchmod',
  'FS_fchmod',
  'FS_doChown',
  'FS_chown',
  'FS_lchown',
  'FS_fchown',
  'FS_doTruncate',
  'FS_truncate',
  'FS_ftruncate',
  'FS_utime',
  'FS_open',
  'FS_close',
  'FS_isClosed',
  'FS_llseek',
  'FS_read',
  'FS_write',
  'FS_mmap',
  'FS_msync',
  'FS_ioctl',
  'FS_writeFile',
  'FS_cwd',
  'FS_chdir',
  'FS_createDefaultDirectories',
  'FS_createDefaultDevices',
  'FS_createSpecialDirectories',
  'FS_createStandardStreams',
  'FS_staticInit',
  'FS_init',
  'FS_quit',
  'FS_findObject',
  'FS_analyzePath',
  'FS_createFile',
  'FS_createDataFile',
  'FS_forceLoadFile',
  'FS_createLazyFile',
  'MEMFS',
  'TTY',
  'PIPEFS',
  'SOCKFS',
  'tempFixedLengthArray',
  'miniTempWebGLFloatBuffers',
  'miniTempWebGLIntBuffers',
  'GL',
  'AL',
  'GLUT',
  'EGL',
  'GLEW',
  'IDBStore',
  'SDL',
  'SDL_gfx',
  'print',
  'printErr',
  'jstoi_s',
];
unexportedSymbols.forEach(unexportedRuntimeSymbol);

  // End runtime exports
  // Begin JS library exports
  // End JS library exports

// end include: postlibrary.js

function checkIncomingModuleAPI() {
  ignoredModuleProp('fetchSettings');
  ignoredModuleProp('logReadFiles');
  ignoredModuleProp('loadSplitModule');
  ignoredModuleProp('onMalloc');
  ignoredModuleProp('onRealloc');
  ignoredModuleProp('onFree');
  ignoredModuleProp('onSbrkGrow');
}

// Imports from the Wasm binary.
var _convex_hull = Module['_convex_hull'] = makeInvalidEarlyAccess('_convex_hull');
var _malloc = Module['_malloc'] = makeInvalidEarlyAccess('_malloc');
var _free_buffer = Module['_free_buffer'] = makeInvalidEarlyAccess('_free_buffer');
var _free = Module['_free'] = makeInvalidEarlyAccess('_free');
var _fflush = makeInvalidEarlyAccess('_fflush');
var _strerror = makeInvalidEarlyAccess('_strerror');
var _emscripten_stack_get_end = makeInvalidEarlyAccess('_emscripten_stack_get_end');
var _emscripten_stack_get_base = makeInvalidEarlyAccess('_emscripten_stack_get_base');
var _emscripten_stack_init = makeInvalidEarlyAccess('_emscripten_stack_init');
var _emscripten_stack_get_free = makeInvalidEarlyAccess('_emscripten_stack_get_free');
var __emscripten_stack_restore = makeInvalidEarlyAccess('__emscripten_stack_restore');
var __emscripten_stack_alloc = makeInvalidEarlyAccess('__emscripten_stack_alloc');
var _emscripten_stack_get_current = makeInvalidEarlyAccess('_emscripten_stack_get_current');
var memory = makeInvalidEarlyAccess('memory');
var __indirect_function_table = makeInvalidEarlyAccess('__indirect_function_table');
var wasmMemory = makeInvalidEarlyAccess('wasmMemory');

function assignWasmExports(wasmExports) {
  assert(typeof wasmExports['convex_hull'] != 'undefined', 'missing Wasm export: convex_hull');
  assert(typeof wasmExports['malloc'] != 'undefined', 'missing Wasm export: malloc');
  assert(typeof wasmExports['free_buffer'] != 'undefined', 'missing Wasm export: free_buffer');
  assert(typeof wasmExports['free'] != 'undefined', 'missing Wasm export: free');
  assert(typeof wasmExports['fflush'] != 'undefined', 'missing Wasm export: fflush');
  assert(typeof wasmExports['strerror'] != 'undefined', 'missing Wasm export: strerror');
  assert(typeof wasmExports['emscripten_stack_get_end'] != 'undefined', 'missing Wasm export: emscripten_stack_get_end');
  assert(typeof wasmExports['emscripten_stack_get_base'] != 'undefined', 'missing Wasm export: emscripten_stack_get_base');
  assert(typeof wasmExports['emscripten_stack_init'] != 'undefined', 'missing Wasm export: emscripten_stack_init');
  assert(typeof wasmExports['emscripten_stack_get_free'] != 'undefined', 'missing Wasm export: emscripten_stack_get_free');
  assert(typeof wasmExports['_emscripten_stack_restore'] != 'undefined', 'missing Wasm export: _emscripten_stack_restore');
  assert(typeof wasmExports['_emscripten_stack_alloc'] != 'undefined', 'missing Wasm export: _emscripten_stack_alloc');
  assert(typeof wasmExports['emscripten_stack_get_current'] != 'undefined', 'missing Wasm export: emscripten_stack_get_current');
  assert(typeof wasmExports['memory'] != 'undefined', 'missing Wasm export: memory');
  assert(typeof wasmExports['__indirect_function_table'] != 'undefined', 'missing Wasm export: __indirect_function_table');
  _convex_hull = Module['_convex_hull'] = createExportWrapper('convex_hull', 3);
  _malloc = Module['_malloc'] = createExportWrapper('malloc', 1);
  _free_buffer = Module['_free_buffer'] = createExportWrapper('free_buffer', 1);
  _free = Module['_free'] = createExportWrapper('free', 1);
  _fflush = createExportWrapper('fflush', 1);
  _strerror = createExportWrapper('strerror', 1);
  _emscripten_stack_get_end = wasmExports['emscripten_stack_get_end'];
  _emscripten_stack_get_base = wasmExports['emscripten_stack_get_base'];
  _emscripten_stack_init = wasmExports['emscripten_stack_init'];
  _emscripten_stack_get_free = wasmExports['emscripten_stack_get_free'];
  __emscripten_stack_restore = wasmExports['_emscripten_stack_restore'];
  __emscripten_stack_alloc = wasmExports['_emscripten_stack_alloc'];
  _emscripten_stack_get_current = wasmExports['emscripten_stack_get_current'];
  memory = wasmMemory = wasmExports['memory'];
  __indirect_function_table = wasmExports['__indirect_function_table'];
}

var wasmImports = {
  /** @export */
  __cxa_throw: ___cxa_throw,
  /** @export */
  _abort_js: __abort_js,
  /** @export */
  emscripten_resize_heap: _emscripten_resize_heap,
  /** @export */
  fd_close: _fd_close,
  /** @export */
  fd_seek: _fd_seek,
  /** @export */
  fd_write: _fd_write
};


// include: postamble.js
// === Auto-generated postamble setup entry stuff ===

var calledRun;

function stackCheckInit() {
  // This is normally called automatically during __wasm_call_ctors but need to
  // get these values before even running any of the ctors so we call it redundantly
  // here.
  _emscripten_stack_init();
  // TODO(sbc): Move writeStackCookie to native to to avoid this.
  writeStackCookie();
}

function run() {

  stackCheckInit();

  preRun();

  function doRun() {
    // run may have just been called through dependencies being fulfilled just in this very frame,
    // or while the async setStatus time below was happening
    assert(!calledRun);
    calledRun = true;
    Module['calledRun'] = true;

    if (ABORT) return;

    initRuntime();

    readyPromiseResolve?.(Module);
    Module['onRuntimeInitialized']?.();
    consumedModuleProp('onRuntimeInitialized');

    assert(!Module['_main'], 'compiled without a main, but one is present. if you added it from JS, use Module["onRuntimeInitialized"]');

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(() => {
      setTimeout(() => Module['setStatus'](''), 1);
      doRun();
    }, 1);
  } else
  {
    doRun();
  }
  checkStackCookie();
}

function checkUnflushedContent() {
  // Compiler settings do not allow exiting the runtime, so flushing
  // the streams is not possible. but in ASSERTIONS mode we check
  // if there was something to flush, and if so tell the user they
  // should request that the runtime be exitable.
  // Normally we would not even include flush() at all, but in ASSERTIONS
  // builds we do so just for this check, and here we see if there is any
  // content to flush, that is, we check if there would have been
  // something a non-ASSERTIONS build would have not seen.
  // How we flush the streams depends on whether we are in SYSCALLS_REQUIRE_FILESYSTEM=0
  // mode (which has its own special function for this; otherwise, all
  // the code is inside libc)
  var oldOut = out;
  var oldErr = err;
  var has = false;
  out = err = (x) => {
    has = true;
  }
  try { // it doesn't matter if it fails
    flush_NO_FILESYSTEM();
  } catch(e) {}
  out = oldOut;
  err = oldErr;
  if (has) {
    warnOnce('stdio streams had content in them that was not flushed. you should set EXIT_RUNTIME to 1 (see the Emscripten FAQ), or make sure to emit a newline when you printf etc.');
    warnOnce('(this may also be due to not including full filesystem support - try building with -sFORCE_FILESYSTEM)');
  }
}

var wasmExports;

// In modularize mode the generated code is within a factory function so we
// can use await here (since it's not top-level-await).
wasmExports = await (createWasm());

run();

// end include: postamble.js

// include: postamble_modularize.js
// In MODULARIZE mode we wrap the generated code in a factory function
// and return either the Module itself, or a promise of the module.
//
// We assign to the `moduleRtn` global here and configure closure to see
// this as an extern so it won't get minified.

if (runtimeInitialized)  {
  moduleRtn = Module;
} else {
  // Set up the promise that indicates the Module is initialized
  moduleRtn = new Promise((resolve, reject) => {
    readyPromiseResolve = resolve;
    readyPromiseReject = reject;
  });
}

// Assertion for attempting to access module properties on the incoming
// moduleArg.  In the past we used this object as the prototype of the module
// and assigned properties to it, but now we return a distinct object.  This
// keeps the instance private until it is ready (i.e the promise has been
// resolved).
for (const prop of Object.keys(Module)) {
  if (!(prop in moduleArg)) {
    Object.defineProperty(moduleArg, prop, {
      configurable: true,
      get() {
        abort(`Access to module property ('${prop}') is no longer possible via the module constructor argument; Instead, use the result of the module constructor.`)
      }
    });
  }
}
// end include: postamble_modularize.js



  return moduleRtn;
}

// Export using a UMD style export, or ES6 exports if selected
export default Module;

