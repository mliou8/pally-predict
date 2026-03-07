// EXPLANATION: By default Metro (React Native's bundler) only watches the
// current app folder. In a monorepo, we need it to also watch /packages/shared
// so changes there hot-reload into the app.
const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '../..')

const config = getDefaultConfig(projectRoot)

// Watch all packages in the monorepo
config.watchFolders = [workspaceRoot]

// Resolve modules from the app first, then the workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
