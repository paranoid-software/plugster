class Plugster extends Object {

    constructor(outlets, controllerName) {
        super();

        if (!Plugster.document) {
            Plugster.document = $(document);
        }
        if (!Plugster.registry) {
            Plugster.registry = {};
            $('[data-controller-name]').map(function (index, val) {
                Plugster.registry[$(val).data('controllerName').toLowerCase()] = undefined;
            });
        }
        if (!Plugster.explicitSubscriptions) {
            Plugster.explicitSubscriptions = {};
        }
        if (!Plugster.htmlDeclaredSubscriptions) {
            Plugster.htmlDeclaredSubscriptions = {};
        }
        if (!Plugster.eventQueue) {
            Plugster.eventQueue = [];
        }
        if (!Plugster.childTemplateHtmlCache) {
            Plugster.childTemplateHtmlCache = {};
        }
        if (!Plugster.childTemplateRequestCache) {
            Plugster.childTemplateRequestCache = {};
        }

        this.locales = {};
        this.name = controllerName || this.constructor.name;
        this._ = outlets;
        this.childTemplates = {};

        console.info(`${this.name} Controller Instantiated.`);
    }

    static plug(me) {
        Plugster.registry[me.name.toLowerCase()] = me;

        let allPlugstersRegistered = true;
        Object.keys(Plugster.registry).forEach(function (key) {
            if (!Plugster.registry[key]) {
                allPlugstersRegistered = false;
            }
        });

        if (!allPlugstersRegistered) return;

        //if (window['plugsters']) return;

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
                let pubMethodsLowerCased = !Plugster.registry[plugsterNameLowerCased] ? [] : Object.getOwnPropertyNames(Object.getPrototypeOf(Plugster.registry[plugsterNameLowerCased])).map(methodName => {
                    return methodName.toLowerCase();
                });
                if (pubMethodsLowerCased.indexOf(eventNameLowerCased) >= 0) {
                    Plugster.htmlDeclaredSubscriptions[`${plugsterNameLowerCased}_${eventNameLowerCased}_${plugster.name.toLowerCase()}`] = {
                        listener: plugster,
                        methodName: methodName
                    };
                }
            });
        });

        window['plugsters'] = Plugster.registry;

        Plugster.processEventQueue();

    }

    static processEventQueue() {
        while (Plugster.eventQueue.length > 0) {
            const { name, args, target } = Plugster.eventQueue.shift();
            target.dispatchEvent(name, args);
        }
    }

    static _plugsterNameFrom(instanceOrName) {
        if (!instanceOrName) return '';
        if (typeof instanceOrName === 'string') return instanceOrName.toLowerCase();
        if (typeof instanceOrName === 'object' && instanceOrName.name) return String(instanceOrName.name).toLowerCase();
        return '';
    }

    static unplug(instanceOrName, options = {}) {
        const name = Plugster._plugsterNameFrom(instanceOrName);
        if (!name) return false;

        const instance = typeof instanceOrName === 'object' && instanceOrName
            ? instanceOrName
            : (Plugster.registry ? Plugster.registry[name] : null);
        const removed = {
            queue: 0,
            explicitSubscriptions: 0,
            htmlDeclaredSubscriptions: 0,
            registry: 0,
        };

        if (instance) {
            // Remove event handlers registered over the plugster instance via registerEventSignature.
            $(instance).off();
        }

        // Drop queued events targeting this instance.
        if (instance && Array.isArray(Plugster.eventQueue)) {
            const before = Plugster.eventQueue.length;
            Plugster.eventQueue = Plugster.eventQueue.filter(function (queuedEvent) {
                return queuedEvent.target !== instance;
            });
            removed.queue = before - Plugster.eventQueue.length;
        }

        // Remove explicit subscriptions where this plugster is publisher or listener.
        if (Plugster.explicitSubscriptions) {
            Object.keys(Plugster.explicitSubscriptions).forEach(function (key) {
                const subscription = Plugster.explicitSubscriptions[key];
                const isPublisher = key.startsWith(`${name}_`);
                const isListener = key.endsWith(`_${name}`);
                if (subscription === instance || isPublisher || isListener) {
                    delete Plugster.explicitSubscriptions[key];
                    removed.explicitSubscriptions += 1;
                }
            });
        }

        // Remove HTML declared subscriptions where this plugster is publisher or listener.
        if (Plugster.htmlDeclaredSubscriptions) {
            Object.keys(Plugster.htmlDeclaredSubscriptions).forEach(function (key) {
                const subscription = Plugster.htmlDeclaredSubscriptions[key];
                const isPublisher = key.startsWith(`${name}_`);
                const isListener = key.endsWith(`_${name}`);
                if ((subscription && subscription.listener === instance) || isPublisher || isListener) {
                    delete Plugster.htmlDeclaredSubscriptions[key];
                    removed.htmlDeclaredSubscriptions += 1;
                }
            });
        }

        if (Plugster.registry && Object.prototype.hasOwnProperty.call(Plugster.registry, name)) {
            delete Plugster.registry[name];
            removed.registry = 1;
        }

        if (window['plugsters']) window['plugsters'] = Plugster.registry;

        console.info('[Plugster] unplug', {
            name: name,
            reason: String(options.reason || '').trim() || 'unspecified',
            removed,
        });

        if (options.destroy === true && instance && typeof instance.destroy === 'function') {
            instance.destroy();
        }

        return true;
    }

    setLocales(value) {
        this.locales = value;
    }

    translateTo(lang, text) {
        if (!this.locales[lang]) return text;
        if (!this.locales[lang][text]) return text;
        return this.locales[lang][text];
    }

    // noinspection JSUnusedGlobalSymbols
    outletOf(elem) {
        return $(elem);
    }

    toString() {
        return this.name;
    }

    init() {
        let self = this;

        console.info(`Initializing ${self.name} Controller.`);

        let childTemplatesLoadPromises = self.bindOutlets();
        return new window.Promise((resolve, reject) => {
            return window.Promise.all(childTemplatesLoadPromises).then(function () {
                console.info(`${self.name} Controller Initialized`);
                self.afterInit();
                resolve(self);
            }).catch(e => {
                reject(e);
            });
        });
    }

    afterInit() {
        throw new Error('Every Plugster must implement its own afterInit method !!!');
    }

    bindOutlets() {

        let self = this;

        console.debug(`Binding Outlets for ${self.name} Controller.`);

        let childTemplatesLoadPromises = [];
        let controllerSelectorSentence = `[data-controller-name=${self.name}]`;
        if ($(controllerSelectorSentence).length === 0) throw new Error(`There is no view with a ${self.name} controller !!!`);

        let root = $(controllerSelectorSentence);

        $.map(self._, function (outlet, key) {

            let selector = `[data-outlet-id='${key}']`;
            if (root.find(selector).length === 0) {
                console.warn(`Outlet ${key} does not exist, check both ${self.name} view and controller and make sure is not intentional !!!`);
                self._[key] = null;
                return;
            }

            let filteredOutlet = root.find(selector);
            if (filteredOutlet.length > 1) {
                let filteredOutlets = $.map(filteredOutlet, function (o) {
                    if ($(o).closest('[data-controller-name]').data('controller-name') === self.name)
                        return $(o);
                    return null;
                });
                if (filteredOutlets.length === 0) {
                    console.warn(`Outlet ${key} does not exist, check both ${self.name} view and controller and make sure is not intentional !!!`);
                    self._[key] = null;
                    return;
                }
                filteredOutlet = filteredOutlets[0];
            }

            filteredOutlet.attr('id', `${self.name}_${key}`);

            if (filteredOutlet.data('child-templates')) {
                filteredOutlet.buildListItem = function (withTemplateIndex, itemKey, jsonData, outletsSchema, atIndex=0, itemClickCallback= undefined) {
                    if (!this.items) this.items = {};
                    if (!this.items[itemKey]) this.items[itemKey] = {};

                    // Update indices of existing items that will be shifted BEFORE inserting
                    // Items at atIndex or after need their indices incremented by 1
                    for (let existingKey in this.items) {
                        if (existingKey !== itemKey && this.items[existingKey].index >= atIndex) {
                            this.items[existingKey].index += 1;
                        }
                    }

                    if (atIndex === 0) {
                        this.prepend(self.childTemplates[`${key}_${withTemplateIndex}`]);
                    }
                    else {
                        this.children().eq(atIndex - 1).after(self.childTemplates[`${key}_${withTemplateIndex}`]);
                    }
                    let outlets = self.compileChildTemplate(key, atIndex, atIndex === 0 ? this.children().first() : this.children().eq(atIndex), outletsSchema);
                    if (outlets === null) return null;
                    outlets.root.attr('data-key', itemKey);
                    if (itemClickCallback)
                        outlets.root.click(function () {
                            itemClickCallback(itemKey, jsonData);
                        });
                    this.items[itemKey].outlets = outlets;
                    this.items[itemKey].data = jsonData;
                    this.items[itemKey].index = atIndex;  // Track insertion position
                    return this.items[itemKey].outlets;
                };
                filteredOutlet.count = function () {
                    if (!this.items) return 0;
                    return Object.keys(this.items).length;
                };
                filteredOutlet.setData = function (key, data) {
                    if (!this.items) return;
                    if (!this.items[key]) return;
                    this.items[key].data = data;
                };
                filteredOutlet.getData = function (key) {
                    if (!this.items || Object.keys(this.items).length === 0 || !this.items[key]) return null;
                    return this.items[key].data;
                };
                filteredOutlet.getOutlets = function (key) {
                    if (!this.items || Object.keys(this.items).length === 0 || !this.items[key]) return null;
                    return this.items[key].outlets;
                };
                filteredOutlet.delete = function (key) {
                    this.children(`[data-key='${key}']`).remove();
                    delete this.items[key];
                };
                filteredOutlet.clear = function () {
                    this.items = undefined;
                    this.children().remove();
                };
                filteredOutlet.getItems = function () {
                    return this.items;
                };
                filteredOutlet.getItemsAsArray = function () {
                    if (!this.items) return [];

                    // Convert dict to array, sorted by index
                    return Object.values(this.items)
                        .sort((a, b) => a.index - b.index);
                };
                filteredOutlet.moveItem = function (key, direction) {
                    if (!this.items || !this.items[key]) {
                        throw new Error(`Item with key "${key}" does not exist`);
                    }

                    // Get current index from stored data
                    const currentIndex = this.items[key].index;
                    const newIndex = currentIndex + direction;

                    // Validate new position
                    const totalItems = Object.keys(this.items).length;
                    if (newIndex < 0) {
                        throw new Error(`Cannot move item "${key}" to position ${newIndex}. Position must be >= 0`);
                    }
                    if (newIndex >= totalItems) {
                        throw new Error(`Cannot move item "${key}" to position ${newIndex}. Position must be < ${totalItems}`);
                    }

                    // Same position, no-op
                    if (newIndex === currentIndex) {
                        return;
                    }

                    // Find the item at target position to swap indices
                    let targetKey = null;
                    for (let itemKey in this.items) {
                        if (this.items[itemKey].index === newIndex) {
                            targetKey = itemKey;
                            break;
                        }
                    }

                    if (!targetKey) {
                        throw new Error(`No item found at target position ${newIndex}`);
                    }

                    // Get DOM elements
                    const allChildren = Array.from(this[0].children);
                    const currentItem = allChildren.find(child => child.getAttribute('data-key') === key);
                    const targetItem = allChildren.find(child => child.getAttribute('data-key') === targetKey);

                    if (!currentItem || !targetItem) {
                        throw new Error(`DOM elements not found for move operation`);
                    }

                    // Move DOM element
                    if (direction < 0) {
                        // Move backwards (towards start)
                        this[0].insertBefore(currentItem, targetItem);
                    } else {
                        // Move forwards (towards end)
                        this[0].insertBefore(currentItem, targetItem.nextSibling);
                    }

                    // Swap indices in stored data
                    this.items[key].index = newIndex;
                    this.items[targetKey].index = currentIndex;
                };
                let templates = filteredOutlet.data('child-templates');
                $.map(templates, function (childTemplate, index) {
                    let deferred = $.Deferred();
                    childTemplatesLoadPromises.push(deferred.promise());
                    self.loadChildTemplate(key, index, childTemplate, deferred);
                });
            }

            for (const prop in outlet) {
                if (outlet.hasOwnProperty(prop)) {
                    filteredOutlet[prop] = outlet[prop];
                }
            }

            self._[key] = filteredOutlet;

        });

        self._.root = root;

        console.debug(`Outlets for ${self.name} Controller were binded successfuly !!!`);

        return childTemplatesLoadPromises;

    }

    loadChildTemplate(outletName, index, file, deferred) {
        let self = this;
        let url = String(file || '').trim();
        if (!url) {
            deferred.reject(new Error('Child template url is required.'));
            return;
        }

        let childTemplateKey = `${outletName}_${index}`;
        let cachedHtml = Plugster.childTemplateHtmlCache[url];
        if (typeof cachedHtml === 'string') {
            self.childTemplates[childTemplateKey] = cachedHtml;
            console.debug(`Template ${url} loaded from memory cache.`);
            deferred.resolve();
            return;
        }

        let inFlightRequest = Plugster.childTemplateRequestCache[url];
        if (inFlightRequest) {
            inFlightRequest
                .then(function (html) {
                    self.childTemplates[childTemplateKey] = html;
                    deferred.resolve();
                })
                .catch(function (err) {
                    deferred.reject(err);
                });
            return;
        }

        let requestPromise = new window.Promise(function (resolve, reject) {
            let completed = false;
            let jqRequest = $.get({url: url, cache: true}, function (html) {
                if (completed) return;
                completed = true;
                resolve(html);
            });
            if (jqRequest && typeof jqRequest.fail === 'function') {
                jqRequest.fail(function (_xhr, _status, errorThrown) {
                    if (completed) return;
                    completed = true;
                    reject(errorThrown instanceof Error ? errorThrown : new Error(`Failed to load template: ${url}`));
                });
            }
        });

        Plugster.childTemplateRequestCache[url] = requestPromise;
        requestPromise
            .then(function (html) {
                Plugster.childTemplateHtmlCache[url] = html;
                delete Plugster.childTemplateRequestCache[url];
                self.childTemplates[childTemplateKey] = html;
                console.debug(`Template ${url} loaded.`);
                deferred.resolve();
            })
            .catch(function (err) {
                delete Plugster.childTemplateRequestCache[url];
                deferred.reject(err);
            });
    }

    compileChildTemplate(parentOutletId, childIndex, template, outletsSchema) {
        if (!outletsSchema || Object.keys(outletsSchema).length === 0) return null;
        let outlets = {};
        outlets.root = template;
        $.map(template.find('[data-child-outlet-id]'), function (outlet) {
            if (!outletsSchema[$(outlet).data('child-outlet-id')]) throw new Error(`There is not child outlet under the name ${$(outlet).data('child-outlet-id')}`);
            let filteredOutlet = $(outlet);
            filteredOutlet.attr('id', `${parentOutletId}_${filteredOutlet.data('child-outlet-id')}_${childIndex}`);
            for (const prop in outletsSchema[$(outlet).data('child-outlet-id')]) {
                if (outletsSchema[$(outlet).data('child-outlet-id')].hasOwnProperty(prop)) {
                    filteredOutlet[prop] = outletsSchema[$(outlet).data('child-outlet-id')][prop];
                }
            }
            outlets[filteredOutlet.data('child-outlet-id')] = filteredOutlet;
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
        if (!window['plugsters']) {
            Plugster.eventQueue.push({ name, args, target: this });
            return;
        }
        let unreferencedArgs = this.cloneDeep(args);
        this.broadcastExplicitSubscriptionsMessages(name, unreferencedArgs);
        this.broadcastHtmlDeclaredSubscriptionsMessages(name, unreferencedArgs);
        $(this).triggerHandler(new $.Event(name, {args: unreferencedArgs}));
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
        return Object.assign(c, ...Object.keys(entity).map((prop) => ({[prop]: self.cloneDeep(entity[prop], cache)})));
    }

    broadcastExplicitSubscriptionsMessages(name, args) {
        let self = this;
        let keyPrefix = `${this.name}_${name}`.toLowerCase();
        Object.keys(Plugster.explicitSubscriptions).map(function (key) {
            if (key.startsWith(keyPrefix)) {
                if (!Plugster.explicitSubscriptions[key]['onNewMessage']) throw new Error('Subscriber must implement onNewMessage method.');
                Plugster.explicitSubscriptions[key]['onNewMessage'](self.name, name, args);
            }
        });
    }

    broadcastHtmlDeclaredSubscriptionsMessages(name, args) {
        let keyPrefix = `${this.name}_${name}`.toLowerCase();
        Object.keys(Plugster.htmlDeclaredSubscriptions).map(function (key) {
            if (key.startsWith(keyPrefix)) {
                let sub = Plugster.htmlDeclaredSubscriptions[key];
                sub.listener[sub.methodName].call(sub.listener, args);
            }
        });
    }

    // Explicit subscriptions enrollment, you will need a default listener on the subscriber called onNewMessage
    // to use this kind of subscription
    // noinspection JSUnusedGlobalSymbols
    listenTo(pubPlugster, event) {
        Plugster.explicitSubscriptions[`${pubPlugster.name}_${event.name}_${this.name}`.toLowerCase()] = this;
    }

    // noinspection JSUnusedGlobalSymbols
    static createView(controllerName, htmlTemplateFile, callback) {
        $.get({url: htmlTemplateFile, cache: true}, function (html) {
            callback(html.replace('[CONTROLLER_NAME]', controllerName));
        });
    }

}

export { Plugster };
