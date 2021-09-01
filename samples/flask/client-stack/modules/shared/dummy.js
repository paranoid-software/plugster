import {Plugster} from '/client-stack/deps/plugster/plugster.module.js';

class Dummy extends Plugster {

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {
    }

    handleCurrencyChange(data) {
        let self = this;
        self._.outlet.text(data.value);
    }
}

export default new Dummy({
    outlet: {}
});
