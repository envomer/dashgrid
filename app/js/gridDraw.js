/**
 *
 */

import {removeNodes} from './utils.js';

export function gridDraw(spec) {
    let {grid, renderer} = spec;
    let drawElement;

    if (document.getElementById('draw-element') === null) {
        drawElement = document.createElement('div');
        drawElement.id = 'draw-element';
        grid.element.appendChild(drawElement);
    }

    /**
     *
     */
    let updateGridSize = function (dim) {
        let {numRows, numColumns} = dim;
        renderer.updateHeight({
            element: grid.element,
            numRows: numRows
        });
        // renderer.updateWidth({
        //     element: grid.element,
        //     numColumns: numColumns
        // });
    }

    /**
     *
     */
    let renderGrid = function (dim) {
        let {numRows, numColumns} = dim;

        // Width.
        renderer.setWidth({
            element: grid.element,
            width: grid.width
        });
        renderer.setWidthPerCell({
            element: grid.element,
            numColumns: numColumns,
            width: grid.width
        });

        // Height.
        renderer.setHeight({
            element: grid.element,
            height: grid.height
        });
        renderer.setHeightPerCell({
            element: grid.element,
            numRows: numRows,
            height: grid.height
        });

        renderer.initCellCentroids({
            numRows: numRows,
            numColumns: numColumns
        });
    }

    /**
     *
     */
    let drawBox = function (obj) {
        let {box} = obj;

        renderer.setBoxXPosition({
            element: box.element,
            column: box.column
        });
        renderer.setBoxYPosition({
            element: box.element,
            row: box.row
        });
        renderer.setBoxWidth({
            element: box.element,
            columnspan: box.columnspan
        });
        renderer.setBoxHeight({
            element: box.element,
            rowspan: box.rowspan
        });
    };

    /**
     * @desc Sets px per numRows.
     * @params {number} numRows.
     * @params {number} numColumns.
     */
    let drawGrid = function (dim) {
        let {numRows, numColumns} = dim;
        let widthPerCell = renderer.getWidthPerCell()
        let heightPerCell = renderer.getHeightPerCell()

        removeNodes(drawElement);

        let htmlString = '';
        // Horizontal lines
        for (let i = 0; i <= numRows; i += 1) {
            htmlString += '<div class="horizontal-line" style="' +
            'left:' + '0px;' +
            'top:' + i * (heightPerCell + grid.yMargin) + 'px;' +
            'width:100%;' + 'height:' +
            grid.yMargin + 'px;">' + '</div>';
        }

        // Vertical lines
        for (let i = 0; i <= numColumns; i += 1) {
            htmlString += '<div class="vertical-line" style="' +
            'top:' + '0px;' +
            'left:' + i * (widthPerCell + grid.xMargin) + 'px;' +
            'height:100%;' + 'width:' + grid.xMargin +
            'px;">' + '</div>';
        }

        // Draw centroids
        for (let i = 0; i < numRows; i += 1) {
            for (let j = 0; j < numColumns; j += 1) {
                htmlString += '<div class="grid-centroid" style="' +
                'left:' + (j * (widthPerCell  + grid.xMargin) +
                    widthPerCell / 2 + grid.xMargin ) + 'px;top:' +
                    (i * (heightPerCell  + grid.yMargin) +
                    heightPerCell / 2 + grid.yMargin ) + 'px;"></div>';
            }
        }

        drawElement.innerHTML = htmlString;
    };

    /** @desc Sets px per numRows.
     * @params numRows number number of numRows.
     * @params column number number of numColumns.
     */
    let drawHash = function (obj) {
        let {numHor, numVer, cellWidth, cellHeight} = obj;

        let drawElement = document.createElement('div');
        let htmlString = '',
            i,
            j,
            lineThickness = "2px";

        if (drawElement.children()) {
            drawElement.children().remove();
        }

        // Horizontal lines
        for (i = 0; i <= numVer; i += 1) {
            htmlString += '<div class="horizontal-hash-line" style="' +
            'left:' + '0px;' +
            'top: ' + (i * cellHeight) + 'px;' +
            'width: 100%;' + 'height:' + lineThickness + ';">' +
            '</div>';
        }

        // Vertical lines
        for (i = 0; i <= numHor; i += 1) {
            htmlString += '<div class="vertical-hash-line" style="' +
            'top:' + '0px;' +
            'left:' + (i * cellWidth) + 'px;' +
            'height:100%;' + 'width:' + lineThickness + ';">' +
            '</div>';
        }

        drawElement.append(drawObj);
        obj.element.append(drawElement);
    };

    return Object.freeze({
        renderGrid,
        updateGridSize,
        drawBox,
        drawGrid,
        drawHash
    })
};