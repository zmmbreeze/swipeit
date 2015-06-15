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
                callback(Date.now());
            }, timeDelay);
        };

    // Works around a rare bug in Safari 6 where the first request is never invoked.
    requestAnimationFrame(function () {});

    var Swipe = function (element) {
        /**
         * @type {Element}
         */
        this.e = element;

        /**
         * @type {Object}
         */
        this._startPos;

        /**
         * @type {boolean}
         */
        this._animating = false;
    };

    /**
     * @param {string|Object} eventName
     * @param {Function} callback
     */
    Swipe.prototype._on = function (eventName, callback) {
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
    Swipe.prototype._un = function (eventName, callback) {
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
        var point = {};

        if (evt.targetTouches) {
            // Prefer Touch Events
            point.x = evt.targetTouches[0].clientX;
            point.y = evt.targetTouches[0].clientY;
        }
        else {
            // Either Mouse event or Pointer Event
            point.x = evt.clientX;
            point.y = evt.clientY;
        }

        return point;
    };

    /**
     * touch start listener
     * @param {TouchEvent} evt
     */
    Swipe.prototype._onstart = function (evt) {
        evt.preventDefault();

        this._on({
            'touchmove': this._onmove,
            'touchend': this._onend,
            'touchcancel': this._onend,
            'mousemove': this._onmove,
            'mouseup': this._onend
        });

        this._startPos = this._getPos(evt);
        this.e.style.WebkitTransition = 'initial';
        this.e.style.transition = 'initial';
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

        this._un({
            'touchmove': this._onmove,
            'touchend': this._onend,
            'touchcancel': this._onend,
            'mousemove': this._onmove,
            'mouseup': this._onend
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
        requestAnimationFrame(function (time) {
            if (!that._animating) {
                return;
            }

            // TODO
            console.log(point);

            that._animating = false;
        });
    };

    window.swipeit = function (element) {
        return new Swipe(element);
    };
})(window);
