/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  forbidden: [
    // ===========================================
    // NO CIRCULAR DEPENDENCIES
    // ===========================================
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies make code hard to reason about',
      from: {},
      to: {
        circular: true,
      },
    },

    // ===========================================
    // LAYER ISOLATION
    // ===========================================

    // Tool handlers should not import from each other
    {
      name: 'tools-no-cross-import',
      severity: 'error',
      comment: 'Tool handlers should be independent',
      from: {
        path: '^src/tools/[^/]+\\.ts$',
      },
      to: {
        path: '^src/tools/[^/]+\\.ts$',
        pathNot: '$from',
      },
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    tsPreCompilationDeps: true,
    tsConfig: {
      fileName: 'tsconfig.json',
    },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
  },
};
