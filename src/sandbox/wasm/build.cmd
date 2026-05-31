@echo off
REM Compile hull.cpp -> geometry.js (ES module with embedded wasm).
REM Requires Emscripten. Run after editing hull.cpp; commit the generated geometry.js.
REM
REM Flags:
REM   MODULARIZE + EXPORT_ES6  -> default export is a factory: createModule() -> Promise<Module>
REM   ENVIRONMENT=web,worker   -> usable from a Web Worker (where we run it)
REM   SINGLE_FILE              -> wasm embedded as base64 in the .js (no separate .wasm to locate;
REM                               robust under the GitHub Pages base path)
REM   ALLOW_MEMORY_GROWTH      -> heap can grow; marshalling.ts must re-fetch HEAP* views
REM
REM NOTE: -O0 (not -O2) on purpose. -O2 runs binaryen's wasm-opt.exe, which this
REM machine's Windows Application Control / Smart App Control blocks (WinError 4551).
REM -O0 skips wasm-opt; for a hull this size the optimizer buys nothing meaningful.
REM On a machine without that policy, bump to -O2 for a smaller/faster module.
setlocal
call "%USERPROFILE%\emsdk\emsdk_env.bat" >nul
pushd "%~dp0"
call emcc hull.cpp -O0 --no-entry -o geometry.js ^
  -sMODULARIZE=1 -sEXPORT_ES6=1 -sENVIRONMENT=web,worker -sSINGLE_FILE=1 ^
  -sALLOW_MEMORY_GROWTH=1 ^
  -sEXPORTED_FUNCTIONS=_convex_hull,_free_buffer,_malloc,_free ^
  -sEXPORTED_RUNTIME_METHODS=HEAPF32,HEAP32
set ERR=%ERRORLEVEL%
popd
endlocal & exit /b %ERR%
