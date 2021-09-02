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
        self._.messageText.text(`User change from ${data.previousValue} to ${data.currentValue}`);
    }
}

let notificationsViewer = new NotificationsViewer({
    messageText: {}
});

Plugster.plug(notificationsViewer);

export {notificationsViewer as NotificationsViewer}
