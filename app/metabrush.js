function Metabrush (d3brush, multibrush) {
    var brush = d3brush;
    //var counter = (counter || 0) + 1;
    init();

    function init(){

        brush.dim = multibrush.dim;
        brush.origin = multibrush.view;

        // brush instance methods
        brush.updatePositions = brush_updatePositions.bind(brush);
        brush.activate = brush_activate.bind(brush);
        brush.moveToFront = brush_moveToFront.bind(brush);

        // default brush settings
        brush.styles = {
            source:{},
            link:{},
            target:{}
        };
        brush.targetViews = new Set(/*_.values(VIEWS)*/);
        brush.connect = false;
        brush.animate = 'none';
        brush.granularity = {
            source:'aggregate',
            target:'aggregate'
        };

        var targetConstraints = [];
        _.forEach(VIEWS, function(view, id){
            if(brush.origin != view){
                targetConstraints.push({target:id, icon:'icons/svg/pk-'+view.type+'.svg', label:view.viewId});
            }
        });

        brush.menu = {};
        brush.menuItems = [
            {
                id:'source',
                items:[
                    {
                        icon:'icons/svg/paint.svg',
                        class:'fill',
                        actions:_.map(constants.brushColors, function(c){
                            return {styles:{fill:c}};
                        }).concat({styles:{fill:undefined}})
                    },
                    {
                        icon:'icons/svg/brush-stroke.svg',
                        class:'stroke',
                        actions:_.map(constants.brushColors, function(c){
                            return {styles:{stroke:c, 'stroke-width':constants.strokeWidth, 'stroke-dasharray':0}}
                        }).concat({styles:{stroke:undefined, 'stroke-width':undefined, 'stroke-dasharray':undefined}})
                    },
                    {
                        icon:'icons/svg/aggregated.svg',
                        class:'granularity',
                        actions:[{granularity:'aggregate', icon:'icons/svg/aggregated.svg'},
                            {granularity:'individual', icon:'icons/svg/individuals.svg'}]
                    }
                ]},
            {
                id:'link',
                items:[
                    {
                        icon:'icons/svg/brush-stroke.svg',
                        class:'stroke',
                        actions:_.map(constants.brushColors , function(c){
                            return {styles:{stroke:c, 'stroke-width':'1px'}};
                        }).concat({styles:{stroke:'#000000', 'stroke-width':'1px'}})
                    },
                    {
                        icon:'icons/svg/target.svg',
                        class:'target-constraint',
                        actions:targetConstraints
                    },
                    {
                        icon:'icons/svg/pk-nolink.svg',
                        class:'curvature',
                        actions:[{connect:'linear', icon:'icons/svg/pk-line.svg', d:'M -10 5 L 10 -5', styles:{'stroke-dasharray':0}},
                            {connect:'step', icon:'icons/svg/pk-step.svg', d:'M -10 5 L 0 5 L 0 -5 L 10 -5', styles:{'stroke-dasharray':0}},
                            {connect:'basis', icon:'icons/svg/pk-curve.svg', d:'M -10 5 Q -5 -4 0 0 Q 5 4 10 -5', styles:{'stroke-dasharray':0}},
                            {connect:'cardinal', icon:'icons/svg/pk-curve2.svg', d:'M -10 5 Q -7 -6 0 0 Q 7 6 10 -5', styles:{'stroke-dasharray':0}},
                            {connect:false, icon:'icons/svg/pk-nolink.svg', d:'M -10 5 Q -5 -4 0 0 Q 5 4 10 -5', styles:{'stroke-dasharray':1}}]
                    },
                    {
                        icon:'icons/svg/pk-animate-none.svg',
                        class:'animation',
                        actions:[{animate:'none', icon:'icons/svg/pk-animate-none.svg'},
                            {animate:'draw', icon:'icons/svg/pk-animate-draw.svg'},
                            {animate:'fade', icon:'icons/svg/pk-animate-fade.svg'}]
                    }
                ]
            }];

        // duplicate source menu for target
        var targetItems = {id:'target'};
        targetItems.items = _.cloneDeep(brush.menuItems[0].items);
        brush.menuItems.push(targetItems);
        brush.targetSourceCoupled = true;

        // initialize the brush svg element
        brush.brushArea = multibrush.brushesContainerNode.insert('g', '.brush')
            .classed('brush ready', true)
            .call(brush);

        /*
         * create the radial menus of the brush
         */
        brush.menuWrap = d3.select('.canvas > .all-brush-menus').append('g')
            .classed('brush-menus-wrap view-' + brush.origin.viewId, true);
        brush.menuArea = brush.menuWrap.append('g')
            .classed('brush-menus ready', true);

        var brushMenu = brush.menuArea.selectAll('g.menu').data(brush.menuItems);
        brushMenu.enter().append('g')
            .attr('class', function(d){return d.id + '-menu menu';})
            .attr('transform', function(d, i){
                return 'translate('+ (i-1)*60 +',-8)';
            })
            .each(function(d){
                var menuG = this;
                brush.menu[d.id] = new d3.radialMenu()
                    .thickness(35)
                    .radius(25)
                    .iconSize(20)
                    .appendTo(menuG)
                    .onClick(function(action){
                        var menuGroup = d3.select(menuG).moveToFront();
                        brush.moveToFront();
                        if(action == 'menu-segment') {
                            return; // when a menu segment is clicked to toggle its options, only move brush to front and done
                        }
                        var segmentContainer = d3.select(this.parentNode.parentNode);
                        if(action.hasOwnProperty('target')){
                            if(brush.targetViews.has(VIEWS[action.target])){
                                brush.targetViews.delete(VIEWS[action.target]);
                                d3.select(this).classed('toggle-active', false);
                            }
                            else{
                                brush.targetViews.add(VIEWS[action.target]);
                                d3.select(this).classed('toggle-active', true);
                            }
                            menuGroup.select('.trigger-icon').select('image.target-state-icon')
                                .style('display', brush.targetViews.size > 0 ? null : 'none');
                        }
                        if(action.hasOwnProperty('connect')){
                            brush.connect = action.connect;
                            segmentContainer.select('.menu-icon').attr('xlink:href', action.icon);
                            menuGroup.select('.trigger-icon').select('path.link').attr('d',action.d);
                        }
                        if(action.hasOwnProperty('animate')){
                            brush.animate = action.animate;
                            segmentContainer.select('.menu-icon').attr('xlink:href', action.icon);
                        }
                        if(action.hasOwnProperty('granularity')){
                                brush.granularity[d.id] = action.granularity;
                                segmentContainer.select('.menu-icon').attr('xlink:href', action.icon);
                        }
                        if(action.hasOwnProperty('styles')){
                            // overwrite brush.styles with selected styles 
                            // (if selected style is explicitly undefined it will overwrite the brush style to mark it undefined)
                            _.assign(brush.styles[d.id], action.styles);
                            segmentContainer.select('.menu-segment').style(action.styles);
                            menuGroup.select('.trigger-icon').style(brush.styles[d.id]);
                        }

                        // update target/source coupling
                        if(d.id == 'source' && brush.targetSourceCoupled){
                            syncTargetWithSource();
                        }
                        if(d.id == 'target' && brush.targetSourceCoupled){
                            decoupleTargetFromSource();
                        }
                        EventBus.trigger(events.UPDATE);
                    })
                    .setup(d.items);
            });

        // add path for connection line of radial menu to brush
        brushMenu.insert('path', ':first-child')
            .classed('menu-line', true)
            .style('stroke','black');

        // add trigger button of radial menu
        var dragBehave = d3.behavior.drag()
            .on('dragstart', function(){
                d3.select(this.parentNode.parentNode).moveToFront();
                brush.moveToFront();
            })
            .on('dragend', function(){ 
                d3.event.sourceEvent.preventDefault();
            })
            .on('drag', function(d, i){
                var menu = d3.select(this.parentNode.parentNode);
                var t = d3.transform(menu.attr('transform'));
                t.translate[0] += d3.event.x;
                t.translate[1] += d3.event.y;
                menu.attr('transform', t.toString());
                menu.select('.menu-line').call(updateConnectionLine, t, i);
            });
        var menuTrigger = brushMenu.append('g').classed('menu-trigger', true);
        menuTrigger.append('circle').classed('trigger', true)
            .attr('r', 22)
            .on('mousedown', stopPropagation).on('touchstart', stopPropagation)
            .call(mtouch_events().on('tap', toggleMenu))
            .call(dragBehave);
        menuTrigger.append('g').classed('trigger-icon', true)
            .each(function(d){
                var icon = d3.select(this);
                if(d.id == 'link'){
                    icon.classed('link-menu-icon', true)
                        .append('path').classed('link', true)
                        .attr('d', 'M -10 5 Q -5 -4 0 0 Q 5 4 10 -5');
                        //.attr('d', 'M -8 5 L 8 -5'); straight line
                    icon.append('circle').classed('point start', true)
                        .attr({r:3, cx:-13, cy:7});
                    icon.append('circle').classed('point end', true)
                        .attr({r:3, cx:13, cy:-7});
                    icon.append('image').classed('target-state-icon', true)
                        .attr('xlink:href', 'icons/svg/target.svg')
                        .attr({x:6, y:-2, width:12, height:12})
                        .style('display', 'none');
                }
                else {
                    icon.classed('point-menu-icon ' + d.id, true)
                        .append('circle').classed('point', true)
                        .attr('r', 10);
                    icon.append('path')
                        .attr('d', "M 0 0 L 12 0 L 12 -3 L 15 0 L 12 3 L 12 0")
                        .attr('transform', function(d){
                            return d.id == 'target' ? 'translate(-13, 0)' : null;
                        })
                        .style({'stroke': 'grey', 'stroke-dasharray':0, fill:'grey', 'stroke-width':1});
                    if(d.id == 'target'){
                        var tcouple = d3.select(this.parentNode).append('g').classed('target-coupling', true);
                        tcouple.append('circle').classed('target-coupling-bg', true)
                            .attr({r:12, cx:18, cy:-16})
                            .style({fill:'#efefef', stroke:'lightgrey', 'stroke-width':1, 'stroke-dasharray':0})
                            .call(mtouch_events().on('tap',  function(){
                                //stopPropagation();
                                if(brush.targetSourceCoupled){
                                    decoupleTargetFromSource();
                                } else {
                                    syncTargetWithSource();
                                }
                                EventBus.trigger(events.UPDATE);
                            }));
                        tcouple.append('image').classed('target-coupling-icon', true)
                            .attr('xlink:href', 'icons/svg/link-coupled.svg')
                            .style('pointer-events', 'none')
                            .attr({ x:12, y:-22, width:12, height:12 });
                    }
                }
            });

        // add close button
        var closeButton = brush.menuArea.append('g')
            .classed('close-button', true)
            .on('mousedown', function(){
                // prevent resize behaviour on close button
                stopPropagation();
            });
        closeButton.append('rect')
            .classed('close-button-bg', true)
            .attr({x:0, y:15, width:28, height:28})
            .style({'shape-rendering':'crispEdges', stroke:'black', fill:'#efefef'})
            .call(mtouch_events().on('tap', function(){
                brush.clear();
                brush.origin.onBrush(brush);
                brush.brushArea.remove();
                brush.menuWrap.remove();
            }));
        closeButton.append('image').classed('close-button-label', true)
            .attr({x:4, y:19, width:20, height:20, 'xlink:href':'icons/svg/waste-disposal.svg'})
            .style({'pointer-events':'none'});


        /*
         * helper functions and instance methods
         */
        function stopPropagation(){
            // prevent brush background to react on click as otherwise this will remove the brush
            d3.event.stopPropagation();
        }
        function toggleMenu(d){
            if(d3.event.defaultPrevented){
                return;
            }
            brush.moveToFront();
            var menu = brush.menu[d.id];
            if(menu.isCollapsed()){
                brush.menuArea.selectAll('.' + d.id + '-menu').moveToFront();
                menu.show();
            }
            else {
                menu.hide();
            }
        }

        function updateConnectionLine(line, menuT, i){
            var menusAreaT = d3.transform(brush.menuArea.attr('transform'));
            var rect = brush.brushArea.select('.extent');
            var rectTopCenter = [rect.attr('x') - (menuT.translate[0] + menusAreaT.translate[0])  + rect.attr('width')/2, rect.attr('y') - (menuT.translate[1] + menusAreaT.translate[1])];

            //if this is not an active brush or if only 10px away from rectangle top border ==> don't draw the line
            if(brush.brushArea.classed('ready') || (Math.abs(rectTopCenter[0]) <= rect.attr('width')/2 && Math.abs(rectTopCenter[1]) <= 10)){
                line.attr('d', null);
            } else {
                var lineOrigin = [rectTopCenter[0]  + (i-1)*3, rectTopCenter[1]];
                line.datum([[0,0], lineOrigin])
                    .attr('d', d3.svg.line());
            }
        }

        function syncTargetWithSource (){
            var targetMenuG = brush.menuArea.selectAll('g.target-menu');
            var sourceMenuG = brush.menuArea.selectAll('g.source-menu');

            // copy source styles and granularity to target
            brush.styles['target'] = _.cloneDeep(brush.styles['source']);
            brush.granularity.target = brush.granularity.source;

            // style the target menu segments and icons the same as in the source menu
            targetMenuG.selectAll('.menu-segment').each(function(d){
                var myContainerClasses = '.' + _.replace(d3.select(this.parentNode).attr('class'), new RegExp(' ','g'), '.');
                var sourceStyle = sourceMenuG.selectAll(myContainerClasses).selectAll('.menu-segment').attr('style');
                d3.select(this).attr('style', sourceStyle);
                var segmentIcon = sourceMenuG.selectAll(myContainerClasses).selectAll('.menu-segment + .menu-icon').attr('xlink:href');
                d3.select(this.parentNode).select('.menu-icon').attr('xlink:href', segmentIcon);
            });

            // set style of menu's trigger icon
            targetMenuG.select('.trigger-icon')
                .attr('style', null)
                .style(brush.styles['target']);

            // set coupling flag to true
            brush.targetSourceCoupled = true;
            brush.menuArea.selectAll('.target-coupling-icon').attr('xlink:href', 'icons/svg/link-coupled.svg');
        }

        function decoupleTargetFromSource () {
            brush.targetSourceCoupled = false;
            brush.menuArea.selectAll('.target-coupling-icon').attr('xlink:href', 'icons/svg/link-decoupled.svg');
        }

        /**
         * update positions of brush menus and close button etc.
         * 'this' refers to the brush
         */
        function brush_updatePositions(){
            var r = this.brushArea.selectAll('rect.extent');

            // reposition menu
            this.menuArea.attr('transform','translate('+ (+r.attr('x') + (+r.attr('width')/2)) + ','
                + r.attr('y') + ')');
            // keep close button on the top right corner (translation is added to menuArea translation)
            closeButton.attr('transform', 'translate(' + (+r.attr('width')/2) + ',0)');
        }

        /**
         * activates the ready brush after a new brush rectangle was drawn
         */
        function brush_activate(){
            this.brushArea
                .classed('ready', false)
                .classed('active', true);
            this.menuArea
                .classed('ready', false)
                .classed('active', true);

            var brushPos = this.brushArea.select('rect.background').node().getBoundingClientRect();
            var svgPos = d3.select('svg').node().getBoundingClientRect();

            this.menuWrap.attr('transform',
                'translate(' + (+brushPos.left - +svgPos.left) + ',' + (+brushPos.top - +svgPos.top) + ')')
        }
        
        function brush_moveToFront(){
            this.brushArea.moveToFront();
            this.menuWrap.moveToFront();
        }
    }


    return brush;
}
