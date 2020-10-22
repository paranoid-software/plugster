import Plugster from '../../libs/plugster/plugster.js';
import CurrenciesServices from '../../services/currencies.js';

class CurrencySelector extends Plugster {

    currenciesSvcs = new CurrenciesServices();
    eventsDefinitions = {
        changed: 'changed'
    };

    constructor(outlets) {
        super('CurrencySelector', outlets);
    };

    init = function () {
        let self = this;
        window.Promise.all(self.bindOutlets()).then(function () {
            console.log(`${self.name} Controller Initialized.`);
            self.afterInit();
        });
    };

    afterInit = function () {

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

    };

    notifyValueSelection = function (value) {
        let self = this;
        self.trigger(self.eventsDefinitions.changed, {value: value})
    };

    changed = function (data, callback) {
        let self = this;
        self.on(self.eventsDefinitions.changed, data, callback);
    };

}

export default new CurrencySelector({
    currenciesDropDown: {}
});
