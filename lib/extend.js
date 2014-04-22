var extend = require('extend');
// Helper function to correctly set up the prototype chain, for subclasses.
// Similar to `goog.inherits`, but uses a hash of prototype properties and
// class properties to be extended.
module.exports = function(protoProps) {
    var parent = this;
    var child;

    // The constructor function for the new subclass is either defined by you
    // (the "constructor" property in your `extend` definition), or defaulted
    // by us to simply call the parent's constructor.
    if (protoProps && protoProps.hasOwnProperty('constructor')) {
        child = protoProps.constructor;
    } else {
        child = function() {
            var instance = this;
            if (!(instance instanceof child)) {
                instance = Object.create(child.prototype);
                child.apply(instance, arguments);
                return instance;
            }
            return parent.apply(this, arguments);
        };
    }

    // Add static properties to the constructor function, if supplied.
    extend(child, parent);

    // Set the prototype chain to inherit from `parent`, without calling
    // `parent`'s constructor function.
    child.prototype = Object.create(parent.prototype);
    child.prototype.constructor = child;

    // Add prototype properties (instance properties) to the subclass,
    // if supplied.
    if (protoProps) extend(child.prototype, protoProps);

    // Set a convenience property in case the parent's prototype is needed
    // later.
    child.__super__ = parent.prototype;

    return child;
};
