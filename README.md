# static generator webpack plugin

---

This is a fork of [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin) that allows for dynamic paths at runtime using webpack contexts.

---

Minimal, unopinionated static site generator powered by webpack.


## Install

```bash
$ npm install static-generator-webpack-plugin --save-dev
```


## Usage

Ensure you have webpack installed, e.g. `npm install -g webpack`


### webpack.config.js

```js
const StaticGeneratorPlugin = require('static-generator-webpack-plugin');

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
    new StaticGeneratorPlugin('main', {
      // Properties here are passed to
      // the exported render function
      greet: 'Hello'
    })
  ]

};
```


### index.js

```jsx
// creates an object with filepaths as keys
// and modules as values
function requireAll(context) {
  return context.keys().reduce((modules, key) => {
    modules[key] = context(key);
    return modules;
  }, {});
}

module.exports = {
  // expects a render function that takes a module
  // and returns a string
  render: (Page, locals, done) => {
    done(
      null,
      '<!DOCTYPE html>' +
      Dom.renderToStaticMarkup(<Page locals={locals} />)
    )
  },
  // expects an object with input filepaths for keys
  // and module definitions as values
  pages: Object.assign(
    {},
    requireAll(require.context('./pages/', true, /\.jsx$/))
  ),
  // expects a function that defines output path
  // based on input module filepath
  transform: inputPath => {
    return inputPath
      .replace('./', '')
      .replace(/\.jsx/, '.html');
  }
}
```


### Default locals

```jsx
// The list of input paths being rendered:
locals.paths

// The input filepath currently being rendered:
locals.path;

// the list of output paths being rendered
locals.outputPaths;

// The output filepath currently being rendered:
locals.outputPath;

// a helper string for resolving absolute paths 
// to root.  eg. `../..` or `.`
locals.baseHref;

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
    new StaticGeneratorPlugin('main', locals, scope)
  ]
}
```


## Related projects

- [react-router-to-array](https://github.com/alansouzati/react-router-to-array) - useful for avoiding hardcoded lists of routes to render
- [gatsby](https://github.com/gatsbyjs/gatsby) - opinionated static site generator built on top of this plugin's parent
- [static-site-generator-webpack-plugin](https://github.com/markdalgleish/static-site-generator-webpack-plugin) - the orginial static site generator

## License

[MIT License](http://markdalgleish.mit-license.org)
