import Plugster from '../../libs/plugster/plugster.js';
import CurrenciesServices from '../../services/currencies.js';

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
        this.registerEventSignature(this.currencyChanged.name, data, callback);
    }

}

export default new CurrencySelector({
    currenciesDropDown: {}
});
