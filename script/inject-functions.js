var applyFunctionOnInspectedWindow = function(fn, callback) {
  /*
    Stringify a function and eval it on the currently inspected window
   */
  chrome.devtools.inspectedWindow['eval'](
    // Prevent from caching (no idea if there is such thing)
    Math.random() + ";(" + fn + ")()", callback);
};

/* Available methods */

var checkMozaicNamespace = function() {
  // window.Mozaic is not created at page load
  return Boolean(Mozaic.general.ENTRY_POINT);
};

var gatherMozaicData = function() {
  var result = {
    allWidgets: [],
    widgetTypes: [],
    allChannels: [],
    channelTypes: [],
    timestamp: new Date().getTime()
  };
  if (!window.loader) {
    return result;
  }
  try {
    // Get all widgets, with corresponding meta data
    result.allWidgets = _.map(loader.widgets, function(widget, id) {
      var attributes = {
        id: id,
        name: widget.params.name,
        channels: widget.channel_mapping
      };
      if (widget.view) {
        attributes.params = widget.view.$el.data('params');
      } else {
        attributes.params = {};
      }
      return attributes;
    });
    // Return a copy of the widget list sorted and grouped by name
    var _widgetTypes = {};
    _.each(result.allWidgets, function(widget) {
      if (!_widgetTypes[widget.name]) {
        _widgetTypes[widget.name] = [];
      }
      _widgetTypes[widget.name].push(widget.id);
    });
    // Turn object into an array so that it can be sorted
    var widgetTypes = [];
    _.each(_widgetTypes, function(widgets, name) {
      widgetTypes.push({
        name: name,
        widgets: widgets
      });
    });
    result.widgetTypes = _.sortBy(widgetTypes, function(type) {
      return -type.widgets.length;
    });
    var datasource = loader.get_module('datasource');
    if (datasource) {
      var allChannels = _.map(datasource.meta_data,
        function (data, id) {
          var attributes = {
            id: id,
            type: data.type
          };
          attributes.channelType =
            Mozaic.DataSourceConfig.channel_types[attributes.type].type;
          if (attributes.channelType == 'relational') {
            attributes.models = datasource.data[id].length;
          }
          return attributes;
        });
      result.allChannels = _.sortBy(allChannels, function(channel) {
        return -(channel.models || 0);
      });
      // Return a copy of the channel list sorted and grouped by name
      var _channelTypes = {};
      _.each(result.allChannels, function(channel) {
        if (!_channelTypes[channel.type]) {
          _channelTypes[channel.type] = [];
        }
        _channelTypes[channel.type].push(channel.id);
      });
      // Turn object into an array so that it can be sorted
      var channelTypes = [];
      _.each(_channelTypes, function(channels, name) {
        channelTypes.push({
          name: name,
          channels: channels
        });
      });
      result.channelTypes = _.sortBy(channelTypes, function(type) {
        return -type.channels.length;
      });
    }
  } catch (e) {
    result.error = e.toString();
  }
  return result;
};
