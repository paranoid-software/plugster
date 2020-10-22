__app.parentcontroller = (function (parentcontroller) {

    'use strict';

    parentcontroller.nestedcontroller = $.extend(new __plugster.Controller('ControllerName', {
        // Outlets
    }), (function () {

        let
            self,
            afterInit = function () {
            };

        return {
            init: function () {
                self = this;
                window.Promise.all(self._init()).then(function () {
                    console.log(String.format('{0} Controller Initialized', self.name));
                    afterInit();
                });
            }
        };

    }()));

    return parentcontroller;

}(__app.parentcontroller || {}));
