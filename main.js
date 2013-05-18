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
            index[name] = ['g', m].join('.')
        }
        for(var i=0;i < data.modules.length;i++) {
            var mod = data.modules[i];
            if(mod.methods) {
                for(var m=0;m < mod.methods.length;m++) {
                    var name = mod.name + '#' + mod.methods[m].name.toLowerCase();
                    index[name] = [i, m].join('.')
                }
            }
            if(mod.vars) {
                for(var n=0;n < mod.vars.length;n++) {
                    var name = mod.name + '#' + mod.vars[n].name.toLowerCase();
                    if(index[name]) {
                        console.log('collision: ', name)
                    }
                    index[name] = [i, n].join('.')
                }
            }
        }
        console.timeEnd('index')
        console.log(index)
        $('.loading').remove()
    })

    // do the search
    $('#search').on('keyup', function() {
        var query = this.value
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
        for(var key in pool) {
            result.push([key, pool[key]])
        }
        // render results as a list (this is nasty)
        var ul = $('<ul>').appendTo($('.results').html(''));
        var list = {}
        for(var i=0;i<result.length;i++) {
            var mod = result[i][0].split('#')[0]
            if(!list[mod]) {
                list[mod] = $('<ul>').appendTo($('<li>' + mod + '</li>').appendTo(ul));
            }
            list[mod].append(
                '<li class="method" data-idx="' + result[i][1] +
                '">#' + result[i][0].split('#')[1] + '</li>'
            )
        }
    })

    // clicked on a methods, show docs
    $('.results').on('click', 'li.method', function(evt) {
        var idxs = this.dataset['idx'].split('.')
        var method = docs.modules[idxs[0]].methods[idxs[1]]
        $('.doc')
            .html('')
            .append('<h1>' + method.textRaw + '</h1>')
            .append('<section>' + method.desc + '</section>')
    })
})()
