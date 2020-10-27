export default class CurrenciesServices {
    constructor() {
        this.baseEndpoint = 'http://api.frankfurter.app';
    }

    getAll() {
        let self = this;
        return $.get({
            url: `${self.baseEndpoint}/currencies`,
            cache: false
        });
    }
}
