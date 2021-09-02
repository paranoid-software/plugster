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
    <title>My New Web Application</title>
</head>
<body>

    <!-- This is plugster view. -->
    <div data-controller-name="MyFirstPlugster">
        <p>Static label</p>
        <!-- This is an outlet -->
        <select aria-label="Selector label" data-outlet-id="someOutletId"></select>
    </div>

    <!-- This is another plugster view. -->
    <div data-controller-name="MySecondPlugster">
        <p>
            Static label: <span data-outlet-id="someOtherOutletId"></span>
        </p>
        <!-- This is a "list kind" outlet; every outlet of this kind can have one or more row
            templates (Standalone and independent HTML files which contains the list items elements). -->
        <div data-outlet-id="listOutletId"
             data-child-templates='["list-row-template.html"]'></div>
    </div>

    <!-- Thanks to ECMAScript 6 we can use modules, wich can contain
        all the controllers needed by the page. -->
    <script type="module" src="my-module.js"></script>

</body>
</html>
```

In the event of having nested views, the inner boundaries define the field of action for every controller, so an outlet X defined inside the plugster A wich is a child of plugster B can not be accessed by the plugster B.

### The outlets (._.)

We define an outlet as an HTML element which form part of a plugster by beign inside of it. They have a **data-outlet-id** attribute which holds its corresponding unique ID at the plugster context.

Every outlet defined in a view can be referenced and accessed by its corresponding controller as a jQuery component without using the $ selector directly, which helps to mantain the code with a little less effort.

### The controller

It is an instance of class extended from the Plugster Base Class. It must implement an initialization method to prepare all the outlets and dependencies in order to work properly.

## List type outlet

Sometimes we need to render complex lists using all kind of HTML elements, in that cases we can use a special outlet with a **data-child-templates** property set to an array of at least one HTML template for every item of the list. In the next example we specified two templates, the first one will be rendered for normal items inside the list, while the second one will be rendered for "deleted" items; in that way we can separate behavior from design and manage to render every item on the list accordingly to its current state.

```html
<div data-controller-name="MySecondPlugster">
    <div data-outlet-id="listOutletId"
        data-child-templates='["list-normal-row-template.html", "list-deleted-row-template.html"]'></div>
        <!-- We need to pass a json array in this property-->
</div>
```

A template is an HTML independent file in which we can design a complex item using other HTML elements (child outlets), which then will be referenced form within the controller using standard programming. The following examples include two independant HTML files used as templates for a list type outlet.

```html
<!-- This is a normal child template -->
<div>
    <span data-child-outlet-id="someOutletId"></span>: <span data-child-outlet-id="someOtherOutletId"></span>
</div>
```

```html
<!-- This is a deleted child template -->
<div>
    <span data-child-outlet-id="someOutletId" class="deleted"></span>: <span data-child-outlet-id="someOtherOutletId"></span>
    <p>
        <button data-child-outlet-id="someButtonOutletId">Undelete</button>
    </p>
</div>
```

### Using the child outlets whitin the controller

```javascript
...

    invalidateRatesList(forCurrency) {
        let self = this;
        self._.selectedCurrencyLabel.text(forCurrency);
        self.exchangeRatesSvcs.getLatest(forCurrency).then(function (response) {
            self._.ratesList.clear();
            Object.keys(response['rates']).map(function (key) {
                let rate = response['rates'][key];
                let itemAsJson = {};
                itemAsJson[key] = rate;
                // Here we use the first template specifying its array index 0,
                // but we can choose which one to use based for example in the item state,
                // using something like ...List.buildListItem(rate.state == 'deleted'? 1 : 0, key ....
                let itemOutlets = self._.ratesList.buildListItem(0, key, itemAsJson, {
                    currencyCodeLabel: {},
                    valueLabel: {}
                });
                if(!itemOutlets) return null;
                itemOutlets.root.click(function() {
                    let key = this.dataset['key'];
                    console.log([key, self._.ratesList.getData(key)]);
                });
                itemOutlets.currencyCodeLabel.text(key);
                itemOutlets.valueLabel.text(rate);
            });
        });
    }

...
```

## Plugster Boilerplate

```javascript
import Plugster from '../../libs/plugster/plugster.js';

class WorkingPlugster extends Plugster {

    constructor(outlets) {
        super(outlets);
    }

    afterInit() {
        // This is our entry point to the plugser,
        // here we can start coding the Plugster behavior
        // and using the declared outlets.

        let self = this;
        self._.someOutlet....
    }

    someEvent(data, callback) {
        this.registerEventSignature(this.someEvent.name, data, callback);
    }

}

// Here we export an instance instead of the classs, because we
// do not need to instantiate this plugster, the idea is more like
// having a controller for a specific HTML view or widget.
export default new WorkingPlugster({
    someOutlet: {}
});
```

## Plugster Sample

```javascript
import Plugster from '../../libs/plugster/plugster.js';

class MyFirstPlugster extends Plugster {

    constructor(outlets) {
        super(outlets);
    };

    afterInit() {

        let self = this;

        self._.someDropDownOutlet.on('change', function () {
            self.notifyValueSelection(this.value);
        });

        self._.someDropDownOutlet.append(new Option(1, 'Argentina'));
        self._.someDropDownOutlet.append(new Option(2, 'Colombia'));
        self._.someDropDownOutlet.append(new Option(3, 'Ecuador'));
        self._.someDropDownOutlet.append(new Option(4, 'Perú'));
        self._.someDropDownOutlet.append(new Option(5, 'Usa'));

    }

    notifyValueSelection(value) {
        this.dispatchEvent(this.valueChanged.name, {value: value})
    }

    valueChanged(data, callback) {
        this.registerEventSignature(this.valueChanged.name, data, callback);
    }

}

export default new MyFirstPlugster({
    someDropDownOutlet: {}
});
```

### Events declarations and dispatching

One of the main goals when using Plugster is to enable the adoption of events as the preferred communication mechanism between HTML views or widgets.

Plugster exposes various mechanisms to enable this type of communication, one of them is to implement two methods in the Plugster which desires to expose an event listener and dispatcher:

- **registerEventSignature**, using this method we can add a signature for a defined event, for example:

```javascript
...

    valueChanged(data, callback) {
        this.registerEventSignature(this.valueChanged.name, data, callback);
    }

}
```

- **dispatchEvent**, using this method we can trigger an event from within a Plugster, for example:

```javascript
...

    notifyValueSelection(value) {
        this.dispatchEvent(this.valueChanged.name, {value: value})
    }

...
```

Finally in order to respond to the registered event the simplest way is to invoke the Plugster event registration method passing a callback as follows:

```javascript
import MyPlugster from './my-plugster.js';

MyPlugster.valueChanged({}, function (e) {
    console.log(e.args.value);
    // Do something else with the received data
});
```

#### HTML based events subscription

This is definitely the most clean and powerfull way of using events to communicate between Plugsters. Lets say we have plugsters A, B and C, and we need to communicate some value change on plugster A into B and C; we can do it easily, following the next steps:

- Expose an event registration method on the *source* Plugster A.

```javascript
...

    valueChanged(data, callback) {
        this.registerEventSignature(this.valueChanged.name, data, callback);
    }

}
```

- Declare a listener method on the **target** Plugsters B and C.

```javascript
...

    handleValueChange(data) {
        console.log(data);
        // Do something else with the recived data
    }

}
```

- Declare the listener at view level on the HTML markup of every interested plugster (in this case plugsters B and C), using the attribute ```data-on-sourceplugstername-sourceeventname=targetListenerMethod```.

```html
<div data-controller-name="PlugsterB"
    data-on-plugstera-valuechanged="handleValueChange">
    <div data-outlet-id="someOutlet"></div>
</div>

<div data-controller-name="PlugsterC"
    data-on-plugstera-valuechanged="handleValueChange">
    <div data-outlet-id="someOutlet"></div>
</div>
```

- Thats it !!, every time Plugster A dispatch an event using ```this.dispatchEvent(this.valueChanged.name, {someProperty: someValue})``` both target plugsters will recevice the data dispatched on its listeners.

## Repository Content

In this repository we have 2 versions for the wrapper; the main version is written using ES6 standard and it is located at the "es6" folder. But we also publish a version based on the "Revealing Module Pattern" in case we need to work in a legacy project based on that pattern.

```lang-none
plugster
└───dist
└───src
└───samples
│   └───flask
│   LICENSE.md
│   readme.md
```

## CDN thanks to jsdelivr

[https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.11/dist/plugster.min.js](https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.11/dist/plugster.min.js)

## Samples

This repository includes one small samples using Flask (python).

The sample try to demonstrate the communication betwwen 3 plugsters using a Currency Rate Public API.

### Real world sample

We have a static blog hosted at github.io, it was created using Plugster and it is a more complete demo of the library; it is located at [https://paranoid-software.github.io](https://paranoid-software.github.io), and the code its available at the github repository located at [https://github.com/paranoid-software/paranoid-software.github.io](https://github.com/paranoid-software/paranoid-software.github.io)
