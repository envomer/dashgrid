/**
* @desc
*/

import {getSortedArr, insertByOrder, getMaxObj} from './utils.js';

export function gridEngine (spec) {
    let {grid, renderer, drawer} = spec;
    let boxes = {};
    let movingBox = {};
    let oldBoxPositions;
    let isDragging = false;
    let numRows = grid.minRows;
    let numColumns = grid.minColumns;

    /**
     * @desc
     */
    let initializeEngine = function () {
        drawer.renderGrid({numRows: numRows, numColumns: numColumns});
        drawer.drawGrid({numRows: numRows, numColumns: numColumns});
        singleFloaters();
        drawBoxes();
    };

    /**
     *
     */
    let insertBox = function (obj) {
        boxes[obj.box.id] = obj.box;
    };

    /**
     * @desc Draws boxes to DOM.
     */
    let drawBoxes = function () {
        Object.keys(boxes).forEach(function (i) {
            drawer.drawBox({box: boxes[i]});
        });
    };

    /**
      *
      */
    let updatePositions = function (obj) {
        let {excludeBox, movedBoxes} = obj;

        // UpdateGrid moved boxes css.
        Object.keys(movedBoxes).forEach(function (i) {
            if (excludeBox !== movedBoxes[i]) {
                drawer.drawBox({box: movedBoxes[i]});
            }
        });

    };

    /**
     * @desc
     */
    let forEachBoxToggleAttr  = function (attr) {
        Object.keys(boxes).forEach(function (boxId) {
            if (boxes[boxId].inherit === true) {
                boxes[boxId][attr] = !boxes[boxId][attr];
            }
        });
    };

    /**
     * @desc Floats all floatable boxes up as much as possible, doesn't
     * effect boxes which grid.floating is set to false.
     */
    let floatAllUp = function () {
        // Order matters in which elements float up.
        let orderedBoxes = getSortedArr('asc', 'y', boxes);

        orderedBoxes.forEach(function (b) {
            if (b.floating === true) {
                floatUp({box: b});
            }
        });
    };

    /**
     *  @desc Find the furtest upward position a box can float
     *      and float it up.
     *  @param {object} box
     */
    let floatUp = function (obj) {
        let {box} = obj;

        let intersectedBoxes;
        while (box.row > 0) {
            box.row -= 1;
            intersectedBoxes = findIntersectedBoxes({
                box: box,
                excludeBox: {}
            });

            if (intersectedBoxes.length > 0) {
                box.row += 1
                break;
            }
        }
    };

    /**
     * @desc
     */
    let setMovingBox = function (obj) {
        let {boxId} = obj;
        movingBox = boxes[boxId];
    };

    /**
     * @desc Move box to new position.
     * @param object box
     * @param obj moveTo {row, column} position.
     * @returns boolean True if box moved.
     */
    let moveBox = function (obj) {
        let {boxId, moveTo} = obj;
        let box = boxes[boxId];

        // Only if moved.
        if (box.column === moveTo.column && box.row === moveTo.row) {
            return false;
        }

        // Copy old positions to move back if move fails.
        oldBoxPositions = saveOldPositions();
        box.column = moveTo.column;
        box.row = moveTo.row;

        // Is the dragging box a floater?
        if (box.floating) {floatUp({box: box});}

        // Attempt the move.
        let movedBoxes = {};
        let isValidMove = canOccupyCell({
            box: box,
            excludeBox: {'id': box.id},
            movedBoxes: movedBoxes
        });

        // If move fails revert back.
        if (!isValidMove) {moveBackBoxes({oldBoxPositions: oldBoxPositions});}

        // TODO: Check out that floatAllUp and singleFloaters don't do the
        // same thing or is redudant.
        // Handle all box floats.
        if (grid.floating) {floatAllUp();}

        // Handle single box floaters.
        singleFloaters();

        updateNumRows({isDragging: true});

        updatePositions({excludeBox: box, movedBoxes: boxes});

        console.log(boxes);

        return {row: box.row, column: box.column};
    };

    /**
     *
     */
    let handleDimensionChange = function () {
        renderer.initCellCentroids({
            numRows: numRows,
            numColumns: numColumns
        });

        drawer.updateGridSize({numRows: numRows, numColumns: numColumns});
        drawer.drawGrid({numRows: numRows, numColumns: numColumns});
    }

    /**
     *
     */
    let singleFloaters = function () {
        Object.keys(boxes).forEach(function (i) {
            if (boxes[i].floating) {floatUp({box: boxes[i]});}
        });
    };

    /**
     *
     */
    let saveOldPositions = function () {
        let oldBoxPositions = {};
        Object.keys(boxes).forEach(function (i) {
            oldBoxPositions[i] = {
                row: boxes[i].row,
                column: boxes[i].column
            };
        });

        return oldBoxPositions;
    };

    /**
     * @desc
     *
     */
    let updateNumRows = function (obj) {
        let {isDragging} = obj;
        let currentMaxRow = getMaxObj(boxes, 'row');

        decreaseNumRows();

        // Determine when to add extra row to be able to move down:
        // 1st: anytime dragging starts
        // 2nd: or when dragging starts AND moving box is close
        // to bottom border.
        if (isDragging === true &&
            (movingBox.row + movingBox.rowspan) === numRows &&
            numRows < grid.maxRows) {

            numRows += 1;
        }

        handleDimensionChange();
    };

    /**
     *
     */
    let moveBackBoxes = function (obj) {
        let {oldBoxPositions} = obj;
        Object.keys(oldBoxPositions).forEach(function (i) {
            boxes[i].row = oldBoxPositions[i].row;
            boxes[i].column = oldBoxPositions[i].column;
        });
    };

    /**
     * @desc Checks whether 2 Boxes intersect using bounding box method.
     * @param boxA object
     * @param boxB object
     * @returns boolean True if intersect else false.
     */
    let doBoxesIntersect = function (obj) {
        let {box, boxB} = obj;
        if (box.column < boxB.column + boxB.columnspan &&
                box.column + box.columnspan > boxB.column &&
                box.row < boxB.row + boxB.rowspan &&
                box.rowspan + box.row > boxB.row) {
        }

        return (box.column < boxB.column + boxB.columnspan &&
                box.column + box.columnspan > boxB.column &&
                box.row < boxB.row + boxB.rowspan &&
                box.rowspan + box.row > boxB.row);
    };

    /**
     * @desc Given a box, finds other boxes which intersect with it.
     * @param box {object}
     * @param excludeBox {array of objects}
     */
    let findIntersectedBoxes = function (obj) {
        let {box, excludeBox} = obj;
        let boxB;
        let intersectingBoxes = [];

        // let closeBoxes = hashMapping.getBoxesFromHash(box);
        // let cells = hashMapping.findIntersectedCells(box);

        Object.keys(boxes).forEach(function (key) {
            boxB = boxes[key];
            if (box !== boxB && boxB.id !== excludeBox.id) {
                if (doBoxesIntersect({box: box, boxB: boxB})) {
                    insertByOrder({
                        order: 'desc',
                        attr: 'y',
                        o: boxB,
                        arr: intersectingBoxes
                    });
                }
            }
        });

        return intersectingBoxes;

    };

    /**
     * @desc Increases number of numRows if box touches bottom of wall.
     * @param box object
     * @returns boolean true if increase else false.
     */
    let increaseNumRows = function () {
        if ((numRows + 1) < grid.maxRows) {
            numRows += 1;
            return true;
        }

        return false;
    };

    /**
     * @desc Decreases number of numRows to furthest downward box.
     * @param box object
     * @returns boolean true if increase else false.
     */
    let decreaseNumRows = function  () {
        let maxRowNum = 0;

        // Expand / Decrease number of numRows if needed.
        let box = getMaxObj(boxes, 'y');

        Object.keys(boxes).forEach(function (key) {
            if (maxRowNum < (boxes[key].row + boxes[key].rowspan)) {
                maxRowNum = boxes[key].row + boxes[key].rowspan;
            }
        });

        if (maxRowNum < numRows) {
            numRows = maxRowNum;
        }

        if (maxRowNum < grid.minRows) {
            numRows = grid.minRows;
        }

        return true;
    };

    /**
     * @desc Handles boundary collisions by reverting back to closest edge point.
     * @param box object
     * @returns boolean True if collided else false.
     */
    let handleBoundaryInteraction = function (obj) {
        let {box} = obj;
        let yMove;

        // Left/top/right boundary.
        if (box.column < 0 ||
            box.column + box.columnspan > numColumns ||
            box.row < 0) {
            return true;
        }

        // Bottom boundary.
        // on collision expand till max numRows reached.
        yMove = box.row + box.rowspan - numRows;
        if (yMove > 0) { // box.row + box.rowspan > numRows
            if (increaseNumRows()) {
                return false;
            }
            return true;
        }

        return false;
    };

    let isSwappable = function (obj) {
        let {boxA, boxB} = obj;
        if (boxA.rowspan === boxB.rowspan
            && boxA.columnspan === boxB.columnspan) {
            return true;
        }
        return false;
    };

    let swapBoxes = function (obj) {
        let {boxA, boxB} = obj;
        boxB.row = oldBoxPositions[boxA.id].row;
        boxB.column = oldBoxPositions[boxA.id].column;
    };

    /**
     * @desc Propagates box collisions.
     * @param {object} box
     * @param {objects} intersectingBoxes
     * @returns {boolean} If move is allowed
     */
    let handleBoxCollision = function (obj) {
        let {box, boxB, excludeBox, movedBoxes} = obj;
        let hasMoved = true;

        if (boxB.pushable === false) {
            return false;
        }

        if (boxB.stacking === true) {
            return true;
        }

        let swappable;
        if (boxB.swapping === true) {
            swappable = isSwappable({boxA: box, boxB: boxB});
            if (swappable) {
                swapBoxes({boxA: box, boxB: boxB});
                return true;
            }
        }

        boxB.row += box.row + box.rowspan - boxB.row;

        return canOccupyCell({
            box: boxB,
            excludeBox: excludeBox,
            movedBoxes: movedBoxes
        });
    };

    /**
     * @desc Checks and handles collisions with wall and boxes.
     *     Works as a tree, propagating moves down the collision tree
     *     and returns true or false depending if the box infront
     *     is able to move.
     *     1. Add box to
     * @param {object} box
     * @param {objects} excludeBox
     * @returns {boolean} true if move is possible, false otherwise.
     */
    let canOccupyCell = function (obj) {
        let {box, excludeBox, movedBoxes} = obj;
        let intersectedBoxes;
        let hasMoved;

        movedBoxes[box.id] = box;

        let collidedWithBoundary = handleBoundaryInteraction({box: box});
        if (collidedWithBoundary) {
            return false;
        }

        if (grid.stacking) {
            return true;
        }

        // Handle Block Collision, recursive tree system.
        intersectedBoxes = findIntersectedBoxes({
            box: box,
            excludeBox: excludeBox
        });

        // If grid.pushable is disabled.
        if (!grid.pushable && intersectedBoxes.length > 0) {
            return false;
        }

        // Handle collision.
        return intersectedBoxes.every(function (boxB, i, e) {
            return handleBoxCollision({
                box: box,
                boxB: boxB,
                excludeBox: excludeBox,
                movedBoxes: movedBoxes
            });
        });

        return true;
    };

    let getNumRows = function () {
        return numRows;
    }

    let getNumColumns = function () {
        return numColumns;
    }

    return Object.freeze({
        initializeEngine,
        insertBox,
        moveBox,
        drawBoxes,
        getNumRows,
        getNumColumns,
        setMovingBox,
        updateNumRows
    });

}