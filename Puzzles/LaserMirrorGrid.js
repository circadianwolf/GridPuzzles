class LaserMirrorGrid extends GridBase {
    static get LaserProgress() {
        return "Lasers";
    }
    static get MirrorProgress() {
        return "Mirrors";
    }

    /** @type {Map} */
    CellGroups = new Map();
    /** @type {Laser[]} */
    Lasers = [];
    /** @type {Mirror[]} */
    Mirrors = [];

    static GetPuzzle() {
        const instructions = `Draw diagonal lines across certain squares to form mirrors, with exactly one mirror per region outlined in bold.
The mirrors must be placed so that a laser fired horizontally or vertically into the grid from each lettered clue would then
exit the grid at the same letter elsewhere, having bounced off the exact number of mirrors indicated by the number next to the letter.
All mirrors must be reached by at least one laser.

<br/><br/>Click a square to place a mirror.
<br/>Click again to rotate the mirror.
<br/>Clicking again will remove the mirror.`;

        const progressTracks = [
            new ProgressTrack(this.LaserProgress, 'Lasers', 6),
            new ProgressTrack(this.MirrorProgress, 'Mirrors', 12)
        ];

        const cellGroups = [
            [0, 0, 0, 1, 1, 1, 2],
            [3, 3, 0, 1, 1, 2, 2],
            [3, 3, 3, 3, 4, 2, 2],
            [5, 6, 4, 4, 4, 7, 8],
            [5, 6, 9, 9, 10, 7, 8],
            [9, 9, 9, 11, 10, 10, 10],
            [9, 9, 11, 11, 10, 10, 10]
        ];

        //note that laser endpoints are actually outside the grid proper
        const lasers = [
            new Laser("A", 3, new LaserEndpoint(-1, 5, CellBorders.Top), new LaserEndpoint(5, -1, CellBorders.Left)),
            new Laser("B", 3, new LaserEndpoint(-1, 6, CellBorders.Top), new LaserEndpoint(6, -1, CellBorders.Left)),
            new Laser("C", 3, new LaserEndpoint(2, 7, CellBorders.Right), new LaserEndpoint(7, 2, CellBorders.Bottom)),
            new Laser("D", 2, new LaserEndpoint(0, 7, CellBorders.Right), new LaserEndpoint(2, -1, CellBorders.Left)),
            new Laser("E", 2, new LaserEndpoint(-1, 2, CellBorders.Top), new LaserEndpoint(7, 6, CellBorders.Bottom)),
            new Laser("F", 2, new LaserEndpoint(-1, 0, CellBorders.Top), new LaserEndpoint(-1, 4, CellBorders.Top)),
        ];

        return new GridPuzzle('LaserMirrorGrid', 'Lasers', instructions, progressTracks, LaserMirrorGrid, cellGroups, [lasers]);
    }

    constructor(canvasId, leftX, topY, gridRows, lasers) {
        super(canvasId, leftX, topY, 50, gridRows);

        this.Lasers = lasers;
        //has to be done after the super() because this.CellGroups is not initialized until then
        this.LoadCellGroups();
    }

    //#region Overrides

    /** @param cell {Cell} */
    LoadCellBorders(cell) {
        super.LoadCellBorders(cell);

        //we only need to handle one of (top/bottom) and (left/right) each
        if (cell.Row > 0 && this.CellGrid[cell.Row - 1][cell.Col].Value !== cell.Value)
            cell.Borders.AddBorder(CellBorders.Top);
        if (cell.Col > 0 && this.CellGrid[cell.Row][cell.Col - 1].Value !== cell.Value)
            cell.Borders.AddBorder(CellBorders.Left);
    }

    /** @param cell {Cell} */
    CellClick(cell) {
        this.SetMirror(cell.Row, cell.Col);
    }

    DrawGrid() {
        super.DrawGrid();

        this.DrawLasers();
        this.DrawLaserLabels();
        this.DrawMirrors();
    }

    SetCellBorderLineStyle(cell) {
        super.SetCellBorderLineStyle(cell);
        this.CanvasContext.setLineDash(this.CellGroups.get(cell.Value) ? [] : [20, 5]); //solid if valid, dashed if not
    }

    //#endregion

    LoadCellGroups() {
        for (const cell of this.CellList) {
            if (!this.CellGroups.has(cell.Value))
                this.CellGroups.set(cell.Value, false);
        }
    }

    //#region Lasers

    DrawLasers() {
        let validLasers = 0;

        for (const laser of this.Lasers) {
            //only need to draw the second one if the first doesn't get to the other endpoint
            if (!this.DrawLaser(laser.Endpoint1, laser.Endpoint2, laser.Mirrors))
                this.DrawLaser(laser.Endpoint2, laser.Endpoint1, laser.Mirrors);
            else
                validLasers++;
        }

        this.SetProgress(LaserMirrorGrid.LaserProgress, validLasers);
    }

    /**
    @param start {LaserEndpoint}
    @param end {LaserEndpoint}
    @param reqMirrors {number}
    */
    DrawLaser(start, end, reqMirrors) {
        const segments = [];

        let segmentStart = start;
        /** @type {LaserEndpoint} */
        let segmentEnd;
        //always at least one segment
        do {
            //segments after the first need to pass ignoreMirror = true because they are starting from a mirror
            segmentEnd = this.GetLaserSegmentEndpoint(segmentStart, segmentStart !== start);
            segments.push(new LaserSegment(segmentStart, segmentEnd));
            segmentStart = segmentEnd;
        }
        while (segmentEnd.Row >= 0 && segmentEnd.Row < this.RowCount && segmentEnd.Col >= 0 && segmentEnd.Col < this.ColCount);

        //each mirror generates a new segment, so there must be reqMirrors + 1 segments (counting the original segment)
        const valid = segmentEnd.Row === end.Row && segmentEnd.Col === end.Col && segments.length === reqMirrors + 1;

        for (const segment of segments)
            this.DrawLaserSegment(segment.Endpoint1.Row, segment.Endpoint1.Col, segment.Endpoint2.Row, segment.Endpoint2.Col, valid);

        return valid;
    }

    /** @param startPoint {LaserEndpoint} */
    GetLaserSegmentEndpoint(startPoint, ignoreMirror = false) {
        let row = startPoint.Row;
        let col = startPoint.Col;
        let direction = startPoint.Position;

        const mirror = this.Mirrors.find(x => x.Row === startPoint.Row && x.Col === startPoint.Col);

        //hitting a mirror keeps the row/col but changes direction
        if (!ignoreMirror && mirror) {
            direction = this.GetDirectionAfterMirror(direction, mirror.Direction);
            return new LaserEndpoint(row, col, direction);
        }
        else {
            switch (direction) {
                case CellBorders.Left:
                    col++;
                    break;
                case CellBorders.Right:
                    col--;
                    break;
                case CellBorders.Top:
                    row++;
                    break;
                case CellBorders.Bottom:
                    row--;
                    break;
                default:
                    throw "Invalid direction";
            }
        }

        //outside of the grid
        if (row < 0 || row >= this.RowCount || col < 0 || col >= this.ColCount)
            return new LaserEndpoint(row, col, direction);

        //continue segment
        return this.GetLaserSegmentEndpoint(new LaserEndpoint(row, col, direction));
    }

    GetDirectionAfterMirror(startDirection, mirrorDirection) {
        switch (startDirection) {
            case CellBorders.Left:
                return mirrorDirection === Mirror.TopLeftDownRight ? CellBorders.Top : CellBorders.Bottom;
            case CellBorders.Right:
                return mirrorDirection === Mirror.TopLeftDownRight ? CellBorders.Bottom : CellBorders.Top;
            case CellBorders.Top:
                return mirrorDirection === Mirror.TopLeftDownRight ? CellBorders.Left : CellBorders.Right;
            case CellBorders.Bottom:
                return mirrorDirection === Mirror.TopLeftDownRight ? CellBorders.Right : CellBorders.Left;
            default:
                throw "Invalid direction";
        }
    }

    DrawLaserSegment(row1, col1, row2, col2, valid = false) {
        this.SetLaserLineStyle(valid);

        //draw lasers from the center of the cell
        const midPos = this.CellSize / 2;
        this.DrawGridLine(row1, col1, row2, col2, midPos);
    }

    SetLaserLineStyle(valid = false) {
        this.CanvasContext.setLineDash([]);
        this.CanvasContext.strokeStyle = valid ? '#0F0' : '#F00'; //green / red
        this.CanvasContext.lineWidth = 3; //3px thick
    }

    //#endregion

    //#region Labels

    DrawLaserLabels() {
        this.SetTextStyle();

        for (const laser of this.Lasers) {
            const labelText = laser.Name + laser.Mirrors;

            this.DrawLaserLabel(labelText, laser.Endpoint1);
            this.DrawLaserLabel(labelText, laser.Endpoint2);
        }
    }

    /**
    @param labelText {string}
    @param laserEndpoint {LaserEndpoint}
     */
    DrawLaserLabel(labelText, laserEndpoint) {
        this.DrawCellText(labelText, laserEndpoint.Row, laserEndpoint.Col, 8, -12);
    }

    //#endregion

    //#region Mirrors

    SetMirror(row, col) {
        const idx = this.Mirrors.findIndex(x => x.Row === row && x.Col === col);

        if (idx >= 0) {
            const mirror = this.Mirrors[idx];

            //remove
            if (mirror.Direction === Mirror.TopRightDownLeft)
                this.Mirrors.splice(idx, 1);
            else
                mirror.Direction = Mirror.TopRightDownLeft;
        }
        else {
            const cell = this.CellGrid[row][col];
            const mirror = new Mirror(row, col, cell.Value, Mirror.TopLeftDownRight);
            this.Mirrors.push(mirror);
        }

        this.UpdateMirrorValidity();
    }

    UpdateMirrorValidity() {
        const mirrorsByCellGroup = new Map();

        for (const mirror of this.Mirrors) {
            if (!mirrorsByCellGroup.has(mirror.CellGroup))
                mirrorsByCellGroup.set(mirror.CellGroup, [mirror]);
            else
                mirrorsByCellGroup.get(mirror.CellGroup).push(mirror);
        }

        let validGroups = 0;

        for (const cellGroup of this.CellGroups.keys()) {
            let valid = false;
            if (mirrorsByCellGroup.has(cellGroup)) {
                const mirrors = mirrorsByCellGroup.get(cellGroup);
                valid = mirrors.length === 1;
                for (const mirror of mirrors)
                    mirror.Valid = valid;
            }
            this.CellGroups.set(cellGroup, valid);
            if (valid)
                validGroups++;
        }

        this.SetProgress(LaserMirrorGrid.MirrorProgress, validGroups);
    }

    DrawMirrors() {
        for (const mirror of this.Mirrors) {
            this.DrawMirror(mirror);
        }
    }

    /** @param mirror {Mirror} */
    DrawMirror(mirror) {
        this.SetMirrorLineStyle(mirror.Valid);

        if (mirror.Direction === Mirror.TopLeftDownRight)
            this.DrawGridLine(mirror.Row, mirror.Col, mirror.Row + 1, mirror.Col + 1);
        else
            this.DrawGridLine(mirror.Row, mirror.Col + 1, mirror.Row + 1, mirror.Col);
    }

    SetMirrorLineStyle(valid = true) {
        this.CanvasContext.setLineDash([]);
        this.CanvasContext.strokeStyle = valid ? '#00F' : '#F0F'; //blue / purple
        this.CanvasContext.lineWidth = 3; //3px thick
    }

    //#endregion
}

class LaserSegment {
    /** @type {LaserEndpoint} */
    Endpoint1;
    /** @type {LaserEndpoint} */
    Endpoint2;

    constructor(endpoint1, endpoint2) {
        this.Endpoint1 = endpoint1;
        this.Endpoint2 = endpoint2;
    }
}

class Laser extends LaserSegment {
    Name = "";
    Mirrors = 0;

    constructor(name, mirrors, endpoint1, endpoint2) {
        super(endpoint1, endpoint2);
        this.Name = name;
        this.Mirrors = mirrors;
    }
}

class LaserEndpoint {
    Row = -1;
    Col = -1;
    Position; //CellBorders enum value

    constructor(row, col, position) {
        this.Row = row;
        this.Col = col;
        this.Position = position;
    }
}

class Mirror {
    static TopLeftDownRight = false;
    static TopRightDownLeft = true;

    Row = -1;
    Col = -1;
    Direction = Mirror.TopLeftDownRight;
    CellGroup = -1;
    Valid = true;

    constructor(row, col, cellGroup, direction = Mirror.TopLeftDownRight) {
        this.Row = row;
        this.Col = col;
        this.CellGroup = cellGroup;
        this.Direction = direction;
    }
}