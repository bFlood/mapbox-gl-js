'use strict';

module.exports = Bucket;

function Bucket(info, geometry, placement) {

    this.info = info;
    this.geometry = geometry;
    this.placement = placement;

    if (info.type === 'text') {
        this.addFeature = this.addText;

    } else if (info.type == 'point' && info.spacing) {
        this.addFeature = this.addMarkers;
        this.spacing = info.spacing || 100;

    } else if (info.type == 'point') {
        this.addFeature = this.addPoint;

    } else if (info.type == 'line') {
        this.addFeature = this.addLine;

    } else if (info.type == 'fill') {
        this.addFeature = this.addFill;

    } else {
        console.warn('unrecognized type');
    }

    var compare = info.compare || '==';
    if (compare in comparators) {
        var code = comparators[compare](info);
        if (code) {
            /* jshint evil: true */
            this.compare = new Function('feature', code);
        }
    }

}

Bucket.prototype.start = function() {
    var geometry = this.geometry;

    this.indices = {
        lineVertexIndex: geometry.lineVertex.index,

        fillBufferIndex: geometry.fillBufferIndex,
        fillVertexIndex: geometry.fillVertex.index,
        fillElementsIndex: geometry.fillElements.index,

        glyphVertexIndex: geometry.glyphVertex.index
    };
};


Bucket.prototype.end = function() {
    var geometry = this.geometry;
    var indices = this.indices;

    indices.lineVertexIndexEnd = geometry.lineVertex.index;

    indices.fillBufferIndexEnd = geometry.fillBufferIndex;
    indices.fillVertexIndexEnd = geometry.fillVertex.index;
    indices.fillElementsIndexEnd = geometry.fillElements.index;

    indices.glyphVertexIndexEnd = geometry.glyphVertex.index;
};


Bucket.prototype.addMarkers = function(lines) {
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addMarkers(lines[i], this.spacing);
    }
};

Bucket.prototype.addLine = function(lines) {
    var info = this.info;
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addLine(lines[i], info.join, info.cap, info.miterLimit, info.roundLimit);
    }
};

Bucket.prototype.addFill = function(lines) {
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addFill(lines[i]);
    }
};

Bucket.prototype.addPoint = function(lines) {
    for (var i = 0; i < lines.length; i++) {
        this.geometry.addPoints(lines[i]);
    }
};

Bucket.prototype.addText = function(lines, faces, shaping) {
    for (var i = 0; i < lines.length; i++) {
        this.placement.addFeature(lines[i], this.info, faces, shaping);
    }
};

// Builds a function body from the JSON specification. Allows specifying other compare operations.
var comparators = {
    '==': function(bucket) {
        if (!('field' in bucket)) return;
        var value = bucket.value, field = bucket.field;
        return 'return ' + (Array.isArray(value) ? value : [value]).map(function(value) {
            return 'feature[' + JSON.stringify(field) + '] == ' + JSON.stringify(value);
        }).join(' || ') + ';';
    }
};