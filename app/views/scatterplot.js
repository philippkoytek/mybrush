
class ScatterPlot extends View {
    constructor (title, xLabel, yLabel, width, height, position, padding){

        super(title, 'scatterplot',width, height, position, padding);

        this.xValue = function(d){
            return d.likes;
        };

        this.yValue = function(d){
            return d.dislikes;
        };
        
        this.rValue = function(d){
            return 7;//(d.wage / 50000) - 1;
        };

        this.strokeValue = this.fillValue = function(d){ 
            return constants.defaultDataColor; 
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
            .classed('bubble data-item aggregate individual', true)
            .attr('r', self.rValue)
            .attr('cx', function(d){ return self.xRange(self.xValue(d)); })
            .attr('cy', function(d){ return self.yRange(self.yValue(d)); })
            .style('fill', self.fillValue)
            .style('stroke', self.fillValue)
            .style('stroke-width', constants.strokeWidth)
            .call(self.addInteractivity.bind(self));
        
        return self;
    };


    /*
     * Override methods
     */
    createBrush () {
        var self = this;
        var brush = d3.svg.pkbrush()
            .y(this.yRange)
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

}


