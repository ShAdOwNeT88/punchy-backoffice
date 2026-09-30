// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

/** Generated clients (orval) are never linted: see docs/DECISIONS.md. */
const GENERATED = ['src/app/**/api/endpoints/**', 'src/app/**/api/model/**'];

/**
 * Features and the domain group each belongs to. A feature may import `@shared/*`, `@core/*`
 * and its own domain's `data-access`; never another feature, sibling or not.
 */
const FEATURES = [
  { path: 'login' },
  { path: 'account' },
  { path: 'admin/overview', domain: 'admin' },
  { path: 'admin/businesses', domain: 'admin' },
  { path: 'admin/managers', domain: 'admin' },
  { path: 'manager/dashboard', domain: 'manager' },
  { path: 'manager/business-profile', domain: 'manager' },
  { path: 'manager/templates', domain: 'manager' },
  { path: 'manager/customers', domain: 'manager' },
];

const noMocks = { group: ['@mocks/*', '**/mocks/**'], message: 'Only app.config.ts wires the mock backend.' };

const featureBoundaries = FEATURES.map(({ path, domain }) => ({
  files: [`src/app/features/${path}/**/*.ts`],
  ignores: GENERATED,
  rules: {
    'no-restricted-imports': [
      'error',
      {
        patterns: [
          {
            regex: `^@features/(?!(${[path, ...(domain ? [`${domain}/data-access`] : [])].join('|')})/)`,
            message: 'Features never import each other; promote shared code instead.',
          },
          { group: ['../../../*', '../../../../*'], message: 'Use the @core, @shared or @features aliases.' },
          noMocks,
        ],
      },
    ],
  },
}));

module.exports = defineConfig([
  { ignores: ['dist/**', '.angular/**', 'coverage/**', ...GENERATED] },
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'app', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        { type: 'element', prefix: 'app', style: 'kebab-case' },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['src/app/core/**/*.ts'],
    ignores: GENERATED,
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@features/*', '@shared/*'], message: 'core/ imports only core/.' },
            noMocks,
          ],
        },
      ],
    },
  },
  {
    files: ['src/app/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@features/*'], message: 'shared/ never depends on a feature.' }, noMocks] },
      ],
    },
  },
  ...featureBoundaries,
  {
    files: ['src/app/features/*/data-access/**/*.ts'],
    ignores: GENERATED,
    rules: {
      'no-restricted-imports': [
        'error',
        { patterns: [{ group: ['@features/**'], message: 'A domain data-access unit imports only shared/ and core/.' }, noMocks] },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {},
  },
]);
