import { builtinModules } from 'node:module';

function force() {
    return {
        name: 'force-module-exports',
        renderChunk(code, chunk, outputOptions) {
            if (outputOptions.format !== "cjs")
                return null;

            const matches = [...code.matchAll(/^\s*exports\.([A-Za-z_$][\w$]*)\s*=\s*([^;]+);\s*$/gm)];

            if (!matches.length)
                return null;

            let defaultValue = null;
            const named = [];

            for (const match of matches) {
                const name = match[1];
                const value = match[2].trim();

                if (name === 'default') {
                    defaultValue = value;
                    continue;
                }

                named.push(`module.exports.${name} = ${value};`);
            }

            const next = code
                .replace(/^\s*Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\{[\s\S]*?\}\);\s*$/gm, '')
                .replace(/^\s*exports\.([A-Za-z_$][\w$]*)\s*=\s*([^;]+);\s*$/gm, '')
                .trimEnd() + `\n${defaultValue ? `module.exports = ${defaultValue};` : ``}\n${named.join("\n")}`;

            return {
                code: next,
                map: null
            };
        }
    }
}

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
    },
    plugins: [
        force()
    ]
}