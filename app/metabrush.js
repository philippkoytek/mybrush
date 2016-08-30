function Metabrush (d3brush, multibrush) {
    var brush = d3brush;
    var counter = (counter || 0) + 1;
    init();

    function init(){

        brush.styles = {};
        brush.targetViews = new Set();
        brush.menuItems = [
            {icon:'icons/svg/paint.svg', action:{styles:{fill:'green'}}},
            {icon:'icons/svg/number-one-bull-eye.svg', action:{target:2}},
            {icon:'icons/svg/number-one-bull-eye.svg', action:{target:1}},
            {icon:'icons/svg/brush-stroke.svg', action:{styles:{stroke:'red', 'stroke-width':'2px'}}},
            {icon:'icons/svg/number-one-bull-eye.svg', action:{connect:true}}
        ];

        brush.dim = multibrush.dim;
        brush.origin = multibrush.view;

        brush.brushArea = multibrush.containerNode.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);


        var brushMenuWrap = brush.brushArea.append('g').classed('brush-menu', true);
        var brushMenu = brushMenuWrap.append('g').classed('source-menu', true);
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
                if(action.hasOwnProperty('connect')){
                    brush.connect = !brush.connect || false;
                }
                EventBus.trigger(events.UPDATE);
            });

        var dragBehave = d3.behavior.drag()
            //.origin(function(d){return d;})  add x and y data to every circle object to remember original position
            .on('dragstart', function(){
                brushMenu.__originT = d3.transform(brushMenu.attr('transform'));
            })
            .on('drag', function(d){
                var ot = brushMenu.__originT;
                var t = d3.transform(brushMenu.attr('transform'));
                t.translate[0] += d3.event.x;
                t.translate[1] += d3.event.y;
                var circle = d3.select(this);
                if(+circle.attr('r')*2 < Math.sqrt(Math.pow(t.translate[0]-ot.translate[0], 2) + Math.pow(t.translate[1]-ot.translate[1], 2))){
                    brushMenu.attr('transform', t.toString());
                }
            }).on('dragend', function(){
                d3.event.preventDefault();
            });

        brushMenu.append('circle')
            .classed('trigger', true)
            .attr('r', 15)
            .on('mousedown', stopPropagation).on('touchstart', stopPropagation)
            .on('click', toggleMenu)
            .call(dragBehave);


        function stopPropagation(){
            // prevent brush background to react on click as otherwise this will remove the brush
            d3.event.stopPropagation();
        }
        function toggleMenu(){
            if(d3.event.defaultPrevented){
                return;
            }
            if(brush.menu.isCollapsed()){
                brush.menu.show(brush.menuItems);
            }
            else {
                brush.menu.hide();
            }
        }
    }


    return brush;
}
