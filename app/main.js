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

    var fullSize = d3.select('body').node().getBoundingClientRect();
    var margin = 30;
    var viewWidth = fullSize.width/2 - margin*1.5;
    var viewHeight = fullSize.height/2 - margin*1.5;
    // create charts
    var scatterplot = new ScatterPlot('likes', 'dislikes', viewWidth, viewHeight, {x: margin, y: margin});
    /*var scatterplot2 = new ScatterPlot('wage', 'value', viewWidth, viewHeight, {x: viewWidth + 2*margin, y: margin});
    scatterplot2.xValue = function(d){
        return d.wage;
    };
    scatterplot2.yValue = function(d){
        return d.value;
    };*/
    var parallelcoords = new ParallelCoords(viewWidth, viewHeight, {x: viewWidth + 2*margin, y: margin});
    var barchart = new BarChart('number of players', viewWidth, viewHeight, {x: margin, y: viewHeight + 2*margin});


    // var listview = new ListView(700, 400, {x: 740, y: 440});
    DEBUG = new DebugView(viewWidth, viewHeight, {x:viewWidth + 2*margin, y:viewHeight + 2*margin});

    // add charts to global views object and fill with data
    VIEWS[scatterplot.viewId] = scatterplot.data(data);
    VIEWS[parallelcoords.viewId] = parallelcoords.data(data);
    VIEWS[barchart.viewId] = barchart.data(data);

    // links and brush menus are above all other elements
    d3.select('.canvas').append('g').classed('links', true);
    allBrushMenus.moveToFront();
});