/**
 * Created by Philipp Koytek on 6/8/2016.
 */

//TODO: create some sort of state history for the metavis

var EventHistory = [];

EventBus.on('all', function(eventName){
    var eventArgs = arguments.splice(0,1);
    EventHistory.push({
        event:eventName,
        args:eventArgs
    });
});