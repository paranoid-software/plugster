# Plugster (._.)

Plugster is a wrapper for those who still consider jQuery as their preferred JavaScript library.

The wrapper has the following goals in mind:

1. Prevent indiscriminate use of jQuery-like selection statements.
2. Enable separation of views and controllers into separate files.
3. Enable the use of events as the main communication mechanism between controllers (Plugsters).

A plugster is a standalone view controller, which can access in a clean way to all the HTML elements previously declared as "outlets".

## Elements of a plugster

### The view

It can be any HTML element inside a page (even the body or the head section), but it is commonly a `<div>` element; and you can have as many "views" as you need inside the same HTML page.

The wrapper recognize a view by the existence of a **data-controller-id** attribute which must contain the plugster name.

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Some Title</title>
</head>
<body>

    <!-- This is plugster view. -->
    <div data-controller-name="PlugsterOne">
        <p>Static label</p>
        <!-- This is an outlet -->
        <select aria-label="Selector label" data-outlet-id="outletName"></select>
    </div>

    <!-- This is another plugster view. -->
    <div data-controller-name="PlugsterTwo">
        <p>
            Static label: <span data-outlet-id="outletId"></span>
        </p>
        <!-- This is a "list kind" outlet; every outlet of this kind can have one or more row templates (Standalone and independent HTML files which contains the list items elements). -->
        <div data-outlet-id="outletId"
             data-child-templates='["list-row-template.html"]'></div>
    </div>

    <!-- Thanks to ECMAScript 6 we can use modules, wich can contain all the controllers needed by the page. -->
    <script type="module" src="module.js"></script>

</body>
</html>
```

In the event of having nested views, the inner boundaries define the field of action for every controller, so an outlet X defined inside the plugster A wich is a child of plugster B can not be accessed by the plugster B.

### The outlets (._.)

We define an outlet as an HTML element which form part of a plugster by beign inside of it. They have a **data-outlet-id** attribute which holds its corresponding unique ID at the plugster context.

Every outlet defined in a view can be referenced and accessed by its corresponding controller as a jQuery component without using the $ selector directly, which helps to mantain the code with a little less effort.

### The controller

It is an instance of class extended from the Plugster Base Class. It must implement an initialization method to prepare all the outlets and dependencies in order to work properly.

```javascript
import Plugster from '../../libs/plugster/plugster.js';

class MyFirstPlugster extends Plugster {

    eventsDefinitions = {
        changed: 'changed'
    };

    constructor(outlets) {
        super('MyFirstPlugster', outlets);
    };

    init = function () {
        let self = this;
        window.Promise.all(self.bindOutlets()).then(function () {
            console.log(`${self.name} Controller Initialized.`);
            self.afterInit();
        });
    };

    afterInit = function () {

        let self = this;

        self._.someDropDownOutlet.on('change', function () {
            self.notifyValueSelection(this.value);
        });

        self._.someDropDownOutlet.append(new Option(1, 'Argentina'));
        self._.someDropDownOutlet.append(new Option(1, 'Colombia'));
        self._.someDropDownOutlet.append(new Option(1, 'Ecuador'));
        self._.someDropDownOutlet.append(new Option(1, 'Perú'));
        self._.someDropDownOutlet.append(new Option(1, 'Usa'));

    };

    notifyValueSelection = function (value) {
        let self = this;
        self.trigger(self.eventsDefinitions.changed, {value: value})
    };

    changed = function (data, callback) {
        let self = this;
        self.on(self.eventsDefinitions.changed, data, callback);
    };

}

export default new MyFirstPlugster({
    someDropDownOutlet: {}
});
```
