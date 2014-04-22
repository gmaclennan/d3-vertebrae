var d3 = require('d3'),
    extend = require('extend'),
    escape = require('escape-html'),
    uniqueId = require('./util').uniqueId,
    urlError = require('./util').urlError,
    events = require('./events');

var Model = module.exports = function(attrs) {
    var instance = this;
    if (!(instance instanceof Model)) {
        return new Model(attrs);
    }
    instance.cid = uniqueId('c');
    instance.attributes = d3.map(attrs || {});
    instance.initialize.apply(instance, arguments);
    return extend(instance, events);
};

Model.extend = require('./extend');

// These are getters/setters to extend/change the class
var constructorMethods = ['dispatch', 'idAttribute', 'initialize', 'sync', 'url', 'parse'];

constructorMethods.forEach(function(method) {
    Model[method] = function(_) {
        if (!arguments.length) return this.prototype[method];
        this.prototype[method] = _;
        return this;
    };
});

// Use this to extend the class by adding methods. You will need to force
// the overwriting of built in methods by setting overwrite = true.
Model.method = function(name, value, overwrite) {
    if (!arguments.length) return this;
    if (arguments.length < 2) return this.prototype[name];
    if (!this.prototype[name] || overwrite) this.prototype[name] = value;
    return this;
};

// Attach all inheritable methods to the Model prototype.
extend(Model.prototype, {

    dispatch: d3.dispatch('sync', 'change', 'destroy', 'invalid'),

    // The value returned during the last failed validation.
    validationError: null,

    // The default name for the JSON `id` attribute is `"id"`. MongoDB and
    // CouchDB users may want to set this to `"_id"`.
    idAttribute: 'id',

    // Initialize is an empty function by default. Override it with your own
    // initialization logic.
    initialize: function() {},

    // Return a copy of the model's `attributes` object.
    toJSON: function() {
        var json = {};
        this.attributes.forEach(function(key, value) {
            json[key] = value;
        });
        return json;
    },

    // Proxy `Backbone.sync` by default -- but override this if you need
    // custom syncing semantics for *this* particular model.
    sync: function() {
        return Backbone.sync.apply(this, arguments);
    },

    // Get the HTML-escaped value of an attribute.
    escape: function(key) {
        return escape(this.attr(key));
    },

    // Set or get a hash of model attributes on the object, firing `"change"`. This is
    // the core primitive operation of a model, updating the data and notifying
    // anyone who needs to know about the change in state. The heart of the beast.
    attr: function(key, val) {
        if (!arguments.length) return this.toJSON();
        if (arguments.length === 1) return this.attributes.get(key);

        // Silently return if there is nothing to change.
        if (this.attributes.has(key) && this.attributes.get(key) === val) return this;

        this.attributes.set(key, val);

        // Trigger all relevant attribute changes.
        this.dispatch.change(this, key, val);

        return this;
    },

    remove: function(attr) {
        var removed = this.attributes.remove(attr);
        if (removed) this.dispatch.change(this, attr);
        return removed;
    },

    // Fetch the model from the server. If the server's representation of the
    // model differs from its current attributes, they will be overridden,
    // dispatching a `"change"` event.
    fetch: function(callback) {
        var model = this;
        var done = function(err, res) {
            if (err) return callback(err, model);
            var attrs = model.parse(res);
            for (var key in attrs) model.attr(key, attrs[key]);
            if (callback) callback(null, model, res);
            model.dispatch.sync(model, res);
        };
        return this.sync('read', this, done);
    },

    // Set a hash of model attributes, and sync the model to the server.
    // If the server returns an attributes hash that differs, the model's
    // state will be `set` again.
    save: function(callback) {
        if (!this.isValid()) return false;

        var model = this;
        var done = function(err, res) {
            if (err) return callback(err, model);
            var attrs = model.parse(res);
            for (var key in attrs) model.attr(key, attrs[key]);
            if (callback) callback(null, model, res);
            model.dispatch.sync(model, res);
        };
        return this.sync(this.isNew() ? 'create' : 'update', this, done);
    },

    // Destroy this model on the server if it was already persisted.
    // Optimistically removes the model from its collection, if it has one.
    // If `wait: true` is passed, waits for the server to respond before removal.
    destroy: function(wait, callback) {
        if (arguments.length === 1 && typeof wait === "function") callback = wait;

        var model = this;
        var destroy = function() {
            model.dispatch.destroy(model, model.collection);
        };

        var done = function(err, res) {
            if (err) return callback(err, model);
            if (wait) destroy();
            if (callback) callback(null, model, res);
            model.dispatch.sync(model, res);
        };

        if (this.isNew()) {
            if (callback) callback(null, model, res);
            destroy();
            return false;
        }

        if (!wait) destroy();
        return this.sync('delete', this, options);
    },

    // Default URL for the model's representation on the server -- if you're
    // using Backbone's restful methods, override this to change the endpoint
    // that will be called.
    url: function() {
        var base =
            d3.functor(this.urlRoot).call(this) ||
            d3.functor(this.collection.url).call(this.collection) ||
            urlError();
        if (this.isNew()) return base;
        return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.id);
    },

    // **parse** converts a response into the hash of attributes to be `set` on
    // the model. The default implementation is just to pass the response along.
    parse: function(res) {
        return res;
    },

    // Create a new model with identical attributes to this one.
    clone: function() {
        return new this.constructor(this.attr());
    },

    // A model is new if it has never been saved to the server, and lacks an id.
    isNew: function() {
        return !this.attr(this.idAttribute);
    },

    // Check if the model is currently in a valid state.
    isValid: function() {
        return this._validate(this.attr());
    },

    // Run validation against the next complete set of model attributes,
    // returning `true` if all is well. Otherwise, fire an `"invalid"` event.
    _validate: function(attrs) {
        if (!this.validate) return true;
        var error = this.validationError = this.validate(attrs) || null;
        if (!error) return true;
        this.dispatch.invalid(this, error);
        return false;
    }

});

// d3.map() accessor methods that we want to implement on the Model (these don't fire events)
var accessorMethods = ['has', 'keys', 'values', 'entries', 'empty', 'size'];

accessorMethods.forEach(function(method) {
    Model.prototype[method] = function() {
      return this.attributes[method].apply(this.attributes, arguments);
    };
});
