/**
 * Created by Philipp Koytek on 6/29/2016.
 */

var items = d3.map(constants).entries();

var controls = d3.select('#controls').selectAll('span.control').data(items);
var cEnter = controls.enter().append('span').classed('control', true);
cEnter.append('input')
    .attr('type', 'checkbox')
    .attr('name', function(d){return d.key;})
    .property('checked', function(d){return d.value;})
    .on('click', function(d){
        constants[d.key] = d.value = d3.select(this).property('checked');
    });
cEnter.append('label').text(function(d){return d.key;});