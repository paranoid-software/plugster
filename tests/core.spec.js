/**
 * @jest-environment jsdom
 **/

import {Plugster} from '../src/plugster.js';
import $ from '../src/jquery.module.js';
import 'regenerator-runtime/runtime';

describe('When a new explicit plugster is instantiated', () => {

    class MyBasicPlugster extends Plugster {
        constructor(outlets, controllerName) {
            super(outlets, controllerName);
        }
        afterInit() {
        }
    }

    it('instance name should match with the constructor provided name', done => {

        let explicitName = 'MyBasicPlugster1';

        $.get = jest.fn().mockImplementation((opt, callback) => {
            let html = '<div data-controller-name="[CONTROLLER_NAME]"></div>'.replace('[CONTROLLER_NAME]', explicitName);
            return Promise.resolve(callback(html));
        });

        Plugster.createView(explicitName, 'my-basic-plugster.html', function (html) {
            document.body.innerHTML = html;
            let myBasicPlugster1 = new MyBasicPlugster({}, explicitName);
            expect(myBasicPlugster1.toString()).toBe(explicitName);
            done();
        });

    });

});

describe('When a new implicit plugster is instantiated', () => {

    class MyBasicPlugster extends Plugster {
        constructor(props) {
            super(props);
        }
        afterInit() {
        }
    }

    it('instance name should match its class name', async () => {

        document.body.innerHTML = '<div data-controller-name="MyBasicPlugster"><span data-outlet-id="someOutlet"></span></div>';

        let myPlugster = await new MyBasicPlugster({someOutlet: {}});
        expect(myPlugster.toString()).toBe('MyBasicPlugster');

    });

    it('missing view should provoke and error', () => {

        document.body.innerHTML = '';

        expect(() => {
            new MyBasicPlugster({}).init();
        }).toThrow('There is no view with a MyBasicPlugster controller !!!');

    });

    it('missing outlet should provoke an error', () => {

        document.body.innerHTML = '<div data-controller-name="MyBasicPlugster"></div>';

        expect(() => {
            new MyBasicPlugster({someOutlet: {}}).init();
        }).toThrow('Outlet someOutlet does not exist, check both MyBasicPlugster view and controller !!!');

    });

    it('missing afterInit method should provoke an error', () => {

        document.body.innerHTML = '<div data-controller-name="MissingAfterInitPlugster"></div>';

        class MissingAfterInitPlugster extends Plugster {
            constructor(outlets) {
                super(outlets);
            }
        }

        expect(async () => {
            await new MissingAfterInitPlugster({}).init();
        }).rejects.toThrow('Every Plugster must implement its own afterInit method !!!');

    });

});

describe('When a plugster gets plugged', () => {

    class MyBasicPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }
        afterInit() {
        }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
    });

    it('must exists on window plugsters container', async () => {

        document.body.innerHTML = '<div data-controller-name="MyBasicPlugster"><span data-outlet-id="someOutlet"></span></div>';

        let myPlugster = await new MyBasicPlugster({someOutlet: {}}).init();
        Plugster.plug(myPlugster);

        expect(window['plugsters']).toHaveProperty(myPlugster.name.toLowerCase());

    });

});

describe("When a view has the same outlet on nested controllers", () => {

    class MyFristPlugster extends Plugster {
        constructor(props) {
            super(props);
        }
        afterInit() {
        }
    }

    class MySecondPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }
        afterInit() {
        }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
    });

    it('controller closest outlet should be linked', async () => {

        document.body.innerHTML = '<div data-controller-name="MyFristPlugster"><span data-outlet-id="someOutlet"></span><div data-controller-name="MySecondPlugster"><div data-outlet-id="someOutlet"></div></div></div>';

        let myFristPlugster = await new MyFristPlugster({someOutlet: {}}).init();
        Plugster.plug(myFristPlugster);

        let mySecondPlugster = await new MySecondPlugster({someOutlet: {}}).init();
        Plugster.plug(mySecondPlugster);

        expect(myFristPlugster._.someOutlet.is('span')).toBe(true);
        expect(mySecondPlugster._.someOutlet.is('div')).toBe(true);

    });

});
