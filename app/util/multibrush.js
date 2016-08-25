/**
 * Created by Philipp Koytek on 6/23/2016.
 */


class Multibrush {
    
    constructor(dim, view, containerNode){
        this._brushes = [];
        this.dim = dim;
        this.view = view;
        this.containerNode = containerNode || this.view.chart;
    }

    addBrush(brush) {
        brush.dim = this.dim;
        brush.brushArea = this.containerNode.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);
        brush.modifiers = [function(d3Sel){}];
        brush.origin = this.view;
        brush.targetViews = [VIEWS[2]];
        if(this.view.adjustBrushArea){
            this.view.adjustBrushArea(brush.brushArea);
        }
        if(constants.touchInteraction){
            this.makeTouchable(brush.brushArea);
        }
        this._brushes.push(brush);
    }

    /**
     * removes all brushes but the one that was added last (ready brush)
     */
    reset() {
        while(this._brushes.length > 1){
            var b = this._brushes.shift();
            b.clear();
        }
        this.view.onBrush();
        this.containerNode.selectAll('.brush.active').remove();
    }

    /**
     * programmatically sets the extent of the current ready brush to just include the data point d
     * @param d
     */
    setExtentOnData(d){
        //TODO: calculate meaningful extent size around the data point (instead of hardcoded ranges)
        if(this.hasX() && this.hasY()){
            var x = this.xValue(d);
            var y = this.yValue(d);
            this.readyBrush().brushArea
                .call(this.readyBrush().extent([[x - 5, y - 5],[x + 5, y + 5]]))
                .call(this.readyBrush().event);
        }
        else {
            var xOrY = this.hasX() ? this.xValue(d) : this.yValue(d);
            this.readyBrush().brushArea
                .call(this.readyBrush().extent([xOrY - 21, xOrY + 21]))
                .call(this.readyBrush().event);
        }
    }

    /**
     * checks if data point d is included in one of the brushes (on this dimension)
     * @param d
     * @returns {boolean}
     */
    extentsContain(d){
        var self = this;
        return this._brushes.some(function(brush){
            var extent = brush.extent();
            if(self.hasX() && self.hasY()){
                return extent[0][0] <= self.xValue(d) && self.xValue(d) <= extent[1][0]
                    && extent[0][1] <= self.yValue(d) && self.yValue(d) <= extent[1][1];
            } else if(self.hasX()){
                return extent[0] <= self.xValue(d) && self.xValue(d) <= extent[1];
            } else if(self.hasY()){
                return extent[0] <= self.yValue(d) && self.yValue(d) <= extent[1];
            }
            else return false;
        });
    }

    readyBrush() {
        return this._brushes[this._brushes.length - 1];
    }

    empty(){
        // possible performance improvement: return this._brushes.length <= 1;
        return this._brushes.every(function(brush){
            return brush.empty();
        });
    }
    
    //Helper functions
    xValue(d){
        return this.view.xValue(d, this.dim);
    }

    yValue(d){
        return this.view.yValue(d, this.dim);
    }
    
    hasX(){
        return this._brushes[0].x() !== null;
    }
    
    hasY(){
        return this._brushes[0].y() !== null;
    }

    makeTouchable(brushArea){
        brushArea.selectAll('g.resize')
            .append('circle')
            .classed('handle', true)
            .attr('r', 10);
    }
}