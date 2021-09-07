/**
 * @jest-environment jsdom
 **/

import $ from 'jquery';
window.$ = $;

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

describe('When html subscription is registered', () => {

    class MyFirstPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
            let self = this;
            self._.hiButton.on('click', {}, () => {
                const myMap = new Map();
                myMap.set('legacyId', '001');
                self.dispatchEvent(self.myEvent.name, {message: 'Hi', nested: {message: 'Stranger'}, myMap: myMap});
            });
        }

        myEvent(data, callback) {
            this.registerEventSignature(this.myEvent.name, data, callback);
        }
    }

    class IncompletePlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
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

        handleMyFirstPlugsterMyevent(data) {
            console.log(data);
        }
    }

    beforeEach(() => {
        Plugster.registry = undefined;
        Plugster.htmlDeclaredSubscriptions = undefined;
    });

    it('should throw error when sub handler is missing', async () => {

        document.body.innerHTML = '<div data-controller-name="MyFirstPlugster"><div data-outlet-id="hiButton"></div></div><div data-controller-name="IncompletePlugster" data-on-myfirstplugster-myevent="handleMyFirstPlugsterMyevent"></div>';

        let myFirstPlugster = await new MyFirstPlugster({hiButton: {}}).init();
        let incompletePlugster = await new IncompletePlugster({}).init();

        expect(() => {
            Plugster.plug(myFirstPlugster);
            Plugster.plug(incompletePlugster)
        }).toThrow('There is no method handleMyFirstPlugsterMyevent within the IncompletePlugster controller !!!');

    });

    it('should throw error when pub event is missing', async () => {

        document.body.innerHTML = '<div data-controller-name="IncompletePlugster"><div data-outlet-id="hiButton"></div></div><div data-controller-name="MySecondPlugster" data-on-incompleteplugster-myevent="handleMyFirstPlugsterMyevent"></div>';

        let incompletePlugster = await new IncompletePlugster({hiButton: {}}).init();
        let mySecondPlugster = await new MySecondPlugster({}).init();

        expect(() => {
            Plugster.plug(incompletePlugster);
            Plugster.plug(mySecondPlugster);
        }).toThrow('There is no myevent event in incompleteplugster controller !!!');

    });

    it('should ', async () => {

        document.body.innerHTML = '<div data-controller-name="MyFirstPlugster"><div data-outlet-id="hiButton"></div></div><div data-controller-name="MySecondPlugster" data-on-myfirstplugster-myevent="handleMyFirstPlugsterMyevent"></div>';

        let myFirstPlugster = new MyFirstPlugster({hiButton: {}});
        let mySecondPlugster = new MySecondPlugster({});

        Plugster.plug(await myFirstPlugster.init());
        Plugster.plug(await mySecondPlugster.init());

        let spy = jest.spyOn(mySecondPlugster, 'handleMyFirstPlugsterMyevent');
        myFirstPlugster._.hiButton.trigger('click');
        expect(spy).toHaveBeenCalledTimes(1);
    });

});