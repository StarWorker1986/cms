QUnit.module("editor.caret.CaretContainerTest", () => {
    const setupHtml = (html) => {
        $("#view").html(html);
    }

    const getRoot = () => {
        return document.getElementById("view");
    }

    QUnit.test("isCaretContainer", (assert) => {
        assert.equal(CaretContainer.isCaretContainer(document.createTextNode('text')), false);
        assert.equal(CaretContainer.isCaretContainer($('<span></span>')[0]), false);
        assert.equal(CaretContainer.isCaretContainer($('<span data-editor-caret="1"></span>')[0]), true);
        assert.equal(CaretContainer.isCaretContainer($('<span data-editor-caret="1">x</span>')[0].firstChild), true);
        assert.equal(CaretContainer.isCaretContainer(document.createTextNode(Zwsp.ZWSP)), true);
    });

    QUnit.test("isCaretContainerBlock", (assert) => {
        assert.equal(CaretContainer.isCaretContainerBlock(document.createTextNode('text')), false);
        assert.equal(CaretContainer.isCaretContainerBlock($('<span></span>')[0]), false);
        assert.equal(CaretContainer.isCaretContainerBlock($('<span data-editor-caret="1"></span>')[0]), true);
        assert.equal(CaretContainer.isCaretContainerBlock($('<span data-editor-caret="1">a</span>')[0].firstChild), true);
        assert.equal(CaretContainer.isCaretContainerBlock(document.createTextNode(Zwsp.ZWSP)), false);
    });

    QUnit.test("isCaretContainerInline", (assert) => {
        assert.equal(CaretContainer.isCaretContainerInline(document.createTextNode('text')), false);
        assert.equal(CaretContainer.isCaretContainerInline($('<span></span>')[0]), false);
        assert.equal(CaretContainer.isCaretContainerInline($('<span data-editor-caret="1"></span>')[0]), false);
        assert.equal(CaretContainer.isCaretContainerInline($('<span data-editor-caret="1">a</span>')[0].firstChild), false);
        assert.equal(CaretContainer.isCaretContainerInline(document.createTextNode(Zwsp.ZWSP)), true);
    });

    QUnit.test("insertInline before element", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertInline(getRoot().firstChild, true), getRoot().firstChild);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().firstChild), true);
    });

    QUnit.test("insertInline after element", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertInline(getRoot().firstChild, false), getRoot().lastChild);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().lastChild), true);
    });

    QUnit.test("insertInline between elements", (assert) => {
        setupHtml('<span contentEditable="false">1</span><span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertBlock('p', getRoot().lastChild, true), getRoot().childNodes[1]);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().childNodes[1]), true);
    });

    QUnit.test("insertInline before element with ZWSP", (assert) => {
        setupHtml('abc' + Zwsp.ZWSP + '<span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertInline(getRoot().lastChild, true), getRoot().childNodes[1]);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().firstChild), false);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().childNodes[1]), true);
    });

    QUnit.test("insertInline after element with ZWSP", (assert) => {
        setupHtml('<span contentEditable="false">1</span>' + Zwsp.ZWSP + 'abc');
        assert.equal(CaretContainer.insertInline(getRoot().firstChild, false), getRoot().childNodes[1]);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().lastChild), false);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().childNodes[1]), true);
    });

    QUnit.test("insertBlock before element", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertBlock('p', getRoot().firstChild, true), getRoot().firstChild);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().firstChild), true);
    });

    QUnit.test("insertBlock after element", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertBlock('p', getRoot().firstChild, false), getRoot().lastChild);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().lastChild), true);
    });

    QUnit.test("insertBlock between elements", (assert) => {
        setupHtml('<span contentEditable="false">1</span><span contentEditable="false">1</span>');
        assert.equal(CaretContainer.insertInline(getRoot().lastChild, true), getRoot().childNodes[1]);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().childNodes[1]), true);
    });

    QUnit.test("startsWithCaretContainer", (assert) => {
        setupHtml(Zwsp.ZWSP + 'abc');
        assert.equal(CaretContainer.startsWithCaretContainer(getRoot().firstChild), true);
    });

    QUnit.test("endsWithCaretContainer", (assert) => {
        setupHtml('abc' + Zwsp.ZWSP);
        assert.equal(CaretContainer.endsWithCaretContainer(getRoot().firstChild), true);
    });

    QUnit.test("hasContent", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');

        let caretContainerBlock = CaretContainer.insertBlock('p', getRoot().firstChild, true);
        assert.equal(CaretContainer.hasContent(caretContainerBlock), false);
        caretContainerBlock.insertBefore(document.createTextNode('a'), caretContainerBlock.firstChild);
        assert.equal(CaretContainer.hasContent(caretContainerBlock), true);
    });

    QUnit.test("showCaretContainerBlock", (assert) => {
        setupHtml('<span contentEditable="false">1</span>');

        let caretContainerBlock = CaretContainer.insertBlock('p', getRoot().firstChild, true);
        caretContainerBlock.insertBefore(document.createTextNode('a'), caretContainerBlock.firstChild);
        CaretContainer.showCaretContainerBlock(caretContainerBlock);
        assert.equal(caretContainerBlock.outerHTML, '<p>a</p>');
    });

    QUnit.test("prependInline", (assert) => {
        setupHtml('a');

        let caretContainerTextNode = CaretContainer.prependInline(getRoot().firstChild);
        assert.equal(caretContainerTextNode.data, Zwsp.ZWSP + 'a');
    });

    QUnit.test("prependInline 2", (assert) => {
        setupHtml('<b>a</b>');
        assert.equal(CaretContainer.prependInline(getRoot().firstChild), null);
        assert.equal(CaretContainer.prependInline(null), null);
    });

    QUnit.test("appendInline", (assert) => {
        setupHtml('a');

        let caretContainerTextNode = CaretContainer.appendInline(getRoot().firstChild);
        assert.equal(caretContainerTextNode.data, 'a' + Zwsp.ZWSP);
    });

    /**
    QUnit.test("isBeforeInline", (assert) => {
        setupHtml(Zwsp.ZWSP + 'a');
        assert.equal(CaretContainer.isBeforeInline(CaretPosition(getRoot().firstChild, 0)), true);
        assert.equal(CaretContainer.isBeforeInline(CaretPosition(getRoot().firstChild, 1)), false);
    });

    QUnit.test("isBeforeInline 2", (assert) => {
        setupHtml('a');
        getRoot().insertBefore(document.createTextNode(Zwsp.ZWSP), getRoot().firstChild);
        assert.equal(CaretContainer.isBeforeInline(CaretPosition(getRoot().firstChild, 0)), true);
        assert.equal(CaretContainer.isBeforeInline(CaretPosition(getRoot().firstChild, 1)), false);
    });

    QUnit.test("isAfterInline", (assert) => {
        setupHtml(Zwsp.ZWSP + 'a');
        assert.equal(CaretContainer.isAfterInline(CaretPosition(getRoot().firstChild, 1)), true);
        assert.equal(CaretContainer.isAfterInline(CaretPosition(getRoot().firstChild, 0)), false);
    });

    QUnit.test("isAfterInline 2", (assert) => {
        setupHtml('a');
        getRoot().insertBefore(document.createTextNode(Zwsp.ZWSP), getRoot().firstChild);
        assert.equal(CaretContainer.isAfterInline(CaretPosition(getRoot().firstChild, 1)), true);
        assert.equal(CaretContainer.isAfterInline(CaretPosition(getRoot().firstChild, 0)), false);
    });
    */
});