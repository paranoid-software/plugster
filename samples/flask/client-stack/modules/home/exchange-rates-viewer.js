import {Plugster} from 'https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.11/dist/plugster.min.js?module';

import ExchangeRatesServices from '/client-stack/services/exchange-rates.js';

class ExchangeRatesViewer extends Plugster {

    exchangeRatesSvcs = new ExchangeRatesServices();

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {

        let self = this;

        self._.currencyLabel.click(function () {
            console.log(this.innerText);
        });

    }

    handleCurrencyChange(data) {
        this.invalidateRatesList(data.currentValue);
    }

    invalidateRatesList(forCurrency) {
        let self = this;
        self._.currencyLabel.text(forCurrency);
        self.exchangeRatesSvcs.getLatest(forCurrency).then(function (response) {
            self._.ratesList.clear();
            Object.keys(response['rates']).map(function (key) {
                let rate = response['rates'][key];
                let itemAsJson = {};
                itemAsJson[key] = rate;
                let itemOutlets = self._.ratesList.buildListItem(0, key, itemAsJson, {
                    currencyCodeLabel: {},
                    valueLabel: {}
                }, function (key, jsonData) {
                    self.notifyItemClick({key: key, value: jsonData});
                });
                if(!itemOutlets) return null;
                itemOutlets.currencyCodeLabel.text(key);
                itemOutlets.valueLabel.text(rate);
            });
        });
    }

    notifyItemClick(value) {
        this.dispatchEvent(this.itemClicked.name, value);
    }

    itemClicked(data, callback) {
        this.registerEventSignature(this.itemClicked.name, data, callback);
    }

}

let exchangeRatesViewer = new ExchangeRatesViewer({
    currencyLabel: {},
    ratesList: {}
});

Plugster.plug(exchangeRatesViewer);

export {exchangeRatesViewer as ExchangeRatesViewer};
