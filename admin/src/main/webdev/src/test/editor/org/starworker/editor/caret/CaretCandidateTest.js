QUnit.module("editor.caret.CaretCandidateTest", () => {
    const setupHtml = (html) => {
        $("#view").html(html);
    }

    const getRoot = () => {
        return document.getElementById("view");
    }

    QUnit.test("isCaretCandidate", (assert) => {
        $.each("img input textarea hr table iframe video audio object".split(' '), (index, name) => {
            assert.equal(CaretCandidate.isCaretCandidate(document.createElement(name)), true);
        });
        assert.equal(CaretCandidate.isCaretCandidate(document.createTextNode('text')), true);
        assert.equal(CaretCandidate.isCaretCandidate($('<span contentEditable="false"></span>')[0]), true);
        assert.equal(CaretCandidate.isCaretCandidate($('<span contentEditable="false" unselectable="true"></span>')[0]), false);
        assert.equal(CaretCandidate.isCaretCandidate($('<div contentEditable="false"></div>')[0]), true);
        assert.equal(CaretCandidate.isCaretCandidate($('<table><tr><td>X</td></tr></table>')[0]), true);
        assert.equal(CaretCandidate.isCaretCandidate($('<span contentEditable="true"></span>')[0]), false);
        assert.equal(CaretCandidate.isCaretCandidate($('<span></span>')[0]), false);
        assert.equal(CaretCandidate.isCaretCandidate(document.createComment('text')), false);
        assert.equal(CaretCandidate.isCaretCandidate($('<span data-mce-caret="1"></span>')[0]), false);
        assert.equal(CaretCandidate.isCaretCandidate(document.createTextNode(Zwsp.ZWSP)), false);
    });

    QUnit.test("isInEditable", (assert) => {
        setupHtml('abc<span contentEditable="true"><b><span contentEditable="false">X</span></b></span>');
        assert.equal(CaretCandidate.isInEditable($('span span', getRoot())[0].firstChild, getRoot()), false);
        assert.equal(CaretCandidate.isInEditable($('span span', getRoot())[0], getRoot()), true);
        assert.equal(CaretCandidate.isInEditable($('span', getRoot())[0], getRoot()), true);
        assert.equal(CaretCandidate.isInEditable(getRoot().firstChild, getRoot()), true);
    });

    QUnit.test("isAtomic", (assert) => {
        $.each(['img', 'input', 'textarea', 'hr'], function (index, name) {
            assert.equal(CaretCandidate.isAtomic(document.createElement(name)), true);
        });
        assert.equal(CaretCandidate.isAtomic(document.createTextNode('text')), false);
        assert.equal(CaretCandidate.isAtomic($('<table><tr><td>X</td></tr></table>')[0]), false);
        assert.equal(CaretCandidate.isAtomic($('<span contentEditable="false">X</span>')[0]), true);
        assert.equal(CaretCandidate.isAtomic($('<span contentEditable="false">X<span contentEditable="true">Y</span>Z</span>')[0]), false);
    });

    QUnit.test("isEditableCaretCandidate", (assert) => {
        setupHtml('abc<b>xx</b><span contentEditable="false"><span contentEditable="false">X</span></span>');
        assert.equal(CaretCandidate.isEditableCaretCandidate(getRoot().firstChild, getRoot()), true);
        assert.equal(CaretCandidate.isEditableCaretCandidate($('b', getRoot())[0]), false);
        assert.equal(CaretCandidate.isEditableCaretCandidate($('span', getRoot())[0]), true);
        assert.equal(CaretCandidate.isEditableCaretCandidate($('span span', getRoot())[0]), false);
    });
});