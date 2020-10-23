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
                self._init(function() {
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
