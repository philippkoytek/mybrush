class BarChart extends View {
    constructor(yLabel, width, height, position, padding){

        padding = padding || {top:20, right:20, bottom:100, left:40};
        super('barchart', width, height, position, padding);
        
        this.rawValues = function(d){
            return d.values || [d];
        };

        this.idValue = function(d){
            return d.key ? _.replace(d.key, new RegExp(' ','g'), '_') : d.fifaPid;
        };

        this.keyValue = function(d){ return d.club; };

        var color = constants.stdColorScale;
        this.strokeValue = this.fillValue = function(d){
            return d.key ? color(d.key) : 'transparent';
        };

        var self = this;
        this.xValue = function(d){
            return self.xRange(d.key || self.keyValue(d)) + self.xRange.rangeBand()/2;
        };

        this.yValue = function(d){
            return self.rawValues(d).length || 1;
        };

        this.xRange = d3.scale.ordinal().rangeRoundBands([0, this.chartWidth], 0.1);
        this.yRange = d3.scale.linear().range([this.chartHeight, 0]);

        this.xAxis = d3.svg.axis().scale(this.xRange).orient('bottom');
        this.yAxis = d3.svg.axis().scale(this.yRange).orient('left');

        this.chart.append('g')
            .classed('x axis', true)
            .attr('transform', 'translate(0,' + this.chartHeight + ')')
            .call(this.xAxis);

        this.chart.append('g')
            .classed('y axis', true)
            .call(this.yAxis)
            .append('text')
            .classed('label', true)
            .attr('transform', 'rotate(-90)')
            .attr('y', -30)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(yLabel || '');
    };

    // public variables and functions
    data(data){
        var self = this;

        var barsData = d3.nest().key(self.keyValue).entries(data);

        self.xRange.domain(barsData.map(function(bar){ return bar.key; }));
        self.yRange.domain([0, d3.max(barsData, function(bar){ return self.rawValues(bar).length; })]);

        var transition = self.chart.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-65)');

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        self.insertNewBrush();

        var content = self.chart.append('g').classed('content', true);

        var barGroups = content.selectAll('.bar').data(barsData);
        barGroups.enter().append('g')
            .classed('bar', true)
            .append('rect').classed('bar-bg data-item aggregate', true)
            .attr({width:self.xRange.rangeBand()})
            .attr('x', function(d){return self.xValue(d) - self.xRange.rangeBand()/2; })
            .attr('y', function(d){return self.yRange(self.yValue(d));})
            .attr('height', function(d){ return self.chartHeight - self.yRange(self.yValue(d)); })
            .style('fill', self.fillValue)
            .style('stroke', self.fillValue)
            .call(self.addInteractivity.bind(self));

        var barParts = barGroups.selectAll('.bar-part').data(function(d){ return self.rawValues(d); });
        barParts.enter().append('rect')
            .classed('bar-part data-item individual', true)
            .attr({width:self.xRange.rangeBand(), height:self.chartHeight - self.yRange(1)})
            .attr('x', function(d){return self.xValue(d) - self.xRange.rangeBand()/2; })
            .attr('y', function(d, i){ return self.yRange(i+1); })
            .style('fill', self.fillValue)
            .style('stroke', self.fillValue)
            .call(self.addInteractivity.bind(self));


        return self;
    };

    /*
     * Override methods
     */

    createBrush () {
        var self = this;
        var brush = d3.svg.pkbrush()
            .x(this.xRange)
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

    adjustBrushArea (brushArea) {
        brushArea.attr('transform', 'translate(0,-5)')
            .selectAll('rect')
            .attr('y', 0)
            .attr('height', this.chartHeight + 5);
    }

    getMinimumBrushBox (visual) {
        var b = visual.getBBox();
        return {x:b.x - 2, y:-5, width: b.width + 4, height: this.chartHeight + 5};
    }

    /**
     * highlights the aggregate data item and related items with a secondary highlight color
     * @param d
     * @param visual
     */
    hoverSecondary(d, visual) {
        d3.select(visual.parentNode).selectAll('.aggregate').classed('highlighted secondary-highlight', true);
        d3.select(visual.parentNode).selectAll('.individual').each(function(d, i){
            if(this != visual) { //only go through secondary items (ie. not the one where the actual hover occured)
                d3.selectAll([...d.visuals]).filter('.individual').classed('highlighted secondary-highlight', true);    //highlight all items associated to the bar
                d3.select(this).classed('highlighted secondary-highlight', false);  // don't highlight the individual bar-parts (as the bar is highlighted as a whole)
            }
        });
    }
}