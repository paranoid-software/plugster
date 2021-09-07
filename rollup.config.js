// rollup.config.js
import { terser } from 'rollup-plugin-terser';
import excludeDependenciesFromBundle from "rollup-plugin-exclude-dependencies-from-bundle";

export default {
  input: 'src/plugster.js',
  plugins: [excludeDependenciesFromBundle({peerDependencies: true, dependencies: true})],
  output: [
    {
      file: 'dist/plugster.js',
      format: 'es'
    },
    {
      file: 'dist/plugster.min.js',
      format: 'es',
      name: 'version',
      plugins: [terser()],
      sourcemap: true
    }
  ],
};