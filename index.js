var request = require('request'),
    cheerio = require('cheerio'),
    url = require('url'),
    extend = require('xtend'),
    util = require('util'),
    EventEmitter = require('events').EventEmitter;

function authorize(appId, login, pass, cb) {
    var cookieJar = request.jar();

    var self = this;
    self.access_token = false;

    request = request.defaults({
        jar:                cookieJar,
        headers:            {
            'User-Agent': 'nodejs-vk-api/0.1'
        },
        followAllRedirects: true
    });

    var params = {
        client_id: appId,
        scope:     [
                       'notify',
                       'friends',
                       'photos',
                       'audio',
                       'video',
                       'docs',
                       'notes',
                       'pages',
                       'status',
                       'offers',
                       'questions',
                       'wall',
                       'groups',
                       'messages',
                       'notifications',
                       'stats',
                       'ads',
                       'offline'
                   ].join(','),
        login:     login,
        pass:      pass
    };

    request({
            url: url.format({
                protocol: 'https',
                host:     'oauth.vk.com',
                pathname: 'authorize',
                query:    {
                    client_id:     params.client_id,
                    scope:         params.scope,
                    redirect_uri:  'https://oauth.vk.com/blank.html',
                    display:       'mobile',
                    v:             '5.21',
                    response_type: 'token'
                }
            })
        },
        function (err, r, body) {
            if (err)
                return cb(err);

            var nextQuery = getLoginFormData(body);

            if (!('email' in nextQuery.form))
                return cb(new Error('Unable to fetch login page'));

            nextQuery.form.email = params.login;
            nextQuery.form.pass = params.pass;

            request({
                    url:    nextQuery.url,
                    method: 'POST',
                    form:   nextQuery.form
                },
                function (err, r, body) {
                    if (err)
                        return cb(err);

                    getAllowLink(body, function (err, link) {
                        if (err)
                            return cb(err);

                        request({
                            url:    link,
                            method: 'POST'
                        }, function (err, res) {
                            var access_token = /access_token=([a-f0-9]+)/.exec(res.request.uri.hash);
                            if (!access_token[1])
                                return cb(new Error('Invalid access_token'));

                            self.access_token = access_token[1];
                            cb(null, self.access_token);

                            self.emit('auth', self.access_token);
                        });
                    })
                });
        });

    function getLoginFormData(html) {
        var $ = cheerio.load(html),
            formData = {};

        var form = $('form[method="post"][action]'),
            inputs = form.find('input[name]');

        inputs.each(function () {
            var e = $(this);
            formData[e.attr('name')] = e.val();
        });

        return {
            url:  form.attr('action'),
            form: formData
        };
    }

    function getAllowLink(html, cb) {
        var $ = cheerio.load(html);

        var err = $('.service_msg_warning');
        if (err.length !== 0)
            return cb(new Error('VK error: ' + err.text()));

        var form = $('form[method="post"][action]');
        if (form.length === 0)
            return cb(new Error('Unable to get link to grant permissions'));

        cb(null, form.attr('action'));
    }

    self.api = function api(method, options, cb) {
        if (typeof options === 'function') {
            cb = options;
            options = {};
        }

        request({
            url: url.format({
                protocol: 'https',
                host:     'api.vk.com',
                pathname: 'method/' + method,
                query:    extend(
                    options,
                    {
                        v:            '5.21',
                        access_token: self.access_token
                    })
            })
        }, function (err, r, json) {
            cb(err, JSON.parse(json));
        });

        return this;
    };

    return self;
}

util.inherits(authorize, EventEmitter);
module.exports = exports = authorize;