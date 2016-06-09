/**
 * Created by Philipp Koytek on 6/8/2016.
 */

class BarChart extends View {
    constructor(svgElement, yLabel, width, height, position, padding){

        padding = padding || {top:20, right:20, bottom:70, left:40};
        super(svgElement, width, height, position, padding);

        this.xRange = d3.scale.ordinal().rangeRoundBands([0, this.chartWidth], 0.1);
        this.yRange = d3.scale.linear().range([this.chartHeight, 0]);

        this.xAxis = d3.svg.axis().scale(this.xRange).orient('bottom');
        this.yAxis = d3.svg.axis().scale(this.yRange).orient('left');

        this.chart.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.chartHeight + ')')
            .call(this.xAxis);

        this.chart.append('g')
            .attr('class', 'y axis')
            .call(this.yAxis)
            .append('text')
            .attr('class', 'label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(yLabel || '');

        var self = this;
        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);

            self.chart.selectAll('.bar')
                .classed('highlighted',false)
                .filter( d => d.values.some(v => selectedData.indexOf(v) !== -1))
                .classed('highlighted', true)
                .moveToFront();
        });
    };

    // public variables and functions
    data(data){
        var self = this;

        var barsData = d3.nest().key(function(d){ return d.club; }).entries(data);

        self.xRange.domain(barsData.map(function(bar){ return bar.key; }));
        self.yRange.domain([0, d3.max(barsData, function(bar){ return bar.values.length; })]);

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

        var bars = self.chart.selectAll('.bar').data(barsData);
        bars.enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function(d){ return self.xRange(d.key); })
            .attr('width', self.xRange.rangeBand())
            .attr('y', function(d){ return self.yRange(d.values.length); })
            .attr('height', function(d){ return self.chartHeight - self.yRange(d.values.length); })
            .on('click', function(d){
                EventBus.trigger(events.HIGHLIGHT, d.values);
            });

        return self;
    };

}