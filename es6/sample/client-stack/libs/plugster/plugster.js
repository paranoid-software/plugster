import $ from '../jquery/jquery.module.js';

export default class Plugster {

    static registry = {};

    constructor(outlets) {

        this.name = this.constructor.name;

        console.log(`${this.name} Controller Instantiated.`);

        this._ = outlets;
        this.childTemplates = {};
        this.init();

        Plugster.registry[this.name.toLowerCase()] = this;

    };

    toString() {
        return this.name;
    }

    init() {
        let self = this;

        console.log(`Initializing ${self.name} Controller.`);

        self.bindOutlets(function () {
            console.log(`${self.name} Controller Initialized`);
            // Here we are invoking the extended class "afterInit" method
            self.afterInit();
        });
    }

    afterInit() {
        throw new Error('You have to implement the Plugster afterInit method !!!');
    }

    bindOutlets(afterBind) {

        let self = this;

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
                    self.loadChildTemplate(key, index, childTemplate, deferred);
                });
            }

            self._[key] = filteredOutlet;

        });

        self._.root = root;

        // Binding HTML declared subscriptions
        Object.keys(root.data()).map(function (key) {
            let dashed = key.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
            let parts = dashed.split('-');
            if (parts.length !== 3) return null;
            if (parts[0] !== 'on') return null;
            let methodName = root.data(key);
            if(!self[methodName]) throw new Error(`There is no method ${methodName} within the ${self.name} controller !!!`);
            let plugsterNameLowerCased = parts[1];
            let eventNameLowerCased = parts[2];
            if(!Plugster.registry[plugsterNameLowerCased]) throw new Error(`There is no ${plugsterNameLowerCased} controller !!!`);
            let pubMethodsLowerCased = Object.getOwnPropertyNames(Object.getPrototypeOf(Plugster.registry[plugsterNameLowerCased])).map(methodName => {
                return methodName.toLowerCase();
            });
            if(pubMethodsLowerCased.indexOf(eventNameLowerCased) < 0) throw new Error(`There is no ${eventNameLowerCased} event in ${plugsterNameLowerCased} controller !!!`);
            Plugster.htmlDeclaredSubscriptions[`${plugsterNameLowerCased}_${eventNameLowerCased}_${self.name.toLowerCase()}`] = {listener: self, methodName: methodName};
        });

        console.log(`Outlets for ${self.name} Controller were binded successfuly !!!`);

        window.Promise.all(childTemplatesLoadPromises).then(function () {
            afterBind();
        });

    }

    loadChildTemplate(outletName, index, file, deferred) {
        let self = this;
        $.get({url: file, cache: false}, function (html) {
            self.childTemplates[`${outletName}_${index}`] = html;
            console.log(`Template ${file} loaded.`);
            deferred.resolve();
        });
    }

    compileChildTemplate(template, outletsSchema) {
        // TODO: Validate schema compliance.
        if (!outletsSchema || Object.keys(outletsSchema).length === 0) return null;
        let outlets = {};
        outlets.root = template;
        $.map(template.find('[data-child-outlet-id]'), function (outlet) {
            outlets[$(outlet).data('child-outlet-id')] = $(outlet);
        });
        return outlets;
    }

    registerEventSignature(name, data, callback) {
        $(this).on(name, data, callback);
    }

    dispatchEvent(name, args) {
        this.broadcastExplicitSubscriptionsMessages(name, args);
        this.broadcastHtmlDeclaredSubscriptionsMessages(name, args);
        $(this).trigger(new $.Event(name, {args: args}));
    }

    static explicitSubscriptions = {};
    static htmlDeclaredSubscriptions = {};

    broadcastExplicitSubscriptionsMessages(name, args) {
        let simpleKey = this.name.toLowerCase();
        let compoundKey = `${this.name}_${name}`.toLowerCase();
        Plugster.explicitSubscriptions[simpleKey]?.onNewMessage(this.name, name, args);
        Plugster.explicitSubscriptions[compoundKey]?.onNewMessage(this.name, name, args);
    }

    broadcastHtmlDeclaredSubscriptionsMessages(name, args) {
        let keyPrefix = `${this.name}_${name}`.toLowerCase();
        Object.keys(Plugster.htmlDeclaredSubscriptions).map(function(key) {
            if(key.startsWith(keyPrefix)) {
                let sub = Plugster.htmlDeclaredSubscriptions[key];
                sub.listener[sub.methodName].call(sub.listener, args);
            }
        });
    }

    // Explicit subscriptions enrollment
    listenTo(pubPlugster, event) {
        if (!event) {
            Plugster.explicitSubscriptions[pubPlugster.name.toLowerCase()] = this;
            return;
        }
        Plugster.explicitSubscriptions[`${pubPlugster.name}_${event.name}`.toLowerCase()] = this;
    }

}
