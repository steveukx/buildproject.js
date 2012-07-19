
var HtmlParser = require('htmlparser');
var ReadDir = require('readdir');

function Snippet(snippetContent) {
   new HtmlParser.Parser(new HtmlParser.DefaultHandler(function(err, dom) {
      console.log(require('util').inspect(dom));
   })).parseComplete(snippetContent);
}

module.exports = function(sourcePath, targetPath, taskRunner, options) {
   if(options.processSnippets) {
      [].concat(options.configuration.snippets).forEach(function(snippet) {
         console.log('  [SNIPPET]');
         ReadDir.readSync(sourcePath, snippet.include, ReadDir.ABSOLUTE_PATHS).forEach(function(path) {
            console.log('  [SNIPPET][' + path + ']');
            Snippet(require('fs').readFileSync(path, 'utf-8'));
         });
      });
   }
};
