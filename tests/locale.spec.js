/**
 * @jest-environment jsdom
 **/

import {Plugster} from '../src/plugster.js';

describe('When using multilanguage', () => {

    class MyLocalizedPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }
        afterInit() {
        }
    }

    it('should return available translations', () => {

        document.body.innerHTML = '<div data-controller-name="MyLocalizedPlugster"></div>';

        let myPlugster = new MyLocalizedPlugster({});
        myPlugster.setLocales({
            'es': {
                'Hi': 'Hola'
            }
        });
        expect(myPlugster.translateTo('es', 'Hi')).toBe('Hola');

    });

    it('should return same text if a transalation is missing', () => {

        document.body.innerHTML = '<div data-controller-name="MyLocalizedPlugster"></div>';

        let myPlugster = new MyLocalizedPlugster({});
        expect(myPlugster.translateTo('de', 'Hi')).toBe('Hi');

    });

});