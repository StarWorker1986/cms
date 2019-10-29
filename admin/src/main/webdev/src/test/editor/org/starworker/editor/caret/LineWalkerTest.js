QUnit.module("editor.caret.LineWalkerTest", function () {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    QUnit.test("positionsUntil", function (assert) {
        let result, predicateCallCount = 0;
        let predicate = () => {
            predicateCallCount++;
            return false;
        };

        setupHtml('<span contentEditable="false">a</span><span>b</span>');
        result = LineWalker.positionsUntil(1, getRoot(), predicate, getRoot().firstChild);
        assert.equal(result.length, 3);
        assert.equal(result[0].position.getNode(), getRoot().lastChild);
        assert.equal(result[1].position.getNode(), getRoot().lastChild.firstChild);
        assert.equal(result[2].position.getNode(), getRoot().lastChild.firstChild);
        assert.equal(predicateCallCount, 3);

        predicateCallCount = 0;
        setupHtml('<span>a</span><span contentEditable="false">b</span>');
        result = LineWalker.positionsUntil(-1, getRoot(), predicate, getRoot().lastChild);
        assert.equal(result.length, 3);
        assert.equal(result[0].position.getNode(), getRoot().lastChild);
        assert.equal(result[1].position.getNode(), getRoot().firstChild.firstChild);
        assert.equal(result[2].position.getNode(), getRoot().firstChild.firstChild);
        assert.equal(predicateCallCount, 3);
    });

    QUnit.test("upUntil", function (assert) {
        let caretPosition, result, predicateCallCount = 0;
        let predicate = () => {
            predicateCallCount++;
            return false;
        };

        setupHtml('<p>a</p><p>b</p><p>c</p>');
        caretPosition = new CaretPosition(getRoot().lastChild.lastChild, 1);
        result = LineWalker.upUntil(getRoot(), predicate, caretPosition);
        assert.equal(result.length, 3);
        assert.equal(result[0].line, 0);
        assert.equal(result[1].line, 1);
        assert.equal(result[2].line, 2);
        assert.equal(predicateCallCount, 3);
    });

    QUnit.test("downUntil", function (assert) {
        let caretPosition, result, predicateCallCount = 0;
        let predicate = () => {
            predicateCallCount++;
            return false;
        };

        setupHtml('<p>a</p><p>b</p><p>c</p>');
        caretPosition = new CaretPosition(getRoot().firstChild.firstChild, 0);
        result = LineWalker.downUntil(getRoot(), predicate, caretPosition);
        assert.equal(result.length, 3);
        assert.equal(result[0].line, 0);
        assert.equal(result[1].line, 1);
        assert.equal(result[2].line, 2);
        assert.equal(predicateCallCount, 3);
    });

    QUnit.test("isAboveLine", function (assert) {
        assert.equal(LineWalker.isAboveLine(5)({ line: 10 }), true);
        assert.equal(LineWalker.isAboveLine(5)({ line: 2 }), false);
    });

    QUnit.test("isLine", function (assert) {
        assert.equal(LineWalker.isLine(3)({ line: 3 }), true);
        assert.equal(LineWalker.isLine(3)({ line: 4 }), false);
    });
});