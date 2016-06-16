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
        this.brushes = {};
        var self = this;
        EventBus.on(events.BRUSH, function(sourceView, brushedData){
           if(sourceView !== self.viewId){

               self.chart.selectAll('.brush').each(function(dim){
                   dim = dim || 'default';
                   d3.select(this).call(self.brushes[dim].clear());
               });

               self.chart.selectAll('.data-item.brushable')
                   .classed('ghost', false)
                   .filter(function(d){
                       return self.rawValues(d).every(v => brushedData.indexOf(v) === -1);
                   })
                   .classed('ghost', true)
                   .moveToBack();
           }
        });

        EventBus.on(events.HIGHLIGHT, function(selectedData){
            selectedData = [].concat(selectedData);

            self.chart.selectAll('.data-item')
                .classed('highlighted',false)
                .filter( d => self.rawValues(d).some(v => selectedData.indexOf(v) !== -1))
                .classed('highlighted', true)
                .moveToFront();
        });
    }
    
    // public functions and variables
    position (position){
        this.position = position;
        return this.svg.attr('transform', 'translate(' + position.x + ',' + position.y + ')');
    };

    static get counter() {
        View._counter = (View._counter || 0) + 1;
        return View._counter;
    }


    get brush (){
        return this.brushes['default'];
    }

    set brush (brush){
        this.brushes['default'] = brush;
    }

    onBrush (){
        var brushedData = [];
        
        //determine brushed dimension(s)
        var brushedDimensions = [];
        _.each(this.brushes, function(b, dim){
            if(!b.empty()){
                brushedDimensions.push(dim);
            }
        });
        
        var self = this;
        this.chart.selectAll('.data-item.brushable').classed('ghost', function(d){
            if(brushedDimensions.every(function(dim){
                var brush = self.brushes[dim];
                return self.isWithinBrushExtent(d, brush, dim);
            })){
                brushedData = brushedData.concat(self.rawValues(d));
                return false;
            } else {
                return true;
            }
        });
        EventBus.trigger(events.BRUSH, self.viewId, brushedData);
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

    isWithinBrushExtent(d, brush, dim){
        var hasX = brush.x() !== null;
        var hasY = brush.y() !== null;
        var extent = brush.extent();
        if(hasX && hasY){
            return extent[0][0] <= this.xValue(d, dim) && this.xValue(d, dim) <= extent[1][0]
                && extent[0][1] <= this.yValue(d, dim) && this.yValue(d, dim) <= extent[1][1];
        } else if(hasX){
            return extent[0] <= this.xValue(d, dim) && this.xValue(d, dim) <= extent[1];
        } else if(hasY){
            return extent[0] <= this.yValue(d, dim) && this.yValue(d, dim) <= extent[1];
        }
        else return false;
    }
}

