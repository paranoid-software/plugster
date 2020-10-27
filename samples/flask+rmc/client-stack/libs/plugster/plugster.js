'use strict';

let __plugster = function (name, outlets) {

    let
        self = this,
        childTemplates = {},
        compileChildTemplate = function (child, outletsSchema) {
            // TODO: Validate schema compliance.
            if (!outletsSchema || Object.keys(outletsSchema).length === 0) return null;
            let outlets = {};
            outlets.root = child;
            $.map(child.find('[data-child-outlet-id]'), function (outlet) {
                outlets[$(outlet).data('child-outlet-id')] = $(outlet);
            });
            return outlets;
        },
        loadChildTemplate = function (outletName, index, file, deferred) {
            $.get({url: file, cache: false}, function (html) {
                childTemplates[String.format('{0}_{1}', outletName, index)] = html;
                console.log(String.format('Template {0} loaded.', file));
                deferred.resolve();
            });
        },
        bindOutlets = function (afterBind) {

            console.log(String.format('Binding Outlets for {0} Controller.', name));

            let childTemplatesLoadPromises = [];
            if ($(String.format('[data-controller-name={0}]', name)).length === 0) throw new Error(String.format('There is no view with a {0} controller !!!', name));

            let root = $(String.format('[data-controller-name={0}]', name));

            $.map(self.outlets, function (outlet, key) {

                let selector = String.format('[data-outlet-id="{0}"]', key);
                if (root.find(selector).length === 0) throw new Error(String.format('Outlet {0} does not exist, check both {1} view and controller !!!', key, name));

                let filteredOutlet = root.find(selector);
                if (filteredOutlet.length > 1) {
                    let filteredOutlets = $.map(filteredOutlet, function (o) {
                        if ($(o).closest('[data-controller-name]').data('controller-name') === name) return $(o);
                        return null;
                    });
                    filteredOutlet = filteredOutlets[0];
                }

                if (filteredOutlet.data('child-templates')) {
                    filteredOutlet.buildListItem = function (withTemplateIndex, itemKey, jsonData, outletsSchema) {
                        if (!this.items) this.items = {};
                        if (!this.items[itemKey]) this.items[itemKey] = {};
                        this.append(childTemplates[String.format('{0}_{1}', key, withTemplateIndex)]);
                        let outlets = compileChildTemplate(this.children().last(), outletsSchema);
                        if (outlets === null) return null;
                        outlets.root.attr('data-key', itemKey);
                        this.items[itemKey].outlets = outlets;
                        this.items[itemKey].data = jsonData;
                        return this.items[itemKey].outlets;
                    };
                    filteredOutlet.count = function () {
                        return Object.keys(this.items).length;
                    };
                    filteredOutlet.getData = function (key) {
                        return this.items[key].data;
                    };
                    filteredOutlet.getOutlets = function (key) {
                        return this.items[key].outlets;
                    };
                    filteredOutlet.clear = function () {
                        this.items = undefined;
                        this.children().remove();
                    };
                    let templates = filteredOutlet.data('child-templates');
                    $.map(templates, function (childTemplate, index) {
                        let deferred = $.Deferred();
                        childTemplatesLoadPromises.push(deferred.promise());
                        loadChildTemplate(key, index, childTemplate, deferred);
                    });
                }

                self.outlets[key] = filteredOutlet;

            });

            outlets.root = root;

            console.log(String.format('Outlets for {0} Controller were binded successfuly !!!', name));

            window.Promise.all(childTemplatesLoadPromises).then(function() {
                afterBind();
            });

        };

    self.name = name;
    self.outlets = outlets;

    self._init = function (afterInit) {
        console.log(String.format('Initializing {0} Controller', name));
        return bindOutlets(function() {
            console.log(String.format('{0} Controller Initialized', self.name));
            afterInit();
        });
    };

    self.dispatchEvent = function (eventName, args) {
        $(this).trigger(new jQuery.Event(eventName, {args: args}));
    };

    self.registerEventSignature = function (eventName, args, callback) {
        $(this).on(eventName, args, callback);
    };

    console.log(String.format('{0} Controller Instantiated', name));

};
