QUnit.module("editor.caret.CaretPositionTest", function () {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const createRange = (startContainer, startOffset, endContainer, endOffset) => {
        let rng = DOMUtils.DOM.createRng();
        rng.setStart(startContainer, startOffset);
        if (endContainer) {
            rng.setEnd(endContainer, endOffset);
        }
        return rng;
    };

    const assertCaretPosition = (assert, actual, expected, message) => {
        if (expected === null) {
            assert.strictEqual(actual, expected, message || "Expected null.");
            return;
        }
        if (actual === null) {
            assert.strictEqual(actual, expected, message || "Didn't expect null.");
            return;
        }
        let defaultMessage = "[\"" + expected.getNode().textContent + "\", " + expected.offset + "] match actual position [\"" + actual.getNode().textContent + "\", " + actual.offset + "]";
        assert.deepEqual(actual, expected, message || defaultMessage);
    };

    const assertRange = (assert, expected, actual) => {
        assert.strictEqual(expected.startContainer, actual.startContainer, "startContainers should be equal");
        assert.strictEqual(expected.startOffset, actual.startOffset, "startOffset should be equal");
        assert.strictEqual(expected.endContainer, actual.endContainer, "endContainer should be equal");
        assert.strictEqual(expected.endOffset, actual.endOffset, "endOffset should be equal");
    };

    QUnit.test("Constructor", function (assert) {
        setupHtml('abc');
        assert.equal(new CaretPosition(getRoot(), 0).container, getRoot());
        assert.strictEqual(new CaretPosition(getRoot(), 1).offset, 1);
        assert.equal(new CaretPosition(getRoot().firstChild, 0).container, getRoot().firstChild);
        assert.strictEqual(new CaretPosition(getRoot().firstChild, 1).offset, 1);
    });

    QUnit.test("fromRangeStart", function (assert) {
        setupHtml('abc');
        assertCaretPosition(assert, CaretPosition.fromRangeStart(createRange(getRoot(), 0)), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, CaretPosition.fromRangeStart(createRange(getRoot(), 1)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, CaretPosition.fromRangeStart(createRange(getRoot().firstChild, 1)), new CaretPosition(getRoot().firstChild, 1));
    });

    QUnit.test("fromRangeEnd", function (assert) {
        setupHtml('abc');
        assertCaretPosition(assert, CaretPosition.fromRangeEnd(createRange(getRoot(), 0, getRoot(), 1)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, CaretPosition.fromRangeEnd(createRange(getRoot().firstChild, 0, getRoot().firstChild, 1)), new CaretPosition(getRoot().firstChild, 1));
    });

    QUnit.test("after", function (assert) {
        setupHtml('abc<b>123</b>');
        assertCaretPosition(assert, CaretPosition.after(getRoot().firstChild), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, CaretPosition.after(getRoot().lastChild), new CaretPosition(getRoot(), 2));
    });

    QUnit.test("before", function (assert) {
        setupHtml('abc<b>123</b>');
        assertCaretPosition(assert, CaretPosition.before(getRoot().firstChild), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, CaretPosition.before(getRoot().lastChild), new CaretPosition(getRoot(), 1));
    });

    QUnit.test("isAtStart", function (assert) {
        setupHtml('abc<b>123</b>123');
        assert.equal(new CaretPosition(getRoot(), 0).isAtStart(), true);
        assert.equal(!new CaretPosition(getRoot(), 1).isAtStart(), true);
        assert.equal(!new CaretPosition(getRoot(), 3).isAtStart(), true);
        assert.equal(new CaretPosition(getRoot().firstChild, 0).isAtStart(), true);
        assert.equal(!new CaretPosition(getRoot().firstChild, 1).isAtStart(), true);
        assert.equal(!new CaretPosition(getRoot().firstChild, 3).isAtStart(), true);
    });

    QUnit.test("isAtEnd", function (assert) {
        setupHtml('abc<b>123</b>123');
        assert.equal(new CaretPosition(getRoot(), 3).isAtEnd(), true);
        assert.equal(!new CaretPosition(getRoot(), 2).isAtEnd(), true);
        assert.equal(!new CaretPosition(getRoot(), 0).isAtEnd(), true);
        assert.equal(new CaretPosition(getRoot().firstChild, 3).isAtEnd(), true);
        assert.equal(!new CaretPosition(getRoot().firstChild, 0).isAtEnd(), true);
        assert.equal(!new CaretPosition(getRoot().firstChild, 1).isAtEnd(), true);
    });

    QUnit.test("toRange", function (assert) {
        setupHtml('abc');
        assertRange(assert, new CaretPosition(getRoot(), 0).toRange(), createRange(getRoot(), 0));
        assertRange(assert, new CaretPosition(getRoot(), 1).toRange(), createRange(getRoot(), 1));
        assertRange(assert, new CaretPosition(getRoot().firstChild, 1).toRange(), createRange(getRoot().firstChild, 1));
    });

    QUnit.test("isEqual", function (assert) {
        setupHtml('abc');
        assert.equal(new CaretPosition(getRoot(), 0).isEqual(new CaretPosition(getRoot(), 0)), true);
        assert.equal(new CaretPosition(getRoot(), 1).isEqual(new CaretPosition(getRoot(), 0)), false);
        assert.equal(new CaretPosition(getRoot(), 0).isEqual(new CaretPosition(getRoot().firstChild, 0)), false);
    });

    QUnit.test('isVisible', function (assert) {
        setupHtml('<b>  abc</b>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 0).isVisible(), false);
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 3).isVisible(), true);
    });

    QUnit.test('getClientRects', function (assert) {
        setupHtml('<b>abc</b>' +
            '<div contentEditable="false">1</div>' +
            '<div contentEditable="false">2</div>' +
            '<div contentEditable="false">2</div>' +
            '<input style="margin: 10px">' +
            '<input style="margin: 10px">' +
            '<input style="margin: 10px">' +
            '<p>123</p>' +
            '<br>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 0).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 1).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 2).getClientRects().length, 2);
        assert.equal(new CaretPosition(getRoot(), 3).getClientRects().length, 2);
        assert.equal(new CaretPosition(getRoot(), 4).getClientRects().length, 2);
        assert.equal(new CaretPosition(getRoot(), 5).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 6).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 7).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 8).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot(), 9).getClientRects().length, 0);
    });

    QUnit.test('getClientRects between inline node and cE=false', function (assert) {
        setupHtml('<span contentEditable="false">def</span>' +
            '<b>ghi</b>');
        assert.equal(new CaretPosition(getRoot(), 1).getClientRects().length, 1);
    });

    QUnit.test('getClientRects at last visible character', function (assert) {
        setupHtml('<b>a  </b>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 1).getClientRects().length, 1);
    });

    QUnit.test('getClientRects at extending character', function (assert) {
        setupHtml('a');
        var textNode = getRoot().firstChild;
        textNode.appendData('\u0301b');
        assert.equal(new CaretPosition(getRoot().firstChild, 0).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot().firstChild, 1).getClientRects().length, 0);
        assert.equal(new CaretPosition(getRoot().firstChild, 2).getClientRects().length, 1);
    });

    QUnit.test('getClientRects at whitespace character', function (assert) {
        setupHtml('  a  ');
        assert.equal(new CaretPosition(getRoot().firstChild, 0).getClientRects().length, 0);
        assert.equal(new CaretPosition(getRoot().firstChild, 1).getClientRects().length, 0);
        assert.equal(new CaretPosition(getRoot().firstChild, 2).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot().firstChild, 3).getClientRects().length, 1);
        assert.equal(new CaretPosition(getRoot().firstChild, 4).getClientRects().length, 0);
        assert.equal(new CaretPosition(getRoot().firstChild, 5).getClientRects().length, 0);
    });

    QUnit.test('getClientRects at only one text node should return client rects', function (assert) {
        setupHtml('<p>a<br>b</p>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 0).getClientRects().length > 0, true);
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 1).getClientRects().length > 0, true);
        assert.equal(new CaretPosition(getRoot().firstChild.lastChild, 0).getClientRects().length > 0, true);
        assert.equal(new CaretPosition(getRoot().firstChild.lastChild, 1).getClientRects().length > 0, true);
    });

    QUnit.test('getNode', function (assert) {
        setupHtml('<b>abc</b><input><input>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 0).getNode(), getRoot().firstChild.firstChild);
        assert.equal(new CaretPosition(getRoot(), 1).getNode(), getRoot().childNodes[1]);
        assert.equal(new CaretPosition(getRoot(), 2).getNode(), getRoot().childNodes[2]);
        assert.equal(new CaretPosition(getRoot(), 3).getNode(), getRoot().childNodes[2]);
    });

    QUnit.test('getNode (before)', function (assert) {
        setupHtml('<b>abc</b><input><input>');
        assert.equal(new CaretPosition(getRoot().firstChild.firstChild, 0).getNode(true), getRoot().firstChild.firstChild);
        assert.equal(new CaretPosition(getRoot(), 1).getNode(true), getRoot().childNodes[0]);
        assert.equal(new CaretPosition(getRoot(), 2).getNode(true), getRoot().childNodes[1]);
        assert.equal(new CaretPosition(getRoot(), 3).getNode(true), getRoot().childNodes[2]);
    });

    QUnit.test('isAtStart/isAtEnd/isTextPosition', function (assert) {
        setupHtml('<b>abc</b><p><input></p>');
        assert.equal(CaretPosition.isAtStart(new CaretPosition(getRoot().firstChild.firstChild, 0)), true);
        assert.equal(CaretPosition.isAtStart(new CaretPosition(getRoot().firstChild.firstChild, 1)), false);
        assert.equal(CaretPosition.isAtStart(new CaretPosition(getRoot().firstChild.firstChild, 3)), false);
        assert.equal(CaretPosition.isAtStart(new CaretPosition(getRoot().lastChild, 0)), true);
        assert.equal(CaretPosition.isAtStart(new CaretPosition(getRoot().lastChild, 1)), false);
        assert.equal(CaretPosition.isAtEnd(new CaretPosition(getRoot().firstChild.firstChild, 3)), true);
        assert.equal(CaretPosition.isAtEnd(new CaretPosition(getRoot().firstChild.firstChild, 1)), false);
        assert.equal(CaretPosition.isAtEnd(new CaretPosition(getRoot().firstChild.firstChild, 0)), false);
        assert.equal(CaretPosition.isAtEnd(new CaretPosition(getRoot().lastChild, 1)), true);
        assert.equal(CaretPosition.isAtEnd(new CaretPosition(getRoot().lastChild, 0)), false);
        assert.equal(CaretPosition.isTextPosition(new CaretPosition(getRoot().firstChild.firstChild, 0)), true);
        assert.equal(CaretPosition.isTextPosition(new CaretPosition(getRoot().lastChild, 0)), false);
    });
});