**This is under development, many things do not work and many things will change**

#d3-vertebrae

d3-vertebrae (d3v) is a small collection of building blocks for building a web app, for when you don't need a full [backbone](http://backbonejs.org), but just a couple of vertebrae. It is heavily inspired (and borrowed from) [Backbone.js](http://backbonejs.org) but with an API for people who like writing declarative code [d3.js](http://d3js.org) style.

d3-vertebrae depends on [d3.js](http://d3js.org) and borrows from its coding style. It implements Backbone style models, with [d3 events](https://github.com/mbostock/d3/wiki/Selections#d3_event) and [d3 maps](https://github.com/mbostock/d3/wiki/Arrays#d3_map) for attribute maps. It provides minimal help, cutting out many convenience methods from Backbone. The aim is to just keep the bare minimum.

Collections are implemented as subclassed arrays, which can be fed directly to [d3.selection.data()](https://github.com/mbostock/d3/wiki/Selections#data).

##Extending built in classes

Rather than Backbone style `Backbone.Model.extend({ method: function, method: function })` you extend d3v models:

```javascript
d3v.Model.extend()
    .initialize(*initializeFuntion*)
    .sync(*customSyncFunction*)
    .method(*yourOwnMethod*, *customFunction*)
```

Backbone style will also work though, if you prefer that.

In general the use of {options} objects is completely removed, preferring a more declarative style that might be repulsive to some...

##Views

For now I don't plan to add views, instead implementing views with d3 with the module pattern, as opposed to the classical objects used for models and collections. A typical pattern would be:

```javascript
MyView = function() {
    // Initialize...
    return function(selection) {
        var data
        var exports = {}

        exports.data(collection) {
            data = collection
            // render whenever the collection changes
            data.on('change', exports.render)
            return exports
        }

        exports.render = function() {

            var divs = selection.selectAll('div')
                .data(data)

            divs.enter()
                // Do what you want with the enter selection

            divs // Update selection

            divs.exit()
                // actions on the exit selection
        }

        return exports
    }
}
```

