class Multibrush {
    
    constructor(dim, view, containerNode){
        this._brushes = [];
        this.dim = dim;
        this.view = view;
        this.containerNode = containerNode || this.view.chart;
        this.xRange = (typeof this.view.xRange == 'function') ? this.view.xRange : this.view.xRange[this.dim];
        this.yRange = (typeof this.view.yRange == 'function') ? this.view.yRange : this.view.yRange[this.dim];
        
        this.containerNode.append('rect')
            .classed('hover-rect ' + dim, true)
            .datum(dim);
    }
    
    addBrush(brush) {
                
        brush = Metabrush(brush, this);
        
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
            this.view.onBrush(b);
        }
        this.containerNode.selectAll('.brush.active').remove();
    }

    /**
     * programmatically calculates a minimum extent around d and activates the ready brush with it
     * @param d
     * @param i
     * @param visual
     */
    setExtentOnData(d, i, visual){
        var domainExtent;
        var minBrushBox = this.view.getMinimumBrushBox(visual, d, this.dim);
        if(this.hasX() && this.hasY()){
            if(this.xRange.invert){
                var xCoord = this.xRange(this.xValue(d, i));
                var yCoord = this.yRange(this.yValue(d, i));
                domainExtent = [
                    [this.xRange.invert(xCoord - minBrushBox.width/2), this.yRange.invert(yCoord + minBrushBox.height/2)],
                    [this.xRange.invert(xCoord + minBrushBox.width/2), this.yRange.invert(yCoord - minBrushBox.height/2)]
                ];
            } else {
                // list view
                domainExtent = [
                    [minBrushBox.x, minBrushBox.y],
                    [minBrushBox.x + minBrushBox.width, minBrushBox.y + minBrushBox.height]
                ];
            }

        }
        else {
            var xyCoord;
            if(this.hasX()){
                // barchart: the xValue accessor already returns coordinates
                // (therefore no range and domain conversion needed)
                xyCoord = this.xValue(d, i);
                domainExtent = [xyCoord - minBrushBox.width/2, xyCoord + minBrushBox.width/2];
            } else {
                // todo: check if it is the same case in parallelcoords as in barchart
                xyCoord = this.yRange(this.yValue(d, i));
                domainExtent = [this.yRange.invert(xyCoord - minBrushBox.height/2),
                    this.yRange.invert(xyCoord + minBrushBox.height/2)];
            }
        }
        this.readyBrush().brushArea
            .call(this.readyBrush().extent(domainExtent))
            .call(this.readyBrush().event);
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
    xValue(d, i){
        return this.view.xValue(d, i, this.dim);
    }

    yValue(d, i){
        return this.view.yValue(d, i, this.dim);
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