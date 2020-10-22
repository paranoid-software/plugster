# Plugster (._.)

Plugster is a wrapper for those who still consider jQuery as their preferred JavaScript library.

The wrapper has the following goals in mind:

1. Prevent indiscriminate use of jQuery-like selection statements.
2. Enable separation of views and controllers into separate files.
3. Enable the use of events as the main communication mechanism between controllers (Plugsters).

A plugster (._.) is a standalone view controller, which can access in a clean way to all the HTML elements previously declared as "outlets".

## Elements of a plugster

### The view

It can be any HTML element inside a page (even the body or the head section), but it is commonly a `<div>` element; and you can have as many "views" as you need inside the same HTML page.

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
        <select aria-label="Selector label" data-outlet-id="outletName"></select>
    </div>

    <!-- This is another plugster view. -->
    <div data-controller-name="PlugsterTwo">
        <p>
            Static label: <span data-outlet-id="outletId"></span>
        </p>
        <!-- This is a "list" outlet; every list can have one or more row templates, wich are also standalone and independent HTML files. -->
        <div data-outlet-id="outletId"
             data-child-templates='["list-row-template.html"]'></div>
    </div>

    <!-- Thanks to ECMAScript 6 we can use modules, wich can contain all the controllers needed by the page. -->
    <script type="module" src="module.js"></script>

</body>
</html>
```
