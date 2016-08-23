/**
 * Created by Philipp Koytek on 6/6/2016.
 */


State().request('data/fifaplayers-top50.json', 'fifaplayers', function(error, data, key) {

    //TODO: positioning of views, make them draggable?

    var scatterplot = new ScatterPlot('likes', 'dislikes', 700, 400, {x: 20, y: 20}).data(data);
    var barchart = new BarChart('number of players', 700, 400, {x: 20, y: 440}).data(data);
    var parallelcoords = new ParallelCoords(700, 400, {x: 740, y: 20}).data(data);
    var listview = new ListView(700, 400, {x: 740, y: 440}).data(data);
});