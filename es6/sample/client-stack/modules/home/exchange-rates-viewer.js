import Plugster from '../../libs/plugster/plugster.js';
import ExchangeRatesServices from '../../services/exchange-rates.js';

class ExchangeRatesViewer extends Plugster {

    exchangeRatesSvcs = new ExchangeRatesServices();

    constructor(outlets) {
        super('ExchangeRatesViewer', outlets);
    };

    init = function () {
        let self = this;
        window.Promise.all(self.bindOutlets()).then(function () {
            console.log(`${self.name} Controller Initialized`);
            self.afterInit();
        });
    };

    afterInit = function () {

        let self = this;

        self._.selectedCurrencyLabel.click(function () {
            console.log(this.innerText);
        });

    };

    invalidateRatesList = function (forCurrency) {
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
                });
                if(!itemOutlets) return null;
                itemOutlets.root.click(function() {
                    let key = this.dataset['key'];
                    console.log(key);
                    console.log(self._.ratesList.getData(key));
                });
                itemOutlets.currencyCodeLabel.text(key);
                itemOutlets.valueLabel.text(rate);
            });
            console.log(self._.ratesList);
            console.log(self._.ratesList.count());
        });
    };

}

export default new ExchangeRatesViewer({
    selectedCurrencyLabel: {},
    ratesList: {}
});
