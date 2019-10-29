QUnit.module("editor.caret.TableCellsTest", function () {
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

    const findClosestPositionInAboveCell = (path, offset) => {
        let table = DOMUtils.getDescendant(DOMUtils.fromDom(getRoot()), "table").getOrDie("Could not find table").dom(),
            container = follow(getRoot(), path),
            pos = new CaretPosition(container, offset);

        return TableCells.findClosestPositionInAboveCell(table, pos);
    };

    const findClosestPositionInBelowCell = (path, offset) => {
        let table = DOMUtils.getDescendant(DOMUtils.fromDom(getRoot()), "table").getOrDie("Could not find table").dom(),
            container = follow(getRoot(), path),
            pos = new CaretPosition(container, offset);

        return TableCells.findClosestPositionInBelowCell(table, pos);
    };

    const getClosestCellAbove = (x, y) => {
        let table = DOMUtils.getDescendant(DOMUtils.fromDom(getRoot()), "table").getOrDie("Could not find table").dom(),
            rect = table.getBoundingClientRect();

        return TableCells.getClosestCellAbove(table, rect.left + x, rect.top + y);
    };

    const getClosestCellBelow = (x, y) => {
        let table = DOMUtils.getDescendant(DOMUtils.fromDom(getRoot()), "table").getOrDie("Could not find table").dom(),
            rect = table.getBoundingClientRect();

        return TableCells.getClosestCellBelow(table, rect.left + x, rect.top + y);
    };

    const assertCaretPosition = (assert, path, offset, posOption) => {
        let container = follow(getRoot(), path), pos = posOption.getOrDie("Needs to return a caret");
        assert.equal(container, pos.container);
        assert.equal(offset, pos.offset);
    };

    const assertCell = (assert, path, cellOption) => {
        let cell = cellOption.getOrDie('x'),
            expectedContainer = follow(getRoot(), path);
        assert.equal(cell, expectedContainer);
    };

    const assertNone = (assert, pos) => {
        assert.equal(pos.isNone(), true);
    };

    QUnit.test("getClosestCellAbove", function (assert) {
        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        let cellOption = getClosestCellAbove(30, 30);
        assertCell(assert, [0, 0, 0, 1], cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        cellOption = getClosestCellAbove(15, 30);
        assertCell(assert, [0, 0, 0, 0], cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        cellOption = getClosestCellAbove(15, 15);
        assertNone(assert, cellOption);
    });

    QUnit.test("getClosestCellBelow", function (assert) {
        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        let cellOption = getClosestCellBelow(30, 15);
        assertCell(assert, [0, 0, 1, 1], cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        cellOption = getClosestCellBelow(15, 15);
        assertCell(assert, [0, 0, 1, 0], cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        cellOption = getClosestCellBelow(30, 30);
        assertNone(assert, cellOption);
    });

    QUnit.test("findClosestPositionInAboveCell", function (assert) {
        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));
        
        let cellOption = findClosestPositionInAboveCell([0, 0, 1, 1], 0);
        assertCaretPosition(assert, [0, 0, 0, 1, 0], 0, cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));
        
        cellOption = findClosestPositionInAboveCell([0, 0, 1, 1], 1);
        assertCaretPosition(assert, [0, 0, 0, 1, 0], 1, cellOption);
    });

    QUnit.test("findClosestPositionInBelowCell", function (assert) {
        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        let cellOption = findClosestPositionInBelowCell([0, 0, 0, 1], 0);
        assertCaretPosition(assert, [0, 0, 1, 1, 0], 0, cellOption);

        setupHtml([
            '<table style="border-collapse: collapse" border="1">',
            '<tbody>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">a</td>',
            '<td style="width: 20px; height: 20px;">b</td>',
            '</tr>',
            '<tr>',
            '<td style="width: 20px; height: 20px;">c</td>',
            '<td style="width: 20px; height: 20px;">d</td>',
            '</tr>',
            '</tbody>',
            '</table>',
        ].join(''));

        cellOption = findClosestPositionInBelowCell([0, 0, 0, 1], 1);
        assertCaretPosition(assert, [0, 0, 1, 1, 0], 1, cellOption);
    });
});