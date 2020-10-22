import $ from "../libs/jquery/jquery.module.js";

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