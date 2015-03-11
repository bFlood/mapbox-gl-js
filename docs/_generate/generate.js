// GL style reference generator

var fs = require('fs'),
    path = require('path'),
    marked = require('marked'),
    _ = require('underscore'),
    documentation = require('documentation'),
    normalize = require('documentation/streams/normalize'),
    flatten = require('documentation/streams/flatten'),
    through = require('through'),
    Handlebars = require('handlebars');

var renderer = new marked.Renderer(),
    heading = {},
    classes = {},
    toc = '',
    api = '';

function getClassDescriptor(name) {
    var descriptor = classes[name]

    if (!descriptor) {
        descriptor = classes[name] = {
            name: name,
            staticMethods: [],
            instanceMethods: []
        };
    }

    return descriptor;
}

function document(data) {
    if (data.kind === 'class' || data.kind === 'mixin') {
        var descriptor = getClassDescriptor(data.name);
        descriptor.description = data.classdesc;
        descriptor.constructor = data;
    }

    else if (data.memberof) {
        var descriptor = getClassDescriptor(data.memberof);
        if (data.scope === 'instance') {
            descriptor.instanceMethods.push(data);
        } else if (data.scope === 'static') {
            descriptor.staticMethods.push(data);
        }
    }
}

documentation(require('../../package.json').main)
    .pipe(normalize())
    .pipe(flatten())
    .pipe(through(document))
    .on('error', function(err) { throw err; })
    .on('end', function() {
        Handlebars.registerHelper('join', function(array, sep, options) {
            return array ? array.map(function(item) { return options.fn(item); }).join(sep) : '';
        });

        Handlebars.registerPartial('methods', fs.readFileSync(path.join(__dirname, './methods.html.hbs'), 'utf8'));
        Handlebars.registerPartial('signature', fs.readFileSync(path.join(__dirname, './signature.html.hbs'), 'utf8'));

        var template = Handlebars.compile(fs.readFileSync(path.join(__dirname, './index.html.hbs'), 'utf8'));

        fs.writeFileSync(
            path.join(__dirname, '../_posts/3400-01-01-api.html'),
            template({classes: _.values(classes)}));
    });

//renderer.code = function (code, lang) {
//    return '{% highlight ' + lang + ' %}' + code + '\n{% endhighlight %}\n';
//}
