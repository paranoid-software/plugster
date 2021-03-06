﻿__app.modules.home = (function (home, services, shared) {

    'use strict';

    home.exchangeratesviewer = $.extend(new __plugster('ExchangeRatesViewer', {
        selectedCurrencyLabel: {},
        ratesList: {}
    }), (function (currencySelector, exchangeRates, quickNotifier) {

        let
            self,
            _,
            invalidateRatesList = function(forCurrency) {
                if(forCurrency === 'USD') quickNotifier.notify('USD FTW !!');
                exchangeRates.getLatest(forCurrency).then(function(response) {
                    _.ratesList.clear();
                    Object.keys(response['rates']).map(function(key) {
                        let rate = response['rates'][key];
                        let itemAsJson = {};
                        itemAsJson[key] = rate;
                        let itemOutlets = _.ratesList.buildListItem(0, key, itemAsJson, {
                            currencyCodeLabel: {},
                            valueLabel: {}
                        });
                        if(!itemOutlets) return null;
                        itemOutlets.root.click(function() {
                            let key = this.dataset['key'];
                            console.log([key, _.ratesList.getData(key)]);
                        });
                        itemOutlets.currencyCodeLabel.text(key);
                        itemOutlets.valueLabel.text(rate);
                    });
                });
            },
            afterInit = function () {
                currencySelector.currencyChanged({}, function (e) {
                    _.selectedCurrencyLabel.text(e.args.value);
                    invalidateRatesList(e.args.value);
                });

                _.selectedCurrencyLabel.click(function() {
                   console.log(this.innerText);
                });
            };

        return {
            init: function () {
                self = this;
                _ = self.outlets;
                self._init(function() {
                    afterInit();
                });
            }
        };

    }(home.currencyselector, services.exchangerates, shared.quicknotifier)));

    return home;

}(
    __app.modules.home || {},
    __app.services,
    __app.modules.shared
));
