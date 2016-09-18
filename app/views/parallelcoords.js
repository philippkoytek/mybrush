/**
 * Created by Philipp Koytek on 6/9/2016.
 */

class ParallelCoords extends View {
    constructor (width, height, position, padding) {
        super('parallelcoords', width, height, position, padding);

        this.yValue = function (d, i, dim){
            return d.skillProperties.find(p => p.title === dim).sumValue;
        };

        var color = constants.stdColorScale;
        this.strokeValue = function(d){
            return color(d.club);
        };

        this.fillValue = function(){
            return 'none';
        };

        this.idValue = function(d){
            return d.fifaPid;
        };

        this.xRange = d3.scale.ordinal().rangePoints([0, this.chartWidth], 0.15);
        this.yRange = {};

        this.axis = d3.svg.axis().orient('left');

    }

    data(data) {
        var self = this;
        //this.dimensions = ['Attacking', 'Movement', 'Defending', 'Goalkeeping'];
        this.dimensions = data[0].skillProperties.map(p => p.title);

        function drawPath(d, i){
            return d3.svg.line().interpolate('cardinal').tension(0.9)(self.dimensions.map(function(dim) {
                return [self.xRange(dim), self.yRange[dim](self.yValue(d, i, dim))];
            }));
        }

        self.xRange.domain(self.dimensions);
        self.dimensions.forEach(function(dim){
            self.yRange[dim] = d3.scale.linear()
                .domain([0, d3.max(data, function(d, i){
                    return self.yValue(d, i, dim);
                }) + 10])
                .range([self.chartHeight, 10]).nice();
        });

        var dimensionGroups = self.chart.selectAll('.dimension')
            .data(self.dimensions)
            .enter().append('g')
            .attr('class', function(dim){
                return 'dimension ' + dim;
            })
            .attr('transform', function(d){
                return 'translate(' + self.xRange(d) + ')';
            });

        dimensionGroups.append('g')
            .classed('axis', true)
            .each(function(d) {d3.select(this).call(self.axis.scale(self.yRange[d]));})
            .append('text')
            .style('text-anchor', 'middle')
            .attr('y', 0)
            .text(function(d){return d;});

        dimensionGroups.each(function(dim){
            self.insertNewBrush(dim, d3.select(this));
        });

        var content = self.chart.append('g').classed('content', true);

        var strokeLines = content.selectAll('path').data(data);
        strokeLines.enter().append('path')
            .classed('line data-item aggregate individual', true)
            .style('stroke', self.strokeValue)
            .style('fill', self.fillValue)
            .style('stroke-width', 2)
            .attr('d', drawPath)
            .call(self.addInteractivity.bind(self));

        return self;
    }
    
    
    createBrush(dim){
        var self = this;
        var brush = d3.svg.brush()
            .y(this.yRange[dim]);
        brush.on('brush', function(){
                self.onBrush(brush);
            })
            .on('brushend', function(){
                self.onBrushEnd(brush);
            });
        return brush;
    }
    
    adjustBrushArea(brushArea) {
        brushArea.attr('transform', 'translate(-8,0)')
            .selectAll('rect')
            .attr('x', 0)
            .attr('width', 16);
    }

    getMinimumBrushBox (visual, d, dim) {
        var y = this.yRange[dim](this.yValue(d, undefined, dim));
        return {x:-8, y:y - 6, width: 16, height: 12};
    }

    lineAnchorPoint (visual, d, brush) {
        var dim = (brush.origin == this) ? brush.dim : this.dimensions[0];
        return this.fromChartToAbsoluteCtx(this.xRange(dim), this.yRange[dim](this.yValue(d, undefined, dim)));
    }
}
