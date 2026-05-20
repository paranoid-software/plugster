/**
 * @jest-environment jsdom
 **/

import $ from 'jquery';
window.$ = $;

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

const ROW_HTML = '<div><span data-child-outlet-id="childOutlet"></span></div>';

describe('Child template loader cache', () => {

    class PlugsterA extends Plugster {
        constructor(outlets) { super(outlets); }
        afterInit() {}
    }

    class PlugsterB extends Plugster {
        constructor(outlets) { super(outlets); }
        afterInit() {}
    }

    beforeEach(() => {
        Plugster.registry = undefined;
        Plugster.childTemplateHtmlCache = undefined;
        Plugster.childTemplateRequestCache = undefined;
    });

    it('serves a second load of the same URL from the memory cache', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PlugsterA">' +
              '<div data-outlet-id="list" data-child-templates=\'["row.html"]\'></div>' +
            '</div>' +
            '<div data-controller-name="PlugsterB">' +
              '<div data-outlet-id="list" data-child-templates=\'["row.html"]\'></div>' +
            '</div>';

        $.get = jest.fn().mockImplementation((opt, callback) => {
            callback(ROW_HTML);
            return undefined;
        });

        await new PlugsterA({list: {}}).init();
        await new PlugsterB({list: {}}).init();

        expect($.get).toHaveBeenCalledTimes(1);
        expect(Plugster.childTemplateHtmlCache['row.html']).toBe(ROW_HTML);
    });

    it('dedupes concurrent loads of the same URL via the in-flight cache', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PlugsterA">' +
              '<div data-outlet-id="list" data-child-templates=\'["row.html"]\'></div>' +
            '</div>' +
            '<div data-controller-name="PlugsterB">' +
              '<div data-outlet-id="list" data-child-templates=\'["row.html"]\'></div>' +
            '</div>';

        const pendingCallbacks = [];
        $.get = jest.fn().mockImplementation((opt, callback) => {
            pendingCallbacks.push(callback);
            return {fail: () => {}};
        });

        const initA = new PlugsterA({list: {}}).init();
        const initB = new PlugsterB({list: {}}).init();

        expect($.get).toHaveBeenCalledTimes(1);
        expect(Plugster.childTemplateRequestCache['row.html']).toBeDefined();

        pendingCallbacks[0](ROW_HTML);
        await Promise.all([initA, initB]);

        expect($.get).toHaveBeenCalledTimes(1);
        expect(Plugster.childTemplateHtmlCache['row.html']).toBe(ROW_HTML);
        expect(Plugster.childTemplateRequestCache['row.html']).toBeUndefined();
    });

    it('rejects when the template url is empty', async () => {
        document.body.innerHTML =
            '<div data-controller-name="PlugsterA">' +
              '<div data-outlet-id="list" data-child-templates=\'[""]\'></div>' +
            '</div>';

        $.get = jest.fn();

        await expect(new PlugsterA({list: {}}).init())
            .rejects.toThrow('Child template url is required.');
        expect($.get).not.toHaveBeenCalled();
    });

});
