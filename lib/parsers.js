'use strict';

/**
 * HTML parsing functions
 *
 * @module vk-dirty-api/Parsers
 */

var cheerio = require('cheerio'),
    errors  = require('./errors');

/**
 * @typedef {Object} loginForm
 *
 * @property {String} url
 * @property {Object} form
 */

/**
 * Parse HTML and return login form action URL and fields
 *
 * @param {!String} html
 * @returns {loginForm}
 */
module.exports.parseLoginFormFields = function (html) {
    var $        = cheerio.load(html),
        formData = {};

    var form   = $('form[method="post"][action]'),
        inputs = form.find('input[name]');

    inputs.each(function () {
        var e = $(this);

        formData[ e.attr('name') ] = e.val();
    });

    return {
        url:  form.attr('action'),
        form: formData
    };
};

/**
 * @callback allowButtonCallback
 * @param {?Error} error
 * @param {String} [url]
 */
/**
 * Parse HTML and return 'Allow' button link
 *
 * @param {!String} html
 * @param {!allowButtonCallback} cb
 */
module.exports.parseAllowButtonHref = function (html, cb) {
    var $ = cheerio.load(html);

    var err = $('.service_msg_warning');
    if (err.length !== 0)
        return cb(new errors.VKAuthError(err.text()));

    var form = $('form[method="post"][action]');
    if (form.length === 0)
        return cb(new Error('Unable to get link to grant permissions'));

    cb(null, form.attr('action'));
};