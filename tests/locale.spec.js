/**
 * @jest-environment jsdom
 **/

import {Plugster} from '../src/plugster.js';
import 'regenerator-runtime/runtime';

describe('When using multilanguage', () => {

    class MyLocalizedPlugster extends Plugster {
        constructor(outlets) {
            super(outlets);
        }

        afterInit() {
        }
    }

    it('should return available translations', async () => {

        document.body.innerHTML = '<div data-controller-name="MyLocalizedPlugster"></div>';

        let myPlugster = await new MyLocalizedPlugster({}).init();
        myPlugster.setLocales({
            'es': {
                'Hi': 'Hola'
            }
        });
        expect(myPlugster.translateTo('es', 'Hi')).toBe('Hola');

    });

    it('should return same text if a transalation is missing', async () => {

        document.body.innerHTML = '<div data-controller-name="MyLocalizedPlugster"></div>';

        let myPlugster = await new MyLocalizedPlugster({}).init();
        expect(myPlugster.translateTo('de', 'Hi')).toBe('Hi');

    });

});