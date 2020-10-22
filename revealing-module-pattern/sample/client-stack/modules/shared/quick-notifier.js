__app.modules.shared = (function (shared) {

    'use strict';

    shared.quicknotifier = $.extend(new __plugster('QuickNotifier', {
        // outlet: {}
    }), (function () {

        let
            self,
            _,
            afterInit = function () {
            };

        return {
            init: function () {
                self = this;
                _ = self.outlets;
                window.Promise.all(self._init()).then(function () {
                    console.log(String.format('{0} Controller Initialized', self.name));
                    afterInit();
                });
            },
            notify: function (message) {
                alert(message);
            }
        };

    }()));

    return shared;

}(__app.modules.shared || {}));
