(function(){
    // some "global" stuff
    var url   = 'http://nodejs.org/docs/latest/api/all.json';
    var index = {};
    var docs  = null;

    // load latest docs
    console.time('loading')
    $.getJSON(url, function(data) {
        docs = data;
        console.timeEnd('loading')
        console.time('index')
        // generate index for fast searching
        for(var m=0;m < data.methods.length;m++) {
            var name = '#' + data.methods[m].name
            index[name] = data.methods[m]
        }
        for(var m=0;m < data.vars.length;m++) {
            var name = '#' + data.vars[m].name
            index[name] = data.vars[m]
        }
        for(var m=0;m < data.globals.length;m++) {
            var mod = data.globals[m]
            indexModule(index, mod)
        }
        for(var i=0;i < data.modules.length;i++) {
            var mod = data.modules[i];
            indexModule(index, mod)
            if(!mod.classes) {
                continue;
            }
            for(var c=0;c<mod.classes.length;c++) {
                var modc = mod.classes[c];
                indexModule(index, modc)

            }

        }
        console.timeEnd('index')
        if(window.location.hash.match(/#!(.+)/)) {
            var idx = window.location.hash.replace(/^#!/, '')
            console.log(idx)
            display(idx)
        }
        if(localStorage.hasOwnProperty('nodoc_lastQuery')) {
            var qry = localStorage.getItem('nodoc_lastQuery')
            $('#search')[0].value = qry
            doSearch(qry)
        }
        $('.loading').hide().remove()
    })

function indexModule(index, mod)
{
    var modname = mod.name
    index[modname + '#_idx_'] = mod
    if(mod.methods) {
        for(var m=0;m < mod.methods.length;m++) {
            mod.methods[m].modname = modname
            var name =  modname + '#' + mod.methods[m].name
            index[name] = mod.methods[m]
        }
    }
    if(mod.vars) {
        for(var m=0;m < mod.vars.length;m++) {
            var name = modname + '#v:' + mod.vars[m].name
            index[name] = mod.vars[m]
        }
    }
    if(mod.properties) {
        for(var m=0;m < mod.properties.length;m++) {
            var name = modname + '#p:' + mod.properties[m].name
            index[name] = mod.properties[m]
        }
    }
    if(mod.events) {
        for(var m=0;m < mod.events.length;m++) {
            var name = modname + '#evt:' + mod.events[m].name
            index[name] = mod.events[m]
        }
    }
}


    // do the search
    function doSearch(query) {
        var result = []
        var parts = query.split(/\s|#|\./)
        var pool  = index;
        for(var i=0;i<parts.length;i++) {
            var newPool = {}
            var qry = parts[i]
            var negate = false

            if(qry.trim() === '')
                continue
            qry = qry.replace(/^event:/, 'evt:')
            if(qry.match(/^-[\S]+/i) || qry.match(/^not:[\S]+/i)) {
                qry = qry.replace(/^(-|not:)/, '')
                negate = true
                newPool = pool
            }

            for(var key in pool) {
                var match = key.match(new RegExp('[^#]*#.*(' + qry + ').*', 'i'))
                if(match && match[1]) {
                    if(!negate)
                        newPool[key] = pool[key]
                    else
                        delete newPool[key]

                    continue;
                }
                match = key.match(new RegExp('.*(' + qry + ')[^#]*#.*', 'i'))
                if(match && match[1]) {
                    if(!negate)
                        newPool[key] = pool[key]
                    else
                        delete newPool[key]
                }
            }
            pool = newPool
        }
        result = Object.keys(pool)
        // render results as a list (this is nasty)
        var ul = $('<ul>').appendTo($('.results').html(''));
        var list = {}
        for(var i=0;i<result.length;i++) {
            var mod = result[i].split('#')[0]
            var sub = result[i].split('#')[1]

            if(sub === '_idx_')
                continue;

            var subName = sub.replace('evt:', 'Event: ')
                             .replace('p:', 'Prop.: ')
                             .replace('v:', 'Var: ')

            if(!list[mod]) {
                list[mod] = $('<ul>').appendTo(
                    $('<li>' +
                        '<a href="#!' + mod + '#_idx_">' + mod + '</a>' +
                      '</li>')
                        .appendTo(ul)
                );
            }
            list[mod].append(
                '<li class="method" data-idx="' + result[i] +'">' +
                    '<a href="#!' + result[i] + '">' +
                        subName +
                    '</a>' +
                '</li>'
            )
        }
    }

    $('#search').on('keyup', function() {
        var query = this.value
        localStorage.setItem('nodoc_lastQuery', query)
        doSearch(query)
    })

    window.addEventListener('hashchange', function() {
        display(window.location.hash.replace(/^#!/, ''))
    }, false)

    function display(idx) {
        if(!index[idx]) {
            return;
        }
        var method = index[idx]

        var header = method.textRaw
        if(method.type === 'method' && method.signatures) {
            header = idx.replace(/#.*$/, '') + '.' +
                        method.name + '('


            header += method.signatures[0].params.map(function(e) {
                var name = e.name
                if(e.desc) {
                    name = '<abbr title="' + e.type + "\n" + e.desc + '">' + name + '</abbr>';
                }
                if(e.optional) {
                    name = '[' + name + ']'
                }
                return name
            }).join(', ') + ')'

            if(method.signatures[0].return) {
                var type = method.signatures[0].return.type
                if(method.signatures[0].return.desc) {
                    type = '<abbr title="' + method.signatures[0].return.desc + '">' + type + '</abbr>'
                }
                header += '<br /> <i class="icon-caret-right"></i> ' + type
            }
        }
        $('.doc')
            .html('')
            .append('<h1>' + header + '</h1>')
            .append('<section>' + method.desc + '</section>')
    }
})()
