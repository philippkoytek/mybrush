/**
 * Radial Menu plugin for d3. Code from:
 * http://bl.ocks.org/IPWright83/165131183939d4936166#menu.js
 * retrieved on August 26, 2016 at 10:00am
 * edited a couple times
 */

d3.radialMenu = function() {

    // Protect against missing new keyword
    if (!(this instanceof d3.radialMenu)) {
        return new d3.radialMenu();
    }

    //#region Local Variables

    // The following variables have getter/setter functions exposed so are configurable
    var data = [{}];
    var padding = 5;
    var radius = 50;
    var thickness = 20;
    var iconSize = 16;
    var animationDuration = 250;                // The duration to run animations for
    var onClick = function(a) { alert(a); };

    // Private Variables
    var offsetAngleDeg = -180 / data.length;    // Initial rotation angle designed to put centre the first segment at the top
    var control = {};                           // The control that will be augmented and returned
    var pie;                                    // The pie layout
    var outerPie;
    var arc;                                    // The arc generator
    var smallOuterArc;
    var bigOuterArc;
    var segmentLayer;                           // The layer that contains the segments
    var isCollapsed = true;                     // Convenient flag with getter accessor to tell if menu is collapsed or not
    
    //#endregion

    //#region Getter/Setter Accessors

    /**
     * 
     * @returns {boolean} returns true if menu is hidden and false when shown
     */
    control.isCollapsed =  function(){
        return isCollapsed;
    };
    
    /**
     * The function to execute on a menu click
     * @param {object} onClick - The function to execute on a menu click
     * @returns {number} The function to execute on a menu click or the control
     */
    control.onClick = function (_) {
        if (!arguments.length) return onClick;
        onClick = _;
        return control;
    };

    /**
     * Time in ms to animate transitions
     * @param {object} animationDuration - The time in ms to animate transitions
     * @returns {number} The time in ms to animate transitions or the control
     */
    control.animationDuration = function (_) {
        if (!arguments.length) return animationDuration;
        animationDuration = _;
        return control;
    };

    /**
     * Padding between segments
     * @param {object} padding - The padding between segments
     * @returns {number} The padding between segments or the control
     */
    control.padding = function (_) {
        if (!arguments.length) return padding;
        padding = _;
        return control;
    };

    /**
     * Size of the icons within the segments
     * @param {object} iconSize - Size of the icons within the segments
     * @returns {number} The Size of the icons within the segments or the control
     */
    control.iconSize = function (_) {
        if (!arguments.length) return iconSize;
        iconSize = _;
        return control;
    };

    /**
     * Changes the inner radius of the menu
     * @param {object} radius - The inner radius
     * @returns {number} The inner radius or the control
     */
    control.radius = function (_) {
        if (!arguments.length) return radius;
        radius = _;
        arc.innerRadius(radius);
        arc.outerRadius(radius + thickness);
        smallOuterArc
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + 10);
        bigOuterArc
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + thickness);
        return control;
    };

    /**
     * Changes the thickness of the menu
     * @param {object} thickness - The thickness of the menu
     * @returns {number} The thickness of the menu or the control
     */
    control.thickness = function (_) {
        if (!arguments.length) return thickness;
        thickness = _;
        arc.outerRadius(radius + thickness);
        smallOuterArc
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + 10);
        bigOuterArc
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + thickness);
        return control;
    };

    //#endregion

    //#region Private Functions

    /**
     * Calculates the mid point of an arc
     * @param {object} d - The D3 data object that represents the arc
     * @param {boolean} isOuterArc - whether to use the radius of the outerArc
     * @returns {object} A co-ordinate with an x, y location
     */
    function calcMidPoint(d, isOuterArc) {
        var angle = d.startAngle + ((d.endAngle - d.startAngle) / 2);
        var r = (isOuterArc ? bigOuterArc.innerRadius()() : radius) + (thickness / 2);
        return {
            x: r * Math.sin(angle),
            y: -r * Math.cos(angle)
        };
    }

    /**
     * Initializes the control
     */
    function init() {

        // Create pie layout
        pie = d3.layout.pie()
            .value(function(d) { return data.length; })
            .padAngle(padding * Math.PI / 180);

        outerPie = d3.layout.pie()
            .padAngle(2 * Math.PI / 180);

        // Create the arc function
        arc = d3.svg.arc()
            .innerRadius(radius)
            .outerRadius(radius + thickness);

        smallOuterArc = d3.svg.arc()
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + 10);
        
        bigOuterArc = d3.svg.arc()
            .innerRadius(radius + thickness + padding)
            .outerRadius(radius + thickness + padding + thickness);
    }

    /**
     * Appends the control to the DOM underneath the given target
     * @param {selector} target - Either a D3 object or a string selector to insert the menu into. Must be an SVG element, or child of an SVG element
     * @returns {object} The control
     */
    control.appendTo = function (target) {

        // Convert the target into a valid D3 selection
        // that we can append our menu into
        target = d3.select(target);

        // Create the visualiziation
        segmentLayer = target.append("g")
            .attr("transform", "rotate(" + offsetAngleDeg + ")");

        return control;
    };

    /**
     * Setup the menu with data
     * @returns {object} The control
     */
    control.setup = function(_) {
        init();
        // Calculate the new offset angle based on the number of data items and
        // then rotate the menu to re-centre the first segment
        data = _;
        offsetAngleDeg = -180 / data.length;
        segmentLayer.attr("transform", "rotate(" + offsetAngleDeg + ")");

        // Join the data to the elements
        var dataJoin = segmentLayer .selectAll(".menu-segment-container")
            .data(pie(data), function(d){return JSON.stringify(d.data);});

        // Updates first

        // Update the segments first to make space for any new ones
        dataJoin.select(".menu-segment")
            .transition()
            .duration(animationDuration)
            .attrTween("d", function(a) {
                // interpolate the objects - which is going to allow updating
                // the angles of the segments within the arc function
                var i = d3.interpolate(this._current, a);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
            });

        // Update the location of the icons
        dataJoin.select(".menu-icon")
            .transition()
            .attr("x", function(d) { return calcMidPoint(d).x - iconSize / 2; })
            .attr("y", function(d) { return calcMidPoint(d).y - iconSize / 2; })
            .attr("transform", function(d) {
                var mp = calcMidPoint(d);
                var angle = -offsetAngleDeg;
                return "rotate(" + angle + "," + mp.x + "," + mp.y + ")";
            });

        // Enter new actors

        // Enter the groups
        var menuSegments = dataJoin .enter()
            .append("g")
            .attr("class", function(d){
                return d.data.class + ' menu-segment-container';
            });

        // Add the segments
        menuSegments.append("path")
            .attr("class", "menu-segment")
            .each(function(d) { this._current = d; })                   // store the initial data value for later
            .on("click", function(d) {
                d3.select(this.parentNode).selectAll('.menu-subsegment-container')
                    .style('display', null)
                    .transition()
                    .duration(animationDuration)
                    .style("opacity", function(){
                        return (+d3.select(this).style('opacity') + 1) % 2;
                    });
            })
            .attr('d', arc.innerRadius(0).outerRadius(0)); //do not display the menu yet. Only with show method

        // Add the icons
        menuSegments.append("image")
            .attr("class", "menu-icon")
            .attr("xlink:href", function(d) { return d.data.icon; })
            .attr("width", iconSize)
            .attr("height", iconSize)
            .attr("x", function(d) { return calcMidPoint(d).x - iconSize / 2; })
            .attr("y", function(d) { return calcMidPoint(d).y - iconSize / 2; })
            .attr("transform", function(d) {
                // We need to rotate the images backwards to compensate for the rotation of the menu as a whole
                var mp = calcMidPoint(d);
                var angle = -offsetAngleDeg;
                return "rotate(" + angle + "," + mp.x + "," + mp.y + ")";
            })
            .style("opacity", 0); //do not display the menu yet. Only with show method

        // Add sub segments
        var subSegments = menuSegments.selectAll('.menu-subsegment-container')
            .data(function(d){
                return d3.layout.pie()
                    .value(function(){return (d.data.actions || []).length;})
                    .padAngle(2 * Math.PI / 180)
                    .startAngle(d.startAngle)
                    .endAngle(d.endAngle)(d.data.actions || []);
            })
            .enter().append('g')
            .classed('menu-subsegment-container', true)
            .style({opacity:0, display:'none'});

        subSegments.append('path')
            .classed('menu-subsegment', true)
            .attr('d', function(d){
                if(d.data.icon){
                    return bigOuterArc(d);
                }
                return smallOuterArc(d);
            })
            .each(function(d){
                d3.select(this).style(d.data.styles);
            })
            .on('click', function(d){
                onClick.call(d3.select(this.parentNode.parentNode).select('.menu-segment').node(), d.data);
            });
        
        subSegments.append("image")
            .attr("class", "menu-icon")
            .attr("xlink:href", function(d) { return d.data.icon; })
            .attr("width", iconSize)
            .attr("height", iconSize)
            .attr("x", function(d) { return calcMidPoint(d, true).x - iconSize / 2; })
            .attr("y", function(d) { return calcMidPoint(d, true).y - iconSize / 2; })
            .attr("transform", function(d) {
                // We need to rotate the images backwards to compensate for the rotation of the menu as a whole
                var mp = calcMidPoint(d, true);
                var angle = -offsetAngleDeg;
                return "rotate(" + angle + "," + mp.x + "," + mp.y + ")";
            });
        
        // Remove old groups
        dataJoin.exit().remove();

        return control;
    };


    /**
     * Display the menu
     * @returns {object} The control
     */
    control.show = function(){
        init();
        isCollapsed = false;
        var dataJoin = segmentLayer.selectAll(".menu-segment-container");

        // Select all the segments and expand them from the centre
        dataJoin.select("path.menu-segment")
            .transition()       // wait for the icons to fade
            .duration(animationDuration)
            .attrTween("d", function(a) {
                // Create interpolations from the 0 to radius - to give the impression of an expanding menu
                var innerTween = d3.interpolate(0, radius);
                var outerTween = d3.interpolate(0, arc.outerRadius()());
                return function(t) {
                    // Re-configure the radius of the arc
                    return arc.innerRadius(innerTween(t)).outerRadius(outerTween(t))(a);
                };
            });

        // Select all the icons and fade them in
        dataJoin.select(".menu-icon")
            .style("opacity", 0)
            .transition()
            .delay(animationDuration)
            .duration(animationDuration)
            .style("opacity", 1);
        
        return control;
    };


    /**
     * Hide the menu
     * @returns {object} The control
     */
    control.hide = function() {
        isCollapsed = true;
        // Join the data with an empty array so that we'll exit all actors
        var dataJoin = segmentLayer.selectAll(".menu-segment-container");

        // Select all the icons and fade them out
        dataJoin.select(".menu-icon")
            .style("opacity", 1)
            .transition()
            .duration(animationDuration)
            .style("opacity", 0);

        dataJoin.selectAll('.menu-subsegment-container')
            .transition()
            .duration(animationDuration)
            .style({opacity:0, display:'none'})
            .each('end', function(){
               // d3.select(this).style('display:none');
            });

        // Select all the segments and animate them back into the centre
        dataJoin.select("path.menu-segment")
            .transition()
            .delay(animationDuration)       // wait for the icons to fade
            .duration(animationDuration)
            .attrTween("d", function(a) {
                // Create interpolations from the radius to 0 - to give the impression of a shrinking menu
                var innerTween = d3.interpolate(radius, 0);
                var outerTween = d3.interpolate(arc.outerRadius()(), 0);
                return function(t) {
                    // Re-configure the radius of the arc
                    return arc.innerRadius(innerTween(t)).outerRadius(outerTween(t))(a);
                };
            });

        return control;
    };

    function tweenArcRadius (a){
        // Create interpolations from the radius to 0 - to give the impression of a shrinking menu
        var innerTween = d3.interpolate(radius, 0);
        var outerTween = d3.interpolate(arc.outerRadius()(), 0);
        return function(t) {
            // Re-configure the radius of the arc
            return arc.innerRadius(innerTween(t)).outerRadius(outerTween(t))(a);
        };
    }

    // Initialize and then return the control
    init();
    return control;
};