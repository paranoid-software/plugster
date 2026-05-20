/**
 * @jest-environment jsdom
 **/

import $ from 'jquery';
window.$ = $;

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

describe('Plugster.unplug', () => {

    class PublisherPlugster extends Plugster {
        constructor(outlets) { super(outlets); }
        afterInit() {}
        valueChanged(data, callback) {
            this.registerEventSignature(this.valueChanged.name, data, callback);
        }
    }

    class ListenerPlugster extends Plugster {
        constructor(outlets) { super(outlets); }
        afterInit() {}
        onNewMessage() {}
        handlePublisherplugsterValuechanged() {}
    }

    class DestroyablePlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
            this.destroyed = false;
        }
        afterInit() {}
        destroy() { this.destroyed = true; }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
        Plugster.explicitSubscriptions = undefined;
        Plugster.htmlDeclaredSubscriptions = undefined;
        Plugster.eventQueue = undefined;
        window['plugsters'] = undefined;
    });

    it('returns false when the argument is undefined', () => {
        expect(Plugster.unplug(undefined)).toBe(false);
    });

    it('returns false for an object that does not look like a plugster', () => {
        expect(Plugster.unplug({})).toBe(false);
    });

    it('removes the instance from the registry and window.plugsters', async () => {
        document.body.innerHTML = '<div data-controller-name="PublisherPlugster"></div>';
        const publisher = await new PublisherPlugster({}).init();
        Plugster.plug(publisher);

        expect(window['plugsters']).toHaveProperty('publisherplugster');

        const result = Plugster.unplug(publisher, {reason: 'test'});
        expect(result).toBe(true);
        expect(Plugster.registry).not.toHaveProperty('publisherplugster');
        expect(window['plugsters']).not.toHaveProperty('publisherplugster');
    });

    it('resolves the instance from the registry when given a string name', async () => {
        document.body.innerHTML = '<div data-controller-name="PublisherPlugster"></div>';
        const publisher = await new PublisherPlugster({}).init();
        Plugster.plug(publisher);

        const result = Plugster.unplug('PublisherPlugster');
        expect(result).toBe(true);
        expect(window['plugsters']).not.toHaveProperty('publisherplugster');
    });

    it('drops HTML declared subscriptions where the unplugged plugster is the listener', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PublisherPlugster"></div>' +
            '<div data-controller-name="ListenerPlugster" data-on-publisherplugster-valuechanged="handlePublisherplugsterValuechanged"></div>';

        const publisher = await new PublisherPlugster({}).init();
        const listener = await new ListenerPlugster({}).init();
        Plugster.plug(publisher);
        Plugster.plug(listener);

        expect(Object.keys(Plugster.htmlDeclaredSubscriptions).length).toBeGreaterThan(0);

        Plugster.unplug(listener);

        expect(Plugster.htmlDeclaredSubscriptions).toEqual({});
    });

    it('drops HTML declared subscriptions where the unplugged plugster is the publisher', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PublisherPlugster"></div>' +
            '<div data-controller-name="ListenerPlugster" data-on-publisherplugster-valuechanged="handlePublisherplugsterValuechanged"></div>';

        const publisher = await new PublisherPlugster({}).init();
        const listener = await new ListenerPlugster({}).init();
        Plugster.plug(publisher);
        Plugster.plug(listener);

        Plugster.unplug(publisher);

        expect(Plugster.htmlDeclaredSubscriptions).toEqual({});
    });

    it('drops explicit subscriptions where the unplugged plugster is the listener', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PublisherPlugster"></div>' +
            '<div data-controller-name="ListenerPlugster"></div>';

        const publisher = await new PublisherPlugster({}).init();
        const listener = await new ListenerPlugster({}).init();
        Plugster.plug(publisher);
        Plugster.plug(listener);
        listener.listenTo(publisher, publisher.valueChanged);

        expect(Object.keys(Plugster.explicitSubscriptions).length).toBe(1);

        Plugster.unplug(listener);

        expect(Plugster.explicitSubscriptions).toEqual({});
    });

    it('drops queued events targeting the unplugged plugster', async () => {
        document.body.innerHTML = '<div data-controller-name="PublisherPlugster"></div>';
        const publisher = await new PublisherPlugster({}).init();

        // window.plugsters is unset, so dispatchEvent goes to the queue.
        publisher.dispatchEvent('valueChanged', {n: 1});
        publisher.dispatchEvent('valueChanged', {n: 2});
        expect(Plugster.eventQueue.length).toBe(2);

        Plugster.unplug(publisher);

        expect(Plugster.eventQueue.length).toBe(0);
    });

    it('calls destroy() on the instance when options.destroy is true', async () => {
        document.body.innerHTML = '<div data-controller-name="DestroyablePlugster"></div>';
        const plugster = await new DestroyablePlugster({}).init();
        Plugster.plug(plugster);

        Plugster.unplug(plugster, {destroy: true});

        expect(plugster.destroyed).toBe(true);
    });

    it('does not call destroy() when options.destroy is omitted', async () => {
        document.body.innerHTML = '<div data-controller-name="DestroyablePlugster"></div>';
        const plugster = await new DestroyablePlugster({}).init();
        Plugster.plug(plugster);

        Plugster.unplug(plugster);

        expect(plugster.destroyed).toBe(false);
    });

});
