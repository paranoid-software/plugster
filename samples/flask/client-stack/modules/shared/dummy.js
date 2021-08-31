import Plugster from '../../libs/plugster/plugster.js';

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
