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


        //TODO: create Brushable and Highlightable Mixin to add Brushing Behaviour dynamically
        this.multiBrushes = {};
        var self = this;
        EventBus.on(events.BRUSH, function(sourceView, brushedData){

               // mark unselected items as ghosts
               self.chart.selectAll('.data-item')
                   .classed('ghost', false)
                   .filter(function(d){
                       return self.rawValues(d).every(function(v){
                           return v.meta.grey.size > 0;
                       });
                   })
                   .classed('ghost', true)
                   .moveToBack();
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

    /*
     * event handlers
     */
    
    highlight (d){
        if(constants.brushOnClick){
            this.brushDataPoint(d);
        }
        else {
            EventBus.trigger(events.HIGHLIGHT, this.rawValues(d));
        }
    }

    onBrush (){
        //determine brushed dimension(s)
        var brushedDimensions = [];
        _.each(this.multiBrushes, function(b, dim){
            if(!b.empty()){
                brushedDimensions.push(dim);
            }
        });

        var self = this;
        this.chart.selectAll('.data-item').each(function(d){
            if(self.isBrushedInAllDimensions(d, brushedDimensions)) {
                self.rawValues(d).forEach(function(v){
                    v.meta.grey.delete(self.viewId);
                });
            } else {
                self.rawValues(d).forEach(function(v){
                    v.meta.grey.add(self.viewId);
                });
            }
        });
        EventBus.trigger(events.BRUSH, self.viewId);
    }
    
    onBrushEnd () { 
        var targetBrush = d3.event.target;
        var readyBrush = this.multiBrushes[targetBrush.dim].readyBrush();

        if(readyBrush === targetBrush){
            if(readyBrush.empty()){
                console.log('resetting brushes');
                this.multiBrushes[targetBrush.dim].reset();
            }
            else {
                console.log('insert new brush');
                targetBrush.brushArea
                    .classed('ready', false)
                    .classed('active', true);
                this.insertNewBrush(targetBrush.dim);
            }
        }
        //else: do nothing because active brush has been altered
        else {
            //TODO: remove output!
            console.log('do nothing');
        }
    }
    
    /*
     * brushing
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

    isBrushedInAllDimensions(d, dimensions){
        return dimensions.every(function(dim){
            return self.multiBrushes[dim].extentsContain(d);
        });
    }

    /*
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

