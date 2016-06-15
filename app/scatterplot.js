/**
 * Created by Philipp Koytek on 6/6/2016.
 */

class ScatterPlot extends View {
    constructor (xLabel, yLabel, width, height, position, padding){

        super('scatterplot',width, height, position, padding);

        this.xValue = function(d){
            return d.likes;
        };

        this.yValue = function(d){
            return d.dislikes;
        };
        
        this.rValue = function(d){
            return d.wage / 50000;
        };

        var color = d3.scale.category20();
        this.fillValue = function(d){ 
            return color(d.club); 
        };
        
        this.idValue = function(d){ 
            return d.fifaPid; 
        };
        
        //this.opacityValue =...
               

        this.xRange = d3.scale.linear().range([0, this.chartWidth]);
        this.yRange = d3.scale.linear().range([this.chartHeight, 0]);

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

        //TODO: refactor highlight event
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
        var self = this;

        self.xRange.domain(d3.extent(data, self.xValue)).nice();
        self.yRange.domain(d3.extent(data, self.yValue)).nice();

        var transition = self.chart.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis);

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        self.brush = d3.svg.brush()
            .y(self.yRange)
            .x(self.xRange)
            .on('brush', self.onBrush.bind(self));

        self.brushArea = self.chart.append('g')
            .classed('brush', true)
            .call(self.brush);

        // data
        var content = self.chart.append('g').classed('content', true);
        var bubbles = content.selectAll('.bubble').data(data, self.idValue);
        bubbles.enter().append('circle')
            .classed('bubble data-item brushable', true)
            .attr('r', self.rValue)
            .attr('cx', function(d){ return self.xRange(self.xValue(d)); })
            .attr('cy', function(d){ return self.yRange(self.yValue(d)); })
            .style('fill', self.fillValue)
            .on('click', function(d){
                EventBus.trigger(events.HIGHLIGHT, d);
            });
        
        return self;
    };
}