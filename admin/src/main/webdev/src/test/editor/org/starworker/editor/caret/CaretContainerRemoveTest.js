QUnit.module("editor.caret.CaretContainerRemoveTest", function () {
    const setupHtml = (html) => {
        $("#view").html(html);
    };

    const getRoot = () => {
        return document.getElementById("view");
    };

    QUnit.test("remove", function (assert) {
        setupHtml('<span contentEditable="false">1</span>');
        CaretContainer.insertInline(getRoot().firstChild, true);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().firstChild), true);
        CaretContainerRemove.remove(getRoot().firstChild);
        assert.equal(CaretContainer.isCaretContainerInline(getRoot().firstChild), false);
    });

    QUnit.test("removeAndReposition block in same parent at offset", function (assert) {
        setupHtml('<span contentEditable="false">1</span>');
        CaretContainer.insertBlock('p', getRoot().firstChild, true);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().firstChild), true);
        
        let pos = CaretContainerRemove.removeAndReposition(getRoot().firstChild, new CaretPosition(getRoot(), 0));
        assert.equal(pos.offset, 0);
        assert.equal(pos.container, getRoot());
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().firstChild), false);
    });

    QUnit.test("removeAndReposition block in same parent before offset", function (assert) {
        setupHtml('<span contentEditable="false">1</span><span contentEditable="false">2</span>');
        CaretContainer.insertBlock('p', getRoot().childNodes[1], true);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().childNodes[1]), true);
        
        let pos = CaretContainerRemove.removeAndReposition(getRoot().childNodes[1], new CaretPosition(getRoot(), 0));
        assert.equal(pos.offset, 0);
        assert.equal(pos.container, getRoot());
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().childNodes[1]), false);
    });

    QUnit.test("removeAndReposition block in same parent after offset", function (assert) {
        setupHtml('<span contentEditable="false">1</span><span contentEditable="false">2</span>');
        CaretContainer.insertBlock('p', getRoot().childNodes[1], true);
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().childNodes[1]), true);
        
        let pos = CaretContainerRemove.removeAndReposition(getRoot().childNodes[1], new CaretPosition(getRoot(), 3));
        assert.equal(pos.offset, 2);
        assert.equal(pos.container, getRoot());
        assert.equal(CaretContainer.isCaretContainerBlock(getRoot().childNodes[1]), false);
    });
});