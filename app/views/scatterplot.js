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
    };


    // public variables and functions
    data (data){
        var self = this;

        self.xRange.domain(d3.extent(data, self.xValue)).nice(5);
        self.yRange.domain(d3.extent(data, self.yValue)).nice(5);

        var transition = self.chart.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis);

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        self.insertNewBrush();

        // data
        var content = self.chart.append('g').classed('content', true);
        var bubbles = content.selectAll('.bubble').data(data, self.idValue);
        bubbles.enter().append('circle')
            .classed('bubble data-item default', true)
            .attr('r', self.rValue)
            .attr('cx', function(d){ return self.xRange(self.xValue(d)); })
            .attr('cy', function(d){ return self.yRange(self.yValue(d)); })
            .style('fill', self.fillValue)
            .on('click', self.highlight.bind(self))
            .each(function(d){
                d.registerVisual(this, self);
            });
        
        return self;
    };


    /*
     * Override methods
     */
    createBrush () {
        var self = this;
        var brush = d3.svg.brush()
            .y(this.yRange)
            .x(this.xRange);
        brush.on('brush', function(){
                self.onBrush(brush);
            })
            .on('brushend', function(){
                self.onBrushEnd(brush);
            });
        return brush;
    }
/*
    updateView(){
        this.chart.selectAll('.data-item')
            .call(this.applyStyles.bind(this));
        this.chart.selectAll('.data-item')
            .filter(this.hasDefaultClass)
            .moveToBack();
    }
*/
}