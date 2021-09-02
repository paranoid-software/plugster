import {Plugster} from '../../deps/plugster/plugster.js';

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

Plugster.plug(new Dummy({
    outlet: {}
}));
