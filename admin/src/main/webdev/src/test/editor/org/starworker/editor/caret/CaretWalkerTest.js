QUnit.module("editor.caret.CaretWalkerTest", function (assert) {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const getChildNode = (childIndex) => {
        return getRoot().childNodes[childIndex];
    };

    const findTextPos = (selector, offset) => {
        return new CaretPosition($(selector, getRoot())[0].firstChild, offset);
    };

    const findElm = (selector) => {
        return $(selector, getRoot())[0];
    };

    const findElmPos = (selector, offset) => {
        return new CaretPosition($(selector, getRoot())[0], offset);
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

    let logicalCaret = new CaretWalker(getRoot());
    QUnit.test("inside empty root", function (assert) {
        setupHtml('');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), null);
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 0)), null);
    });

    QUnit.test("on null", function (assert) {
        setupHtml('');
        assertCaretPosition(assert, logicalCaret.next(null), null);
        assertCaretPosition(assert, logicalCaret.prev(null), null);
    });

    QUnit.test("within text node in root", function (assert) {
        setupHtml('abc');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 0)), new CaretPosition(getRoot().firstChild, 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 1)), new CaretPosition(getRoot().firstChild, 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 2)), new CaretPosition(getRoot().firstChild, 3));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 3)), null);
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().firstChild, 3)), new CaretPosition(getRoot().firstChild, 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().firstChild, 2)), new CaretPosition(getRoot().firstChild, 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().firstChild, 1)), new CaretPosition(getRoot().firstChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().firstChild, 0)), null);
    });

    QUnit.test('within text node in element', function (assert) {
        setupHtml('<p>abc</p>');
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p', 0)), findTextPos('p', 1));
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p', 1)), findTextPos('p', 2));
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p', 2)), findTextPos('p', 3));
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p', 3)), null);
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('p', 3)), findTextPos('p', 2));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('p', 2)), findTextPos('p', 1));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('p', 1)), findTextPos('p', 0));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('p', 0)), null);
    });

    QUnit.test('from index text node over comment', function (assert) {
        setupHtml('abcd<!-- x -->efgh');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), new CaretPosition(getRoot().firstChild, 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot().lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot().firstChild, 4));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 3)), new CaretPosition(getRoot().lastChild, 4));
    });

    QUnit.test('from text to text across elements', function (assert) {
        setupHtml('<p>abc</p><p>def</p>');
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p:first', 3)), findTextPos('p:last', 0));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('p:last', 0)), findTextPos('p:first', 3));
    });

    QUnit.test('from text to text across elements with siblings', function (assert) {
        setupHtml('<p>abc<b><!-- x --></b></p><p><b><!-- x --></b></p><p><b><!-- x --></b>def</p>');
        assertCaretPosition(assert, logicalCaret.next(findTextPos('p:first', 3)), new CaretPosition(findElm('p:last').lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('p:last').lastChild, 0)), findTextPos('p:first', 3));
    });

    QUnit.test('from input to text', function (assert) {
        setupHtml('123<input>456');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot().lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot().firstChild, 3));
    });

    QUnit.test('from input to input across elements', function (assert) {
        setupHtml('<p><input></p><p><input></p>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('p:first'), 1)), new CaretPosition(findElm('p:last'), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('p:last'), 0)), new CaretPosition(findElm('p:first'), 1));
    });

    QUnit.test('next br to br across elements', function (assert) {
        setupHtml('<p><br></p><p><br></p>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('p:first'), 0)), new CaretPosition(findElm('p:last'), 0));
    });

    QUnit.test('from text node to before cef span over br', function (assert) {
        setupHtml('<p>a<br><span contenteditable="false">X</span></p>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('p'), 1)), new CaretPosition(findElm('p'), 2));
    });

    QUnit.test('prev br to br across elements', function (assert) {
        setupHtml('<p><br></p><p><br></p>');
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('p:last'), 0)), new CaretPosition(findElm('p:first'), 0));
    });

    QUnit.test('from before/after br to text', function (assert) {
        setupHtml('<br>123<br>456<br>789');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), new CaretPosition(getChildNode(1), 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), new CaretPosition(getChildNode(3), 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 4)), new CaretPosition(getChildNode(5), 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 5)), new CaretPosition(getRoot().lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 5)), new CaretPosition(getRoot(), 4));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 4)), new CaretPosition(getChildNode(3), 3));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 0));
    });

    QUnit.test('over br', function (assert) {
        setupHtml('<br><br><br>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), null);
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 3)), null);
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 3)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 0)), null);
    });

    QUnit.test('over input', function (assert) {
        setupHtml('<input><input><input>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 3));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 3)), null);
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 3)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 0)), null);
    });

    QUnit.test('over img', function (assert) {
        setupHtml('<img src="about:blank"><img src="about:blank"><img src="about:blank">');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 0)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 3));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 3)), null);
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 3)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 0)), null);
    });

    QUnit.test('over script/style/textarea', function (assert) {
        setupHtml('a<script>//x</script>b<style>x{}</style>c<textarea>x</textarea>d');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 1)), new CaretPosition(getRoot().childNodes[2], 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().childNodes[2], 1)), new CaretPosition(getRoot().childNodes[4], 0));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 5)), new CaretPosition(getRoot(), 6));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 6)), new CaretPosition(getRoot(), 5));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().childNodes[4], 0)), new CaretPosition(getRoot().childNodes[2], 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot().childNodes[0], 1));
    });

    QUnit.test('around tables', function (assert) {
        setupHtml('a<table><tr><td>A</td></tr></table><table><tr><td>B</td></tr></table>b');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 1)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), findTextPos('td:first', 0));
        assertCaretPosition(assert, logicalCaret.next(findTextPos('td:first', 1)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 2)), findTextPos('td:last', 0));
        assertCaretPosition(assert, logicalCaret.next(findTextPos('table:last td', 1)), new CaretPosition(getRoot(), 3));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 3)), new CaretPosition(getRoot().lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().lastChild, 0)), new CaretPosition(getRoot(), 3));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 3)), findTextPos('td:last', 1));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('td:last', 0)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), findTextPos('td:first', 1));
        assertCaretPosition(assert, logicalCaret.prev(findTextPos('td:first', 0)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot().firstChild, 1));
    });

    QUnit.test('over cE=false', function (assert) {
        setupHtml('123<span contentEditable="false">a</span>456');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 3)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot(), 1)), new CaretPosition(getRoot(), 2));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot(), 2)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().lastChild, 0)), new CaretPosition(getRoot(), 2));
    });

    QUnit.test('from after to last element', function (assert) {
        setupHtml('<input />');
        assertCaretPosition(assert, logicalCaret.prev(CaretPosition.after(getRoot())), new CaretPosition(getRoot(), 1));
    });

    QUnit.test('from after to last element with br', function (assert) {
        setupHtml('<input /><br>');
        assertCaretPosition(assert, logicalCaret.prev(CaretPosition.after(getRoot())), new CaretPosition(getRoot(), 1));
    });

    QUnit.test('from inside cE=true in cE=false to after cE=false', function (assert) {
        setupHtml('<p>' +
            '<span contentEditable="false">' +
            '<span contentEditable="true">' +
            'abc' +
            '</span>' +
            'def' +
            '</span>' +
            '</p>' +
            '<p>abc</p>');
        assertCaretPosition(assert, logicalCaret.next(findTextPos('span span', 3)), new CaretPosition(findElm('p'), 1));
    });

    QUnit.test('around cE=false inside nested cE=true', function (assert) {
        setupHtml('<span contentEditable="false">' +
            '<span contentEditable="true">' +
            '<span contentEditable="false">1</span>' +
            '<span contentEditable="false">2</span>' +
            '<span contentEditable="false">3</span>' +
            '</span>' +
            '</span>');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('span span'), 0)), new CaretPosition(findElm('span span'), 1));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('span span'), 1)), new CaretPosition(findElm('span span'), 2));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('span span'), 2)), new CaretPosition(findElm('span span'), 3));
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(findElm('span span'), 3)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('span span'), 0)), new CaretPosition(getRoot(), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('span span'), 1)), new CaretPosition(findElm('span span'), 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('span span'), 2)), new CaretPosition(findElm('span span'), 1));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(findElm('span span'), 3)), new CaretPosition(findElm('span span'), 2));
    });

    QUnit.test('next from last node', function (assert) {
        setupHtml('<p><b><input></b></p>' +
            '<input>' +
            '<p><b><input></b></p>');
        assertCaretPosition(assert, logicalCaret.next(findElmPos('p:first', 1)), new CaretPosition(getRoot(), 1));
        assertCaretPosition(assert, logicalCaret.next(findElmPos('p:last', 1)), null);
    });

    QUnit.test('left/right between cE=false inlines in different blocks', function (assert) {
        setupHtml('<p>' +
            '<span contentEditable="false">abc</span>' +
            '</p>' +
            '<p>' +
            '<span contentEditable="false">def</span>' +
            '</p>');
        assertCaretPosition(assert, logicalCaret.next(findElmPos('p:first', 1)), findElmPos('p:last', 0));
        assertCaretPosition(assert, logicalCaret.prev(findElmPos('p:last', 0)), findElmPos('p:first', 1));
    });

    QUnit.test('from before/after root', function (assert) {
        setupHtml('<p>a</p><p>b</p>');
        assertCaretPosition(assert, logicalCaret.next(CaretPosition.before(getRoot())), findTextPos('p:first', 0));
        assertCaretPosition(assert, logicalCaret.prev(CaretPosition.after(getRoot())), findTextPos('p:last', 1));
    });

    QUnit.test('never into caret containers', function (assert) {
        setupHtml('abc<b data-editor-caret="1">def</b>ghi');
        assertCaretPosition(assert, logicalCaret.next(new CaretPosition(getRoot().firstChild, 3)), new CaretPosition(getRoot().lastChild, 0));
        assertCaretPosition(assert, logicalCaret.prev(new CaretPosition(getRoot().lastChild, 0)), new CaretPosition(getRoot().firstChild, 3));
    });
});