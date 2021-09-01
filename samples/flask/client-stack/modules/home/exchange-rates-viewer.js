import {Plugster} from '/client-stack/deps/plugster/plugster.module.js';
import ExchangeRatesServices from '/client-stack/services/exchange-rates.js';

class ExchangeRatesViewer extends Plugster {

    exchangeRatesSvcs = new ExchangeRatesServices();

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {

        let self = this;

        self._.selectedCurrencyLabel.click(function () {
            console.log(this.innerText);
        });

    }

    onNewMessage(plugsterSourceName, eventName, data) {
        console.log([plugsterSourceName, eventName, data]);
    }

    handleCurrencyChange(data) {
        this.invalidateRatesList(data.value);
    }

    invalidateRatesList(forCurrency) {
        let self = this;
        self._.selectedCurrencyLabel.text(forCurrency);
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
                    console.log([key, jsonData]);
                });
                if(!itemOutlets) return null;
                itemOutlets.currencyCodeLabel.text(key);
                itemOutlets.valueLabel.text(rate);
            });
        });
    }

}

export default new ExchangeRatesViewer({
    selectedCurrencyLabel: {},
    ratesList: {}
});
