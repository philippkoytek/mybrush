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
            return (d.wage / 50000) - 1;
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
            .style('stroke', self.fillValue)
            .style('stroke-width', 2)
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
                    point:{'fill': thisView.fillValue(d), 'stroke':thisView.fillValue(d), 'stroke-width':2},
                    link:{stroke:'black', fill:'none'}
                };
                this.connections = [];

                d.brushes.forEach(function(brush){
                    if(brush.origin == thisView){
                        // overwrites myStyles with the new brush styles (except does not overwrite when brush style is marked undefined)
                        _.merge(myStyles.point, brush.styles.source);
                    } else if (brush.targetViews.has(thisView)){
                        // overwrites myStyles with the new brush styles (except does not overwrite when brush style is marked undefined)
                        _.merge(myStyles.point, brush.styles.target);
                    }
                    //rebuild connections data
                    if(brush.connect && brush.origin == thisView){
                        _.merge(myStyles.link, brush.styles.link);
                        d.visuals.forEach(function(visual){
                            //only connect to visuals in target views and not to self (in origin view)
                            if(brush.targetViews.has(visual.view)){
                                this.connections.push({from:this, to:visual, brush:brush});
                            }
                        }, this);
                    }
                }, this);

                d3.select(this).style(myStyles.point);



                var makeLine = function(start, end, curveStyle, pathNode){
                    var s = getCenter(start);
                    var e = getCenter(end);
                    var points;
                    var res = 5;
                    var type = 'bspline';
                    if(curveStyle == 'linear'){
                        points = [s, e];
                        res = 0;
                    }
                    else {
                        points = [s, {x:(s.x + e.x)/2, y:s.y}, {x:(s.x + e.x)/2, y:e.y}, e];
                    }

                    if(curveStyle == 'step'){
                        curveStyle = 'linear';
                        res = 0;
                    }

                    if(curveStyle == 'cardinal'){
                        type = 'catmull-rom';
                    }

                    var newCurve = new SDCurve({
                        points: points,
                        degree: 2,
                        resolution:res,
                        type:type
                    }).curve().map(function(d){
                        return d.point;
                    });
                    
                    if(pathNode._curve && curveStyle){
                        if(pathNode._curve.length > newCurve.length){
                            insertPoints(newCurve, pathNode._curve.length - newCurve.length);
                        }
                        else if (newCurve.length > pathNode._curve.length) {
                            insertPoints(pathNode._curve, newCurve.length - pathNode._curve.length);
                            d3.select(pathNode).attr('d', function(){
                                return drawCurve(pathNode._curve);
                            });
                        }
                    }

                    //todo: performance improvement possible here by caching the curves for different line styles in a property of pathNode
                    pathNode._curve = newCurve;
                    return drawCurve(pathNode._curve);
                };


                function drawCurve(curve){
                    return d3.svg.line()
                        .x(function(d) { return d.x; })
                        .y(function(d) { return d.y; })
                        .interpolate("linear")(curve);
                }

                /**
                 * inserts <count> points to the array <curvePoints> and distributes them evenly across all line segments.
                 * Manipulates the given array <curvePoints> by inserting points
                 * @param curvePoints {[]} the curve's array of points. (the number of line segments can be determined by: curvePoints.length-1)
                 * @param count {int} total number of points to be added to the curve
                 */
                function insertPoints(curvePoints, count){
                    var pointsPerSegment = count / (curvePoints.length-1);  // number of points that need to be added on each line segment (in average)
                    var totalPointsAdded = 0;
                    var pointsForSegmentI;
                    // iterate over all line segments of the curve (eg. segment1 is from point 0 to point 1)
                    for(var segmentI = 1; segmentI <= curvePoints.length-1-totalPointsAdded; segmentI++){
                        pointsForSegmentI = Math.round(segmentI * pointsPerSegment) - totalPointsAdded;  // determined by calculating the points to be added from segment0 to segmentI minus the points already added
                        if(pointsForSegmentI > 0){
                            curvePoints.splice(segmentI+totalPointsAdded, 0, ...distributePointsBetween(curvePoints[segmentI+totalPointsAdded - 1], curvePoints[segmentI+totalPointsAdded], pointsForSegmentI));
                            totalPointsAdded += pointsForSegmentI;
                        }
                    }
                }

                /**
                 * calculates evenly distributed points that are on a straight line between points a and b
                 * format of points: {x:.., y:..}
                 * @param a {object} start point of line
                 * @param b {object} end point of line
                 * @param n {int} number of points to insert between a and b
                 * @return {[]} array of n evenly distributed points on the line between a and b
                 */
                function distributePointsBetween(a, b, n) {
                    var dx = (b.x - a.x) / (n + 1);
                    var dy = (b.y - a.y) / (n + 1);
                    var points = [];
                    for(var i = 1; i <= n; i++){
                        points.push({
                            x: a.x + dx*i,
                            y: a.y + dy*i
                        });
                    }
                    return points;
                }





                var dataId = thisView.idValue(d);
                var links = d3.select('.canvas > .links').selectAll('path.data' + dataId + '.from-view-' + thisView.viewId)
                    .data(this.connections, function(d){return dataId + '-from' + thisView.viewId + '-to' + d.to.view.viewId});

                // todo: update lines (including line interpolation etc)
                links.style(myStyles.link).transition().attr('d', function(d){
                    return makeLine(d.from, d.to, d.brush.connect, this);
                });

                links.enter().append('path')
                    .classed('data'+dataId, true)
                    .classed('from-view-'+thisView.viewId, true) //todo: add a "to-view-1" class
                    .style(myStyles.link)
                    .style('opacity', function(d){
                        return d.brush.animate == 'fade' ? 0 : 1;
                    })
                    .attr('d', function(d){
                        var to = d.to;
                        if(d.brush.animate == 'draw'){
                            to = d.from;
                        }
                        return makeLine(d.from, to, d.brush.connect, this);
                    })
                    .transition()
                    .duration(function(d){
                        return d.brush.animate && d.brush.animate != 'none'? 350 : 0;
                    })
                    .style('opacity', 1)
                    .attr('d', function(d){
                        return makeLine(d.from, d.to, d.brush.connect, this);
                    });


                links.exit()
                    .transition()
                    .duration(function(d){
                        return d.brush.animate && d.brush.animate != 'none'? 350 : 0;
                    })
                    .style('opacity', function(d){
                        return d.brush.animate == 'fade' ? 0 : 1;
                    })
                    .attr('d', function(d){
                        if(d.brush.animate == 'draw'){
                            return makeLine(d.from, d.from, d.brush.connect, this);
                        }
                        return drawCurve(this._curve);
                    })
                    .remove();
            });

        
        function getCenter(visual){
            return {
                x:visual.getBoundingClientRect().left + visual.getBoundingClientRect().width/2,
                y:visual.getBoundingClientRect().top + visual.getBoundingClientRect().height/2
            };
        }
    }

}


