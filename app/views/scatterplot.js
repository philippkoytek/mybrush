
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
            .call(self.addHover.bind(self));
        
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


                var dataId = thisView.idValue(d);
                var links = d3.select('.canvas > .links').selectAll('path.data' + dataId + '.from-view-' + thisView.viewId)
                    .data(this.connections, function(d){return dataId + '-from' + thisView.viewId + '-to' + d.to.view.viewId});

                // todo: update lines (including line interpolation etc)
                links.style(myStyles.link).transition().attr('d', function(d){
                    return Lines.makeLine(getCenter(d.from), getCenter(d.to), d.brush.connect, this);
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
                        return Lines.makeLine(getCenter(d.from), getCenter(to), d.brush.connect, this);
                    })
                    .transition()
                    .duration(function(d){
                        return d.brush.animate && d.brush.animate != 'none'? 350 : 0;
                    })
                    .style('opacity', 1)
                    .attr('d', function(d){
                        return Lines.makeLine(getCenter(d.from), getCenter(d.to), d.brush.connect, this);
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
                            return Lines.makeLine(d.from, d.from, d.brush.connect, this);
                        }
                        return Lines.drawCurve(this._curve);
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


