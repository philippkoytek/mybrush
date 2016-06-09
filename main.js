/**
 * Created by Philipp Koytek on 6/6/2016.
 */


d3.json('data/fifaplayers-top50.json', function(error, data){
    
    //TODO: positioning of views, make them draggable?
    //TODO: add frame around views

    var scatterplot = new ScatterPlot(document.getElementsByClassName('scatterplot')[0], 'likes', 'dislikes', 700, 400, {x:20, y:20}).data(data);
    var barchart = new BarChart(document.getElementsByClassName('barchart')[0], 'number of players', 700, 400, {x:20, y:440}).data(data);
});