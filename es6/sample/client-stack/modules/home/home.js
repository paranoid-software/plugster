import CurrencySelector from './currency-selector.js';
import ExchangeRatesViewer from './exchange-rates-viewer.js';

CurrencySelector.currencyChanged({}, function (e) {
    if (e.args.value === 'USD') alert('USD FTW !!');
    ExchangeRatesViewer.invalidateRatesList(e.args.value);
});
