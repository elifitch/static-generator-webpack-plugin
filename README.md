# static generator webpack plugin

---

This is a fork of [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin) that allows for dynamic paths at runtime using webpack contexts.

---

Minimal, unopinionated static site generator powered by webpack.

This plugin works particularly well with universal libraries like [React](https://github.com/facebook/react) and [React Router](https://github.com/rackt/react-router) since it allows you to prerender your routes at build time, rather than requiring a Node server in production.

## Install

```bash
$ npm install static-generator-webpack-plugin --save-dev
```

## Usage

Ensure you have webpack installed, e.g. `npm install -g webpack`

### webpack.config.js

```js
const StaticSiteGeneratorPlugin = require('static-site-generator-webpack-plugin');

module.exports = {
  entry: {
    'main': './index.js'
  },

  output: {
    filename: 'index.js',
    path: 'dist',
    /* IMPORTANT!
     * You must compile to UMD or CommonJS
     * so it can be required in a Node context: */
    libraryTarget: 'umd'
  },

  plugins: [
    new StaticSiteGeneratorPlugin('main', {
      // Properties here are passed to
      // the exported render function
      greet: 'Hello'
    })
  ]

};
```

### index.js

```jsx
// builds a path:module object
// { './source/page.jsx': require('./source/page.jsx') }

function requireAll(context) {
  return context.keys().reduce((modules, key) => {
    modules[key] = context(key);
    return modules;
  }, {});
}

module.exports = {
  render: (Page, locals, done) => {
    done(
      null,
      '<!DOCTYPE html>' +
      Dom.renderToStaticMarkup(<Page locals={locals} />)
    )
  },
  pages: Object.assign(
    {},
    requireAll(require.context('./pages/', true, /\.jsx$/))
  ),
  transform: inputPath => {
    return inputPath
      .replace('./', '')
      .replace(/\.jsx/, '.html');
  }
}
```

### Default locals

```jsx
// The list of paths being rendered:
locals.paths

// The input filepath currently being rendered:
locals.path;

// The output filepath currently being rendered:
locals.outputPath;

// An object containing all assets:
locals.assets;

// Advanced: Webpack's stats object:
locals.webpackStats;
```

Any additional locals provided in your config are also available.

## Scope

If required, you can provide an object that will exist in the global scope when executing your render function. This is particularly useful if certain libraries or tooling you're using assumes a browser environment.

For example, when using Webpack's `require.ensure`, which assumes that `window` exists:

```js
const scope = { window: {} };

module.exports = {
  ...,
  plugins: [
    new StaticSiteGeneratorPlugin('main', locals, scope)
  ]
}
```

## Compression support

Generated files can be compressed with [compression-webpack-plugin](https://github.com/webpack/compression-webpack-plugin), but first ensure that this plugin appears before compression-webpack-plugin in your plugins array:

```js
const StaticGeneratorPlugin = require('static-generator-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

module.exports = {
  ...,
  plugins: [
    new StaticGeneratorPlugin(...),
    new CompressionPlugin(...)
  ]
};
```


## Related projects

- [react-router-to-array](https://github.com/alansouzati/react-router-to-array) - useful for avoiding hardcoded lists of routes to render
- [gatsby](https://github.com/gatsbyjs/gatsby) - opinionated static site generator built on top of this plugin's parent
- [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin) - the orginial static site generator

## License

[MIT License](http://markdalgleish.mit-license.org)
