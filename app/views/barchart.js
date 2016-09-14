class BarChart extends View {
    constructor(yLabel, width, height, position, padding){

        padding = padding || {top:20, right:20, bottom:100, left:40};
        super('barchart', width, height, position, padding);
        
        this.rawValues = function(d){
            return d.values;  
        };

        this.rawIdValue = function(d){
            return d.fifaPid;
        };

        this.idValue = function(bar){
            return _.replace(bar.key, new RegExp(' ','g'), '_');
        };

        var color = d3.scale.category20();
        this.fillValue = function(d){
            return color(d.key);
        };

        var self = this;
        this.xValue = function(d){
            return self.xRange(d.key) + self.xRange.rangeBand()/2;
        };

        this.yValue = function(d){
            return self.rawValues(d).length;
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
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(yLabel || '');
    };

    // public variables and functions
    data(data){
        var self = this;

        var barsData = d3.nest().key(function(d){ return d.club; }).entries(data);

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
        var bars = content.selectAll('.bar').data(barsData);
        bars.enter().append('rect')
            .classed('bar data-item', true)
            .attr('x', function(d){ return self.xValue(d) - self.xRange.rangeBand()/2; })
            .attr('width', self.xRange.rangeBand())
            .attr('y', function(d){ return self.yRange(self.yValue(d)); })
            .attr('height', function(d){ return self.chartHeight - self.yRange(self.yValue(d)); })
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
        var brush = d3.svg.brush()
            .x(this.xRange);
        brush.on('brush', function(){
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

}