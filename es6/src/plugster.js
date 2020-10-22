import $ from '../jquery/jquery.module.js';

export default class Plugster {

    constructor(name, outlets) {
        console.log(`${name} Controller Instantiated.`);
        this.name = name;
        this._ = outlets;
        this.childTemplates = {};
    };

    bindOutlets = function () {

        let self = this;

        console.log(`Initializing ${self.name} Controller.`);
        console.log(`Binding Outlets for ${self.name} Controller.`);

        let childTemplatesLoadPromises = [];
        let controllerSelectorSentence = `[data-controller-name=${self.name}]`;
        if ($(controllerSelectorSentence).length === 0) throw new Error(`There is no view with a ${self.name} controller !!!`);

        let root = $(controllerSelectorSentence);

        $.map(self._, function (outlet, key) {

            let selector = `[data-outlet-id='${key}']`;
            if (root.find(selector).length === 0) throw new Error(`Outlet ${key} does not exist, check both ${self.name} view and controller !!!`);

            let filteredOutlet = root.find(selector);
            if (filteredOutlet.length > 1) {
                let filteredOutlets = $.map(filteredOutlet, function (o) {
                    if ($(o).closest('[data-controller-name]').data('controller-name') === self.name) return $(o);
                    return null;
                });
                filteredOutlet = filteredOutlets[0];
            }

            if (filteredOutlet.data('child-templates')) {
                filteredOutlet.buildListItem = function (withTemplateIndex, itemKey, jsonData, outletsSchema) {
                    if (!this.items) this.items = {};
                    if (!this.items[itemKey]) this.items[itemKey] = {};
                    this.append(self.childTemplates[`${key}_${withTemplateIndex}`]);
                    let outlets = self.compileChildTemplate(this.children().last(), outletsSchema);
                    if(outlets === null) return null;
                    outlets.root.attr('data-key', itemKey);
                    this.items[itemKey].outlets = outlets;
                    this.items[itemKey].data = jsonData;
                    return this.items[itemKey].outlets;
                };
                filteredOutlet.count = function() {
                  return Object.keys(this.items).length;
                };
                filteredOutlet.getData = function(key) {
                  return this.items[key].data;
                };
                filteredOutlet.getOutlets = function(key) {
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
                    self.loadChildTemplate(key, index, childTemplate, deferred);
                });
            }

            self._[key] = filteredOutlet;

        });

        self._.root = root;

        console.log(`Outlets for ${self.name} Controller were binded successfuly !!!`);

        return childTemplatesLoadPromises;

    };

    loadChildTemplate = function (outletName, index, file, deferred) {
        let self = this;
        $.get({url: file, cache: false}, function (html) {
            self.childTemplates[`${outletName}_${index}`] = html;
            console.log(`Template ${file} loaded.`);
            deferred.resolve();
        });
    };

    compileChildTemplate = function (child, outletsSchema) {
        // TODO: Validate schema compliance.
        if(!outletsSchema || Object.keys(outletsSchema).length === 0) return null;
        let outlets = {};
        outlets.root = child;
        $.map(child.find('[data-child-outlet-id]'), function (outlet) {
            outlets[$(outlet).data('child-outlet-id')] = $(outlet);
        });
        return outlets;
    };

    trigger = function (eventName, args) {
        $(this).trigger(new $.Event(eventName, {args: args}));
    };

    on = function (eventName, args, callback) {
        $(this).on(eventName, args, callback);
    };

}
