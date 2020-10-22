import CurrencySelector from './currency-selector.js';
import ExchangeRatesViewer from './exchange-rates-viewer.js';

CurrencySelector.changed({}, function (e) {
    if (e.args.value === 'USD') alert('USD FTW !!');
    ExchangeRatesViewer.invalidateRatesList(e.args.value);
});

CurrencySelector.init();
ExchangeRatesViewer.init();
