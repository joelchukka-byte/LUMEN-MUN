import coreWebVitals from 'eslint-config-next/core-web-vitals';
import typescript from 'eslint-config-next/typescript';

const eslintConfig = [
  {
    // Imported reference material, kept verbatim for comparison. It is not part
    // of the build and must not be held to this project's rules.
    ignores: [
      'design/**',
      'reference/**',
      '.next/**',
      '.pglite/**',
      'drizzle/**',
      'uploads/**',
    ],
  },
  ...coreWebVitals,
  ...typescript,
];

export default eslintConfig;
