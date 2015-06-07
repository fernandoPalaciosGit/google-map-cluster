var express = require('express'),
    app = express(),
    options = {
        dotfiles: 'ignore',
        etag: false,
        extensions: ['htm', 'html'],
        maxAge: '1d',
        redirect: false,
        setHeaders: function (res) {
            res.set('x-timestamp', Date.now());
        }
    };
    
app.use('/map-cluster', express.static('public', options)).listen(3000);