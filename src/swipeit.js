(function (win) {

    var Swipe = function (element) {
        /**
         * @type {Element}
         */
        this.e = element;

        /**
         * @type {Object}
         */
        this._startPos;
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
            'mousemove', this._onmove,
            'mouseup', this._onend
        });

        this._startPos = this._getPos(evt);
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
            'mousemove', this._onmove,
            'mouseup', this._onend
        });
    };

    /**
     * touch move listener
     * @param {TouchEvent} evt
     */
    Swipe.prototype._onmove = function (evt) {

    };

    window.swipeit = function (element) {
        return new Swipe(element);
    };
})(window);
