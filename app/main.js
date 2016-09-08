/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var DEBUG;
var DATA;
var VIEWS = [];

Data.request('data/fifaplayers-top50.json', 'fifaplayers', function(error, data, key) {

    //TODO: positioning of views, make them draggable?
    DATA = data = [data[0], data[1]];

    var plot2 = new ScatterPlot('wage', 'value', 700, 400, {x: 740, y: 20});
    plot2.xValue = function(d){
        return d.wage;
    };
    plot2.yValue = function(d){
        return d.value;
    };

    var plot = new ScatterPlot('weight', 'height', 700, 400, {x: 20, y: 440});
    plot.xValue = function(d){
        return d.weight;
    };
    plot.yValue = function(d){
        return d.height;
    };

    VIEWS.push(new ScatterPlot('likes', 'dislikes', 700, 400, {x: 20, y: 20}).data(data));
    VIEWS.push(plot.data(data));
    VIEWS.push(plot2.data(data));
    DEBUG = new DebugView(700, 400, {x:740, y:440});
    // var barchart = new BarChart('number of players', 700, 400, {x: 20, y: 440}).data(data);
    // var parallelcoords = new ParallelCoords(700, 400, {x: 740, y: 20}).data(data);
    // var listview = new ListView(700, 400, {x: 740, y: 440}).data(data);
    d3.select('.canvas').append('g').classed('links', true);
});