/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var DEBUG;

State().request('data/fifaplayers-top50.json', 'fifaplayers', function(error, data, key) {

    //TODO: positioning of views, make them draggable?
    data = [data[0], data[1]];

    var scatterplot = new ScatterPlot('likes', 'dislikes', 700, 400, {x: 20, y: 20}).data(data);
    var scatterplot2 = new ScatterPlot('likes', 'dislikes', 700, 400, {x: 20, y: 440}).data(data);
    var scatterplot3 = new ScatterPlot('likes', 'dislikes', 700, 400, {x: 740, y: 20}).data(data);
    DEBUG = new DebugView(700, 400, {x:740, y:440});
    // var barchart = new BarChart('number of players', 700, 400, {x: 20, y: 440}).data(data);
    // var parallelcoords = new ParallelCoords(700, 400, {x: 740, y: 20}).data(data);
    // var listview = new ListView(700, 400, {x: 740, y: 440}).data(data);
});