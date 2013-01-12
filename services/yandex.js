/**
 * Yandex.Maps API 2.0
 * http://api.yandex.ru/maps/doc/jsapi/2.x/dg/concepts/router.xml
 *
 * WARNING!!! Use of this request is prohibited by the end-user agreement 
 * And added only for test purposes. Use at your own risk.
 */

var request = require('request')

var URL = 'https://api-maps.yandex.ru/services/route/1.1/route.xml';

/**
 * Yandex.Maps API request
 *
 * @param {object} options (optional) request options
 *                          - userAgent: request User Agent
 *                          - mode: 
 *                              * avoidTrafficJams: avoid traffic jams when choosing a route
 *                              * considerTraffic: receive trip duration considering current traffic conditions
 */
exports = module.exports = function (options) {
    var headers = {}
        , considerTraffic = false;

    if (options) {
        if (options.userAgent) {
            headers['user-agent'] = options.userAgent;
        }
        considerTraffic = (options.mode === 'avoidTrafficJams') 
                            || (options.mode === 'considerTraffic');
    }

    return function (origin, destination, cb) {
        var callbackId = 'id_' + Date.now()
        , query = {
            'callback': callbackId,
            'rll': origin.join(',') + '~' + destination.join(','),
            'sco': 'latlong',
            'lang': 'en_US'
        }
        , req = {
            'url': URL,
            'qs': query,
            'headers': headers,
            'encoding': 'utf8'
        }

        if (options) {
            if (options.mode === 'avoidTrafficJams') {
                query.mode = 'jams';
            }
        }

        request(req, function (err, response, body) {
            if (err) return cb(err);

            // Convert response to JSON
            body = body.slice(callbackId.length + 1, -2);
            try {
                body = JSON.parse(body);
            } catch (e) {
                return cb("Invalid response");
            }

            var metadata = body.response.properties.RouterRouteMetaData
                , durationNoTraffic = metadata.time
                , durationWithTraffic = metadata.jamsTime
                , duration = (considerTraffic) ? durationWithTraffic : durationNoTraffic
                , distance = metadata.length;

            cb(null, {
                'duration': duration,  // seconds
                'durationNoTraffic': durationNoTraffic,
                'durationWithTraffic': durationWithTraffic,
                'distance': distance  // meters
            })
        })
    }
}
