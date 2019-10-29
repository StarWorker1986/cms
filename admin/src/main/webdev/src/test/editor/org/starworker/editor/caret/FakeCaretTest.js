QUnit.module("editor.caret.FakeCaretTest", function(assert) {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const isBlock = (node) => {
        return node.nodeName === "DIV";
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

    let fakeCaret = new FakeCaret(getRoot(), isBlock, Option.constant(true));

    QUnit.test("show/hide (before, block)", function (assert) {
        let rng, $fakeCaretElm;

        setupHtml('<div>a</div>');
        rng = fakeCaret.show(true, $('div', getRoot())[0]);
        $fakeCaretElm = $(getRoot()).children();
        
        assert.equal($fakeCaretElm[0].nodeName, 'P');
        assert.equal($fakeCaretElm.attr("data-editor-caret"), "before");
        assertRange(assert, rng, createRange($fakeCaretElm[0], 0, $fakeCaretElm[0], 0));

        fakeCaret.hide();
        assert.equal($('*[data-editor-caret]', getRoot()).length, 0);
    });

    QUnit.test("show/hide (before, block)", function(assert) {
        let rng, $fakeCaretElm;

        setupHtml('<div>a</div>');
        rng = fakeCaret.show(false, $('div', getRoot())[0]);
        $fakeCaretElm = $(getRoot()).children();

        assert.equal($fakeCaretElm[1].nodeName, 'P');
        assert.equal($fakeCaretElm.eq(1).attr('data-editor-caret'), 'after');
        assertRange(assert, rng, createRange($fakeCaretElm[1], 0, $fakeCaretElm[1], 0));
        
        fakeCaret.hide();
        assert.equal($('*[data-editor-caret]', getRoot()).length, 0);
    });

    QUnit.test("show/hide (before, inline)", function(assert) {
        let rng, $fakeCaretText;

        setupHtml('<span>a</span>');
        rng = fakeCaret.show(true, $('span', getRoot())[0]);
        $fakeCaretText = $(getRoot()).contents();

        assert.equal($fakeCaretText[0].nodeName, '#text');
        assert.equal($fakeCaretText[0].data, Zwsp.ZWSP);
        assertRange(assert, rng, createRange($fakeCaretText[0], 1));

        fakeCaret.hide();
        assert.equal($(getRoot()).contents()[0].nodeName, 'SPAN');
    });

    QUnit.test("show/hide (after, inline)", function(assert) {
        let rng, $fakeCaretText;

        setupHtml('<span>a</span>');
        rng = fakeCaret.show(false, $('span', getRoot())[0]);
        $fakeCaretText = $(getRoot()).contents();
        
        assert.equal($fakeCaretText[1].nodeName, '#text');
        assert.equal($fakeCaretText[1].data, Zwsp.ZWSP);
        assertRange(assert, rng, createRange($fakeCaretText[1], 1));

        fakeCaret.hide();
        assert.equal($(getRoot()).contents()[0].nodeName, 'SPAN');
    });

    QUnit.test("getCss", function(assert) {
        assert.equal(fakeCaret.getCss().length > 10, true);
    });

    QUnit.test("show before TD", function(assert) {
        let rng;
        setupHtml('<table><tr><td contenteditable="false">x</td></tr></table>');
        rng = fakeCaret.show(false, $('td', getRoot())[0]);
        assert.equal(true, rng === null, "Should be null since TD is not a valid caret target");
    });

    QUnit.test("show before TH", function(assert) {
        let rng;
        setupHtml('<table><tr><th contenteditable="false">x</th></tr></table>');
        rng = fakeCaret.show(false, $('th', getRoot())[0]);
        assert.equal(true, rng === null, "Should be null since TH is not a valid caret target");
    });

    QUnit.test("isFakeCaretTarget", function(assert) {
        setupHtml('<p></p>');
        assert.equal(false, FakeCaret.isFakeCaretTarget(getRoot().childNodes[0]), "Should not need a fake caret");
        
        setupHtml('<p contenteditable="false"></p>');
        assert.equal(true, FakeCaret.isFakeCaretTarget(getRoot().childNodes[0]), "Should always need a fake caret");
        
        setupHtml('<table></table>');
        assert.equal(FakeCaret.isFakeCaretTableBrowser(), FakeCaret.isFakeCaretTarget(getRoot().childNodes[0]), "Should on some browsers need a fake caret");
    });
});