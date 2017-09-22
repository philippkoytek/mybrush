class View {
    constructor (title, type, width, height, position, padding) {
        padding = padding || {top:20, right:20, bottom:30, left:40};
        padding.top += 50;
        this.frameWidth = width || 960;
        this.frameHeight = height || 500;
        this.chartHeight = this.frameHeight - padding.top - padding.bottom;
        this.chartWidth = this.frameWidth - padding.left - padding.right;
        this.position = position || {x:0, y:0};
        this.viewId = View.counter;
        this.multiBrushes = {};
        this.type = type;
        this.title = title || 'No title';

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

        this.svg.append('text')
            .classed('view-title', true)
            .style({'font-size':28, 'font-weight':'bold', fill:'#808080'})
            .attr({x:padding.left, y:50})
            .text(this.title);

        this.svg.append('text')
            .classed('view-number', true)
            .style({'font-size':48, 'font-weight':'bold', fill:'#808080'})
            .attr({x:this.frameWidth - 60, y:52})
            .text(this.viewId);

        this.chart = this.svg.append('g')
            .classed('chart', true)
            .attr('transform', 'translate(' + padding.left + ',' + padding.top + ')');
        
        this.fromChartToAbsoluteCtx = makeAbsoluteContext(this.chart.node(), d3.select('svg').node());        

        var self = this;
        EventBus.on(events.UPDATE, function(){
            self.updateView.apply(self, arguments);
        });
    }


    /**
     * event handlers
     */
    hover(d, visual){
        var self = this;
        if(d3.event){
            d3.event.sourceEvent.stopPropagation();
        }
        this.rawValues(d).forEach(function(v){
            this.chart.selectAll('.hover-rect')
                .each(function(dim){
                    d3.select(this).attr(self.getMinimumBrushBox(visual, d, dim));
                })
                .style({display:'inline', opacity:1});
            d3.selectAll([...v.visuals]).filter('.individual').classed('highlighted', true).moveToFront();
            if(this.hoverSecondary){
                this.hoverSecondary(d, visual);
            }
            // highlight links that are connected to the individual (!) data item
            d3.select('.canvas > .links')
                .selectAll(
                    'path.from-data' + this.idValue(d) + '.from-view-' + this.viewId +', '+
                    'path.to-data' + this.idValue(d) + '.to-view-' + this.viewId
                ).classed('highlighted', true);
            d3.select('svg').on('click', function(){
                if(!d3.event.defaultPrevented){
                    self.unhover();
                }
            });
        }, this);
    }

    unhover(d, visual){
        d3.selectAll('.data-item').classed('highlighted secondary-highlight', false);
        d3.select('.canvas > .links').selectAll('path').classed('highlighted', false);
        this.chart.selectAll('.hover-rect')
            .style({display:'none', opacity:0});
        d3.select('svg').on('click', null);
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
                    self.hover(d, visual);
                }, 250);
            })
            .on('mouseleave', function(d){
                clearTimeout(t);
                self.unhover(d, this);
            })
            .call(mtouch_events()
                .on('tap', function(d, i){
                    if(d3.event.sourceEvent.type === "mouseup"){
                        return self.brushDataPoint(d, i, this);
                    }
                    var wasHighlighted = d3.select(this).classed('highlighted');
                    self.unhover();
                    if(!wasHighlighted){
                        self.hover(d, this);
                    }
                })
                .on('hold', function(d, i){
                    self.brushDataPoint(d, i, this);
                })
            );
    }

    onBrushStart(brush){
        brush.moveToFront();
    }

    /**
     * update meta information of data on brush event
     */
    onBrush (brush){

        brush.updatePositions();
        
        // (un)register brush with (un)brushed items
        var self = this;
        this.chart.selectAll('.data-item').each(function(d, i){
            var extent = brush.extent();
            var brushed = false;
            
            if(brush.x() !== null && brush.y() !== null){
                brushed = extent[0][0] <= self.xValue(d, i, brush.dim) && self.xValue(d, i, brush.dim) <= extent[1][0]
                    && extent[0][1] <= self.yValue(d, i, brush.dim) && self.yValue(d, i, brush.dim) <= extent[1][1];
            } else if(brush.x() !== null){
                brushed = extent[0] <= self.xValue(d, i, brush.dim) && self.xValue(d, i, brush.dim) <= extent[1];
            } else if(brush.y() !== null){
                brushed = extent[0] <= self.yValue(d, i, brush.dim) && self.yValue(d, i, brush.dim) <= extent[1];
            }

            if(brushed){
                self.rawValues(d).forEach(function(v){
                    v.registerBrush(brush);
                    d3.selectAll([...v.visuals]).filter('.individual').classed('up', true);
                });

            }
            else {
                self.rawValues(d).forEach(function(v){
                    v.unregisterBrush(brush);
                    d3.selectAll([...v.visuals]).filter('.individual').classed('up', v.brushes.size > 0);
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
                targetBrush.activate();
                this.insertNewBrush(targetBrush.dim);
            }
        }
        d3.selectAll('.data-item.up').moveToFront();
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

    brushDataPoint(d, i, visual){
        _.forEach(this.multiBrushes, function(multibrush){
            multibrush.setExtentOnData(d, i, visual);
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

    getMinimumBrushBox (visual) {
        var b = visual.getBBox();
        return {x:b.x - 3, y:b.y - 3, width: b.width + 6, height: b.height + 6};
    }

    lineAnchorPoint (visual, d, brush) {
        var b = visual.getBBox();
        return this.fromChartToAbsoluteCtx(b.x + b.width/2, b.y + b.height/2);
    }
    
    styleItem (d3Selection, styles) {
        d3Selection.style(styles);
    }

    updateView(){
        var thisView = this;
        this.chart.selectAll('.data-item')
            .each(function(d){

                //default styles and reset connections
                var myStyles = {
                    point:{'fill': thisView.fillValue(d), 'stroke':thisView.strokeValue(d), 'stroke-width':constants.strokeWidth},
                    link:{stroke:'black', fill:'none'}
                };
                this.connections = [];
                var d3This = d3.select(this);

                // calculate data item's style and connections
                thisView.rawValues(d).forEach(function(v){
                    v.brushes.forEach(function(brush){
                        // overwrite myStyles with the new brush styles (except does not overwrite when brush style is marked undefined)
                        if(brush.origin == thisView && d3This.classed(brush.granularity.source)){
                            _.merge(myStyles.point, brush.styles.source);
                        } else if (brush.targetViews.has(thisView) && d3This.classed(brush.granularity.target)){
                            _.merge(myStyles.point, brush.styles.target);
                        }
                        //rebuild connections data
                        if(brush.connect && brush.origin == thisView && d3This.classed(brush.granularity.source)){
                            //todo fixme: link styles from different brushes that apply to the same connections are not merged but overwritten
                            // (possible fix: don't add the connection twice to this.connections but find the existing one and merge the styles in it)
                            var linkStyle = _.merge({}, myStyles.link, brush.styles.link);
                            v.visuals.forEach(function(visual){
                                //only connect to visuals in target views and not to self (in origin view)
                                if(brush.targetViews.has(visual.view) && d3.select(visual).classed(brush.granularity.target)){
                                    this.connections.push({from:this, to:visual, brush:brush, rawValue:v, style:linkStyle});
                                }
                            }, this);
                        }
                    }, this);
                }, this);

                // style the data item
                thisView.styleItem(d3This, myStyles.point);

                // draw the lines
                var id = thisView.idValue(d);
                var links = d3.select('.canvas > .links').selectAll('path.from-data' + id + '.from-view-' + thisView.viewId)
                    .data(this.connections, function(c){
                        // identifier example: dataItemID WITHIN dataGroupID FROM group/individual IN view2 TO group/individual IN view3
                        return thisView.idValue(c.rawValue) + '-within' + id +
                            '-from-' + c.brush.granularity.source + '-in' + thisView.viewId +
                            '-to-' + c.brush.granularity.target + '-in' + c.to.view.viewId;
                    });

                // update lines (including line interpolation etc)
                links.each(function(c){
                        d3.select(this).style(c.style);
                    })
                    .transition("line-transition-update")
                    .attr('d', function(c){
                    return Lines.makeLine(c.from.view.lineAnchorPoint(c.from, c.rawValue, c.brush),
                        c.to.view.lineAnchorPoint(c.to, c.rawValue, c.brush), c.brush.connect, this);
                    });

                // add new lines
                links.enter().append('path')
                    .classed('from-data'+id, true)
                    .classed('from-view-'+thisView.viewId, true) //todo: add a "to-view-1" class
                    .each(function(c){
                        var toId = c.to.view.idValue(d3.select(c.to).datum());
                        d3.select(this)
                            .style(c.style)
                            .classed('to-view-'+c.to.view.viewId + ' to-data'+toId, true);
                    })
                    .style('opacity', function(c){
                        return c.brush.animate == 'fade' ? 0 : 0.6;
                    })
                    .attr('d', function(c){
                        var to = c.to;
                        if(c.brush.animate == 'draw'){
                            to = c.from;
                        }
                        return Lines.makeLine(c.from.view.lineAnchorPoint(c.from, c.rawValue, c.brush),
                            to.view.lineAnchorPoint(to, c.rawValue, c.brush), c.brush.connect, this);
                    })
                    .transition("line-transition-enter")
                    .duration(function(c){
                        return c.brush.animate && c.brush.animate != 'none'? constants.linkTransitionDuration : 0;
                    })
                    .style('opacity', 0.6)
                    .attr('d', function(c){
                        return Lines.makeLine(c.from.view.lineAnchorPoint(c.from, c.rawValue, c.brush),
                            c.to.view.lineAnchorPoint(c.to, c.rawValue, c.brush), c.brush.connect, this);
                    });


                // remove lines that dropped out
                links.exit()
                    .transition("line-transition-exit")
                    .duration(function(d){
                        return d.brush.animate && d.brush.animate != 'none'? constants.linkTransitionDuration : 0;
                    })
                    .style('opacity', function(d){
                        return d.brush.animate == 'fade' ? 0 : 0.6;
                    })
                    .attr('d', function(d){
                        if(d.brush.animate == 'draw'){
                            return Lines.makeLine(d.from.view.lineAnchorPoint(d.from, d.rawValue, d.brush), 
                                d.from.view.lineAnchorPoint(d.from, d.rawValue, d.brush), d.brush.connect, this);
                        }
                        return Lines.drawCurve(this._curve);
                    })
                    .remove();
            });
    }
}

