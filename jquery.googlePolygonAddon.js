(function ($) {
    $.googlePolygonAddon = function (map, polygon) {
        const addonInstance = new GooglePolygonAddon(map, polygon);

        // Expose the refreshPosition and moveVertex functions
        $.googlePolygonAddon.refreshPosition = function (onRefreshPosition) {
            addonInstance.addRefreshPositionListener(onRefreshPosition);
        };

        $.googlePolygonAddon.moveVertex = function (onVertexMove) {
            addonInstance.addVertexMoveListener(onVertexMove);
        };

        $.googlePolygonAddon.removeRefreshPositionListener = function () {
            addonInstance.removeRefreshPositionListener();
        };

        $.googlePolygonAddon.removeVertexMoveListener = function () {
            addonInstance.removeVertexMoveListener();
        };

        return addonInstance;
    };

    class GooglePolygonAddon {
        constructor(map, polygon) {
            this.map = map;
            this.polygon = polygon;

            this.dragging = false;
            this.draggedVertexIndex = null;

            // Set the time interval (in milliseconds) for detecting inactivity
            this.inactivityTimeout = 10000; // 1 second

            // Bind event handlers
            this.boundOnMouseMove = this.onMouseMove.bind(this);
            this.boundOnMouseUp = this.onMouseUp.bind(this);
            this.boundOnTouchMove = this.onTouchMove.bind(this);
            this.boundOnTouchEnd = this.onTouchEnd.bind(this);
        }

        attachEvents() {
            // Attach events
            google.maps.event.addListener(this.polygon, 'mousedown', this.onMouseDown.bind(this));
            document.addEventListener('mousemove', this.boundOnMouseMove);
            google.maps.event.addListener(this.polygon, 'mouseup', this.boundOnMouseUp);

            // Touch events
            google.maps.event.addListener(this.polygon, 'touchstart', this.onTouchStart.bind(this));
            document.addEventListener('touchmove', this.boundOnTouchMove, {passive: false});
            google.maps.event.addListener(this.polygon, 'touchend', this.boundOnTouchEnd);

            // Blur event on the document
            document.addEventListener('blur', this.onDocumentBlur.bind(this));
        }

        removeEvents() {
            google.maps.event.removeListener(this.polygon, 'mousedown', this.onMouseDown.bind(this));
            document.removeEventListener('mousemove', this.onMouseMove.bind(this));
            google.maps.event.removeListener(this.polygon, 'mouseup', this.onMouseUp.bind(this));

            // Remove touch events
            google.maps.event.removeListener(this.polygon, 'touchstart', this.onTouchStart.bind(this));
            document.removeEventListener('touchmove', this.onTouchMove.bind(this), {passive: false});
            google.maps.event.removeListener(this.polygon, 'touchend', this.onTouchEnd.bind(this));

            // Blur event on the document
            document.removeEventListener('blur', this.onDocumentBlur.bind(this));
        }

        updateVertex(event) {
            if (event && 'vertex' in event) {
                this.draggedVertex = event.vertex;
            } else {
                this.draggedVertex = null;
            }
        }

        onMouseDown(event) {
            const domEvent = event.domEvent;
            this.dragging = true;
            this.updateVertex(event)
        }

        onTouchStart(event) {
            this.dragging = true;
            this.updateVertex(event)
        }

        onMouseMove(event) {
            if (this.dragging) {
                this.resetInactivityTimer();
                this.moveCalculation();
            }
        }

        onTouchMove(event) {
            if (this.dragging) {
                this.resetInactivityTimer();
                this.moveCalculation();
            }
        }

        resetInactivityTimer() {
            clearTimeout(this.inactivityTimeoutId);
            this.inactivityTimeoutId = setTimeout(() => {
                this.dragging = false;
            }, this.inactivityTimeout);
        }

        onDocumentBlur() {
            this.dragging = false;
            this.updateVertex(null);
        }

        onMouseUp(event) {
            this.dragging = false;
            this.updateVertex(null);
        }

        onTouchEnd(event) {
            this.dragging = false;
            this.updateVertex(null);
        }

        toArray(polygon) {
            const pathArray = [];
            const path = polygon.getPath();

            for (let i = 0; i < path.getLength(); i++) {
                const vertex = path.getAt(i);
                pathArray.push({lat: vertex.lat(), lng: vertex.lng()});
            }

            return pathArray;
        }

        moveCalculation() {
            const vertex = {lat: 0, lng: 0};
            if (vertex) {
                const pin = $(".pin-marker")[this.draggedVertex]
                if (pin) {
                    if (typeof this.refreshPosition === 'function') {
                        this.refreshPosition($(pin).position().left, $(pin).position().top)
                    }
                    if (typeof this.refreshPosition === 'function') {
                        this.scale = Math.pow(2, this.map.getZoom());
                        this.topRight = this.map.getProjection().fromLatLngToPoint(this.map.getBounds().getNorthEast());
                        this.bottomLeft = this.map.getProjection().fromLatLngToPoint(this.map.getBounds().getSouthWest());
                        const reversePoint = new google.maps.Point(
                            this.bottomLeft.x + (parseFloat($(pin).position().left + 5) / this.scale),
                            this.topRight.y + (parseFloat($(pin).position().top + 15) / this.scale)
                        );
                        const reverseLatLng = this.map.getProjection().fromPointToLatLng(reversePoint);
                        this.moveVertex(reverseLatLng);
                    }
                }
            }
        }

        addRefreshPositionListener(onRefreshPosition) {
            this.refreshPosition = onRefreshPosition
        }

        addVertexMoveListener(onVertexMove) {
            this.moveVertex = onVertexMove
        }

        removeRefreshPositionListener() {
            this.refreshPosition = null
        }

        removeVertexMoveListener() {
            this.moveVertex = null
        }
    }
})(jQuery);
