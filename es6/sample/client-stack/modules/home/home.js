import currencySelector from './currency-selector.js';
import exchangeRatesViewer from './exchange-rates-viewer.js';

console.log(currencySelector.toString());
console.log(exchangeRatesViewer.toString());

//exchangeRatesViewer.listenTo(currencySelector);
//exchangeRatesViewer.listenTo(currencySelector, currencySelector.currencyChanged);

/*
currencySelector.currencyChanged({}, function (e) {
    if (e.args.value === 'USD') alert('USD FTW !!');
    exchangeRatesViewer.invalidateRatesList(e.args.value);
});
*/