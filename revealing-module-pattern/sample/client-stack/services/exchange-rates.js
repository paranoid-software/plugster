__app.services = (function (app, services) {

    'use strict';

    services.exchangerates = (function () {
        let
            baseEndpoint = 'http://api.frankfurter.app',
            getLatest = function (from) {
                return $.get({
                    url: String.format('{0}/latest?from={1}', baseEndpoint, from),
                    cache: false
                });
            };

        return {
            getLatest: getLatest
        };

    }());

    return services;

}(__app || {}, __app.services || {}));


