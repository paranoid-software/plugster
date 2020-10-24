import $ from "../libs/jquery/jquery.module.js";

export default class ExchangeRatesServices {
    constructor() {
        this.baseEndpoint = 'http://api.frankfurter.app';
    }

    getLatest = function (from) {
        let self = this;
        return $.get({
            url: `${self.baseEndpoint}/latest?from=${from}`,
            cache: false
        });
    };
}
