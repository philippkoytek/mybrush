class Multibrush {
    
    constructor(dim, view, containerNode){
        this._brushes = [];
        this.dim = dim;
        this.view = view;
        this.containerNode = containerNode || this.view.chart;
    }

    addBrush(brush) {
        brush.dim = this.dim;
        brush.styles = {};
        brush.origin = this.view;
        brush.targetViews = new Set();
        brush.brushArea = this.containerNode.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);
        var brushMenu = brush.brushArea.append('g').classed('brush-menu', true);
        brush.menuItems = [
            {icon:'https://github.com/favicon.ico', action:{styles:{fill:'green'}}},
            {icon:'https://github.com/favicon.ico', action:{styles:{stroke:'red', 'stroke-width':'2px'}}},
            {icon:'https://github.com/favicon.ico', action:{target:1}},
            {icon:'https://github.com/favicon.ico', action:{target:2}}
        ];
        brush.menu = new d3.radialMenu()
            .thickness(35)
            .radius(20)
            .iconSize(20)
            .appendTo(brushMenu.node())
            .onClick(function(action){
                if(action.hasOwnProperty('styles')){
                    _.extend(brush.styles, action.styles);
                }
                if(action.hasOwnProperty('target')){
                    brush.targetViews.add(VIEWS[action.target]);
                }
                EventBus.trigger(events.UPDATE);
            });

        brushMenu.append('circle')
            .classed('trigger', true)
            .attr('r', 15)
            .attr('role', 'button')
            .on('mousedown', function(){
                // prevent brush background to react on click as this will remove the brush
                d3.event.stopPropagation();
                brush.menu.show(brush.menuItems);
            });
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