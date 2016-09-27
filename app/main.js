/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var DEBUG;
var DATA = [];
var VIEWS = {};
document.addEventListener('contextmenu', function(event){
    event.preventDefault();
    return false;
});

Data.request('data/fifaplayers-top50.json', 'fifaplayers', function(error, data, key) {

    DATA = data;
    //add group where all brushes will go
    var allBrushMenus = d3.select('.canvas').append('g').classed('all-brush-menus', true);

    var fullSize = d3.select('body').node().getBoundingClientRect();
    var margin = 80;
    var padding = 50;

    function viewPosition (i) {
        var xi = i % cols;
        var yi = Math.floor(i *1.0/ cols);
        return {
            x: xi * viewWidth + margin + xi * padding,
            y: yi * viewHeight + margin + yi * padding
        };
    }

    var config = getParameterByName('config');

    var cols;
    var rows;
    if(config == 1){
        cols = 1;
        rows = 1;
    } else if(config == 2){
        cols = 2;
        rows = 1;
    } else {
        cols = 3;
        rows = 2;
    }
    var viewWidth = (fullSize.width - margin*2 - padding*(cols-1))/cols; // one margin more than view columns
    var viewHeight = (fullSize.height - margin*2 - padding*(rows-1))/rows; // one margin more than view rows
    var pos = 0;

    // create charts
    var scatterplot = new ScatterPlot('defending vs. attacking', 'Attacking', 'Defending', viewWidth, viewHeight, viewPosition(pos++));
    scatterplot.xValue = function(d){
        return d.skillProperties[0].sumValue; //Attacking
        //return d.skillProperties[2].subProperties[1].value; // sprintspeed
    };
    scatterplot.yValue = function(d){
        return d.skillProperties[5].sumValue; //Defending
    };


    var parallelcoords;
    var scatterplot2;
    var barchart2;
    if(!config || config > 2){
        parallelcoords = new ParallelCoords('skill characteristics', viewWidth, viewHeight, viewPosition(pos++));
        scatterplot2 = new ScatterPlot('height vs. wage', 'wage', 'height', viewWidth, viewHeight, viewPosition(pos++));
        scatterplot2.xValue = function(d){
            return d.wage;
            //return new Date(Date.now() - new Date(d.birthdate.$date)).getTime() / (1000*3600*24*365); // age
        };
        scatterplot2.yValue = function(d){
            return d.height;
            //return d.skillProperties[2].subProperties[1].value; // acceleration
        };
        barchart2 = new BarChart('clubs', 'number of players', viewWidth, viewHeight, viewPosition(pos++));
    }

    var listview;
    if(!config || config > 1){
        listview = new ListView('player names', viewWidth, viewHeight, viewPosition(pos++));
    }

    var barchart;
    if(!config || config > 2) {
        barchart = new BarChart('main positions', 'number of players', viewWidth, viewHeight, viewPosition(pos++));
        barchart.keyValue = function (d) {
            return d.mainPosition;
        };
    }

    // add charts to global views object and fill with data
    VIEWS[scatterplot.viewId] = scatterplot;
    if(!config || config > 1){
        VIEWS[listview.viewId] = listview;
    }
    if(!config || config > 2){
        VIEWS[parallelcoords.viewId] = parallelcoords;
        VIEWS[barchart.viewId] = barchart;
        VIEWS[barchart2.viewId] = barchart2;
        VIEWS[scatterplot2.viewId] = scatterplot2;
    }

    _.forEach(VIEWS, function(view){
        view.data(DATA);
    });

    // links and brush menus are above all other elements
    d3.select('.canvas').append('g').classed('links', true);
    allBrushMenus.moveToFront();
});

/*
var parallelcoords2 = new ParallelCoords(viewWidth, viewHeight, viewPosition(6));
parallelcoords2.calcDimensions = function(d){
    //return ['dislikes', 'likes', 'height', 'weight', 'overallRating', 'value', 'wage'];
    return d.skillProperties[0].subProperties.map(s => s.title);
};
parallelcoords2.yValue = function(d, i, dim){
    //return d[dim];
    return d.skillProperties[0].subProperties.find(s => s.title === dim).value;
};

 var barchart3 = new BarChart('number of players', viewWidth, viewHeight, viewPosition(7));
 /barchart3.keyValue = function(d){ return d.nationality; };
*/