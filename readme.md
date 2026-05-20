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

The wrapper recognize a view by the existence of a **data-controller-name** attribute which must contain the plugster name.

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

We define an outlet as an HTML element which form part of a plugster by beign inside it. They have a **data-outlet-id** attribute which holds its corresponding unique ID at the plugster context.

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
class MyPlugster extends Plugster {

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
                if (!itemOutlets) return null;
                itemOutlets.root.click(function () {
                    let key = this.dataset['key'];
                    console.log([key, self._.ratesList.getData(key)]);
                });
                itemOutlets.currencyCodeLabel.text(key);
                itemOutlets.valueLabel.text(rate);
            });
        });
    }

}
```

### List item positioning

The full signature of `buildListItem` is:

```javascript
listOutlet.buildListItem(withTemplateIndex, itemKey, jsonData, outletsSchema, atIndex = 0, itemClickCallback = undefined);
```

The fifth argument `atIndex` controls where the new item is inserted (default `0`, i.e. the beginning of the list). When inserting at a position already occupied, existing items at that position and beyond are shifted forward by one. Each item keeps its current position in `items[key].index`.

```javascript
self._.ratesList.buildListItem(0, 'eur', eurData, schema);              // index 0
self._.ratesList.buildListItem(0, 'usd', usdData, schema, 1);           // index 1, after eur
self._.ratesList.buildListItem(0, 'cop', copData, schema, 1);           // inserts at 1; usd shifts to 2
```

Two helpers expose the current ordering and let you reorder items after insertion:

- `listOutlet.getItemsAsArray()` returns the items as an array sorted by `index` (each entry has `outlets`, `data`, `index`). Use this when DOM order matters — `getItems()` returns a dictionary with no guaranteed iteration order.
- `listOutlet.moveItem(key, direction)` swaps the item identified by `key` with the one at `currentIndex + direction`, updating both the DOM and the stored indices. `direction` is typically `+1` or `-1`. Throws if the key does not exist or if the resulting position would fall outside `[0, count)`.

```javascript
self._.ratesList.moveItem('cop', +1);   // swap cop with the item below it
self._.ratesList.moveItem('cop', -1);   // swap cop with the item above it

self._.ratesList.getItemsAsArray().forEach(item => {
    console.log(item.index, item.data);
});
```

### Child template caching

Child template HTML is fetched once per URL and cached in memory for the lifetime of the page. If several plugsters declare the same template URL in their `data-child-templates`, only the first triggers an HTTP request; the rest read from the cache (or from the in-flight request if they request it concurrently). This is transparent — no opt-in is required.

## Plugster Boilerplate

```javascript
import {Plugster} from '../../libs/plugster/plugster.js';

class WorkingPlugster extends Plugster {

    constructor(outlets) {
        super(outlets);
    }

    afterInit() {
        // This is our entry point to the plugser,
        // here we can start coding the Plugster behavior
        // and using the declared outlets.

        let self = this;
        self._.someOutlet // ....
    }

    someEvent(data, callback) {
        this.registerEventSignature(this.someEvent.name, data, callback);
    }

}

let workingPlugster = await new WorkingPlugster({
    someOutlet: {}
}).init();

Plugster.plug(workingPlugster);

export {workingPlugster as WorkingPlugster};
```

## Plugster Sample

```javascript
import {Plugster} from '../../libs/plugster/plugster.js';

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

let myFirstPlugster = await new MyFirstPlugster({
    someDropDownOutlet: {}
}).init();

Plugster.plug(myFirstPlugster);

export {myFirstPlugster as MyFirstPlugster};
```

### Events declarations and dispatching

One of the main goals when using Plugster is to enable the adoption of events as the preferred communication mechanism between HTML views or widgets.

Plugster exposes various mechanisms to enable this type of communication, one of them is to implement two methods in the Plugster which desires to expose an event listener and dispatcher:

- **registerEventSignature**, using this method we can add a signature for a defined event, for example:

```javascript
class MyPlugster extends Plugster {

    valueChanged(data, callback) {
        this.registerEventSignature(this.valueChanged.name, data, callback);
    }

}
```

- **dispatchEvent**, using this method we can trigger an event from within a Plugster, for example:

```javascript
class MyPlugster extends Plugster {

    notifyValueSelection(value) {
        this.dispatchEvent(this.valueChanged.name, {value: value})
    }

}
```

Finally, in order to respond to the registered event the simplest way is to invoke the Plugster event registration method passing a callback as follows:

```javascript
import {MyPlugster} from './my-plugster.js';

MyPlugster.valueChanged({}, function (e) {
    console.log(e.args.value);
    // Do something else with the received data
});
```

#### HTML based events subscription

This is definitely the most clean and powerfull way of using events to communicate between Plugsters. Lets say we have plugsters A, B and C, and we need to communicate some value change on plugster A into B and C; we can do it easily, following the next steps:

- Expose an event registration method on the *source* Plugster A.

```javascript
class MyPlugsterA extends Plugster {

    valueChanged(data, callback) {
        this.registerEventSignature(this.valueChanged.name, data, callback);
    }

}
```

- Declare a listener method on the **target** Plugsters B and C.

```javascript
class MyPlugsterB extends Plugster {

    handleValueChange(data) {
        console.log(data);
        // Do something else with the recived data
    }

}

class MyPlugsterC extends Plugster {

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

- That's it !!, every time Plugster A dispatch an event using ```this.dispatchEvent(this.valueChanged.name, {someProperty: someValue})``` both target plugsters will recevice the data dispatched on its listeners.

## Plugster lifecycle

Plugsters are normally created once at page load and live for as long as the page does. For long-lived single-page applications, or when a region of the DOM is replaced and rebuilt, you can tear down a plugster cleanly with `Plugster.unplug`.

```javascript
Plugster.unplug(plugsterOrName, options);
```

The first argument is either the plugster instance or its name (case-insensitive). `unplug` performs the following:

- Removes any handler attached to the instance via `registerEventSignature`.
- Drops queued events targeting the instance (events that were dispatched before `Plugster.plug` ran).
- Removes every explicit subscription where the instance is publisher or listener.
- Removes every HTML-declared subscription where the instance is publisher or listener.
- Removes the entry from `Plugster.registry` and from the `window.plugsters` mirror.

Returns `true` on success, `false` if the argument cannot be resolved to a plugster name.

```javascript
// Tear down a plugster that responded to a route change.
Plugster.unplug(myEditor, { reason: 'route-change' });

// You can also pass the name as a string.
Plugster.unplug('MyEditor');
```

If the plugster needs to release resources of its own (clear timers, detach observers, etc.), define a `destroy()` method on the class and pass `{ destroy: true }`:

```javascript
class MyEditor extends Plugster {
    afterInit() {
        this.timer = setInterval(() => this.tick(), 1000);
    }
    destroy() {
        clearInterval(this.timer);
    }
}

Plugster.unplug(myEditor, { destroy: true, reason: 'navigation' });
```

The `reason` field is purely informational — it ends up in the console log entry that `unplug` writes, which helps when auditing teardowns in the browser devtools.

## Repository Content

The library is written as a single ES6 module. The source lives in `src/`, tests in `tests/`, and the build output (committed) in `dist/`.

```lang-none
plugster
└───dist
└───src
└───tests
│   .babelrc
│   .gitignore
│   LICENSE
│   package-lock.json
│   package.json
│   readme.md
│   rollup.config.js
```

## CDN thanks to jsdelivr

[https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.14/dist/plugster.min.js](https://cdn.jsdelivr.net/gh/paranoid-software/plugster@1.0.14/dist/plugster.min.js)

## Release process

Releases are cut by hand. Plugster is **not** published to npm — distribution happens through GitHub tags resolved by jsdelivr (`cdn.jsdelivr.net/gh/paranoid-software/plugster@<tag>/dist/plugster.min.js`), so the **tag is the release**.

### Branch model

- `main` only contains released code. Never commit directly to `main`.
- `develop` is the working branch. All changes land there first.
- Every release ships through a PR `develop → main`.

### Cutting a release

1. **Work on `develop`.** Commit the release content there.
2. **Bump `package.json` `version`** to the next number (e.g. `1.0.14`) as part of the same set of commits. From `1.0.14` onwards, `package.json` is kept in sync with the released tag.
3. **Rebuild `dist/`:** `npm run build`. The regenerated `dist/plugster.js`, `dist/plugster.min.js`, and `dist/plugster.min.js.map` are committed — jsdelivr serves `dist/` directly from the tag.
4. **Tests must pass:** `npm test`.
5. **Push `develop`** and open a PR `develop → main` on GitHub.
6. **Merge the PR** into `main`.
7. **Create the GitHub Release.** In the GitHub UI: Releases → "Draft a new release" → "Choose a tag" → type the new tag name (e.g. `1.0.14`) → "Create new tag: 1.0.14 on publish" → Target: `main` → write the notes → Publish. GitHub creates the tag at the tip of `main` when you click Publish. **Do not create the tag manually from the local CLI.**

After publishing, update consumers that pin the CDN URL (the paranoid.software portal, downstream apps) to the new tag.

### Historical notes

- Tags `1.0.6`–`1.0.13` are **lightweight** (pushed from local before the Release was opened); from `1.0.14` onwards the GitHub Release UI creates the tag (annotated).
- `package.json` `version` was left at `"1.0.11"` across releases `1.0.11`–`1.0.13`; from `1.0.14` onwards it is bumped every release.

## Library Dependencies and Development Dependencies

The library depends only on jQuery, at the moment we are using jQuery 3.6.0, but we believe it will work with older versions also.

For the development we depend on:

- jest, for testing environment.
- babel, for ES6 module testing.
- rollup & terser, for ES6 module distribution file generation. 

## Samples

The samples repository is located at [https://github.com/paranoid-software/plugster-samples](https://github.com/paranoid-software/plugster-samples)

There you can play with one small sample which runs on Flask (python). The sample try to demonstrate the communication betwwen 3 plugsters using a public Currency Rate API.

### Real world sample

We have a static blog hosted at GitHub.io, it was created using Plugster, and it is a more complete demo of the library; it is located at [https://paranoid-software.github.io](https://paranoid-software.github.io), and the code it's available at the GitHub repository located at [https://github.com/paranoid-software/paranoid-software.github.io](https://github.com/paranoid-software/paranoid-software.github.io)
