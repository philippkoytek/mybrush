/**
 * Created by Philipp Koytek on 6/8/2016.
 */

//TODO: create some sort of state history for the metavis

var EventHistory = [];

EventBus.on('all', function(eventName){
    eventHistory.push({
        event:eventName,
        args:arguments.shift()
    });
});