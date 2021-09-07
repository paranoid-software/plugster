import $ from './jquery.module.js';

class Plugster extends Object {

    constructor(outlets, controllerName) {
        super();

        if (!Plugster.document) Plugster.document = $(document);
        if (!Plugster.registry) {
            Plugster.registry = {};
            $('[data-controller-name]').map(function(index, val) {
                Plugster.registry[$(val).data('controllerName').toLowerCase()] = undefined;
            });
        }
        if (!Plugster.explicitSubscriptions) Plugster.explicitSubscriptions = {};
        if (!Plugster.htmlDeclaredSubscriptions) Plugster.htmlDeclaredSubscriptions = {};

        this.locales = {};
        this.name = controllerName || this.constructor.name;
        this._ = outlets;
        this.childTemplates = {};

        console.log(`${this.name} Controller Instantiated.`);

        this.init();
    }

    static plug(me) {

        Plugster.registry[me.name.toLowerCase()] = me;

        let allPlugstersRegistered = true;
        Object.keys(Plugster.registry).map(function(key) {
            if(!Plugster.registry[key]) allPlugstersRegistered = false;
        });

        if (!allPlugstersRegistered) return;
        if (window['plugsters']) return;

        // Binding HTML declared subscriptions
        Object.keys(Plugster.registry).map(function (plugsterKey) {
            let plugster = Plugster.registry[plugsterKey];
            let root = Plugster.registry[plugsterKey]._.root;
            Object.keys(root.data()).map(function (rootDataKey) {
                let dashed = rootDataKey.replace(/[A-Z]/g, m => "-" + m.toLowerCase());
                let parts = dashed.split('-');
                if (parts.length !== 3) return null;
                if (parts[0] !== 'on') return null;
                let methodName = root.data(rootDataKey);
                if (!plugster[methodName]) throw new Error(`There is no method ${methodName} within the ${plugster.name} controller !!!`);
                let plugsterNameLowerCased = parts[1];
                let eventNameLowerCased = parts[2];
                if (!Plugster.registry[plugsterNameLowerCased]) throw new Error(`There is no ${plugsterNameLowerCased} controller !!!`);
                let pubMethodsLowerCased = Object.getOwnPropertyNames(Object.getPrototypeOf(Plugster.registry[plugsterNameLowerCased])).map(methodName => {
                    return methodName.toLowerCase();
                });
                if (pubMethodsLowerCased.indexOf(eventNameLowerCased) < 0) throw new Error(`There is no ${eventNameLowerCased} event in ${plugsterNameLowerCased} controller !!!`);
                Plugster.htmlDeclaredSubscriptions[`${plugsterNameLowerCased}_${eventNameLowerCased}_${plugster.name.toLowerCase()}`] = {listener: plugster, methodName: methodName};
            });
        });

        window['plugsters'] = Plugster.registry;

    }

    setLocales(value) {
        this.locales = value;
    }

    translateTo(lang, text) {
        if(!this.locales[lang]) return text;
        if(!this.locales[lang][text]) return text;
        return this.locales[lang][text];
    }

    toString() {
        return this.name;
    }

    init() {
        let self = this;

        console.log(`Initializing ${self.name} Controller.`);

        let promises = self.bindOutlets();
        if (promises.length === 0) {
            console.log(`${self.name} Controller Initialized`);
            self.afterInit();
            return;
        }
        window.Promise.all(promises).then(function () {
            console.log(`${self.name} Controller Initialized`);
            self.afterInit();
        });
    }

    afterInit() {
        throw new Error('Every Plugster must implement its own afterInit method !!!');
    }

    bindOutlets() {

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
                    if ($(o).closest('[data-controller-name]').data('controller-name') === self.name) 
                        return $(o);
                    return null;
                });
                filteredOutlet = filteredOutlets[0];
            }

            filteredOutlet.attr('id', `${self.name}_${key}`);

            if (filteredOutlet.data('child-templates')) {
                filteredOutlet.buildListItem = function (withTemplateIndex, itemKey, jsonData, outletsSchema, itemClickCallback) {
                    if (!this.items) this.items = {};
                    if (!this.items[itemKey]) this.items[itemKey] = {};
                    this.append(self.childTemplates[`${key}_${withTemplateIndex}`]);
                    let outlets = self.compileChildTemplate(key, this.children().length - 1, this.children().last(), outletsSchema);
                    if (outlets === null) return null;
                    outlets.root.attr('data-key', itemKey);
                    if(itemClickCallback)
                        outlets.root.click(function() {
                            itemClickCallback(itemKey, jsonData);
                        });
                    this.items[itemKey].outlets = outlets;
                    this.items[itemKey].data = jsonData;
                    return this.items[itemKey].outlets;
                };
                filteredOutlet.count = function () {
                    if (!this.items) return 0;
                    return Object.keys(this.items).length;
                };
                filteredOutlet.getData = function (key) {
                    return this.items[key].data;
                };
                filteredOutlet.getOutlets = function (key) {
                    return this.items[key].outlets;
                };
                filteredOutlet.delete = function(key) {
                    this.children(`[data-key='${key}']`).remove();
                    delete this.items[key];
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

    }

    loadChildTemplate(outletName, index, file, deferred) {
        let self = this;
        $.get({url: file, cache: false}, function (html) {         
            self.childTemplates[`${outletName}_${index}`] = html;
            console.log(`Template ${file} loaded.`);
            deferred.resolve();
        });
    }

    compileChildTemplate(parentOutletId, childIndex, template, outletsSchema) {
        // TODO: Validate schema compliance.
        if (!outletsSchema || Object.keys(outletsSchema).length === 0) return null;
        let outlets = {};
        outlets.root = template;
        $.map(template.find('[data-child-outlet-id]'), function (outlet) {
            $(outlet).attr('id', `${parentOutletId}_${$(outlet).data('child-outlet-id')}_${childIndex}`);
            outlets[$(outlet).data('child-outlet-id')] = $(outlet);
        });
        return outlets;
    }

    registerEventSignature(name, data, callback) {
        if (!name) return;
        if (!data) return;
        if (!callback) return;
        let unreferencedData = this.cloneDeep(data);
        $(this).on(name, unreferencedData, callback);
    }

    dispatchEvent(name, args) {
        let unreferencedArgs = this.cloneDeep(args);
        this.broadcastExplicitSubscriptionsMessages(name, unreferencedArgs);
        this.broadcastHtmlDeclaredSubscriptionsMessages(name, unreferencedArgs);
        $(this).triggerHandler(new $.Event(name,{args: unreferencedArgs}));
    }

    // Taken from https://medium.com/weekly-webtips/deep-clone-with-vanilla-js-5ef16e0b365c
    cloneDeep(entity, cache = new WeakMap) {
        let self = this;
        const referenceTypes = ['Array', 'Object', 'Map', 'Set', 'WeakMap', 'WeakSet'];
        const entityType = Object.prototype.toString.call(entity);
        if (!new RegExp(referenceTypes.join('|')).test(entityType)) return entity;
        if (cache.has(entity)) {
            return cache.get(entity);
        }
        const c = new entity.constructor;
        if (entity instanceof Map || entity instanceof WeakMap) {
            entity.forEach((value, key) => c.set(self.cloneDeep(key), self.cloneDeep(value)));
        }
        if (entity instanceof Set || entity instanceof WeakSet) {
            entity.forEach((value) => c.add(self.cloneDeep(value)));
        }
        cache.set(entity, c);
        return Object.assign(c, ...Object.keys(entity).map((prop) => ({ [prop]: self.cloneDeep(entity[prop], cache) })));
    }

    broadcastExplicitSubscriptionsMessages(name, args) {
        let self = this;
        let keyPrefix = `${this.name}_${name}`.toLowerCase();
        Object.keys(Plugster.explicitSubscriptions).map(function(key) {
            if(key.startsWith(keyPrefix)) {
                if (!Plugster.explicitSubscriptions[key]['onNewMessage']) throw new Error('Subscriber must implement onNewMessage method.');
                Plugster.explicitSubscriptions[key]['onNewMessage'](self.name, name, args);
            }
        });
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

    // Explicit subscriptions enrollment, you will need a default listener on the subscriber called onNewMessage
    // to use this kind of subscriptions
    listenTo(pubPlugster, event) {
        Plugster.explicitSubscriptions[`${pubPlugster.name}_${event.name}_${this.name}`.toLowerCase()] = this;
    }

    static createView(controllerName, htmlTemplateFile, callback) {
        $.get({url: htmlTemplateFile, cache: false}, function(html) {
            callback(html.replace('[CONTROLLER_NAME]', controllerName));
        });
    }

}

export {Plugster}
