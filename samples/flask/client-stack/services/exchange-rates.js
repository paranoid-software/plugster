export default class ExchangeRatesServices {
    constructor() {
        this.baseEndpoint = 'http://api.frankfurter.app';
    }

    getLatest(from) {
        let self = this;
        return $.get({
            url: `${self.baseEndpoint}/latest?from=${from}`,
            cache: false
        });
    }
}
