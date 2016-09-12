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

    updateView(){
        //TODO
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

    addHover(selection){
        var t;
        var self = this;
        selection
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
            .on('click', self.highlight.bind(self))
            .each(function(d){
                d.registerVisual(this, self);
            });
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

            //TODO: probably missing rawValues
            if(brushed){
                d.registerBrush(brush);
            }
            else {
                d.unregisterBrush(brush);
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

    /**
     * function to overwrite in order to get the underlying values of an aggregation.
     * Default: If d is not an aggregation of values it will just return a single-element array containing d.
     * @param d
     * @returns {Array.<*>}
     */
    rawValues (d) {
        return [].concat(d);
    }
}

