__app.modules.home = (function (home, services) {

    'use strict';

    home.currencyselector = $.extend(new __plugster('CurrencySelector', {
        currenciesDropDown: {}
    }), (function (currenciesSvc) {

        let
            self,
            _,
            eventsDefinitions = {
                changed: 'changed'
            },
            notifyValueSelection = function(value) {
                self.trigger(eventsDefinitions.changed, { value: value })
            },
            afterInit = function () {

                _.currenciesDropDown.on('change', function () {
                    notifyValueSelection(this.value);
                });

                currenciesSvc.getAll().then(function(response) {
                   Object.keys(response).map(function(key) {
                       _.currenciesDropDown.append(new Option(response[key], key));
                   });
                   notifyValueSelection(_.currenciesDropDown.first().val());
                });

            };

        return {
            init: function () {
                self = this;
                _ = self.outlets;
                window.Promise.all(self._init()).then(function () {
                    console.log(String.format('{0} Controller Initialized', self.name));
                    afterInit();
                });
            },
            changed: function (data, callback) {
                self.on(eventsDefinitions.changed, data, callback);
            }
        };

    }(services.currencies)));

    return home;

}(
    __app.modules.home || {},
    __app.services
));
