export default class CurrenciesServices {
    constructor() {
        this.baseEndpoint = 'http://api.frankfurter.app';
    }

    getAll = function () {
        let self = this;
        return $.get({
            url: `${self.baseEndpoint}/currencies`,
            cache: false
        });
    }
}
