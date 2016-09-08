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

    updateView(){
        var thisView = this;
        this.chart.selectAll('.data-item')
            .each(function(d){

                //default styles and reset connections
                var myStyles = {
                    source:{'fill': thisView.fillValue(d), 'stroke':'none', 'stroke-width':0},
                    link:{stroke:'black', fill:'none'}
                };
                this.connections = [];

                d.brushes.forEach(function(brush){
                    if(brush.origin == thisView || brush.targetViews.has(thisView)){
                        // overwrites myStyles with the new brush styles (except does not overwrite when brush style is marked undefined)
                        _.merge(myStyles, brush.styles);
                    }
                    //rebuild connections data
                    if(brush.connect && brush.origin == thisView){
                        d.visuals.forEach(function(visual){
                            //only connect to visuals in target views and not to self (in origin view)
                            if(brush.targetViews.has(visual.view)){
                                this.connections.push({from:this, to:visual, brush:brush});
                            }
                        }, this);
                    }
                }, this);

                d3.select(this).style(myStyles.source);


                var makeLine = function(start, end, interpolation, pathNode){
                    var s = getCenter(start);
                    var e = getCenter(end);
                    var points;
                    var res = 5;
                    var type = 'bspline';
                    if(interpolation == 'linear'){
                        points = [s, s, e, e];
                        res = 0;
                    }
                    else {
                        points = [s, [(s[0] + e[0])/2, s[1]], [(s[0] + e[0])/2, e[1]], e];
                    }

                    if(interpolation == 'step'){
                        interpolation = 'linear';
                        res = 0;
                    }

                    if(interpolation == 'cardinal'){
                        type = 'catmull-rom';
                    }

                    return d3.svg.line().interpolate(interpolation)(points);
                };




                var dataId = thisView.idValue(d);
                var links = d3.select('.canvas').selectAll('path.data' + dataId + '.from-view-' + thisView.viewId)
                    .data(this.connections, function(d){return dataId + '-from' + thisView.viewId + '-to' + d.to.view.viewId});

                console.log(this.connections);
                // todo: update lines (including line interpolation etc)
                links.style(myStyles.link).transition().attr('d', function(d){
                    return makeLine(d.from, d.to, d.brush.connect, this);
                });

                links.enter().append('path')
                    .classed('data'+dataId, true)
                    .classed('from-view-'+thisView.viewId, true) //todo: add a "to-view-1" class
                    .attr('d', function(d){
                        return makeLine(d.from, d.from, d.brush.connect, this);
                    })
                    .style(myStyles.link)
                    .transition()
                    .attr('d', function(d){
                        return makeLine(d.from, d.to, d.brush.connect, this);
                    });

                links.exit().transition().attr('d', function(d){
                    return makeLine(d.from, d.from, d.brush.connect, this);
                }).remove();
            });

        
        function getCenter(visual){
            return [visual.getBoundingClientRect().left + visual.getBoundingClientRect().width/2,
                visual.getBoundingClientRect().top + visual.getBoundingClientRect().height/2];
        }
    }

}

/*var sdLineFunction = d3.svg.line()
 .x(function(d) { return d.point.x; })
 .y(function(d) { return d.point.y; })
 .interpolate("linear");

 var curvePts = myCurve.curve();
 var mySlices = []
 var half1 = curvePts.slice(0,curvePts.length/2);
 var half2 = curvePts.slice(curvePts.length/2+1, curvePts.length);

 var pts = getLinePoints(d.from, d.to).map(function(p){
 return {x:p[0], y:p[1]};
 });
 var myCurve = new SDCurve({
 points: pts,
 degree: 5
 });
 return sdLineFunction(myCurve.curve());
 */
