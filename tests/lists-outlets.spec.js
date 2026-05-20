/**
 * @jest-environment jsdom
 **/

import $ from 'jquery';
window.$ = $;

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

describe('When a plugster has a list outlet', () => {

    class MyComplexPlugster extends Plugster {
        constructor(props) {
            super(props);
        }

        afterInit() {
        }
    }

    beforeEach(() => {

        document.body.innerHTML = '<div data-controller-name="MyComplexPlugster"><div data-outlet-id="listOutlet" data-child-templates=\'["list-row-template.html"]\'></div></div>'

        $.get = jest.fn().mockImplementation((opt, callback) => {
            let html = '<div><span data-child-outlet-id="childOutlet"></span></div>';
            return Promise.resolve(callback(html));
        });

        window.Promise.all = jest.fn().mockImplementation((childTemplatesLoadPromises) => {
            return Promise.resolve(childTemplatesLoadPromises);
        });

    });

    it('should support list related methods', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        expect(myPlugster._.listOutlet).toHaveProperty('buildListItem');
        expect(myPlugster._.listOutlet).toHaveProperty('count');
        expect(myPlugster._.listOutlet).toHaveProperty('getData');
        expect(myPlugster._.listOutlet).toHaveProperty('getOutlets');
        expect(myPlugster._.listOutlet).toHaveProperty('delete');
        expect(myPlugster._.listOutlet).toHaveProperty('clear');

    });

    it('should support items addition', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        expect(myPlugster._.listOutlet.count()).toBe(1);

    });

    it('should support item click event', async () => {

        const fn = jest.fn();

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        }, 0, fn);

        itemOutlets.childOutlet.text(itemData.name);
        itemOutlets.root.trigger('click');

        expect(fn).toHaveBeenLastCalledWith(itemData.id, itemData);

    });

    it('should support item data retreival', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);

        expect(myPlugster._.listOutlet.getData(itemData.id)).toStrictEqual({id: 1, name: 'Test'});

    });

    it('should support item retreival', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);

        expect(myPlugster._.listOutlet.getOutlets(itemData.id)).toStrictEqual(itemOutlets);

    });

    it('should support item deletion', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        myPlugster._.listOutlet.delete(itemData.id);
        expect(myPlugster._.listOutlet.count()).toBe(0);

    });

    it('should support all items deletion', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        myPlugster._.listOutlet.clear();
        expect(myPlugster._.listOutlet.count()).toBe(0);

    });

    it('getItemsAsArray returns items sorted by insertion index', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {label: 'a'}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {label: 'b'}, {childOutlet: {}}, 1);
        myPlugster._.listOutlet.buildListItem(0, 'c', {label: 'c'}, {childOutlet: {}}, 2);

        const arr = myPlugster._.listOutlet.getItemsAsArray();
        expect(arr.map(i => i.data.label)).toEqual(['a', 'b', 'c']);

    });

    it('getItemsAsArray returns empty when no items have been added', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        expect(myPlugster._.listOutlet.getItemsAsArray()).toEqual([]);

    });

    it('buildListItem shifts existing indices when inserting at the middle', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);
        myPlugster._.listOutlet.buildListItem(0, 'middle', {}, {childOutlet: {}}, 1);

        const items = myPlugster._.listOutlet.getItems();
        expect(items.a.index).toBe(0);
        expect(items.middle.index).toBe(1);
        expect(items.b.index).toBe(2);

        const domKeys = Array.from(myPlugster._.listOutlet[0].children)
            .map(c => c.getAttribute('data-key'));
        expect(domKeys).toEqual(['a', 'middle', 'b']);

    });

    it('buildListItem shifts every existing item when prepending at index 0', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);
        myPlugster._.listOutlet.buildListItem(0, 'head', {}, {childOutlet: {}}, 0);

        const items = myPlugster._.listOutlet.getItems();
        expect(items.head.index).toBe(0);
        expect(items.a.index).toBe(1);
        expect(items.b.index).toBe(2);

    });

    it('moveItem swaps positions and DOM order when direction is +1', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);
        myPlugster._.listOutlet.buildListItem(0, 'c', {}, {childOutlet: {}}, 2);

        myPlugster._.listOutlet.moveItem('a', +1);

        const items = myPlugster._.listOutlet.getItems();
        expect(items.a.index).toBe(1);
        expect(items.b.index).toBe(0);
        expect(items.c.index).toBe(2);

        const domKeys = Array.from(myPlugster._.listOutlet[0].children)
            .map(c => c.getAttribute('data-key'));
        expect(domKeys).toEqual(['b', 'a', 'c']);

    });

    it('moveItem swaps positions and DOM order when direction is -1', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);
        myPlugster._.listOutlet.buildListItem(0, 'c', {}, {childOutlet: {}}, 2);

        myPlugster._.listOutlet.moveItem('c', -1);

        const items = myPlugster._.listOutlet.getItems();
        expect(items.a.index).toBe(0);
        expect(items.b.index).toBe(2);
        expect(items.c.index).toBe(1);

        const domKeys = Array.from(myPlugster._.listOutlet[0].children)
            .map(c => c.getAttribute('data-key'));
        expect(domKeys).toEqual(['a', 'c', 'b']);

    });

    it('moveItem with direction 0 is a no-op', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);

        myPlugster._.listOutlet.moveItem('a', 0);

        const items = myPlugster._.listOutlet.getItems();
        expect(items.a.index).toBe(0);
        expect(items.b.index).toBe(1);

    });

    it('moveItem throws for an unknown key', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});

        expect(() => myPlugster._.listOutlet.moveItem('ghost', +1))
            .toThrow('Item with key "ghost" does not exist');

    });

    it('moveItem throws when target index is below zero', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);

        expect(() => myPlugster._.listOutlet.moveItem('a', -1))
            .toThrow('Position must be >= 0');

    });

    it('moveItem throws when target index is past the last position', async () => {

        let myPlugster = await new MyComplexPlugster({listOutlet: {}}).init();

        myPlugster._.listOutlet.buildListItem(0, 'a', {}, {childOutlet: {}});
        myPlugster._.listOutlet.buildListItem(0, 'b', {}, {childOutlet: {}}, 1);

        expect(() => myPlugster._.listOutlet.moveItem('a', +5))
            .toThrow('Position must be < 2');

    });

});
