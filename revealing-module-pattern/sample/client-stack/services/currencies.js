__app.services = (function (app, services) {

    'use strict';

    services.currencies = (function () {
        let
            baseEndpoint = 'http://api.frankfurter.app',
            getAll = function () {
                return $.get({
                    url: String.format('{0}/currencies', baseEndpoint),
                    cache: false
                });
            };

        return {
            getAll: getAll
        };

    }());

    return services;

}(__app || {}, __app.services || {}));


