// This mixin will call the dispatch method on the object it is mixed into.
// It does the equivalent of a d3.rebind to call the dispatch method in its context
// Likewise it will work as a getter / setter returning either itself or the value returned by dispatch
module.exports.on = function(type, listener) {
    var value,
        allNamespace = '.all',
        dispatch = this.dispatch;

    // Add a special event type 'all'
    if (type === 'all') {
        if (arguments.length < 2) {
            // if called with one argument, get the current function assigned to 'all'
            // (actually returns the function assigned to just one of the dispatch methods)
            value = dispatch.on.call(dispatch, Object.keys(dispatch)[0] + allNamespace);
        } else if (!listener) {
            // If listener is null, then this will remove the all event.
            value = dispatch.on.call(dispatch, allNamespace, null);
        } else {
            // otherwise, set the listener on all the methods on the dispatch object.
            // The listener is wrapped so that the first argument will be the method 
            // that initiated the listener
            Object.keys(dispatch).forEach(function(method) {
                value = dispatch.on.call(dispatch, method + allNamespace, function() {
                    var args = Array.prototype.slice.call(arguments);
                    args.unshift(method);
                    listener.apply(this, args);
                });
            });
        }
    } else {
        value = dispatch.on.apply(dispatch, arguments);
    }
    return value === dispatch ? this : value;
};
