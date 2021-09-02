import {Plugster} from 'https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.11/dist/plugster.min.js?module';
import CurrenciesServices from '/client-stack/services/currencies.js';

class CurrencySelector extends Plugster {

    currenciesSvcs = new CurrenciesServices();

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {

        let self = this;

        self._.currenciesDropDown.on('change', function () {
            let previousValue = self._.currenciesDropDown.data('pre');
            self._.currenciesDropDown.data('pre', this.value);
            self.notifyCurrencySelection({ previousValue: previousValue, currentValue: this.value });
        });

        self.currenciesSvcs.getAll().then(function (response) {
            Object.keys(response).map(function (key) {
                self._.currenciesDropDown.append(new Option(response[key], key));
            });
            self._.currenciesDropDown.data('pre', self._.currenciesDropDown.first().val());
            self.notifyCurrencySelection({ previousValue: 'NA', currentValue: self._.currenciesDropDown.first().val() });
        });

    }

    notifyCurrencySelection(value) {
        this.dispatchEvent(this.currencyChanged.name, value);
    }

    currencyChanged(data, callback) {
        this.registerEventSignature(this.currencyChanged.name, data, callback);
    }

}

let currencySelector = new CurrencySelector({
    currenciesDropDown: {}
});

Plugster.plug(currencySelector);

export {currencySelector as CurrencySelector};
