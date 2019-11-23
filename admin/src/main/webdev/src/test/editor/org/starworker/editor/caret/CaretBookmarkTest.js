QUnit.module("editor.caret.CaretBookmarkTest", function() {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    const createTextPos = (textNode, offset) => {
        return new CaretPosition(textNode, offset);
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

    QUnit.test("create element index", function (assert) {
        setupHtml('<b></b><i></i><b></b>');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().childNodes[0])), 'b[0],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().childNodes[1])), 'i[0],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().childNodes[2])), 'b[1],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.after(getRoot().childNodes[2])), 'b[1],after');
    });

    QUnit.test("create text index", function (assert) {
        setupHtml('a<b></b>b<b></b>ccc');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[0], 0)), 'text()[0],0');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[2], 1)), 'text()[1],1');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[4], 3)), 'text()[2],3');
    });

    QUnit.test("create text index on fragmented text nodes", function (assert) {
        setupHtml('a');
        getRoot().appendChild(document.createTextNode('b'));
        getRoot().appendChild(document.createTextNode('c'));
        getRoot().appendChild(document.createElement('b'));
        getRoot().appendChild(document.createTextNode('d'));
        getRoot().appendChild(document.createTextNode('e'));
        assert.equal(getRoot().childNodes.length, 6);
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[0], 0)), 'text()[0],0');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[1], 0)), 'text()[0],1');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[2], 0)), 'text()[0],2');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[4], 0)), 'text()[1],0');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(getRoot().childNodes[5], 0)), 'text()[1],1');
    });

    QUnit.test("create br element index", function (assert) {
        setupHtml('<p><br data-editor-bogus="1"></p><p><br></p>');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().firstChild.firstChild)), 'p[0]/br[0],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().lastChild.firstChild)), 'p[1]/br[0],before');
    });

    QUnit.test("create deep element index", function (assert) {
        setupHtml('<p><span>a</span><span><b id="a"></b><b id="b"></b><b id="c"></b></span></p>');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(document.getElementById('a'))), 'p[0]/span[1]/b[0],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(document.getElementById('b'))), 'p[0]/span[1]/b[1],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(document.getElementById('c'))), 'p[0]/span[1]/b[2],before');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.after(document.getElementById('c'))), 'p[0]/span[1]/b[2],after');
    });

    QUnit.test("create deep text index", function (assert) {
        setupHtml('<p><span>a</span><span id="x">a<b></b>b<b></b>ccc</span></p>');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(document.getElementById('x').childNodes[0], 0)), 'p[0]/span[1]/text()[0],0');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(document.getElementById('x').childNodes[2], 1)), 'p[0]/span[1]/text()[1],1');
        assert.equal(CaretBookmark.create(getRoot(), createTextPos(document.getElementById('x').childNodes[4], 3)), 'p[0]/span[1]/text()[2],3');
    });

    QUnit.test("create element index from bogus", function (assert) {
        setupHtml('<b></b><span data-editor-bogus="1"><b></b><span data-editor-bogus="1"><b></b><b></b></span></span>');
        assert.equal(CaretBookmark.create(getRoot(), CaretPosition.before(getRoot().lastChild.lastChild.childNodes[1])), 'b[3],before');
    });

    QUnit.test("resolve element index", function (assert) {
        setupHtml('<b></b><i></i><b></b>');
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'b[0],before'), CaretPosition.before(getRoot().childNodes[0]));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'b[1],before'), CaretPosition.before(getRoot().childNodes[2]));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'b[1],after'), CaretPosition.after(getRoot().childNodes[2]));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'i[0],before'), CaretPosition.before(getRoot().childNodes[1]));
    });

    QUnit.test("resolve odd element names", function(assert) {
        setupHtml('<h-2X>abc</h-2X>');
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'h-2X[0]/text()[0],2'), createTextPos(getRoot().childNodes[0].firstChild, 2));
    });
    
    QUnit.test("resolve deep element index", function(assert) {
        setupHtml('<p><span>a</span><span><b id="a"></b><b id="b"></b><b id="c"></b></span></p>');
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'p[0]/span[1]/b[0],before'), CaretPosition.before(document.getElementById('a')));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'p[0]/span[1]/b[1],before'), CaretPosition.before(document.getElementById('b')));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'p[0]/span[1]/b[2],before'), CaretPosition.before(document.getElementById('c')));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'p[0]/span[1]/b[2],after'), CaretPosition.after(document.getElementById('c')));
    });
    
    QUnit.test("resolve text index", function(assert) {
        setupHtml('a<b></b>b<b></b>ccc');
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],0'), createTextPos(getRoot().childNodes[0], 0));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[1],1'), createTextPos(getRoot().childNodes[2], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[2],3'), createTextPos(getRoot().childNodes[4], 3));
    });
    
    QUnit.test("resolve text index on fragmented text nodes", function(assert) {
        setupHtml('a');
        getRoot().appendChild(document.createTextNode('b'));
        getRoot().appendChild(document.createTextNode('c'));
        getRoot().appendChild(document.createElement('b'));
        getRoot().appendChild(document.createTextNode('d'));
        getRoot().appendChild(document.createTextNode('e'));
        
        assert.equal(getRoot().childNodes.length, 6);
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],0'), createTextPos(getRoot().childNodes[0], 0));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],1'), createTextPos(getRoot().childNodes[0], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],2'), createTextPos(getRoot().childNodes[1], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],3'), createTextPos(getRoot().childNodes[2], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],4'), createTextPos(getRoot().childNodes[2], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[1],0'), createTextPos(getRoot().childNodes[4], 0));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[1],1'), createTextPos(getRoot().childNodes[4], 1));
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[1],2'), createTextPos(getRoot().childNodes[5], 1));
    });
    
    QUnit.test("resolve text index with to high offset", function(assert) {
        setupHtml('abc');
        assertCaretPosition(assert, CaretBookmark.resolve(getRoot(), 'text()[0],10'), createTextPos(getRoot().childNodes[0], 3));
    });
    
    QUnit.test("resolve invalid paths", function(assert) {
        setupHtml('<b><i></i></b>');
        assert.equal(CaretBookmark.resolve(getRoot(), 'x[0]/y[1]/z[2]'), null);
        assert.equal(CaretBookmark.resolve(getRoot(), 'b[0]/i[2]'), null);
        assert.equal(CaretBookmark.resolve(getRoot(), 'x'), null);
        assert.equal(CaretBookmark.resolve(getRoot(), null), null);
    });
});