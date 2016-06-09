/**
 * Created by Philipp Koytek on 6/6/2016.
 */

class ScatterPlot extends View {
    constructor (xLabel, yLabel, width, height, position, padding){

        super('scatterplot',width, height, position, padding);

        this.xRange = d3.scale.linear().range([0, this.chartWidth]);
        this.yRange = d3.scale.linear().range([this.chartHeight, 0]);

        this.color = d3.scale.category20();

        this.xAxis = d3.svg.axis().scale(this.xRange).orient('bottom');
        this.yAxis = d3.svg.axis().scale(this.yRange).orient('left');

        this.chart.append('g')
            .classed('x axis', true)
            .attr('transform', 'translate(0,' + this.chartHeight + ')')
            .call(this.xAxis)
            .append('text')
            .classed('label', true)
            .attr('x', this.chartWidth)
            .attr('y', -6)
            .style('text-anchor', 'end')
            .text(xLabel || '');

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

        var self = this;
        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);

            self.chart.selectAll('.bubble')
                .classed('highlighted',false)
                .filter( d => selectedData.indexOf(d) !== -1)
                .classed('highlighted', true)
                .moveToFront();
        });

    };


    // public variables and functions
    data (data){
        // load data into plot

        var self = this;
        // TODO: provide mapping functions for incoming data to map it as needed for the chart: d = {xValue, yValue, rValue, colorValue, opacityValue}

        self.xRange.domain(d3.extent(data, function(d){ return d.likes; })).nice();
        self.yRange.domain(d3.extent(data, function(d){ return d.dislikes; })).nice();

        var transition = self.chart.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis);

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        // data
        var bubbles = self.chart.selectAll('.bubble').data(data, function(d){ return d.fifaPid; });
        bubbles.enter().append('circle')
            .classed('bubble', true)
            .attr('r', function(d){ return d.wage / 50000 || 3.5; })
            .attr('cx', function(d){ return self.xRange(d.likes); })
            .attr('cy', function(d){ return self.yRange(d.dislikes); })
            .style('fill', function(d){ return self.color(d.club || '0'); })
            .on('click', function(d){
                EventBus.trigger(events.HIGHLIGHT, d);
            });
        
        return self;
    };
}