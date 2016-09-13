class View {
    constructor (type, width, height, position, padding) {
        padding = padding || {top:20, right:20, bottom:30, left:40};
        this.frameWidth = width || 960;
        this.frameHeight = height || 500;
        this.chartHeight = this.frameHeight - padding.top - padding.bottom;
        this.chartWidth = this.frameWidth - padding.left - padding.right;
        this.position = position || {x:0, y:0};
        this.viewId = View.counter;
        this.multiBrushes = {};

        this.svg = d3.select('.canvas').append('g')
            .classed('view', true)
            .classed(type, type || false)
            .attr('transform', 'translate(' + this.position.x + ',' + this.position.y + ')');

        this.svg.append('rect')
            .classed('frame', true)
            .attr('x', 0)
            .attr('y', 0)
            .attr('width', this.frameWidth)
            .attr('height', this.frameHeight);

        this.chart = this.svg.append('g')
            .classed('chart', true)
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');


        this.chart.append('rect').classed('hover-rect', true);
        

        var self = this;
        EventBus.on(events.UPDATE, function(){
            self.updateView.apply(self, arguments);
        });

        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);
            // mark highlighted items
            self.chart.selectAll('.data-item')
                .classed('highlighted',false)
                .filter( d => self.rawValues(d).some(v => selectedData.indexOf(v) !== -1))
                .classed('highlighted', true)
                .moveToFront();
        });
    }


    /**
     * event handlers
     */
    highlight (d){
        if(constants.brushOnClick){
            this.brushDataPoint(d);
        } else {
            EventBus.trigger(events.HIGHLIGHT, this.rawValues(d));
        }
    }

    hover(d, visual){
        var b = visual.getBBox();
        this.chart.selectAll('.hover-rect').datum(visual)
            .attr({x:b.x - 3, y:b.y - 3, width: b.width + 6, height: b.height + 6})
            .style({display:'inline', opacity:1});
        d3.selectAll([...d.visuals]).classed('highlighted', true);
    }

    unhover(d, visual){
        d3.selectAll([...d.visuals]).classed('highlighted', false);
        this.chart.select('.hover-rect')
            .style({display:'none', opacity:0});
    }

    addInteractivity(selection){
        var t;
        var self = this;
        selection
            .each(function(d){
                self.rawValues(d).forEach(function(v){
                    v.registerVisual(this, self);
                }, this);
            })
            .on('mouseenter', function(d){
                var visual = this;
                t = setTimeout(function(){
                    self.rawValues(d).forEach(function(v){
                        self.hover(v, visual);
                    });
                }, 250);
            })
            .on('mouseleave', function(d){
                var visual = this;
                clearTimeout(t);
                self.rawValues(d).forEach(function(v){
                    self.unhover(v, visual);
                });
            })
            .on('click', self.highlight.bind(self));
    }

    /**
     * update meta information of data on brush event
     */
    onBrush (brush){

        // reposition menu
        var extentRect = brush.brushArea.select('.extent');
        var brushMenu = brush.brushArea.selectAll('.brush-menus');
        brushMenu.attr('transform','translate('+ (+extentRect.attr('x') + (+extentRect.attr('width')/2)) + ','
            + extentRect.attr('y') + ')');
        
        // (un)register brush with (un)brushed items
        var self = this;
        this.chart.selectAll('.data-item').each(function(d){
            var extent = brush.extent();
            var brushed = false;
            
            if(brush.x() !== null && brush.y() !== null){
                brushed = extent[0][0] <= self.xValue(d, brush.dim) && self.xValue(d, brush.dim) <= extent[1][0]
                    && extent[0][1] <= self.yValue(d, brush.dim) && self.yValue(d, brush.dim) <= extent[1][1];
            } else if(brush.x() !== null){
                brushed = extent[0] <= self.xValue(d, brush.dim) && self.xValue(d, brush.dim) <= extent[1];
            } else if(brush.y() !== null){
                brushed = extent[0] <= self.yValue(d, brush.dim) && self.yValue(d, brush.dim) <= extent[1];
            }

            if(brushed){
                self.rawValues(d).forEach(function(v){
                    v.registerBrush(brush);
                });

            }
            else {
                self.rawValues(d).forEach(function(v){
                    v.unregisterBrush(brush);
                });
            }
        });

        EventBus.trigger(events.UPDATE);
    }

    /**
     * aftermath when brushing on the ready brush (ie. resetting the brushes or inserting a new brush)
     */
    onBrushEnd (brush) {
        var targetBrush = brush;
        var readyBrush = this.multiBrushes[targetBrush.dim].readyBrush();
        if(readyBrush === targetBrush){
            if(!readyBrush.empty()){
                targetBrush.brushArea
                    .classed('ready', false)
                    .classed('active', true);
                this.insertNewBrush(targetBrush.dim);
            }
        }
    }
    
    /*
     * brushing utility and helper functions
     */

    insertNewBrush (dim = 'default', containerNode) {
        if(!this.multiBrushes.hasOwnProperty(dim)){
            this.multiBrushes[dim] = new Multibrush(dim, this, containerNode);
        }
        this.multiBrushes[dim].addBrush(this.createBrush(dim));
    }

    brushDataPoint(d){
        _.each(this.multiBrushes, function(brush){
            brush.setExtentOnData(d);
        });
    }

    /**
     * utilities
     */
    position (position){
        this.position = position;
        return this.svg.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
    };

    static get counter() {
        View._counter = (View._counter || 0) + 1;
        return View._counter;
    }
    
    /**
     * delegate methods that have to be overwritten by subclasses
     */
    createBrush(ranges){
        throw Error('need to overwrite brush creator method createBrush for object: ' + this);
    }

    xValue (){
        throw Error('need to overwrite accessor method xValue for object: ' + this);
    };

    yValue (){
        throw Error('need to overwrite accessor method yValue for object: ' + this);
    };

    idValue (){
        throw Error('need to overwrite accessor method idValue for object: ' + this);
    }

    rawIdValue () {
        throw Error('need to overwrite accessor method rawIdValue for object: ' + this);
    }

    /**
     * function to overwrite in order to get the underlying values of an aggregation.
     * Default: If d is not an aggregation of values it will just return a single-element array containing d.
     * @param d
     * @returns {Array.<*>}
     */
    rawValues (d) {
        return [].concat(d);
    }

    updateView(){
        var thisView = this;
        this.chart.selectAll('.data-item')
            .each(function(aggregateD){

                //default styles and reset connections
                var myStyles = {
                    point:{'fill': thisView.fillValue(aggregateD), 'stroke':thisView.fillValue(aggregateD), 'stroke-width':2},
                    link:{stroke:'black', fill:'none'}
                };
                this.connections = [];

                thisView.rawValues(aggregateD).forEach(function(v){
                    v.brushes.forEach(function(brush){
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
                            v.visuals.forEach(function(visual){
                                //only connect to visuals in target views and not to self (in origin view)
                                if(brush.targetViews.has(visual.view)){
                                    this.connections.push({from:this, to:visual, brush:brush, rawValue:v});
                                }
                            }, this);
                        }
                    }, this);
                }, this);


                d3.select(this).style(myStyles.point);


                var aggregateId = thisView.idValue(aggregateD);
                var links = d3.select('.canvas > .links').selectAll('path.data' + aggregateId + '.from-view-' + thisView.viewId)
                    .data(this.connections, function(d){
                        return thisView.rawIdValue(d.rawValue) + '-within' + aggregateId + '-from' + thisView.viewId + '-to' + d.to.view.viewId
                    });

                // update lines (including line interpolation etc)
                links.style(myStyles.link).transition().attr('d', function(d){
                    return Lines.makeLine(getCenter(d.from), getCenter(d.to), d.brush.connect, this);
                });

                // add new lines
                links.enter().append('path')
                    .classed('data'+aggregateId, true)
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


                // remove lines that dropped out
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
                            return Lines.makeLine(getCenter(d.from), getCenter(d.from), d.brush.connect, this);
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

