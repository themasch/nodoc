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
            var name = '#' + data.methods[m].name.toLowerCase();
            index[name] = data.methods[m]
        }
        for(var m=0;m < data.vars.length;m++) {
            var name = '#' + data.vars[m].name.toLowerCase();
            index[name] = data.vars[m]
        }
        for(var m=0;m < data.globals.length;m++) {
            var mod = data.globals[m]
            if(mod.methods) {
                for(var i=0;i < data.globals.length;i++) {
                    var name = mod.name.toLowerCase() + '#' + mod.methods[i].name.toLowerCase();
                    index[name] = mod.methods[i]
                }
            }
        }
        for(var i=0;i < data.modules.length;i++) {
            var mod = data.modules[i];
            if(mod.methods) {
                for(var m=0;m < mod.methods.length;m++) {
                    var name = mod.name + '#' + mod.methods[m].name.toLowerCase();
                    index[name] = mod.methods[m]
                }
            }
            if(mod.vars) {
                for(var m=0;m < mod.vars.length;m++) {
                    var name = mod.name + '#' + mod.vars[m].name.toLowerCase();
                    index[name] = mod.vars[m]
                }
            }
            if(mod.properties) {
                for(var m=0;m < mod.properties.length;m++) {
                    var name = mod.name + '#' + mod.properties[m].name.toLowerCase();
                    index[name] = mod.properties[m]
                }
            }
        }
        console.timeEnd('index')
        if(window.location.hash.match(/#!(.+)/)) {
            var idx = window.location.hash.replace(/^#!/, '').replace('.', '#')
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


    // do the search
    function doSearch(query) {
        var result = []
        var parts = query.split(/\s|#|\./)
        var pool  = index;
        for(var i=0;i<parts.length;i++) {
            var newPool = {}
            var qry = parts[i].toLowerCase()
            var negate = false

            if(qry.trim() === '')
                continue

            if(qry.match(/^-[\S]+/) || qry.match(/^not:[\S]+/)) {
                qry = qry.replace(/^(-|not:)/, '')
                negate = true
                newPool = pool
            }

            for(var key in pool) {
                var match = key.match(new RegExp('[^#]*#.*(' + qry + ').*'))
                if(match && match[1]) {
                    if(!negate)
                        newPool[key] = pool[key]
                    else
                        delete newPool[key]

                    continue;
                }
                match = key.match(new RegExp('.*(' + qry + ')[^#]*#.*'))
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
            if(!list[mod]) {
                list[mod] = $('<ul>').appendTo($('<li>' + mod + '</li>').appendTo(ul));
            }
            list[mod].append(
                '<li class="method" data-idx="' + result[i] +'">' +
                    '<a href="#!' + result[i].replace('#', '.') + '">' +
                        '#' + result[i].split('#')[1] +
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

    // clicked on a methods, show docs
    $('.results').on('click', 'li.method', function(evt) {
        display(this.dataset['idx'])
    })

    function display(idx) {
        var method = index[idx]
        $('.doc')
            .html('')
            .append('<h1>' + method.textRaw + '</h1>')
            .append('<section>' + method.desc + '</section>')
    }
})()
