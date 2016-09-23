/**
 * Created by Philipp Koytek on 6/9/2016.
 */

class ParallelCoords extends View {
    constructor (width, height, position, padding) {
        super('parallelcoords', width, height, position, padding || {top:30, right:20, bottom:30, left:40});

        this.yValue = function (d, i, dim){
            if(dim == 'HeadingAccuracy'){
                return d.skillProperties[0].subProperties[2].value;
            }
            return d.skillProperties.find(p => p.title === dim).sumValue;
        };

        this.calcDimensions = function(d){
            //return ['Attacking', 'Movement', 'Defending', 'Goalkeeping']; // reduce dimensions
            return d.skillProperties.map(p => p.title);//.concat('HeadingAccuracy');
        };

        this.strokeValue = function(d){
            return constants.defaultDataColor;
        };

        this.fillValue = function(d){
            return constants.defaultDataColor;
        };

        this.idValue = function(d){
            return d.fifaPid;
        };

        this.xRange = d3.scale.ordinal().rangePoints([0, this.chartWidth], 0.15);
        this.yRange = {};

        this.axis = d3.svg.axis().orient('left');

        this.strokeWidth = 0.8;
        this.fullWidth = 3; // = fillWidth + strokeWidth*2

    }

    data(data) {
        var self = this;
        this.dimensions = this.calcDimensions(data[0]);

        function drawPath(d, i){
            var pts = self.dimensions.map(function(dim) {
                return [self.xRange(dim), self.yRange[dim](self.yValue(d, i, dim))];
            });
            var reverse = [];
            for(var pi = pts.length - 1; pi >= 0; pi--){
                reverse.push([pts[pi][0], pts[pi][1] + self.fullWidth]);
            }
            return d3.svg.line().interpolate('linear')(pts.concat(reverse));
        }

        self.xRange.domain(self.dimensions);
        self.dimensions.forEach(function(dim){
            var e = d3.extent(data, function(d, i){
                return self.yValue(d, i, dim);
            });
            self.yRange[dim] = d3.scale.linear()
                .domain([Math.max(0,e[0]-5),e[1]+5])
                .range([self.chartHeight, 0]).nice();
        });

        var content = self.chart.append('g').classed('content', true);

        var strokeLines = content.selectAll('path').data(data);
        strokeLines.enter().append('path')
            .classed('line data-item aggregate individual', true)
            .style('stroke', self.strokeValue)
            .style('fill', self.fillValue)
            .style('stroke-width', self.strokeWidth)
            .attr('d', drawPath)
            .call(self.addInteractivity.bind(self));

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
            .attr('y', -10)
            .text(function(d){return d;});

        dimensionGroups.each(function(dim){
            self.insertNewBrush(dim, d3.select(this));
        });

        return self;
    }
    
    
    createBrush(dim){
        var self = this;
        var brush = d3.svg.pkbrush()
            .y(this.yRange[dim])
            .handleSize(constants.handleSize);
        brush.on('brushstart', function(){
                self.onBrushStart(brush);
            }).on('brush', function(){
                self.onBrush(brush);
            })
            .on('brushend', function(){
                self.onBrushEnd(brush);
            });
        return brush;
    }
    
    adjustBrushArea(brushArea) {
        brushArea.attr('transform', 'translate(-20,0)')
            .selectAll('rect')
            .attr('x', 0)
            .attr('width', 40);
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
