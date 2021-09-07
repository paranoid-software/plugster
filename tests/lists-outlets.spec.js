/**
 * @jest-environment jsdom
 **/

import {Plugster} from '../src/plugster.js';
import $ from '../src/jquery.module.js';
//import 'regenerator-runtime/runtime';

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

    it('should support list related methods', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        expect(myPlugster._.listOutlet).toHaveProperty('buildListItem');
        expect(myPlugster._.listOutlet).toHaveProperty('count');
        expect(myPlugster._.listOutlet).toHaveProperty('getData');
        expect(myPlugster._.listOutlet).toHaveProperty('getOutlets');
        expect(myPlugster._.listOutlet).toHaveProperty('delete');
        expect(myPlugster._.listOutlet).toHaveProperty('clear');

    });

    it('should support items addition', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        expect(myPlugster._.listOutlet.count()).toBe(1);

    });

    it('should support item click event', () => {

        const spy = jest.spyOn(console, 'log').mockImplementation();
        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        }, function(key, data) {
            console.log(key, data);
        });
        
        itemOutlets.childOutlet.text(itemData.name);
        itemOutlets.root.trigger('click');

        expect(spy).toHaveBeenLastCalledWith(itemData.id, itemData);

    });

    it('should support item data retreival', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);

        expect(myPlugster._.listOutlet.getData(itemData.id)).toStrictEqual({id: 1, name: 'Test'});

    });

    it('should support item retreival', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);

        expect(myPlugster._.listOutlet.getOutlets(itemData.id)).toStrictEqual(itemOutlets);

    });

    it('should support item deletion', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        myPlugster._.listOutlet.delete(itemData.id);
        expect(myPlugster._.listOutlet.count()).toBe(0);

    });

    it('should support all items deletion', () => {

        let myPlugster = new MyComplexPlugster({listOutlet: {}});

        let itemData = {id: 1, name: 'Test'};
        let itemOutlets = myPlugster._.listOutlet.buildListItem(0, itemData.id, itemData, {
            childOutlet: {}
        });
        itemOutlets.childOutlet.text(itemData.name);
        myPlugster._.listOutlet.clear();
        expect(myPlugster._.listOutlet.count()).toBe(0);

    });

});
