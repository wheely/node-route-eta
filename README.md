node-route-eta
==============

Request the the route ETA from public services

Install
------

<pre>
npm install git://github.com/zerodivisi0n/node-route-eta.git
</pre>

Usage
-----

```javascript
var eta = require('node-route-eta');

var ORIGIN_POINT = [55.81, 37.42];
var DESTINATION_POINT = [55.72, 37.67];

var google = eta.google()
    , googleForBusiness = eta.google('MAPS_CLIENT_ID', 'MAPS_PRIVATE_KEY')
    , googleForBusinessWithTraffic = eta.google('MAPS_CLIENT_ID', 'MAPS_PRIVATE_KEY', {'considerTraffic': true})
    , bing = eta.bing('BIND_API_KEY')
    , bingWithTraffic = eta.bing('BIND_API_KEY', {'optimize': 'timeWithTraffic'});

function requestHandler (name) {
  return function (err, res) {
    if (err) return console.error(name + " error:", err);
    console.log(name + " ETA: " + res.duration + " seconds");
  }
}

google(ORIGIN_POINT, DESTINATION_POINT, requestHandler('google'));
googleForBusiness(ORIGIN_POINT, DESTINATION_POINT, requestHandler('googleForBusiness'));
googleForBusinessWithTraffic(ORIGIN_POINT, DESTINATION_POINT, requestHandler('googleForBusinessWithTraffic'));
bing(ORIGIN_POINT, DESTINATION_POINT, requestHandler('bing'));
bingWithTraffic(ORIGIN_POINT, DESTINATION_POINT, requestHandler('bingWithTraffic'));
```
