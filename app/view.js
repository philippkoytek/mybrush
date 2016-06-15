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

        this.brushes = {};
        var self = this;
        EventBus.on(events.BRUSH, function(sourceView, ghostData){
           if(sourceView !== self.viewId){

               self.chart.selectAll('.brush').each(function(dim){
                   dim = dim || 'default';
                   d3.select(this).call(self.brushes[dim].clear());
               });

               self.chart.selectAll('.data-item.brushable')
                   .classed('ghost', false)
                   .filter(function(d){
                       return ghostData.indexOf(d) !== -1;
                   })
                   .classed('ghost', true)
                   .moveToBack();
           }
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


    //TODO: create Brushable Mixin to add Brushing Behaviour dynamically
    get brush (){
        return this.brushes['default'];
    }

    set brush (brush){
        this.brushes['default'] = brush;
    }

    onBrush (){
        var ghostData = [];
        
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
                return false;
            } else {
                ghostData.push(d);
                return true;
            }
        });
        EventBus.trigger(events.BRUSH, self.viewId, ghostData);
    }

    xValue (){
        throw error('need to overwrite accessor method xValue for object: ' + this);
    };

    yValue (){
        throw error('need to overwrite accessor method yValue for object: ' + this);
    };

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

