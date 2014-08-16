/**
 * The Google Directions API
 * https://developers.google.com/maps/documentation/directions/
 */

var crypto = require('crypto')
    , querystring = require('querystring')
    , request = require('request');

var HOST = 'https://maps.googleapis.com';
var DIRECTIONS_ENDPOINT = '/maps/api/directions/json';
var DISTANCE_MATRIX_ENDPOINT = '/maps/api/distancematrix/json';

/**
 * Google Directions API request
 *
 * @param {string} clientId (optional) client ID
 * @param {string} privateKey (optional) private key to sign request
 * @param {object} options (optional) global request options
 *                          - userAgent: request User Agent
 *                          - mode: travel mode (driving [default], walking, bicycling, transit)
 *                          - units: Unit Systems (metric [default], imperial)
 *                          - api: Target API (directions [default], distancematrix)
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
    var api = options.api || 'directions';
    var headers = {};

    if (['directions', 'distancematrix'].indexOf(api) < 0) throw new Error("Invalid API: " + api);

    if (options.userAgent) {
        headers['user-agent'] = options.userAgent;
    }

    var endpoint, parseResponse;
    if (api === 'directions') {
        endpoint = DIRECTIONS_ENDPOINT;
        parseResponse = parseDirectionsResponse;
    } else {
        endpoint = DISTANCE_MATRIX_ENDPOINT;
        parseResponse = parseDistanceMatrixResponse;
    }

    return function (origin, destination, cb) {
        var query = {
            'mode': mode,
            'units': units
        }
        , req = {
            'headers': headers,
            'json': true
        };

        if (api === 'directions') {
            query.origin = origin.join(',');
            query.destination = destination.join(',');
        } else if (api === 'distancematrix') {
            query.origins = origin.join(',');
            query.destinations = destination.join(',');
        }

        if (options.considerTraffic) {
            // set current time
            query.departure_time = Math.round(Date.now()/1000);
        }

        var url = endpoint + '?' + querystring.stringify(query);

        if (clientId && privateKey) {
            // Sign request with client id
            url += '&client=' + clientId;
            url += '&signature=' + signRequest(url, privateKey);
        }

        req.url = HOST + url;
        request(req, function (err, response, body) {
            if (err) return cb(err);
            if (!body) return cb("Empty response");
            if (body.status !== 'OK') return cb("Invalid status (" + body.status + "):" + body.error_message);

            var result = parseResponse(body);
            if (!result) return cb("Failed to parse response");

            var distance = result.distance
            var duration = result.duration;

            if (options.considerTraffic && result.duration_in_traffic) {
                duration = result.duration_in_traffic;
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

function parseDirectionsResponse (body) {
    if (!body.routes) return;
    var routes = body.routes;
    if (!Array.isArray(routes) || (routes.length === 0)) return;
    var legs = routes[0].legs;
    if (!Array.isArray(legs) || (legs.length === 0)) return;

    return legs[0];
}

function parseDistanceMatrixResponse (body) {
    if (!body.rows) return;
    var rows = body.rows;
    if (!Array.isArray(rows) || (rows.length === 0)) return;
    var elements = rows[0].elements;
    if (!Array.isArray(elements) || (elements.length === 0)) return;

    return elements[0];
}
