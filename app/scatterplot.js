/**
 * Created by Philipp Koytek on 6/6/2016.
 */

var MvScatterPlot = (function(){

    // static variables
    var defaults = {};
    defaults.margin = {top: 20, right: 20, bottom: 30, left: 40};
    defaults.width = 960;
    defaults.height = 500;

    // constructor
    var ScatterPlot = function(svgElement, xLabel, yLabel, width, height){
        this.width = (width || defaults.width) - defaults.margin.left - defaults.margin.right;
        this.height = (height || defaults.height) - defaults.margin.top - defaults.margin.bottom;

        this.xRange = d3.scale.linear().range([0, this.width]);
        this.yRange = d3.scale.linear().range([this.height, 0]);

        //TODO: what colors to use?
        this.color = d3.scale.category20();

        this.xAxis = d3.svg.axis().scale(this.xRange).orient('bottom');
        this.yAxis = d3.svg.axis().scale(this.yRange).orient('left');

        this.svg = d3.select(svgElement)
            .attr('width', this.width + defaults.margin.left + defaults.margin.right)
            .attr('height', this.height + defaults.margin.top + defaults.margin.bottom)
            .append('g')
            .attr('transform', 'translate(' + defaults.margin.left + ',' + defaults.margin.top + ')');

        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(this.xAxis)
            .append('text')
            .attr('class', 'label')
            .attr('x', this.width)
            .attr('y', -6)
            .style('text-anchor', 'end')
            .text(xLabel || '');

        this.svg.append('g')
            .attr('class', 'y axis')
            .call(this.yAxis)
            .append('text')
            .attr('class', 'label')
            .attr('transform', 'rotate(-90)')
            .attr('y', 6)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(yLabel || '');
    };


    // public variables and functions
    ScatterPlot.prototype.data = function(data){
        // load data into plot

        var self = this;
        // TODO: provide mapping functions for incoming data to map it as needed for the chart: d = {xValue, yValue, rValue, colorValue, opacityValue}

        self.xRange.domain(d3.extent(data, function(d){ return d.likes; })).nice();
        self.yRange.domain(d3.extent(data, function(d){ return d.dislikes; })).nice();

        var transition = self.svg.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis);

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        // data
        var bubbles = self.svg.selectAll('.bubble').data(data, function(d){ return d.fifaPid; });
        bubbles.enter().append('circle')
            .attr('class', 'bubble')
            .attr('r', function(d){ return d.wage / 50000 || 3.5; })
            .attr('cx', function(d){ return self.xRange(d.likes); })
            .attr('cy', function(d){ return self.yRange(d.dislikes); })
            .style('fill', function(d){ return self.color(d.club || '0'); })
            .on('click', function(d){
                EventBus.trigger(events.HIGHLIGHT, d);
            });

        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);
            
            self.svg.selectAll('.bubble')
                .classed('highlighted',false)
            .filter( d => selectedData.indexOf(d) !== -1)
                .classed('highlighted', true)
                .moveToFront();
        });

        
        return self;
    };

    return ScatterPlot;

})();