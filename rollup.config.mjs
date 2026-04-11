import { builtinModules } from 'node:module';

export default {
    input: 'dist/esm/index.js',
    external: [
        ...builtinModules,
        ...builtinModules.map(name => 'node:' + name),
        'axios',
        'm3u8stream'
    ],
    treeshake: false,
    output: {
        dir: 'dist/cjs',
        format: 'cjs',
        exports: 'named',
        sourcemap: true,
        preserveModules: true,
        preserveModulesRoot: 'dist/esm',
        entryFileNames: '[name].cjs',
        chunkFileNames: '[name].cjs'
    }
}