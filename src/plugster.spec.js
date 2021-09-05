/**
* @jest-environment jsdom
**/

import { Plugster } from './plugster.js';
import $ from './jquery.module.js';

describe('When a new implicit plugster is instantiated', () => {

    it('missing view should throw error', () => {
        class MyFristPlugster extends Plugster {
            constructor(props) {
                super(props);
            }
            afterInit() {
            }
        }
        expect(() => {
            new MyFristPlugster({});
        }).toThrow('There is no view with a MyFristPlugster controller !!!');
    });

    it('plugster name should match its controller name', () => {

        document.body.innerHTML = '<div data-controller-name="MyFristPlugster"></div>';

        class MyFristPlugster extends Plugster {
            constructor(props) {
                super(props);
            }
            afterInit() {
            }
        }
        let myFristPlugster = new MyFristPlugster({});
        expect(myFristPlugster.name).toBe('MyFristPlugster');

    });

});

describe('When a new explicit plugster is instantiated', () => {

    it('plugster name should match its explicit controller name', done => {

        let explicitName = 'MyNewPlugster1';

        $.get = jest.fn().mockImplementation((opt, callback) => {
            let html = '<div data-controller-name="[CONTROLLER_NAME]"></div>';
            return Promise.resolve(callback(html.replace('[CONTROLLER_NAME]', explicitName)));
        });

        class MyNewPlugster extends Plugster {
            constructor(outlets, controllerName) {
                super(outlets, controllerName);
            }
            afterInit() {
            }
        }

        Plugster.createView(explicitName, 'my-new-plugster.html', function (html) {
            document.body.innerHTML = html;
            let myNewPlugster = new MyNewPlugster({}, explicitName);
            expect(myNewPlugster.name).toBe(explicitName);
            done();
        });

    });

});