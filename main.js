/**
 * Created by Philipp Koytek on 6/6/2016.
 */


d3.json('data/fifaplayers-top50.json', function(error, data){
    
    //TODO: positioning of views, make them draggable?
    //TODO: add frame around views

    var scatterplot = new ScatterPlot('likes', 'dislikes', 700, 400, {x:20, y:20}).data(data);
    var barchart = new BarChart('number of players', 700, 400, {x:20, y:440}).data(data);
    var x = new ParallelCoords(700, 400, {x:740, y: 20}).data(data);
});