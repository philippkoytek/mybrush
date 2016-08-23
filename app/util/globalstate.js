/**
 * Created by Philipp Koytek on 6/8/2016.
 */

//TODO: create some sort of state history for the metavis

var EventHistory = [];

EventBus.on('all', function(eventName){
    var eventArgs = Array.prototype.slice.call(arguments, 1);
    //console.log(eventName, eventArgs);
    EventHistory.push({
        event:eventName,
        args:eventArgs,
        timestamp:Date.now()
    });
});