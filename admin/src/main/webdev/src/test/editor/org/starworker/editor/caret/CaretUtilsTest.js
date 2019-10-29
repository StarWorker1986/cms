QUnit.module("editor.caret.CaretUtilsTest", function () {
    const ZWSP = Zwsp.ZWSP;
    
    const setupHtml = (html) => {
        html = html.replace(new RegExp(ZWSP, 'g'), "__ZWSP__")
        $("#view").html(html);
        replaceWithZwsp(getRoot());
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const replaceWithZwsp = (node) => {
        for (let i = 0; i < node.childNodes.length; i++) {
            let childNode = node.childNodes[i];
            if (childNode.nodeType === 3) {
                childNode.nodeValue = childNode.nodeValue.replace(/__ZWSP__/, ZWSP);
            }
            else {
                replaceWithZwsp(childNode);
            }
        }
    };

    const findElm = (selector) => {
        return $(selector, getRoot())[0];
    };

    const createRange = (startContainer, startOffset, endContainer, endOffset) => {
        let rng = DOMUtils.DOM.createRng();
        rng.setStart(startContainer, startOffset);
        if (endContainer) {
            rng.setEnd(endContainer, endOffset);
        }
        return rng;
    };

    const assertRange = (assert, expected, actual) => {
        assert.strictEqual(expected.startContainer, actual.startContainer, "startContainers should be equal");
        assert.strictEqual(expected.startOffset, actual.startOffset, "startOffset should be equal");
        assert.strictEqual(expected.endContainer, actual.endContainer, "endContainer should be equal");
        assert.strictEqual(expected.endOffset, actual.endOffset, "endOffset should be equal");
    };

    QUnit.test("isForwards", function (assert) {
        assert.equal(CaretUtils.isForwards(1), true);
        assert.equal(CaretUtils.isForwards(10), true);
        assert.equal(CaretUtils.isForwards(0), false);
        assert.equal(CaretUtils.isForwards(-1), false);
        assert.equal(CaretUtils.isForwards(-10), false);
    });

    QUnit.test("isBackwards", function (assert) {
        assert.equal(CaretUtils.isBackwards(1), false);
        assert.equal(CaretUtils.isBackwards(10), false);
        assert.equal(CaretUtils.isBackwards(0), false);
        assert.equal(CaretUtils.isBackwards(-1), true);
        assert.equal(CaretUtils.isBackwards(-10), true);
    });

    QUnit.test("findNode", function (assert) {
        setupHtml('<b>abc</b><b><i>123</i></b>def');
        let isBold = node => node.nodeName === 'B',
            isText = node => node.nodeType === 3;

        assert.equal(CaretUtils.findNode(getRoot(), 1, isBold, getRoot()), getRoot().firstChild);
        assert.equal(CaretUtils.findNode(getRoot(), 1, isText, getRoot()), getRoot().firstChild.firstChild);
        assert.equal(CaretUtils.findNode(getRoot().childNodes[1], 1, isBold, getRoot().childNodes[1]) === null, true);
        assert.equal(CaretUtils.findNode(getRoot().childNodes[1], 1, isText, getRoot().childNodes[1]).nodeName, '#text');
        assert.equal(CaretUtils.findNode(getRoot(), -1, isBold, getRoot()), getRoot().childNodes[1]);
        assert.equal(CaretUtils.findNode(getRoot(), -1, isText, getRoot()), getRoot().lastChild);
    });

    QUnit.test("getEditingHost", function (assert) {
        setupHtml('<span contentEditable="true"><span contentEditable="false"></span></span>');
        assert.equal(CaretUtils.getEditingHost(getRoot(), getRoot()), getRoot());
        assert.equal(CaretUtils.getEditingHost(getRoot().firstChild, getRoot()), getRoot());
        assert.equal(CaretUtils.getEditingHost(getRoot().firstChild.firstChild, getRoot()), getRoot().firstChild);
    });

    QUnit.test("getParentBlock", function (assert) {
        setupHtml('<p>abc</p><div><p><table><tr><td>X</td></tr></p></div>');
        assert.equal(CaretUtils.getParentBlock(findElm('p:first')), findElm('p:first'));
        assert.equal(CaretUtils.getParentBlock(findElm('td:first').firstChild), findElm('td:first'));
        assert.equal(CaretUtils.getParentBlock(findElm('td:first')), findElm('td:first'));
        assert.equal(CaretUtils.getParentBlock(findElm('table')), findElm('table'));
    });

    QUnit.test("isInSameBlock", function (assert) {
        setupHtml('<p>abc</p><p>def<b>ghj</b></p>');
        assert.strictEqual(CaretUtils.isInSameBlock(new CaretPosition(findElm('p:first').firstChild, 0), new CaretPosition(findElm('p:last').firstChild, 0)), false);
        assert.strictEqual(CaretUtils.isInSameBlock(new CaretPosition(findElm('p:first').firstChild, 0), new CaretPosition(findElm('p:first').firstChild, 0)), true);
        assert.strictEqual(CaretUtils.isInSameBlock(new CaretPosition(findElm('p:last').firstChild, 0), new CaretPosition(findElm('b').firstChild, 0)), true);
    });

    QUnit.test("isInSameEditingHost", function (assert) {
        setupHtml('<p>abc</p>' +
            'def' +
            '<span contentEditable="false">' +
            '<span contentEditable="true">ghi</span>' +
            '<span contentEditable="true">jkl</span>' +
            '</span>');
        assert.strictEqual(CaretUtils.isInSameEditingHost(new CaretPosition(findElm('p:first').firstChild, 0), new CaretPosition(findElm('p:first').firstChild, 1)), true);
        assert.strictEqual(CaretUtils.isInSameEditingHost(new CaretPosition(findElm('p:first').firstChild, 0), new CaretPosition(getRoot().childNodes[1], 1)), true);
        assert.strictEqual(CaretUtils.isInSameEditingHost(new CaretPosition(findElm('span span:first').firstChild, 0), new CaretPosition(findElm('span span:first').firstChild, 1)), true);
        assert.strictEqual(CaretUtils.isInSameEditingHost(new CaretPosition(findElm('p:first').firstChild, 0), new CaretPosition(findElm('span span:first').firstChild, 1)), false);
        assert.strictEqual(CaretUtils.isInSameEditingHost(new CaretPosition(findElm('span span:first').firstChild, 0), new CaretPosition(findElm('span span:last').firstChild, 1)), false);
    });

    QUnit.test("isBeforeContentEditableFalse", function (assert) {
        setupHtml('<span contentEditable="false"></span>' +
            '<span contentEditable="false"></span>a');
        assert.strictEqual(CaretUtils.isBeforeContentEditableFalse(new CaretPosition(getRoot(), 0)), true);
        assert.strictEqual(CaretUtils.isBeforeContentEditableFalse(new CaretPosition(getRoot(), 1)), true);
        assert.strictEqual(CaretUtils.isBeforeContentEditableFalse(new CaretPosition(getRoot(), 2)), false);
        assert.strictEqual(CaretUtils.isBeforeContentEditableFalse(new CaretPosition(getRoot(), 3)), false);
    });

    QUnit.test("isBeforeContentEditableFalse/isAfterContentEditableFalse on bogus all element", function (assert) {
        setupHtml('<input><p contentEditable="false" data-editor-bogus="all"></p><input>');
        assert.strictEqual(CaretUtils.isBeforeContentEditableFalse(new CaretPosition(getRoot(), 1)), false);
        assert.strictEqual(CaretUtils.isAfterContentEditableFalse(new CaretPosition(getRoot(), 2)), false);
    });

    QUnit.test("isAfterContentEditableFalse", function (assert) {
        setupHtml('<span contentEditable="false"></span>' +
            '<span contentEditable="false"></span>a');
        assert.strictEqual(CaretUtils.isAfterContentEditableFalse(new CaretPosition(getRoot(), 0)), false);
        assert.strictEqual(CaretUtils.isAfterContentEditableFalse(new CaretPosition(getRoot(), 1)), true);
        assert.strictEqual(CaretUtils.isAfterContentEditableFalse(new CaretPosition(getRoot(), 2)), true);
        assert.strictEqual(CaretUtils.isAfterContentEditableFalse(new CaretPosition(getRoot(), 3)), false);
    });

    QUnit.test("normalizeRange", function (assert) {
        setupHtml('abc<span contentEditable="false">1</span>def');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().firstChild, 2)), createRange(getRoot().firstChild, 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().firstChild, 3)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().lastChild, 2)), createRange(getRoot().lastChild, 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().lastChild, 0)), createRange(getRoot(), 2));
    });

    QUnit.test("normalizeRange deep", function (assert) {
        setupHtml('<i><b>abc</b></i><span contentEditable="false">1</span><i><b>def</b></i>');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('b').firstChild, 2)), createRange(findElm('b').firstChild, 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('b').firstChild, 3)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(findElm('b:last').firstChild, 1)), createRange(findElm('b:last').firstChild, 1));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(findElm('b:last').firstChild, 0)), createRange(getRoot(), 2));
    });

    QUnit.test("normalizeRange break at candidate", function (assert) {
        setupHtml('<p><b>abc</b><input></p><p contentEditable="false">1</p><p><input><b>abc</b></p>');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('b').firstChild, 3)), createRange(findElm('b').firstChild, 3));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('b:last').lastChild, 0)), createRange(findElm('b:last').lastChild, 0));
    });

    QUnit.test("normalizeRange at block caret container", function (assert) {
        setupHtml('<p data-editor-caret="before">\u00a0</p><p contentEditable="false">1</p><p data-editor-caret="after">\u00a0</p>');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('p:first').firstChild, 0)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(findElm('p:first').firstChild, 1)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(findElm('p:last').firstChild, 0)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(findElm('p:last').firstChild, 1)), createRange(getRoot(), 2));
    });

    QUnit.test("normalizeRange at inline caret container", function (assert) {
        setupHtml('abc<span contentEditable="false">1</span>def');
        getRoot().insertBefore(document.createTextNode(ZWSP), getRoot().childNodes[1]);
        getRoot().insertBefore(document.createTextNode(ZWSP), getRoot().childNodes[3]);
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().firstChild, 3)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().childNodes[1], 0)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().childNodes[1], 1)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().lastChild, 0)), createRange(getRoot(), 3));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().childNodes[3], 0)), createRange(getRoot(), 3));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().childNodes[3], 1)), createRange(getRoot(), 3));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().firstChild, 3)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().childNodes[1], 0)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().childNodes[1], 1)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().lastChild, 0)), createRange(getRoot(), 3));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().childNodes[3], 0)), createRange(getRoot(), 3));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().childNodes[3], 1)), createRange(getRoot(), 3));
    });

    QUnit.test("normalizeRange at inline caret container (combined)", function (assert) {
        setupHtml('abc' + ZWSP + '<span contentEditable="false">1</span>' + ZWSP + 'def');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().firstChild, 3)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().firstChild, 4)), createRange(getRoot(), 1));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().lastChild, 0)), createRange(getRoot(), 2));
        assertRange(assert, CaretUtils.normalizeRange(-1, getRoot(), createRange(getRoot().lastChild, 1)), createRange(getRoot(), 2));
    });

    QUnit.test("normalizeRange at inline caret container after block", function (assert) {
        setupHtml('<p><span contentEditable="false">1</span></p>' + ZWSP + 'abc');
        assertRange(assert, CaretUtils.normalizeRange(1, getRoot(), createRange(getRoot().lastChild, 0)), createRange(getRoot().lastChild, 0));
    });
});