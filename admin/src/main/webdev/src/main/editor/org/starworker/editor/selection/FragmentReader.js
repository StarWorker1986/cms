import Tools from "../util/Tools";
import ElementType from "../dom/ElementType";
import Parents from "../dom/Parents";
import DOMUtils from "../dom/DOMUtils";
import SelectionUtils from "./SelectionUtils";
import SimpleTableModel from "./SimpleTableModel";
import TableCellSelection from "./TableCellSelection";

export default class FragmentReader {
    static read(rootNode, ranges) {
        let selectedCells = TableCellSelection.getCellsFromElementOrRanges(ranges, rootNode);
        return selectedCells.length > 0 ? this.__getTableFragment(rootNode, selectedCells)
                                        : this.__getSelectionFragment(rootNode, ranges);
    }

    static __findParentListContainer(parents) {
        return Tools.find(parents, (elm) => {
            return DOMUtils.name(elm) === "ul" || DOMUtils.name(elm) === "ol";
        });
    }

    static __getFullySelectedListWrappers(parents, rng) {
        return Tools.find(parents, (elm) => {
            return DOMUtils.name(elm) === "li" && SelectionUtils.hasAllContentsSelected(elm, rng);
        })
        .fold(Option.constant([]), (li) => {
            return this.__findParentListContainer(parents).map((listCont) => {
                return [
                    DOMUtils.fromTag("li"),
                    DOMUtils.fromTag(DOMUtils.name(listCont))
                ];
            }).getOr([]);
        });
    }

    static __wrap(innerElm, elms) {
        let wrapped = Tools.foldl(elms, (acc, elm) => {
            DOMUtils.append(elm, acc);
            return elm;
        }, innerElm);
        return elms.length > 0 ? DOMUtils.fromElements([wrapped]) : wrapped;
    }

    static __directListWrappers(commonAnchorContainer) {
        if (ElementType.isListItem(commonAnchorContainer)) {
            return DOMUtils.parent(commonAnchorContainer).filter(ElementType.isList).fold(Option.constant([]), (listElm) => {
                return [commonAnchorContainer, listElm];
            });
        }
        else {
            return ElementType.isList(commonAnchorContainer) ? [commonAnchorContainer] : [];
        }
    }

    static __getWrapElements(rootNode, rng) {
        let commonAnchorContainer = DOMUtils.fromDom(rng.commonAncestorContainer),
            parents = Parents.parentsAndSelf(commonAnchorContainer, rootNode);
        
        let wrapElements = Tools.filter(parents, (elm) => {
            return ElementType.isInline(elm) || ElementType.isHeading(elm);
        });
        
        let listWrappers = this.__getFullySelectedListWrappers(parents, rng),
            allWrappers = wrapElements.concat(listWrappers.length ? listWrappers : this.__directListWrappers(commonAnchorContainer));
        
        return Tools.map(allWrappers, DOMUtils.shallow);
    }

    static __emptyFragment() {
        return DOMUtils.fromElements([]);
    }

    static __getFragmentFromRange(rootNode, rng) {
        return this.__wrap(DOMUtils.fromDom(rng.cloneContents()), this.__getWrapElements(rootNode, rng));
    }

    static __getParentTable(rootElm, cell) {
        return DOMUtils.ancestor(cell, (elm) => DOMUtils.is(elm, "table"), (elm) => rootElm.dom() === elm.dom());
    }

    static __getTableFragment(rootNode, selectedTableCells) {
        return this.__getParentTable(rootNode, selectedTableCells[0]).bind((tableElm) => {
            let firstCell = selectedTableCells[0],
                lastCell = selectedTableCells[selectedTableCells.length - 1],
                fullTableModel = SimpleTableModel.fromDom(tableElm);

            return SimpleTableModel.subsection(fullTableModel, firstCell, lastCell).map((sectionedTableModel) => {
                return DOMUtils.fromElements([SimpleTableModel.toDom(sectionedTableModel)]);
            });
        }).getOrThunk(this.__emptyFragment);
    }

    static __getSelectionFragment(rootNode, ranges) {
        return ranges.length > 0 && ranges[0].collapsed ? this.__emptyFragment() : this.__getFragmentFromRange(rootNode, ranges[0]);
    }
}