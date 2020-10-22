let __app = (function () {

    'use strict';

    return {
        modules: {},
        init: function () {
            if (this.modules.home && this.modules.home.currencyselector) this.modules.home.currencyselector.init();
            if (this.modules.home && this.modules.home.exchangeratesviewer) this.modules.home.exchangeratesviewer.init();
            if (this.modules.shared && this.modules.shared.quicknotifier) this.modules.shared.quicknotifier.init();
        }
    };

})();

$(document).ready(function () {

    window.onerror = function (msg, file, line, col, error) {
        StackTrace.fromError(error).then(function (stackframes) {
            let stringifiedStack = stackframes.map(function (frame) {
                return frame.toString();
            }).join('\n');

            //TODO: Post exception to the corresponding server

            console.log(stringifiedStack);
        }).catch(function (err) {
            console.log(err.message);
        });
    };

    $.ajaxSetup({
        beforeSend: function (xhr) {
            //xhr.setRequestHeader("Authorization", String.format() );
        },
        cache: false
    });

    __app.init();

});
