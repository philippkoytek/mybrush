/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var DEBUG;
var DATA;
var VIEWS = {};

Data.request('data/fifaplayers-top50.json', 'fifaplayers', function(error, data, key) {

    //TODO: positioning of views, make them draggable?
    DATA = data;// = [data[0], data[1]];

    //add group where all brushes will go
    var allBrushMenus = d3.select('.canvas').append('g').classed('all-brush-menus', true);

    // create charts
    var scatterplot = new ScatterPlot('likes', 'dislikes', 700, 400, {x: 20, y: 20});
    var scatterplot2 = new ScatterPlot('wage', 'value', 700, 400, {x: 740, y: 20});
    scatterplot2.xValue = function(d){
        return d.wage;
    };
    scatterplot2.yValue = function(d){
        return d.value;
    };
    var barchart = new BarChart('number of players', 700, 400, {x: 20, y: 440});

    // var parallelcoords = new ParallelCoords(700, 400, {x: 740, y: 20});
    // var listview = new ListView(700, 400, {x: 740, y: 440});
    DEBUG = new DebugView(700, 400, {x:740, y:440});

    // add charts to global views object and fill with data
    VIEWS[scatterplot.viewId] = scatterplot.data(data);
    VIEWS[scatterplot2.viewId] = scatterplot2.data(data);
    VIEWS[barchart.viewId] = barchart.data(data);

    // links and brush menus are above all other elements
    d3.select('.canvas').append('g').classed('links', true);
    allBrushMenus.moveToFront();
});