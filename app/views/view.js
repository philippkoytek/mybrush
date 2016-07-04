/**
 * Created by Philipp Koytek on 6/9/2016.
 */

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

        var self = this;
        EventBus.on(events.BRUSH, function(sourceView){
            if(constants.greyOnBrush){
                self.chart.selectAll('.data-item')
                    .classed('ghost', false)
                    .filter(self.isGhost.bind(self))
                    .classed('ghost', true)
                    .moveToBack();
            }
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

    /**
     * update meta information of data on brush event
     */
    onBrush (){
        //determine brushed dimension(s)
        var self = this;
        var brushedDimensions = [];
        _.each(this.multiBrushes, function(b, dim){
            if(!b.empty()){
                brushedDimensions.push(dim);
            }
        });

        if(brushedDimensions.length == 0) {
            // no active brushes
            this.chart.selectAll('.data-item').each(function (d) {
                self.rawValues(d).forEach(function (v) {
                    v.meta.unset(self.viewId);
                });
            });
        } else {
            this.chart.selectAll('.data-item').each(function(d){
                if(self.brushesContain(d, brushedDimensions)) {
                    // item is brushed
                    self.rawValues(d).forEach(function(v){
                        v.meta.brush(self.viewId);
                        if(constants.connect){
                            v.meta.connectFrom(this);
                        }
                    }, this);
                } else {
                    // item is not brushed (-> grey)
                    self.rawValues(d).forEach(function(v){
                        v.meta.grey(self.viewId);
                        v.meta.disconnectFrom(this);
                    }, this);
                }
            });
            State().updateConns();
        }

        EventBus.trigger(events.BRUSH, self.viewId);
    }

    /**
     * aftermath when brushing on the ready brush (ie. resetting the brushes or inserting a new brush)
     */
    onBrushEnd () { 
        var targetBrush = d3.event.target;
        var readyBrush = this.multiBrushes[targetBrush.dim].readyBrush();
        if(readyBrush === targetBrush){
            if(readyBrush.empty()){
                this.multiBrushes[targetBrush.dim].reset();
            }
            else {
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
     * checks if data point d is being brushed in this view.
     * d is only brushed if it is contained in brushes of every dimension in dimensions
     * @param d
     * @param dimensions
     * @returns {*|boolean} true if d is being brushed
     */
    brushesContain(d, dimensions){
        var self = this;
        return dimensions.every(function(dim){
            return self.multiBrushes[dim].extentsContain(d);
        });
    }

    /**
     * checks if d is supposed to be a ghost (ie. greyed out) or not (ie. colored/highlighted)
     * depending on the kind of brushing that is active (union vs. intersect)
     * @param d
     * @returns {boolean}
     */
    isGhost(d){
        if(constants.unionBrushing){
            return !this.rawValues(d).some(function(v){
                return !v.meta.hasGreys() || v.meta.hasBrushes();
            });
        } else {
            return this.rawValues(d).every(function(v){
                return v.meta.hasGreys();
            });
        }
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

