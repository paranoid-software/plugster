/**
 * @jest-environment jsdom
 **/

import $ from 'jquery';
window.$ = $;

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

describe('When explicit subscription is registered', () => {

    class MyFirstPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
            let self = this;
            self._.hiButton.on('click', {}, () => {
                self.dispatchEvent(self.myEvent.name, {message: 'Hi', nested: {message: 'Stranger'}, list: [1, 2, 3]});
            });
        }

        myEvent(data, callback) {
            this.registerEventSignature(this.myEvent.name, data, callback);
        }
    }

    class MySecondPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
        }

        onNewMessage(source, event, args) {
            console.log(source, event, args);
        }
    }

    class IncompletePlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
        }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
        Plugster.explicitSubscriptions = undefined;
    });

    it('should throw error when sub onNewMessage is missing', async () => {

        document.body.innerHTML = '<div data-controller-name="MyFirstPlugster"><div data-outlet-id="hiButton"></div></div><div data-controller-name="IncompletePlugster"></div>';

        let myFirstPlugster = new MyFirstPlugster({hiButton: {}});
        Plugster.plug(await myFirstPlugster.init());
        let mySecondPlugster = new IncompletePlugster({});
        Plugster.plug(await mySecondPlugster.init());
        mySecondPlugster.listenTo(myFirstPlugster, myFirstPlugster.myEvent);
        expect(() => {
            myFirstPlugster._.hiButton.trigger('click');
        }).toThrow('Subscriber must implement onNewMessage method.');

    });

    it('should excecute subscriber onNewMessage method', async () => {

        document.body.innerHTML = '<div data-controller-name="MyFirstPlugster"><div data-outlet-id="hiButton"></div></div><div data-controller-name="MySecondPlugster"></div>';

        let myFirstPlugster = new MyFirstPlugster({hiButton: {}});
        Plugster.plug(await myFirstPlugster.init());
        let mySecondPlugster = new MySecondPlugster({});
        Plugster.plug(await mySecondPlugster.init());
        mySecondPlugster.listenTo(myFirstPlugster, myFirstPlugster.myEvent);

        let spy = jest.spyOn(mySecondPlugster, 'onNewMessage');

        myFirstPlugster._.hiButton.trigger('click');

        expect(spy).toHaveBeenCalledTimes(1);

    });

});

describe('When implicit subscription is registered', () => {

    class MyFirstPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
            let self = this;
            self._.hiButton.on('click', {}, () => {
                self.dispatchEvent(self.myEvent.name, {message: 'Hi', nested: {message: 'Stranger'}, list: [1, 2, 3]});
            });
        }

        myEvent(data, callback) {
            this.registerEventSignature(this.myEvent.name, data, callback);
        }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
    });

    it('should execute registered callback', async () => {
        document.body.innerHTML = '<div data-controller-name="MyFirstPlugster"><div data-outlet-id="hiButton"></div></div>';
        let myFirstPlugster = new MyFirstPlugster({hiButton: {}});
        Plugster.plug(await myFirstPlugster.init());
        let spy = jest.spyOn(myFirstPlugster, 'myEvent');
        let mySet = new Set();
        mySet.add(1);
        mySet.add(5);
        mySet.add('Some text');
        myFirstPlugster.myEvent({id: 1, s: mySet}, function (e) {
            console.log(e.data);
        });
        myFirstPlugster._.hiButton.trigger('click');
        expect(spy).toHaveBeenCalledTimes(1);
    });

});