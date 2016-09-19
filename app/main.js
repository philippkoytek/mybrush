/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var DEBUG;
var DATA;
var VIEWS = {};

Data.request('data/fifaplayers_0-999.json', 'fifaplayers', function(error, data, key) {

    //TODO: positioning of views, make them draggable?
    var groupsOf50 = _.chunk(data, 50);
    DATA = groupsOf50[0];// = [data[0], data[1]];

    //add group where all brushes will go
    var allBrushMenus = d3.select('.canvas').append('g').classed('all-brush-menus', true);

    var fullSize = d3.select('body').node().getBoundingClientRect();
    var margin = 30;
    var viewWidth = fullSize.width/2 - margin*1.5;
    var viewHeight = fullSize.height/2 - margin*1.5;
    // create charts
    var scatterplot = new ScatterPlot('x', 'y', viewWidth, viewHeight, {x: margin, y: margin});
    scatterplot.xValue = function(d){
        return d.skillProperties[0].sumValue;
        //return d.skillProperties[2].subProperties[1].value; // sprintspeed
        //return new Date(Date.now() - d.birthdate.$date).getTime() / (1000*3600*24*365); // age
    };
    scatterplot.yValue = function(d){
        return d.skillProperties[5].sumValue;
        //return d.skillProperties[2].subProperties[0].value; // acceleration
    };
    var parallelcoords = new ParallelCoords(viewWidth, viewHeight, {x: viewWidth + 2*margin, y: margin});

    var barchart = new BarChart('number of players', viewWidth, viewHeight, {x: margin, y: viewHeight + 2*margin}, {top:20, right:20, bottom:30, left:40});
    barchart.keyValue = function(d){ return d.positions[0]; };

    var listview = new ListView(viewWidth, viewHeight, {x:viewWidth + 2*margin, y:viewHeight + 2*margin});
    //DEBUG = new DebugView(viewWidth, viewHeight, {x:viewWidth + 2*margin, y:viewHeight + 2*margin});

    // add charts to global views object and fill with data
    VIEWS[scatterplot.viewId] = scatterplot;
    VIEWS[parallelcoords.viewId] = parallelcoords;
    VIEWS[barchart.viewId] = barchart;
    VIEWS[listview.viewId] = listview;

    scatterplot.data(DATA);
    parallelcoords.data(DATA);
    barchart.data(DATA);
    listview.data(DATA);

    // links and brush menus are above all other elements
    d3.select('.canvas').append('g').classed('links', true);
    allBrushMenus.moveToFront();
});