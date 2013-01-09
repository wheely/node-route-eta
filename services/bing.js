/**
 * Bing Maps REST Services Routes API
 * http://msdn.microsoft.com/en-us/library/ff701713.aspx
 */

var request = require('request');

var URL = 'https://dev.virtualearth.net/REST/V1/Routes/Driving'

/**
 * Bing request
 *
 * @param {string} apiKey Bing Maps Key
 * @param {object} options (optional) request options
 *                          - userAgent: request User Agent
 *                          - optimize: time [default], distance, timeWithTraffic
 */
exports = module.exports = function (apiKey, options) {
    var optimize = 'time'  // setting defauls
        , headers = {};

    if (options) {
        if (options.userAgent) {
            headers['user-agent'] = options.userAgent;
        }
        if (options.optimize) {
            optimize = options.optimize;
        }
    }

    return function (origin, destination, cb) {
        var query = {
            'wp.0': origin.join(','),
            'wp.1': destination.join(','),
            'optimize': optimize,
            'key': apiKey
        }
        , req = {
            'url': URL,
            'qs': query,
            'headers': headers,
            'json': true
        }

        request(req, function (err, response, body) {
            if (err) return cb(err);

            if (!body || !body.resourceSets) return cb("Invalid respose");
            if (!Array.isArray(body.resourceSets) 
                || (body.resourceSets.length === 0)) return cb("Invalid respose");
            var resourceSet = body.resourceSets[0];
            if (!resourceSet.resources 
                || !Array.isArray(resourceSet.resources) 
                || (resourceSet.resources.length === 0)) return cb("Invalid response");

            var result = resourceSet.resources[0];

            if (result.durationUnit !== 'Second') return cb("Invalid duration unit:", result['durationUnit']);
            if (result.distanceUnit !== 'Kilometer') return cb("Invalid distance unit:", result['durationUnit']);

            cb(null, {
                'duration': result.travelDuration,  // seconds
                'distance': result.travelDistance * 1000 // meters
            })
        });
    }
}
