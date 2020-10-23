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
            self.notifyValueSelection(this.value);
        });

        self.currenciesSvcs.getAll().then(function (response) {
            Object.keys(response).map(function (key) {
                self._.currenciesDropDown.append(new Option(response[key], key));
            });
            self.notifyValueSelection(self._.currenciesDropDown.first().val());
        });

    }

    notifyValueSelection(value) {
        this.dispatchEvent(this.changed.name, {value: value})
    }

    changed(data, callback) {
        this.registerEventSignature(this.changed.name, data, callback);
    }

}

export default new CurrencySelector({
    currenciesDropDown: {}
});
