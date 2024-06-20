import fs from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron/simple'
import pkg from './package.json'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true })

  const isServe = command === 'serve'
  const isBuild = command === 'build'
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG

  return {
    plugins: [
      vue(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: 'electron/main/index.ts',
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */'[startup] Electron App')
            } else {
              startup()
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                // Some third-party Node.js libraries may not be built correctly by Vite, especially `C/C++` addons, 
                // we can use `external` to exclude them to ensure they work correctly.
                // Others need to put them in `dependencies` to ensure they are collected into `app.asar` after the app is built.
                // Of course, this is not absolute, just this way is relatively simple. :)
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
                plugins: [
                  {
                    // 该插件会将electron/worker_threads文件夹下的ts文件单独打包为对应的js文件，以供childprocess,utilityProcess等使用
                    name: 'build-worker-threads',
                    async buildStart() {
                      const files = await fs.promises.readdir('electron/worker_threads');
                      files.filter(file => path.extname(file).toLowerCase() === '.ts')
                        .forEach(file => {
                          this.emitFile({
                            type: 'chunk',
                            id: path.join('electron/worker_threads', file)
                          })
                        })
                    },
                    generateBundle(options, bundle) {
                      for (const [fileName, chunkInfo] of Object.entries(bundle)) {
                        if (chunkInfo.type === 'chunk' && chunkInfo.isEntry && chunkInfo.facadeModuleId.includes('electron\\worker_threads')) {
                          // 修改文件名和路径 不要文件后面带哈希值
                          //将在dist-electron/main/worker_threads文件夹下 生成js文件
                          bundle[fileName].fileName = 'worker_threads/' + chunkInfo.name + '.js';
                        }
                      }
                    }
                  }
                ]
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined, // #332
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {}),
              },
            },
          },
        },
        // Ployfill the Electron and Node.js API for Renderer process.
        // If you want use Node.js in Renderer process, the `nodeIntegration` needs to be enabled in the Main process.
        // See 👉 https://github.com/electron-vite/vite-plugin-electron-renderer
        renderer: {},
      }),
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL)
      return {
        host: url.hostname,
        port: +url.port,
      }
    })(),
    clearScreen: false,
  }
})
