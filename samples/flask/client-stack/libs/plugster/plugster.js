export default class Plugster {

    constructor(outlets, controllerName) {

        Plugster.document = $(document);

        this.dictionary = {};
        this.name = controllerName || this.constructor.name;

        console.log(`${this.name} Controller Instantiated.`);

        if (!Plugster.registry) {
            Plugster.registry = {};
            $('[data-controller-name]').map(function(index, val) {
               Plugster.registry[$(val).data('controllerName').toLowerCase()] = undefined;
            });
        }

        Plugster.registry[this.name.toLowerCase()] = this;

        if (!Plugster.explicitSubscriptions) Plugster.explicitSubscriptions = {};
        if (!Plugster.htmlDeclaredSubscriptions) Plugster.htmlDeclaredSubscriptions = {};

        this._ = outlets;
        this.childTemplates = {};
        this.init();

        let allPlugstersRegistered = true;
        Object.keys(Plugster.registry).map(function(key) {
            if(!Plugster.registry[key]) allPlugstersRegistered = false;
        });

        if(allPlugstersRegistered && !window.plugsters) {
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
                    if(!plugster[methodName]) throw new Error(`There is no method ${methodName} within the ${plugster.name} controller !!!`);
                    let plugsterNameLowerCased = parts[1];
                    let eventNameLowerCased = parts[2];
                    if(!Plugster.registry[plugsterNameLowerCased]) throw new Error(`There is no ${plugsterNameLowerCased} controller !!!`);
                    let pubMethodsLowerCased = Object.getOwnPropertyNames(Object.getPrototypeOf(Plugster.registry[plugsterNameLowerCased])).map(methodName => {
                        return methodName.toLowerCase();
                    });
                    if(pubMethodsLowerCased.indexOf(eventNameLowerCased) < 0) throw new Error(`There is no ${eventNameLowerCased} event in ${plugsterNameLowerCased} controller !!!`);
                    Plugster.htmlDeclaredSubscriptions[`${plugsterNameLowerCased}_${eventNameLowerCased}_${plugster.name.toLowerCase()}`] = {listener: plugster, methodName: methodName};
                });
            });
            window.plugsters = Plugster.registry;
        }

    }
        Plugster.registry[this.name.toLowerCase()] = this;

    setDictionary(value) {
        this.dictionary = value;
    }

    translateTo(lang, text) {
        if(!this.dictionary[lang]) return text;
        if(!this.dictionary[lang][text]) return text;
        return this.dictionary[lang][text];
    }

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

            filteredOutlet.attr('id',`${self.name}_${key}`);

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
        let unreferenced = _.cloneDeep(data);
        $(this).on(name, unreferenced, callback);
    }

    dispatchEvent(name, args) {
        let unreferenced = _.cloneDeep(args);
        this.broadcastExplicitSubscriptionsMessages(name, unreferenced);
        this.broadcastHtmlDeclaredSubscriptionsMessages(name, unreferenced);
        $(this).trigger(new $.Event(name, {args: unreferenced}));
    }

    broadcastExplicitSubscriptionsMessages(name, args) {
        let self = this;
        let keyPrefix = `${this.name}_${name}`.toLowerCase();
        Object.keys(Plugster.explicitSubscriptions).map(function(key) {
            if(key.startsWith(keyPrefix)) {
                Plugster.explicitSubscriptions[key]?.onNewMessage(self.name, name, args);
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
    listenTo(pubPlugster, event) {
/*        if (!event) {
            console.log(1,`${pubPlugster.name}_${this.name}`)
            Plugster.explicitSubscriptions[`${pubPlugster.name}_${this.name}`.toLowerCase()] = this;
            return;
        }*/
        Plugster.explicitSubscriptions[`${pubPlugster.name}_${event.name}_${this.name}`.toLowerCase()] = this;
    }

    static createView(controllerName, htmlTemplateFile, callback) {
        $.get({url: htmlTemplateFile, cache: false}, function(html) {
            callback(html.replace('[CONTROLLER_NAME]', controllerName));
        });
    }

}
