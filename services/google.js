/**
 * The Google Directions API
 * https://developers.google.com/maps/documentation/directions/
 */

var crypto = require('crypto')
    , querystring = require('querystring')
    , request = require('request');

var HOST = 'https://maps.googleapis.com';
var PATHNAME = '/maps/api/directions/json';

/**
 * Google Directions API request
 *
 * @param {string} clientId (optional) client ID
 * @param {string} privateKey (optional) private key to sign request
 * @param {object} options (optional) global request options
 *                          - userAgent: request User Agent
 *                          - mode: travel mode (driving [default], walking, bicycling, transit)
 *                          - units: Unit Systems (metric [default], imperial)
 *                          - considerTraffic: receive trip duration considering current traffic conditions
 *                                                  (works only with Maps for Business account)
 */
exports = module.exports = function (clientId, privateKey, options) {
    if ((typeof clientId === 'object') && (arguments.length === 1)) {
        options = clientId;
        clientId = null;
        privateKey = null;
    }

    options = options || {};
    var mode = options.mode || 'driving';
    var units = options.units || 'metric';
    var headers = {};

    if (options.userAgent) {
        headers['user-agent'] = options.userAgent;
    }

    return function (origin, destination, cb) {
        var query = {
            'origin': origin.join(','),
            'destination': destination.join(','),
            'mode': mode,
            'units': units
        }
        , req = {
            'headers': headers,
            'json': true
        };

        if (options.considerTraffic) {
            // set current time
            query.departure_time = Math.round(Date.now()/1000);
        }

        var url = PATHNAME + '?' + querystring.stringify(query);

        if (clientId && privateKey) {
            // Sign request with client id
            url += '&client=' + clientId;
            url += '&signature=' + signRequest(url, privateKey);
        }

        req.url = HOST + url;
        request(req, function (err, response, body) {
            if (err) return cb(err);
            if (!body || !body.routes) return cb("Invalid response");
            var routes = body.routes;
            if (!Array.isArray(routes)
                || (routes.length === 0)) return cb("Invalid response");
            var legs = routes[0].legs;
            if (!Array.isArray(legs)
                || (legs.length === 0)) return cb("Invalid response");

            var leg = legs[0]
                , distance = leg.distance
                , duration = leg.duration;

            if (options.considerTraffic && leg.duration_in_traffic) {
                duration = leg.duration_in_traffic;
            }

            cb(null, {
                'duration': duration.value,  // seconds
                'distance': distance.value  // meters
            })
        });
    }
}

function signRequest (url, key) {
    key = key.replace(/\-/g, '+').replace(/_/g, '/');  // Base64 for URLs
    key = new Buffer(key, 'base64');
    var hmac = crypto.createHmac('sha1', key);
    hmac.update(url);
    return hmac.digest('base64').replace(/\+/g, '-').replace(/\//g, '_');
}
