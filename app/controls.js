/**
 * Created by Philipp Koytek on 6/29/2016.
 */

var controls = d3.select('#controls');
controls.append('input')
    .attr('type', 'checkbox')
    .attr('name', 'brush on click')
    .property('checked', constants.brushOnClick)
    .on('click', function(){
        constants.brushOnClick = d3.select(this).property('checked');
    });
controls.append('label').text('brush on click');

controls.append('input')
    .attr('type', 'checkbox')
    .attr('name', 'union brushing')
    .property('checked', constants.unionBrushing)
    .on('click', function(){
        constants.unionBrushing = d3.select(this).property('checked');
    });
controls.append('label').text('union brushing');

controls.append('input')
    .attr('type', 'checkbox')
    .attr('name', 'touch interaction')
    .property('checked', constants.touchInteraction)
    .on('click', function(){
        constants.touchInteraction = d3.select(this).property('checked');
    });
controls.append('label').text('touch interaction');