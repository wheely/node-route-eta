/**
 * Index file for module
 */

var fs = require('fs')
    , path = require('path')

var SERVICES_PATH = 'services';

var fullpath = path.join(__dirname, SERVICES_PATH);
fs.readdirSync(fullpath).forEach(function (filename) {
    if (filename[0] === '.') return;  // skip hidden files
    if (path.extname(filename) === '.js') {  // require only js files
        var name = path.basename(filename, '.js')
            , filepath = path.join(fullpath, filename);
        exports[name] = require(filepath);
    }
});
