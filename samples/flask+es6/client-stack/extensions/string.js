String.format = function () {
    let s = arguments[0];
    for (let i = 0; i < arguments.length - 1; i++) {
        let reg = new RegExp('\\{' + i + '\\}', 'gm');
        s = s.replace(reg, arguments[i + 1]);
    }
    return s;
};

String.concat = function (args) {
    let list = Array.prototype.slice.call(arguments, 0);
    return list.join('');
};

String.isNullOrEmpty = function () {
    let s = arguments[0];
    return !s || /^(\s*|null)$/i.test(s);
};

String.objectFormat = function (text, obj) {
    let prop, formattedText = text;
    for (prop in obj)
        if (obj.hasOwnProperty(prop))
            formattedText = formattedText.replace(["{", prop, "}"].join(''), obj[prop]);
    return formattedText;
};
