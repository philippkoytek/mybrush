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

    //TODO: positioning of views, make them draggable?
    var subset = data.filter(function(d){
        return ['Arsenal', 'FC Barcelona', 'Real Madrid CF', 'FC Bayern Munich', 'Roma'].indexOf(d.club) >= 0;
    });
    var groupsOf50 = _.chunk(data, 50);
    //DATA = groupsOf50[15];// = [data[0], data[1]];
    for(var i = 0; i < groupsOf50.length; i++){
        DATA.push(groupsOf50[i][0]);
        DATA.push(groupsOf50[i][1]);
    }
    DATA = data;

    //add group where all brushes will go
    var allBrushMenus = d3.select('.canvas').append('g').classed('all-brush-menus', true);

    var fullSize = d3.select('body').node().getBoundingClientRect();
    var margin = 80;
    var padding = 50;
    var cols = 3;
    var rows = 2;
    var viewWidth = (fullSize.width - margin*2 - padding*(cols-1))/cols; // one margin more than view columns
    var viewHeight = (fullSize.height - margin*2 - padding*(rows-1))/rows; // one margin more than view rows

    function viewPosition (i) {
        var xi = i % cols;
        var yi = Math.floor(i *1.0/ cols);
        return {
            x: xi * viewWidth + margin + xi * padding,
            y: yi * viewHeight + margin + yi * padding
        };
    }



    // create charts
    var scatterplot = new ScatterPlot('Attacking', 'Defending', viewWidth, viewHeight, viewPosition(0));
    scatterplot.xValue = function(d){
        return d.skillProperties[0].sumValue; //Attacking
        //return d.skillProperties[2].subProperties[1].value; // sprintspeed
    };
    scatterplot.yValue = function(d){
        return d.skillProperties[5].sumValue; //Defending
    };
    var parallelcoords = new ParallelCoords(viewWidth, viewHeight, viewPosition(1));

    var scatterplot2 = new ScatterPlot('wage', 'height', viewWidth, viewHeight, viewPosition(2));
    scatterplot2.xValue = function(d){
        return d.wage;
        //return new Date(Date.now() - new Date(d.birthdate.$date)).getTime() / (1000*3600*24*365); // age
    };
    scatterplot2.yValue = function(d){
        return d.height;
        //return d.skillProperties[2].subProperties[1].value; // acceleration

    };

    var barchart2 = new BarChart('number of players', viewWidth, viewHeight, viewPosition(3));

    var listview = new ListView(viewWidth, viewHeight, viewPosition(4));

    var barchart = new BarChart('number of players', viewWidth, viewHeight, viewPosition(5));
    barchart.keyValue = function(d){ return d.mainPosition; };





    // add charts to global views object and fill with data
    VIEWS[scatterplot.viewId] = scatterplot;
    VIEWS[parallelcoords.viewId] = parallelcoords;
    VIEWS[barchart.viewId] = barchart;
    VIEWS[listview.viewId] = listview;
    VIEWS[barchart2.viewId] = barchart2;
    VIEWS[scatterplot2.viewId] = scatterplot2;

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