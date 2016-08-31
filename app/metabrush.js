function Metabrush (d3brush, multibrush) {
    var brush = d3brush;
    var counter = (counter || 0) + 1;
    init();

    function init(){

        brush.styles = {};
        brush.targetViews = new Set();
        brush.menu = {};
        brush.menuItems = [{
                id:'source',
                items:[
                    {icon:'icons/svg/paint.svg', action:{styles:{fill:'green'}}},
                    {icon:'icons/svg/brush-stroke.svg', action:{styles:{stroke:'red', 'stroke-width':'2px'}}}
                ]
            },{
                id:'link',
                items:[
                    {icon:'icons/svg/number-one-bull-eye.svg', action:{connect:true}}
                ]
            },{
                id:'target',
                items:[
                    {icon:'icons/svg/number-one-bull-eye.svg', action:{target:2}},
                    {icon:'icons/svg/number-one-bull-eye.svg', action:{target:1}}
                ]
            }];

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
                brush.menu[d.id] = new d3.radialMenu()
                    .thickness(35)
                    .radius(20)
                    .iconSize(20)
                    .appendTo(this)
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
            });

        var dragBehave = d3.behavior.drag()
            //.origin(function(d){return d;})  add x and y data to every circle object to remember original position
            .on('dragstart', function(){
                this.parentNode.__originT = d3.transform(d3.select(this.parentNode).attr('transform'));
            })
            .on('drag', function(d){
                var menu = d3.select(this.parentNode);
                var ot = this.parentNode.__originT;
                var t = d3.transform(menu.attr('transform'));
                t.translate[0] += d3.event.x;
                t.translate[1] += d3.event.y;
                var circle = d3.select(this);
                if(+circle.attr('r') < Math.sqrt(Math.pow(t.translate[0]-ot.translate[0], 2) + Math.pow(t.translate[1]-ot.translate[1], 2))){
                    menu.attr('transform', t.toString());
                }
                //TODO: if menu is more than circle-radius away from the rectangle's frame: draw a connector line
            }).on('dragend', function(){
                d3.event.sourceEvent.preventDefault();
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
        function toggleMenu(d){
            if(d3.event.defaultPrevented){
                return;
            }
            var menu = brush.menu[d.id];
            if(menu.isCollapsed()){
                menu.show(d.items);
            }
            else {
                menu.hide();
            }
        }
    }


    return brush;
}
