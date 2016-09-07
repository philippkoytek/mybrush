function Metabrush (d3brush, multibrush) {
    var brush = d3brush;
    //var counter = (counter || 0) + 1;
    init();

    function init(){

        brush.styles = {
            source:{},
            link:{},
            target:{}
        };
        brush.targetViews = new Set();
        brush.menu = {};
        brush.menuItems = [{
                id:'source',
                items:[
                    {
                        icon:'icons/svg/paint.svg',
                        class:'fill',
                        actions:[{styles:{fill:'green'}},{styles:{fill:'blue'}},{styles:{fill:'red'}},{styles:{fill:undefined}}]
                    },
                    {
                        icon:'icons/svg/brush-stroke.svg',
                        class:'stroke',
                        actions:[{styles:{stroke:'green', 'stroke-width':'2px', 'stroke-dasharray':0}},
                            {styles:{stroke:'blue', 'stroke-width':'2px', 'stroke-dasharray':0}},
                            {styles:{stroke:'red', 'stroke-width':'2px', 'stroke-dasharray':0}},
                            {styles:{stroke:undefined, 'stroke-width':undefined, 'stroke-dasharray':undefined}}]
                    }
                ]},
            {
                id:'link',
                items:[
                    {
                        icon:'icons/svg/brush-stroke.svg',
                        class:'stroke',
                        actions:[{styles:{stroke:'green', 'stroke-width':'1px', 'stroke-dasharray':0}},
                            {styles:{stroke:'blue', 'stroke-width':'1px', 'stroke-dasharray':0}},
                            {styles:{stroke:'red', 'stroke-width':'1px', 'stroke-dasharray':0}},
                            {styles:{stroke:'black', 'stroke-width':'1px', 'stroke-dasharray':0}}]
                    },
                    {
                        icon:'icons/svg/number-one-bull-eye.svg',
                        class:'target-constraint',
                        actions:[{target:2}, {target:1}]
                    },
                    {
                        icon:'icons/svg/pk-curve.svg',
                        class:'curvature',
                        actions:[{connect:true}] //todo: missing stroke dasharray
                    }
                   // {icon:'icons/svg/pk-line.svg', action:{connect:true}}
                ]
            }/*,{
                id:'target',
                items:[
                    {icon:'icons/svg/number-one-bull-eye.svg', action:{target:2}},
                    {icon:'icons/svg/number-one-bull-eye.svg', action:{target:1}}
                ]
            }*/];

        brush.dim = multibrush.dim;
        brush.origin = multibrush.view;

        brush.brushArea = multibrush.containerNode.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);


        var brushMenuWrap = brush.brushArea.append('g').classed('brush-menus', true);

        var brushMenu = brushMenuWrap.selectAll('g.menu').data(brush.menuItems);
        brushMenu.enter().append('g')
            .attr('class', function(d){return d.id + '-menu menu';})
            .attr('transform', function(d, i){
                return 'translate('+ (i-1)*60 +',0)';
            })
            .each(function(d){
                var menuG = this;
                brush.menu[d.id] = new d3.radialMenu()
                    .thickness(35)
                    .radius(20)
                    .iconSize(20)
                    .appendTo(menuG)
                    .onClick(function(action){
                        if(action.hasOwnProperty('styles')){
                            // overwrite brush.styles with selected styles (if selected style is explicitly undefined it will overwrite the brush style to mark it undefined)
                            _.assign(brush.styles[d.id], action.styles);
                            d3.select(this).style(action.styles);
                            d3.select(menuG).select('.trigger-icon').style(brush.styles[d.id]);
                        }
                        if(action.hasOwnProperty('target')){
                            brush.targetViews.add(VIEWS[action.target]);
                        }
                        if(action.hasOwnProperty('connect')){
                            brush.connect = !brush.connect || false;
                        }
                        EventBus.trigger(events.UPDATE);
                    })
                    .setup(d.items);
            });

        var dragBehave = d3.behavior.drag()
            //.origin(function(d){return d;})  add x and y data to every circle object to remember original position
            .on('dragstart', function(){})
            .on('dragend', function(){ d3.event.sourceEvent.preventDefault(); })
            .on('drag', function(d){
                //move menu
                var menu = d3.select(this.parentNode);
                var t = d3.transform(menu.attr('transform'));
                t.translate[0] += d3.event.x;
                t.translate[1] += d3.event.y;
                menu.attr('transform', t.toString());

                //update connection line
                var menusT = d3.transform(brushMenuWrap.attr('transform'));
                var rect = brush.brushArea.select('.extent');
                var rectOrigin = [rect.attr('x') - (t.translate[0] + menusT.translate[0]), rect.attr('y') - (t.translate[1] + menusT.translate[1])];
                menu.select('.menu-line').datum([[0,0], rectOrigin])
                    .attr('d', d3.svg.line());
            });

        brushMenu.insert('path', ':first-child')
            .classed('menu-line', true)
            .style('stroke','black');

        brushMenu.append('circle')
            .classed('trigger', true)
            .attr('r', 15)
            .on('mousedown', stopPropagation).on('touchstart', stopPropagation)
            .on('click', toggleMenu)
            .call(dragBehave);

        brushMenu.append('g')
            .classed('trigger-icon', true)
            .each(function(d){
                var icon = d3.select(this);
                if(d.id == 'link'){
                    icon.classed('link-menu-icon', true)
                        .append('path').classed('link', true)
                        .attr('d', 'M -10 5 Q -5 -4 0 0 Q 5 4 10 -5');
                        //.attr('d', 'M -8 5 L 8 -5'); straight line
                    icon.append('circle').classed('point start', true)
                        .attr({r:2, cx:-10, cy:5});
                    icon.append('circle').classed('point end', true)
                        .attr({r:2, cx:10, cy:-5});
                }
                else {
                    icon.classed('point-menu-icon ' + d.id, true)
                        .append('circle').classed('point', true)
                        .attr('r', 8);
                }
            });



        function stopPropagation(){
            // prevent brush background to react on click as otherwise this will remove the brush
            d3.event.stopPropagation();
        }
        function toggleMenu(d){
            if(d3.event.defaultPrevented){
                return;
            }
            var menu = brush.menu[d.id];
            if(menu.isCollapsed()){
                menu.show();
            }
            else {
                menu.hide();
            }
        }
    }


    return brush;
}
