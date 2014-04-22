/* jshint proto: true */

module.exports = {
    subclass: (function() {
        return {}.__proto__ ?
        // Until ECMAScript supports array subclassing, prototype injection works well. 
        // See http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/

        function(object, prototype) {
            object.__proto__ = prototype;
        } :

        // And if your browser doesn't support __proto__, we'll use direct extension.

        function(object, prototype) {
            for (var property in prototype) object[property] = prototype[property];
        };
    })(),

    uniqueId: (function() {
        var idCounter = 0;
        return function(prefix) {
            var id = ++idCounter + '';
            return prefix ? prefix + id : id;
        };
    })(),

    urlError: function() {
        throw new Error('A "url" property or function must be specified');
    }
};
