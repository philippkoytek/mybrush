/**
 * Created by Philipp Koytek on 6/8/2016.
 */

var MvBarChart = (function(){

    // static variables
    var defaults = {};
    defaults.margin = {top: 20, right: 20, bottom: 70, left: 40};
    defaults.width = 960;
    defaults.height = 500;

    //constructor
    var BarChart = function(svgElement, yLabel, width, height){
        this.width = (width || defaults.width)  - defaults.margin.left - defaults.margin.right;
        this.height = (height || defaults.height)  - defaults.margin.top - defaults.margin.bottom;

        this.xRange = d3.scale.ordinal().rangeRoundBands([0, this.width], 0.1);
        this.yRange = d3.scale.linear().range([this.height, 0]);

        this.xAxis = d3.svg.axis().scale(this.xRange).orient('bottom');
        this.yAxis = d3.svg.axis().scale(this.yRange).orient('left');

        this.svg = d3.select(svgElement)
            .attr('width', this.width + defaults.margin.left + defaults.margin.right)
            .attr('height', this.height + defaults.margin.top + defaults.margin.bottom)
            .attr('transform', 'translate(0,' + (defaults.margin.top + this.height + defaults.margin.bottom) + ')')
            .append('g')
            .attr('transform', 'translate(' + defaults.margin.left + ',' + defaults.margin.top + ')');

        this.svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(this.xAxis);

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
    BarChart.prototype.data = function(data){
        var self = this;

        var barsData = d3.nest().key(function(d){ return d.club; }).entries(data);

        self.xRange.domain(barsData.map(function(bar){ return bar.key; }));
        self.yRange.domain([0, d3.max(barsData, function(bar){ return bar.values.length; })]);

        var transition = self.svg.transition();

        transition.select('.x.axis')
            .duration(750)
            .call(self.xAxis)
            .selectAll('text')
            .style('text-anchor', 'end')
            .attr('transform', 'rotate(-65)');

        transition.select('.y.axis')
            .duration(750)
            .call(self.yAxis);

        var bars = self.svg.selectAll('.bar').data(barsData);
        bars.enter().append('rect')
            .attr('class', 'bar')
            .attr('x', function(d){ return self.xRange(d.key); })
            .attr('width', self.xRange.rangeBand())
            .attr('y', function(d){ return self.yRange(d.values.length); })
            .attr('height', function(d){ return self.height - self.yRange(d.values.length); })
            .on('click', function(d){
                EventBus.trigger('selection', d.values);
            });

        EventBus.on('selection', function(selection){
           selection = [].concat(selection);
           bars.style('stroke-width', '0');
            var highlightedBar = bars.filter(function(d){
               return d.values.some(v => selection.indexOf(v) !== -1);
            });
            highlightedBar.style({
                'stroke-width':'2px',
                'stroke':'#F00'
            });
        });

        return self;
    };

    return BarChart;
})();