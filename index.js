var RawSource = require('webpack-sources/lib/RawSource');
var evaluate = require('eval');
var path = require('path');

function StaticSiteGeneratorWebpackPlugin(entry, locals, scope) {
  this.entry = entry;
  this.locals = locals || {};
  this.scope = scope || {};
}

StaticSiteGeneratorWebpackPlugin.prototype.apply = function(compiler) {
  compiler.plugin('this-compilation', (compilation) => {
    compilation.plugin('optimize-assets', (_, done) => {
      const webpackStats = compilation.getStats();
      const webpackStatsJson = webpackStats.toJson();

      try {
        const asset = findAsset(this.entry, compilation, webpackStatsJson);
        const assets = getAssetsFromCompilation(compilation, webpackStatsJson);

        if (asset === null) {
          throw new Error('Source file not found: "' + this.renderSrc + '"');
        }

        const entry = evaluate(asset.source(), /* filename: */ this.entry, /* scope: */ this.scope, /* includeGlobals: */ true);

        if (entry.hasOwnProperty('default')) {
          entry = entry['default'];
        }

        if (typeof entry.render !== 'function') {
          throw new Error('Export from "' + this.entry + '" must be a function that returns an HTML string');
        }

        const pageKeys = Object.keys(entry.pages);
        Promise.all(
          pageKeys.map(inputPath => {
            let Page = entry.pages[inputPath];
            const transform = (entry.transform) || (a => a);

            if (Page.hasOwnProperty('default')) {
              Page = Page['default'];
            }

            const locals = Object.assign({
              paths: pageKeys,
              path: inputPath,
              outputPaths: pageKeys.map(transform),
              outputPath: transform(inputPath),
              assets: assets,
              webpackStats: webpackStats
            }, this.locals);

            return new Promise((resolve, reject) => {
              entry.render(Page, locals, (err, res) => {
                if (err) reject(err);
                resolve(res);
              });
            })
            .then(output => {
              compilation.assets[locals.outputPath] = new RawSource(output);
            })
            .catch(err => {
              compilation.errors.push(err.stack);
            });
          })
        ).then(() => done());
      } catch (err) {
        compilation.errors.push(err.stack);
        done();
      }
    });
  });
};

function findAsset(src, compilation, webpackStatsJson) {
  var asset = compilation.assets[src];

  if (asset) {
    return asset;
  }

  var chunkValue = webpackStatsJson.assetsByChunkName[src];

  if (!chunkValue) {
    return null;
  }
  // Webpack outputs an array for each chunk when using sourcemaps
  if (chunkValue instanceof Array) {
    // Is the main bundle always the first element?
    chunkValue = chunkValue[0];
  }
  return compilation.assets[chunkValue];
};

// Shamelessly stolen from html-webpack-plugin - Thanks @ampedandwired :)
function getAssetsFromCompilation(compilation, webpackStatsJson) {
  var assets = {};
  for (var chunk in webpackStatsJson.assetsByChunkName) {
    var chunkValue = webpackStatsJson.assetsByChunkName[chunk];

    // Webpack outputs an array for each chunk when using sourcemaps
    if (chunkValue instanceof Array) {
      // Is the main bundle always the first element?
      chunkValue = chunkValue[0];
    }

    if (compilation.options.output.publicPath) {
      chunkValue = compilation.options.output.publicPath + chunkValue;
    }
    assets[chunk] = chunkValue;
  }

  return assets;
};

module.exports = StaticSiteGeneratorWebpackPlugin;
