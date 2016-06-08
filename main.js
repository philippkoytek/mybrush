/**
 * Created by Philipp Koytek on 6/6/2016.
 */


d3.json('data/fifaplayers-top50.json', function(error, data){

    var scatterplot = new MvScatterPlot(document.getElementsByClassName('scatterplot')[0], 'likes', 'dislikes').data(data);
});