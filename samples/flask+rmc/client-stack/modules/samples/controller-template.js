__app.controller = $.extend(new __plugster.Controller('ControllerName', {
    // Here we must declare the view outlets
}), (function (controller) {

    'use strict';

    let
        self,
        afterInit = function () {
        };

    $.extend(controller, {
        init: function () {
            self = this;
            window.Promise.all(self._init()).then(function () {
                console.log(String.format('{0} Controller Initialized', self.name));
                afterInit();
            });
        }
    });

    return controller;

}(__app.controller || {})));
