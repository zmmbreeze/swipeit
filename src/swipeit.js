(function (win) {
    // requestAnimationFrame
    // https://github.com/facebook/react/blob/38acadf6f493926383aec0362617b8507ddee0d8/src/shared/vendor/core/requestAnimationFrame.js
    var lastTime = 0;
    var requestAnimationFrame =
        window.requestAnimationFrame       ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function (callback) {
            var currTime = Date.now();
            var timeDelay = Math.max(0, 16 - (currTime - lastTime));
            lastTime = currTime + timeDelay;
            return global.setTimeout(function () {
                callback();
            }, timeDelay);
        };

    // Works around a rare bug in Safari 6 where the first request is never invoked.
    requestAnimationFrame(function () {});

    var UPDATE_EVENT = 'update';
    var CANCEL_EVENT = 'cancel';
    var SUCCESS_EVENT = 'success';
    var START_EVENT = 'start';
    var DONE_EVENT = 'done';

    /**
     * @constructor
     * @param {Element|string} element
     * @param {Object=} opt_config
     * @param {number=} opt_config.maxAngle
     * @param {number=} opt_config.threshold
     */
    var Swipe = function (element, opt_config) {
        /**
         * @type {Object}
         */
        this.opt = opt_config || {};

        /**
         * @type {Element}
         */
        this.e = typeof element === 'string'
            ? document.getElementById(element) : element;

        /**
         * @type {Object}
         */
        this._startPos = null;

        /**
         * @type {boolean}
         */
        this._animating = false;

        /**
         * up|down|right|left
         * @type {string}
         */
        this._direction = null;

        /**
         * {
         *     'direction': 'top',
         *     'position': {
         *         'x': 100,
         *         'y': 100
         *     }
         * }
         * @type {Object}
         */
        this.status = {};
        this.status['position'] = {};

        /**
         * @type {number}
         */
        this._threshold = this.opt['threshold'] || 5;

        var maxAngle = this.opt['maxAngle'] || 45;
        /**
         * @type {Object}
         */
        this._angles = {
            'right': [ [0, maxAngle], [360 - maxAngle, 360] ],
            'top': [ [90 - maxAngle, 90 + maxAngle] ],
            'left': [ [180 - maxAngle, 180 + maxAngle] ],
            'bottom': [ [270 - maxAngle, 270 + maxAngle] ]
        };

        /**
         * @type {Object}
         */
        this._callbacks = {};

        this._startCallback = this._onstart.bind(this);
        this._moveCallback = this._onmove.bind(this);
        this._endCallback = this._onend.bind(this);

        this.e.addEventListener('mousedown', this._startCallback, false);
        this.e.addEventListener('touchstart', this._startCallback, false);
    };

    /**
     * @param {string} eventName
     * @param {Function} callback
     */
    Swipe.prototype.on = function (eventName, callback) {
        var cbs = this._callbacks[eventName] = this._callbacks[eventName] || [];
        cbs.push(callback);
    };

    /**
     * @param {string} eventName
     * @param {Function=} opt_callback
     */
    Swipe.prototype.off = function (eventName, opt_callback) {
        if (!opt_callback) {
            this._callbacks[eventName].length = 0;
            return;
        }

        var cbs = this._callbacks[eventName];
        if (cbs && cbs.length) {
            for (var i = 0; i < cbs.length; i++) {
                if (opt_callback === cbs[i]) {
                    cbs.splice(i, 1);
                    return;
                }
            }
        }
    };

    /**
     * @param {string} eventName
     */
    Swipe.prototype.trigger = function (eventName) {
        var cbs = this._callbacks[eventName];
        if (cbs) {
            var cb;
            var args = slice.call(arguments, 1);
            for (var i = 0; i < cbs.length; i++) {
                cb = cbs[i];
                if (cb) {
                    cb.apply(this.e, args);
                }
            }
        }
    };

    /**
     * @param {string|Object} eventName
     * @param {Function} callback
     */
    Swipe.prototype._bind = function (eventName, callback) {
        if (typeof eventName === 'string') {
            document.addEventListener(eventName, callback, true);
        }
        else {
            var obj = eventName;
            for (eventName in obj) {
                document.addEventListener(eventName, obj[eventName], true);
            }
        }
    };

    /**
     * @param {string|Object} eventName
     * @param {Function} callback
     */
    Swipe.prototype._unbind = function (eventName, callback) {
        if (typeof eventName === 'string') {
            document.removeEventListener(eventName, callback, true);
        }
        else {
            var obj = eventName;
            for (eventName in obj) {
                document.removeEventListener(eventName, obj[eventName], true);
            }
        }
    };

    /**
     * Get touch position
     * @param {TouchEvent} event
     */
    Swipe.prototype._getPos = function (evt) {
        var point = this.status['position'];

        if (evt.targetTouches) {
            // Prefer Touch Events
            point['x'] = evt.targetTouches[0].clientX;
            point['y'] = evt.targetTouches[0].clientY;
        }
        else {
            // Either Mouse event or Pointer Event
            point['x'] = evt.clientX;
            point['y'] = evt.clientY;
        }

        return point;
    };

    /**
     * touch start listener
     * @param {TouchEvent} evt
     */
    Swipe.prototype._onstart = function (evt) {
        evt.preventDefault();

        this._bind({
            'touchmove': this._moveCallback,
            'touchend': this._endCallback,
            'touchcancel': this._endCallback,
            'mousemove': this._moveCallback,
            'mouseup': this._endCallback
        });

        this._startPos = this._getPos(evt);
        this.e.style.WebkitTransition = 'initial';
        this.e.style.transition = 'initial';
        this.trigger(START_EVENT);
    };

    /**
     * touch end listener
     * @param {TouchEvent} evt
     */
    Swipe.prototype._onend = function (evt) {
        evt.preventDefault();

        if (evt.targetTouches && evt.targetTouches.length > 0) {
            return;
        }

        this._direction = null;
        this._unbind({
            'touchmove': this._moveCallback,
            'touchend': this._endCallback,
            'touchcancel': this._endCallback,
            'mousemove': this._moveCallback,
            'mouseup': this._endCallback
        });
    };

    /**
     * touch move listener
     * @param {TouchEvent} evt
     */
    Swipe.prototype._onmove = function (evt) {
        var point = this._getPos(evt);

        if (this._animating) {
            return;
        }

        this._animating = true;
        var that = this;
        requestAnimationFrame(function () {
            if (!that._animating) {
                return;
            }

            if (that.status['direction'] == null
                && ((Math.abs(point['x'] - that._startPos['x']) >= that._threshold)
                    || (Math.abs(point['y'] - that._startPos['y']) >= that._threshold))) {
                that.status['direction'] = that._getDirection(point, that._startPos);
            }

            that.trigger(UPDATE_EVENT, that.status);

            that._animating = false;
        });
    };

    /**
     * calculate angle
     *
     * @param {Object} curPos
     * @param {Object} startPos
     * @return {number} up|left|right|down
     */
    Swipe.prototype._calAngle = function (curPos, startPos) {
        var x1 = curPos['x'] - startPos['x'];
        var y1 = -curPos['y'] + startPos['y'];
        var x2 = 1;
        var y2 = 0;
        var r = Math.acos((x1 * x2 + y1 * y2) / Math.sqrt((x1 * x1 + y1 * y1) * (x2 * x2 + y2 * y2)));
        var angle = r * 180 / Math.PI;
        return y1 < 0 ? (360 - angle) : angle;
    };

    /**
     * calculate the direction
     *
     * @param {Object} curPos
     * @param {Object} startPos
     * @return {string} up|left|right|down or empty string if no right direction
     */
    Swipe.prototype._getDirection = function (curPos, startPos) {
        var angle = this._calAngle(curPos, startPos);
        var tmp;
        for (var dir in this._angles) {
            if (this._angles.hasOwnProperty(dir)) {
                tmp = this._angles[dir];
                for (var i = 0; i < tmp.length; i++) {
                    if (angle >= tmp[i][0] && angle <= tmp[i][1]) {
                        return dir;
                    }
                }
            }
        }

        return '';
    };

    window.swipeit = function (element, opt_config) {
        return new Swipe(element, opt_config);
    };
})(window);
