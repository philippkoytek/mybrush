// source: http://bl.ocks.org/eweitnauer/7144244#mtouch-events.js

/// Based on the d3.behavior.drag and d3.behavior.zoom.
mtouch_events = function() {
    var event = d3_eventDispatch(mtouch, "tap", "dbltap", "hold", "drag", "mdrag", 'touch', 'release')
        ,fingers = [] // array of augmented touches = fingers
        ,id2finger = {} // maps ids to fingers
        ,last_taps = [] // [{timeStamp: xxx, pos: [x,y]}, ...], used to detect dbltaps
        ,mouse_id = 'mouse'
        ,tap_max_time = 250
        ,tap_max_dist2 = 10*10
        ,hold_time = 500
        ,hold_max_dist2 = 10*10
        ,dbltap_max_delay = 400
        ,dbltap_max_dist = 20;

    function mtouch() {
        this.on("touchstart.mtouch", touchstarted)
            .on("mousedown.mtouch", mousedown)
            .on("touchmove.mtouch", touchmoved)
            .on("touchend.mtouch", touchended)
            .on("touchcancel.mtouch", touchended);
    }

    mtouch.call = function(f) {
        f.apply(mtouch, arguments); return this;
    };

    /// On mousedown, start listening for mousemove and mouseup events on the
    /// whole window. Also call the touchstarted function. If it was not the left
    /// mousebutton that was pressed, do nothing.
    function mousedown() {
        if (!detectLeftButton(d3.event)) return;
        var w = d3.select(window);
        var thiz = this, argumentz = arguments;
        w.on("mousemove.mtouch", function() { touchmoved.apply(thiz, argumentz) });
        w.on("mouseup.mtouch", function() {
            w.on("mousemove.mtouch", null);
            w.on("mouseup.mtouch", null);
            touchended.apply(thiz, argumentz);
        });
        touchstarted.apply(this, arguments);
    }

    function touchstarted() {
        d3.event.preventDefault();
        var target = this
            ,event_ = event.of(target, arguments)
            ,touches = get_changed_touches();

        for (var i=0,N=touches.length; i<N; i++) {
            var finger = new Finger(touches[i].identifier, event_, target);
            fingers.push(finger);
            id2finger[touches[i].identifier] = finger;
            event_({type: 'touch', finger: finger, fingers: fingers});
        }
    }

    function touchmoved() {
        d3.event.preventDefault();
        var target = this
            ,event_ = event.of(target, arguments)
            ,touches = get_changed_touches();

        for (var i=0,N=fingers.length; i<N; i++) fingers[i].changed = false;

        var df = [];
        for (var i=0,N=touches.length; i<N; i++) {
            var finger = id2finger[touches[i].identifier];
            if (!finger) continue;
            finger.move(event_);
            df.push(finger);
        }

        event_({type: 'mdrag', dragged_fingers: df, fingers: fingers});
    }

    function touchended() {
        d3.event.preventDefault();
        var target = this
            ,event_ = event.of(target, arguments)
            ,touches = get_changed_touches();

        for (var i=0,N=touches.length; i<N; i++) {
            var finger = id2finger[touches[i].identifier];
            if (!finger) continue;
            finger.end(event_);
            delete id2finger[touches[i].identifier];
            fingers = d3.values(id2finger);
            event_({type: 'release', finger: finger, fingers: fingers});
        }
    }

    function Finger(id, event, target) {
        this.id = id;
        this.target = target;
        this.event = event;
        this.parent = target.parentNode;
        this.timeStamp0 = d3.event.timeStamp;
        this.timeStamp = this.timeStamp0;
        this.hold_timer = setTimeout(this.held.bind(this), hold_time);
        this.pos = get_position(this.parent, this.id);
        this.pos0 = [this.pos[0], this.pos[1]];
        this.dist_x = 0; // dx between current and starting point
        this.dist_y = 0;
        this.dx = 0; // dx in the last dragging step
        this.dy = 0;
        this.dt = 0; // dt in the last dragging step
        this.changed = true; // used by gesture to check whether it needs to update
        this.gesture = null; // is set when finger gets bound to a gesture
    }

    Finger.prototype.cancel_hold = function() {
        if (this.hold_timer) clearTimeout(this.hold_timer);
        this.hold_timer = null;
    };

    Finger.prototype.held = function() {
        this.event({type: 'hold', id: this.id, fingers: fingers});
        this.hold_timer = null;
    };

    Finger.prototype.move = function(event) {
        this.changed = true;
        this.event = event;

        var p = get_position(this.parent, this.id)
            ,t = d3.event.timeStamp;
        this.dx = p[0] - this.pos[0];
        this.dy = p[1] - this.pos[1];
        this.dist_x = p[0] - this.pos0[0];
        this.dist_y = p[1] - this.pos0[1];
        this.pos = p;
        this.dt = t-this.timeStamp;
        this.timeStamp = t;

        if (this.dist_x*this.dist_x+this.dist_y*this.dist_y > hold_max_dist2) {
            this.cancel_hold();
        }

        if (this.gesture) return;

        event({type: 'drag', finger: this, x: this.pos[0], y: this.pos[1]
            ,dx: this.dx, dy: this.dy, fingers: fingers});
    };

    Finger.prototype.end = function(event) {
        var dt = d3.event.timeStamp - this.timeStamp0;
        if (dt <= tap_max_time && (this.dist_x*this.dist_x+this.dist_y*this.dist_y) <= tap_max_dist2) {
            if (match_tap(d3.event.timeStamp, this.pos[0], this.pos[1])) {
                event({type: 'dbltap', finger: this, fingers: fingers});
            } else {
                event({type: 'tap', finger: this, fingers: fingers});
            }
        }
        this.cancel_hold();
    };

    function get_changed_touches() {
        return d3.event.changedTouches || [{identifier: mouse_id}];
    }

    function detectLeftButton(event) {
        if ('buttons' in event) return event.buttons === 1;
        else if ('which' in event) return event.which === 1;
        else return event.button === 1;
    }

    /// Returns true if any tap in the last_taps list is spatially and temporally
    /// close enough to the passed time and postion to count as a dbltap. If not,
    /// the passed data is added as new tap. All taps that are too old are removed.
    function match_tap(timeStamp, x, y) {
        var idx = -1, pos = [x,y];
        last_taps = last_taps.filter(function (tap, i) {
            if (timeStamp - tap.timeStamp <= dbltap_max_delay
                && get_distance(tap.pos, pos) <= dbltap_max_dist) idx = i;
            return tap.timeStamp-timeStamp <= dbltap_max_delay && idx !== i;
        });
        if (idx === -1) last_taps.push({timeStamp: timeStamp, pos: pos});
        return idx !== -1;
    }

    function get_position(container, id) {
        if (id === mouse_id) return d3.mouse(container);
        else return d3.touches(container).filter(function(p) { return p.identifier === id; })[0];
    }

    function get_distance(p1, p2) {
        return Math.sqrt((p1[0]-p2[0])*(p1[0]-p2[0]) + (p1[1]-p2[1])*(p1[1]-p2[1]));
    }

    return d3.rebind(mtouch, event, "on");
};

/// Replication of the internal d3_eventDispatch method.
function d3_eventDispatch(target) {
    var dispatch = d3.dispatch.apply(this, Array.apply(null, arguments).slice(1));

    dispatch.of = function(thiz, argumentz) {
        return function(e1) {
            try {
                var e0 =
                    e1.sourceEvent = d3.event;
                e1.target = target;
                d3.event = e1;
                dispatch[e1.type].apply(thiz, argumentz);
            } finally {
                d3.event = e0;
            }
        };
    };

    return dispatch;
}