__app.modules.home = (function (home, services) {

    'use strict';

    home.currencyselector = $.extend(new __plugster('CurrencySelector', {
        currenciesDropDown: {}
    }), (function (currenciesSvc) {

        let
            self,
            _,
            notifyCurrencySelection = function(value) {
                self.dispatchEvent(self.currencyChanged.name, { value: value })
            },
            afterInit = function () {

                _.currenciesDropDown.on('change', function () {
                    notifyCurrencySelection(this.value);
                });

                currenciesSvc.getAll().then(function(response) {
                   Object.keys(response).map(function(key) {
                       _.currenciesDropDown.append(new Option(response[key], key));
                   });
                   notifyCurrencySelection(_.currenciesDropDown.first().val());
                });

            };

        return {
            init: function () {
                self = this;
                _ = self.outlets;
                self._init(function() {
                    afterInit();
                });
            },
            currencyChanged: function (data, callback) {
                self.registerEventSignature(this.currencyChanged.name, data, callback);
            }
        };

    }(services.currencies)));

    return home;

}(
    __app.modules.home || {},
    __app.services
));
