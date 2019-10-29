class ViewBlock {
    static setupHtml(html) {
        $("#view").html(html);
    }

    static getRoot() {
        return document.getElementById("view");
    }
}