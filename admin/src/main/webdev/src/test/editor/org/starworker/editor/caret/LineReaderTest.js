QUnit.module("editor.caret.LineReaderTest", function () {
    const browser = PlatformDetection.detect().browser;
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const follow = (ancestor, descendantPath) => {
        if (descendantPath.length === 0) {
            return ancestor;
        }
        else {
            let child = ancestor;
            for (let i = 0; i < descendantPath.length; i++) {
                child = child.childNodes[descendantPath[i]];
            }
            return child;
        }
    };

    const findClosestHorizontalPosition = (positions, path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.findClosestHorizontalPosition(positions, pos);
    };

    const getPositionsUntilPreviousLine = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.getPositionsUntilPreviousLine(getRoot(), pos);
    };

    const getPositionsUntilNextLine = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.getPositionsUntilNextLine(getRoot(), pos);
    };

    const getAbovePositions = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.getPositionsAbove(getRoot(), pos);
    };

    const getBelowPositions = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.getPositionsBelow(getRoot(), pos);
    };

    const isAtFirstLine = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.isAtFirstLine(getRoot(), pos);
    };

    const isAtLastLine = (path, offset) => {
        let container = follow(getRoot(), path), pos = new CaretPosition(container, offset);
        return LineReader.isAtLastLine(getRoot(), pos);
    };

    const assertLineInfoCaretPositions = (assert, lineInfo, expectedPositions) => {
        let actualPositions = lineInfo.positions;

        assert.equal(actualPositions.length, expectedPositions.length);
        Tools.each(expectedPositions, function (p, i) {
            let container = follow(getRoot(), p.path);
            assert.equal(actualPositions[i].container, container);
            assert.equal(actualPositions[i].offset, p.offset);
        });
    };

    const assertCaretPosition = (assert, posOption, path, offset) => {
        let container = follow(getRoot(), path), pos = posOption.getOrDie("Needs to return a caret");
        assert.equal(pos.container, container);
        assert.equal(pos.offset, offset);
    };

    const assertCaretPositions = (assert, actualPositions, expectedPositions) => {
        assert.equal(actualPositions.length, expectedPositions.length);
        Tools.each(expectedPositions, (p, i) => {
            let container = follow(getRoot(), p.path);
            assert.equal(actualPositions[i].container, container);
            assert.equal(actualPositions[i].offset, p.offset);
        });
    };

    const assertBreakType = (assert, lineInfo, expectedBreakType) => {
        let actualBreakType = lineInfo.breakType;
        assert.equal(actualBreakType, expectedBreakType);
    };

    const assertBreakPositionNone = (assert, lineInfo) => {
        assert.equal(lineInfo.breakAt.isNone(), true);
    };

    const assertBreakPosition = (assert, lineInfo, path, offset) => {
        let container = follow(getRoot(), path), breakPos = lineInfo.breakAt.getOrDie();
        assert.equal(container, breakPos.container);
        assert.equal(offset, breakPos.offset);
    };

    const assertNone = (assert, posOption) => {
        assert.equal(posOption.isNone(), true);
    };

    QUnit.test("getPositionsUntilPreviousLine", function (assert) {
        setupHtml('<p>a</p>');
        let lineInfo = getPositionsUntilPreviousLine([0, 0], 0);
        assertLineInfoCaretPositions(assert, lineInfo, []);
        assertBreakType(assert, lineInfo, BreakType.Eol);
        assertBreakPositionNone(assert, lineInfo);

        setupHtml('<p>ab</p>');
        lineInfo = getPositionsUntilPreviousLine([0, 0], 2);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 0], offset: 0 },
            { path: [0, 0], offset: 1 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Eol);
        assertBreakPositionNone(assert, lineInfo);

        setupHtml('<p>a<br>b</p>');
        lineInfo = getPositionsUntilPreviousLine([0, 2], 1);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 2], offset: 0 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Br);
        assertBreakPosition(assert, lineInfo, [0], 1);

        setupHtml('<p>a<br>bc</p>');
        lineInfo = getPositionsUntilPreviousLine([0, 2], 1);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 2], offset: 0 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Br);
        assertBreakPosition(assert, lineInfo, [0], 1);


        setupHtml('<p>a</p><p>b</p>');
        lineInfo = getPositionsUntilPreviousLine([1, 0], 1);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [1, 0], offset: 0 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Block);
        assertBreakPosition(assert, lineInfo, [0, 0], 1);

        setupHtml('<div style="width: 10px">abc def ghi</div>');
        lineInfo = getPositionsUntilPreviousLine([0, 0], 6);

        if (browser.isSafari()) {
            assertLineInfoCaretPositionsassert, lineInfo, ([
                { path: [0, 0], offset: 4 },
                { path: [0, 0], offset: 5 }
            ]);
            assertBreakType(assert, lineInfo, BreakType.Wrap);
            assertBreakPosition(assert, lineInfo, [0, 0], 3);
        }
        else {
            assertLineInfoCaretPositions(assert, lineInfo, [
                { path: [0, 0], offset: 5 }
            ]);
            assertBreakType(assert, lineInfo, BreakType.Wrap);
            assertBreakPosition(assert, lineInfo, [0, 0], 4);
        }

        setupHtml('<div style="width: 10px">abc def ghi</div>');
        lineInfo = getPositionsUntilPreviousLine([0, 0], 5);

        if (browser.isSafari()) {
            assertLineInfoCaretPositions(assert, lineInfo, [
                { path: [0, 0], offset: 4 }
            ]);
            assertBreakType(assert, lineInfo, BreakType.Wrap);
            assertBreakPosition(assert, lineInfo, [0, 0], 3);
        }
        else {
            assertLineInfoCaretPositions(assert, lineInfo, []);
            assertBreakType(assert, lineInfo, BreakType.Wrap);
            assertBreakPosition(assert, lineInfo, [0, 0], 4);
        }
    });

    QUnit.test("getPositionsUntilNextLine", function (assert) {
        setupHtml('<p>a</p>');
        let lineInfo = getPositionsUntilNextLine([0, 0], 1);
        assertLineInfoCaretPositions(assert, lineInfo, []);
        assertBreakType(assert, lineInfo, BreakType.Eol);
        assertBreakPositionNone(assert, lineInfo);

        setupHtml('<p>ab</p>');
        lineInfo = getPositionsUntilNextLine([0, 0], 0);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 0], offset: 1 },
            { path: [0, 0], offset: 2 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Eol);
        assertBreakPositionNone(assert, lineInfo);

        setupHtml('<p>a<br>b</p>');
        lineInfo = getPositionsUntilNextLine([0, 0], 0);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 0], offset: 1 },
            { path: [0], offset: 1 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Br);
        assertBreakPosition(assert, lineInfo, [0], 1);

        setupHtml('<p><input><br>b</p>');
        lineInfo = getPositionsUntilNextLine([0], 0);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0], offset: 1 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Br);
        assertBreakPosition(assert, lineInfo, [0], 1);

        setupHtml('<p>a</p><p>b</p>');
        lineInfo = getPositionsUntilNextLine([0, 0], 0);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 0], offset: 1 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Block);
        assertBreakPosition(assert, lineInfo, [1, 0], 0);

        setupHtml('<div style="width: 10px">abc def ghi</div>');
        lineInfo = getPositionsUntilNextLine([0, 0], 6);
        assertLineInfoCaretPositions(assert, lineInfo, [
            { path: [0, 0], offset: 7 }
        ]);
        assertBreakType(assert, lineInfo, BreakType.Wrap);
        assertBreakPosition(assert, lineInfo, [0, 0], 8);

        setupHtml('<div style="width: 10px">abc def ghi</div>');
        lineInfo = getPositionsUntilNextLine([0, 0], 7);
        assertLineInfoCaretPositions(assert, lineInfo, []);
        assertBreakType(assert, lineInfo, BreakType.Wrap);
        assertBreakPosition(assert, lineInfo, [0, 0], 8);
    });

    QUnit.test("isAtFirstLine", function (assert) {
        setupHtml('<p>a</p>');
        assert.equal(true, isAtFirstLine([0, 0], 0));

        setupHtml('<p>a</p>');
        assert.equal(true, isAtFirstLine([0, 0], 1));

        setupHtml('<p>a<br>b</p>');
        assert.equal(false, isAtFirstLine([0, 2], 0));

        setupHtml('<p>a<br>b</p>');
        assert.equal(false, isAtFirstLine([0, 2], 1));

        setupHtml('<p>a</p><p>b</p>');
        assert.equal(false, isAtFirstLine([1, 0], 0));

        setupHtml('<div style="width: 10px">abc def ghi</div>');
        assert.equal(false, isAtFirstLine([0, 0], 4));

        setupHtml('<table><tbody><tr><td><p>a</p></td></tr></tbody></table>');
        assert.equal(true, isAtFirstLine([0, 0, 0, 0, 0, 0], 0));

        setupHtml('<table><tbody><tr><td><p>a</p><p>b</p></td></tr></tbody></table>');
        assert.equal(false, isAtFirstLine([0, 0, 0, 0, 1, 0], 0));
    });

    QUnit.test("isAtLastLine", function (assert) {
        setupHtml('<p>a</p>');
        assert.equal(true, isAtLastLine([0, 0], 0));
        
        setupHtml('<p>a</p>');
        assert.equal(true, isAtLastLine([0, 0], 1));
        
        setupHtml('<p>a<br>b</p>');
        assert.equal(false, isAtLastLine([0, 0], 0));
        
        setupHtml('<p>a<br>b</p>');
        assert.equal(false, isAtLastLine([0, 0], 1));
        
        setupHtml('<p>a</p><p>b</p>');
        assert.equal(false, isAtLastLine([0, 0], 0));
        
        setupHtml('<div style="width: 10px">abc def ghi</div>');
        assert.equal(false, isAtLastLine([0, 0], 6));
        
        setupHtml('<table><tbody><tr><td><p>a</p><p>b</p></td></tr></tbody></table>');
        assert.equal(false, isAtLastLine([0, 0, 0, 0, 0, 0], 0));
        
        setupHtml('<table><tbody><tr><td><p>a</p><p>b</p></td></tr></tbody></table>');
        assert.equal(true, isAtLastLine([0, 0, 0, 0, 1, 0], 0));        
    });

    QUnit.test("getAbovePositions", function (assert) {
        setupHtml('<p>a</p>');
        let posOptions = getAbovePositions([0, 0], 1);
        assertCaretPositions(assert, posOptions, []);

        setupHtml('<p>ab</p><p>a</p>');
        posOptions = getAbovePositions([1, 0], 0);
        assertCaretPositions(assert, posOptions, [
            { path: [0, 0], offset: 0 },
            { path: [0, 0], offset: 1 },
            { path: [0, 0], offset: 2 }
        ]);

        setupHtml('<p>a<input>b</p><p>a</p>');
        posOptions = getAbovePositions([1, 0], 0);
        assertCaretPositions(assert, posOptions, [
            { path: [0, 0], offset: 0 },
            { path: [0, 0], offset: 1 },
            { path: [0], offset: 1 },
            { path: [0], offset: 2 },
            { path: [0, 2], offset: 0 },
            { path: [0, 2], offset: 1 }
        ]);
    });

    QUnit.test("getBelowPositions", function (assert) {
        setupHtml('<p>a</p>');
        let posOptions = getBelowPositions([0, 0], 0);
        assertCaretPositions(assert, posOptions, []);

        setupHtml('<p>a</p><p>ab</p>');
        posOptions = getBelowPositions([0, 0], 0);
        assertCaretPositions(assert, posOptions, [
            { path: [1, 0], offset: 0 },
            { path: [1, 0], offset: 1 },
            { path: [1, 0], offset: 2 }
        ]);

        setupHtml('<p>a</p><p>a<input>b</p>');
        posOptions = getBelowPositions([0, 0], 0);
        assertCaretPositions(assert, posOptions, [
            { path: [1, 0], offset: 0 },
            { path: [1, 0], offset: 1 },
            { path: [1], offset: 1 },
            { path: [1], offset: 2 },
            { path: [1, 2], offset: 0 },
            { path: [1, 2], offset: 1 }
        ]);
    });

    QUnit.test("findClosestHoriontalPosition (above)", function (assert) {
        setupHtml('<p>ab</p>');
        let positions = getAbovePositions([0, 0], 0),
            posOption = findClosestHorizontalPosition(positions, [0, 0], 0);
        assertNone(assert, posOption);

        setupHtml('<p>ab</p><p>cd</p>');
        positions = getAbovePositions([1, 0], 0);
        posOption = findClosestHorizontalPosition(positions, [1, 0], 0);
        assertCaretPosition(assert, posOption, [0, 0], 0);

        setupHtml('<p>ab</p><p>cd</p>');
        positions = getAbovePositions([1, 0], 0);
        posOption = findClosestHorizontalPosition(positions, [1, 0], 2);
        assertCaretPosition(assert, posOption, [0, 0], 2);

        setupHtml('<p><input></p><p><input></p>');
        positions = getAbovePositions([1], 0);
        posOption = findClosestHorizontalPosition(positions, [1], 0);
        assertCaretPosition(assert, posOption, [0], 0);

        setupHtml('<p><input></p><p><input></p>');
        positions = getAbovePositions([1], 0);
        posOption = findClosestHorizontalPosition(positions, [1], 1);
        assertCaretPosition(assert, posOption, [0], 1);

        setupHtml('<p>a<input>b</p><p>a<input>b</p>');
        positions = getAbovePositions([1, 2], 0);
        posOption = findClosestHorizontalPosition(positions, [1, 2], 0);
        assertCaretPosition(assert, posOption, [0, 2], 0);
    });

    QUnit.test("findClosestHoriontalPosition (below)", function (assert) {
        setupHtml('<p>ab</p>');
        let positions = getBelowPositions([0, 0], 0),
            posOption = findClosestHorizontalPosition(positions, ([0, 0], 0));
        assertNone(assert, posOption);
        
        setupHtml('<p>ab</p><p>cd</p>');
        positions = getBelowPositions([0, 0], 0);
        posOption = findClosestHorizontalPosition(positions, [0, 0], 0);
        assertCaretPosition(assert, posOption, [1, 0], 0);
        
        setupHtml('<p>ab</p><p>cd</p>');
        positions = getBelowPositions([0, 0], 0);
        posOption = findClosestHorizontalPosition(positions, [0, 0], 2);
        assertCaretPosition(assert, posOption, [1, 0], 2);
        
        setupHtml('<p><input></p><p><input></p>');
        positions = getBelowPositions([0], 0);
        posOption = findClosestHorizontalPosition(positions, [0], 0);
        assertCaretPosition(assert, posOption, [1], 0);
        
        setupHtml('<p><input></p><p><input></p>');
        positions = getBelowPositions([0], 0);
        posOption = findClosestHorizontalPosition(positions, [0], 1);
        assertCaretPosition(assert, posOption, [1], 1);
        
        setupHtml('<p>a<input>b</p><p>a<input>b</p>');
        positions = getBelowPositions([0, 0], 0);
        posOption = findClosestHorizontalPosition(positions, [0, 0], 0);
        assertCaretPosition(assert, posOption, [1, 0], 0);
        
        setupHtml('<p>a<input>b</p><p>a<input>b</p>');
        positions = getBelowPositions([0, 2], 0);
        posOption = findClosestHorizontalPosition(positions, [0, 2], 0);
        assertCaretPosition(assert, posOption, [1, 2], 0);
    });
});