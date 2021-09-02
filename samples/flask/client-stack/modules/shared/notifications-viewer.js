import {Plugster} from 'https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.11/dist/plugster.min.js?module';

class NotificationsViewer extends Plugster {

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {
    }

    handleCurrencyChange(data) {
        let self = this;
        if (data.previousValue === 'NA') return;
        self._.messageText.text(`User change currency from ${data.previousValue} to ${data.currentValue}`);
    }

    handleRatesListItemClick(data) {
        let self = this;
        self._.messageText.text(`User clicked on ${data.key} which value is ${data.value[data.key]}`);
    }
}

let notificationsViewer = new NotificationsViewer({
    messageText: {}
});

Plugster.plug(notificationsViewer);

export {notificationsViewer as NotificationsViewer}
