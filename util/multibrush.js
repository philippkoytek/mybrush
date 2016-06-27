/**
 * Created by Philipp Koytek on 6/23/2016.
 */


class Multibrush {
    
    constructor(dim, view){
        this._brushes = [];
        this.dim = dim;
        this.view = view;
    }
    
    empty(){
        // possible performance improvement: return this._brushes.length <= 1;
        return this._brushes.every(function(brush){
            return brush.empty();
        });
    }
    
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
    
    addBrush(brush) {
        brush.dim = this.dim;
        brush.brushArea = this.view.chart.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);
        this._brushes.push(brush);
    }

    readyBrush() {
        return this._brushes[this._brushes.length - 1];
    }
    
    /*
     * removes all brushes but the one that was added last (ready brush)
     */
    reset() {
        while(this._brushes.length > 1){
            var b = this._brushes.shift();
            b.clear();
        }
        this.view.onBrush();
        this.view.chart.selectAll('.brush.active').remove();
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
}