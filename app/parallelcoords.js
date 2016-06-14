/**
 * Created by Philipp Koytek on 6/9/2016.
 */

class ParallelCoords extends View {
    constructor (width, height, position, padding) {
        super('parallelcoords', width, height, position, padding);

        this.xRange = d3.scale.ordinal().rangePoints([0, this.chartWidth], 1);
        this.yRange = {};

        this.axis = d3.svg.axis().orient('left');

        var self = this;
        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);

            self.chart.selectAll('.foreground path')
                .classed('highlighted',false)
                .filter( d => selectedData.indexOf(d) !== -1)
                .classed('highlighted', true)
                .moveToFront();
        });

        EventBus.on(events.BRUSH, function(source, ghostData){
            if(source !== self.viewId){
                self.chart.selectAll('.brush').each(
                    function(dim) {
                        d3.select(this).call(self.yRange[dim].brush.clear());
                    });
                self.chart.selectAll('.foreground path')
                    .classed('ghost', false)
                    .filter(function (d) {
                        return ghostData.indexOf(d) !== -1;
                    })
                    .classed('ghost', true);
            }
        });
    }

    data(data) {
        var self = this;
        var dimensions = data[0].skillProperties.map(p => p.title);

        function valueForDim (d, dim){
            return d.skillProperties.find(p => p.title === dim).sumValue;
        }

        function drawPath(d){
            return d3.svg.line()(dimensions.map(function(dim) {
                return [self.xRange(dim), self.yRange[dim](valueForDim(d, dim))];
            }));
        }

        self.xRange.domain(dimensions);
        dimensions.forEach(function(dim){
            self.yRange[dim] = d3.scale.linear()
                .domain(d3.extent(data, function(d){
                    return valueForDim(d, dim);
                }))
                .range([self.chartHeight, 0]);
        });


        var background = self.chart.append('g')
            .classed('background', true)
            .selectAll('path').data(data)
            .enter().append('path')
            .attr('d', drawPath);

        var foreground = self.chart.append('g')
            .classed('foreground', true)
            .selectAll('path').data(data)
            .enter().append('path')
            .attr('d', drawPath)
            .on('click', function(d){
                EventBus.trigger(events.HIGHLIGHT, d);
            });


        var dimensionGroups = self.chart.selectAll('.dimension')
            .data(dimensions)
            .enter().append('g')
            .classed('dimension', true)
            .attr('transform', function(d){
                return 'translate(' + self.xRange(d) + ')';
            });

        dimensionGroups.append('g')
            .classed('axis', true)
            .each(function(d) {d3.select(this).call(self.axis.scale(self.yRange[d]));})
            .append('text')
            .style('text-anchor', 'middle')
            .attr('y', -9)
            .text(function(d){return d;});

        dimensionGroups.append('g')
            .classed('brush', true)
            .each(function(d){
                d3.select(this).call(
                    self.yRange[d].brush = d3.svg.brush().y(self.yRange[d]).on('brush', brushed)
                );
            })
            .selectAll('rect')
            .attr('x', -8)
            .attr('width', 16);

        function brushed () {
            var actives = dimensions.filter(dim => !self.yRange[dim].brush.empty());
            var extents = actives.map(a => self.yRange[a].brush.extent());
            var ghostData = [];
            foreground.classed('ghost', function(d){
                if(actives.every(function(dim, i){
                    return extents[i][0] <= valueForDim(d, dim) && valueForDim(d, dim) <= extents[i][1];
                })){
                    return false;
                }
                else {
                    ghostData.push(d);
                    return true;
                }
            });
            EventBus.trigger(events.BRUSH, self.viewId, ghostData);
        }
    }
}
