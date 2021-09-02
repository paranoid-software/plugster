import {Plugster} from '/client-stack/deps/plugster/plugster.js';
import CurrenciesServices from '/client-stack/services/currencies.js';

class CurrencySelector extends Plugster {

    currenciesSvcs = new CurrenciesServices();

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {

        let self = this;

        self._.currenciesDropDown.on('change', function () {
            self.notifyCurrencySelection(this.value);
        });

        self.currenciesSvcs.getAll().then(function (response) {
            Object.keys(response).map(function (key) {
                self._.currenciesDropDown.append(new Option(response[key], key));
            });
            self.notifyCurrencySelection(self._.currenciesDropDown.first().val());
        });

    }

    notifyCurrencySelection(value) {
        this.dispatchEvent(this.currencyChanged.name, {value: value})
    }

    currencyChanged(data, callback) {
        console.log(1);
        this.registerEventSignature(this.currencyChanged.name, data, callback);
    }

}

let currencySelector = new CurrencySelector({
    currenciesDropDown: {}
});

Plugster.plug(currencySelector);
