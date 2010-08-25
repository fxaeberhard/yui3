YUI.add('datatable-base', function(Y) {

function Column(config) {
    Column.superclass.constructor.apply(this, arguments);
}

/**
 * Class name.
 *
 * @property NAME
 * @type String
 * @static
 * @final
 * @value "column"
 */
Column.NAME = "column";

/////////////////////////////////////////////////////////////////////////////
//
// Column Attributes
//
/////////////////////////////////////////////////////////////////////////////
Column.ATTRS = {
    id: {
        valueFn: "_defaultId",
        writeOnce: true
    },
    key: {
        valueFn: "_defaultKey"
    },
    field: {
        valueFn: "_defaultField"
    },
    label: {
        valueFn: "_defaultLabel"
    },
    keyIndex: {
        readOnly: true
    },
    parent: {
        readOnly: true
    },
    children: {
    },
    colspan: {
        readOnly: true
    },
    rowspan: {
        readOnly: true
    },
    thNode: {
        readOnly: true
    },
    thLinerNode: {
        readOnly: true
    },
    thLabelNode: {
        readOnly: true
    },
    abbr: {
        value: null
    },
    className: {},
    editor: {},
    formatter: {},
    
    // requires datatable-colresize
    resizeable: {},

    //requires datatable-sort
    sortable: {},
    hidden: {},
    width: {},
    minWidth: {},
    maxAutoWidth: {}
};

/* Column extends Widget */
Y.extend(Column, Y.Widget, {
    _defaultId: function() {
        return Y.guid();
    },

    _defaultKey: function(key) {
        return key || Y.guid();
    },

    _defaultField: function(field) {
        return field || this.get("key");
    },

    _defaultLabel: function(label) {
        return label || this.get("key");
    },

    initializer: function() {
    },

    destructor: function() {
    },

    syncUI: function() {
        this._uiSetAbbr(this.get("abbr"));
    },

    _afterAbbrChange: function (e) {
        this._uiSetAbbr(e.newVal);
    },
    
    _uiSetAbbr: function(val) {
        this._thNode.set("abbr", val);
    }

});

Y.Column = Column;

var Lang = Y.Lang;

function Columnset(config) {
    Columnset.superclass.constructor.apply(this, arguments);
}

/**
 * Class name.
 *
 * @property NAME
 * @type String
 * @static
 * @final
 * @value "columnset"
 */
Columnset.NAME = "columnset";

/////////////////////////////////////////////////////////////////////////////
//
// Columnset Attributes
//
/////////////////////////////////////////////////////////////////////////////
Columnset.ATTRS = {
    columns: {
        setter: "_setColumns"
    },

    // DOM tree representation of all Columns
    tree: {
        readOnly: true,
        value: []
    },

    //TODO: is this necessary?
    // Flat representation of all Columns
    flat: {
        readOnly: true,
        value: []
    },

    // Hash of all Columns by ID
    hash: {
        readOnly: true,
        value: {}
    },

    // Flat representation of only Columns that are meant to display data
    keys: {
        readOnly: true,
        value: []
    }
};

/* Columnset extends Base */
Y.extend(Columnset, Y.Base, {
    _setColumns: function(columns) {
            return Y.clone(columns);
    },

    initializer: function() {

            // DOM tree representation of all Columns
            var tree = [],
            // Flat representation of all Columns
            flat = [],
            // Hash of all Columns by ID
            hash = {},
            // Flat representation of only Columns that are meant to display data
            keys = [],
            // Original definitions
            columns = this.get("columns"),

            self = this;

        // Internal recursive function to define Column instances
        function parseColumns(depth, nodeList, parent) {
            var i=0,
                len = nodeList.length,
                currentNode,
                column,
                currentChildren;

            // One level down
            depth++;

            // Create corresponding dom node if not already there for this depth
            if(!tree[depth]) {
                tree[depth] = [];
            }

            // Parse each node at this depth for attributes and any children
            for(; i<len; ++i) {
                currentNode = nodeList[i];

                currentNode = Lang.isString(currentNode) ? {key:currentNode} : currentNode;

                // Instantiate a new Column for each node
                column = new Y.Column(currentNode);

                // Cross-reference Column ID back to the original object literal definition
                currentNode.yuiColumnId = column.get("id");

                // Add the new Column to the flat list
                flat.push(column);

                // Add the new Column to the hash
                hash[column.get("id")] = column;

                // Assign its parent as an attribute, if applicable
                if(parent) {
                    column._set("parent", parent);
                }

                // The Column has descendants
                if(Lang.isArray(currentNode.children)) {
                    currentChildren = currentNode.children;
                    column._set("children", currentChildren);

                    self._setColSpans(column, currentNode);

                    self._cascadePropertiesToChildren(column, currentChildren);

                    // The children themselves must also be parsed for Column instances
                    if(!tree[depth+1]) {
                        tree[depth+1] = [];
                    }
                    parseColumns(depth, currentChildren, column);
                }
                // This Column does not have any children
                else {
                    column._set("keyIndex", keys.length);
                    column._set("colspan", 1);
                    keys.push(column);
                }

                // Add the Column to the top-down dom tree
                tree[depth].push(column);
            }
            depth--;
        }

        // Parse out Column instances from the array of object literals
        parseColumns(-1, columns);


        // Save to the Columnset instance
        this._set("tree", tree);
        this._set("flat", flat);
        this._set("hash", hash);
        this._set("keys", keys);

        this._setRowSpans();
        this._setHeaders();
    },

    destructor: function() {
    },

    _cascadePropertiesToChildren: function(oColumn, currentChildren) {
        var i = 0,
            len = currentChildren.length,
            child;

        // Cascade certain properties to children if not defined on their own
        for(; i<len; ++i) {
            child = currentChildren[i];
            if(oColumn.get("className") && (child.className === undefined)) {
                child.className = oColumn.get("className");
            }
            if(oColumn.get("editor") && (child.editor === undefined)) {
                child.editor = oColumn.get("editor");
            }
            if(oColumn.get("formatter") && (child.formatter === undefined)) {
                child.formatter = oColumn.get("formatter");
            }
            if(oColumn.get("resizeable") && (child.resizeable === undefined)) {
                child.resizeable = oColumn.get("resizeable");
            }
            if(oColumn.get("sortable") && (child.sortable === undefined)) {
                child.sortable = oColumn.get("sortable");
            }
            if(oColumn.get("hidden")) {
                child.hidden = true;
            }
            if(oColumn.get("width") && (child.width === undefined)) {
                child.width = oColumn.get("width");
            }
            if(oColumn.get("minWidth") && (child.minWidth === undefined)) {
                child.minWidth = oColumn.get("minWidth");
            }
            if(oColumn.get("maxAutoWidth") && (child.maxAutoWidth === undefined)) {
                child.maxAutoWidth = oColumn.get("maxAutoWidth");
            }
        }
    },

    _setColSpans: function(oColumn, currentNode) {
        // Determine COLSPAN value for this Column
        var terminalChildNodes = 0;

        function countTerminalChildNodes(ancestor) {
            var descendants = ancestor.children,
                i = 0,
                len = descendants.length;

            // Drill down each branch and count terminal nodes
            for(; i<len; ++i) {
                // Keep drilling down
                if(Lang.isArray(descendants[i].children)) {
                    countTerminalChildNodes(descendants[i]);
                }
                // Reached branch terminus
                else {
                    terminalChildNodes++;
                }
            }
        }
        countTerminalChildNodes(currentNode);
        oColumn._set("colspan", terminalChildNodes);
    },

    _setRowSpans: function() {
        // Determine ROWSPAN value for each Column in the dom tree
        function parseDomTreeForRowspan(tree) {
            var maxRowDepth = 1,
                currentRow,
                currentColumn,
                m,p;

            // Calculate the max depth of descendants for this row
            function countMaxRowDepth(row, tmpRowDepth) {
                tmpRowDepth = tmpRowDepth || 1;

                var i = 0,
                    len = row.length,
                    col;

                for(; i<len; ++i) {
                    col = row[i];
                    // Column has children, so keep counting
                    if(Lang.isArray(col.children)) {
                        tmpRowDepth++;
                        countMaxRowDepth(col.children, tmpRowDepth);
                        tmpRowDepth--;
                    }
                    // Column has children, so keep counting
                    else if(col.get && Lang.isArray(col.get("children"))) {
                        tmpRowDepth++;
                        countMaxRowDepth(col.get("children"), tmpRowDepth);
                        tmpRowDepth--;
                    }
                    // No children, is it the max depth?
                    else {
                        if(tmpRowDepth > maxRowDepth) {
                            maxRowDepth = tmpRowDepth;
                        }
                    }
                }
            }

            // Count max row depth for each row
            for(m=0; m<tree.length; m++) {
                currentRow = tree[m];
                countMaxRowDepth(currentRow);

                // Assign the right ROWSPAN values to each Column in the row
                for(p=0; p<currentRow.length; p++) {
                    currentColumn = currentRow[p];
                    if(!Lang.isArray(currentColumn.get("children"))) {
                        currentColumn._set("rowspan", maxRowDepth);
                    }
                    else {
                        currentColumn._set("rowspan", 1);
                    }
                }

                // Reset counter for next row
                maxRowDepth = 1;
            }
        }
        parseDomTreeForRowspan(this.get("tree"));
    },

    _setHeaders: function() {
        var headers, column,
            allKeys = this.get("keys"),
            i=0, len = allKeys.length;

        function recurseAncestorsForHeaders(headers, oColumn) {
            headers.push(oColumn.get("key"));
            //headers[i].push(oColumn.getSanitizedKey());
            if(oColumn.get("parent")) {
                recurseAncestorsForHeaders(headers, oColumn.get("parent"));
            }
        }
        for(; i<len; ++i) {
            headers = [];
            column = allKeys[i];
            recurseAncestorsForHeaders(headers, column);
            column._set("headers", headers.reverse().join(" "));
        }
    },

    getColumn: function() {
    }
});

Y.Columnset = Columnset;

var LANG = Y.Lang,
    NODE = Y.Node,
    GETCLASSNAME = Y.ClassNameManager.getClassName,
    BIND = Y.bind,

    DATATABLE = "datatable",

    CLASS_DATA = GETCLASSNAME(DATATABLE, "data"),
    CLASS_MSG = GETCLASSNAME(DATATABLE, "msg"),
    CLASS_FIRST = GETCLASSNAME(DATATABLE, "first"),
    CLASS_LAST = GETCLASSNAME(DATATABLE, "last"),

    TEMPLATE_TH = '<th id="{id}" rowspan="{rowspan}" colspan="{colspan}">{value}</th>',
    TEMPLATE_TR = '<tr id="{id}"></tr>',
    TEMPLATE_TD = '<td headers="{headers}">{value}</td>',
    TEMPLATE_VALUE = '{value}';

function DTBase(config) {
    DTBase.superclass.constructor.apply(this, arguments);
}

/*
 * Required NAME static field, to identify the Widget class and
 * used as an event prefix, to generate class names etc. (set to the
 * class name in camel case).
 */
DTBase.NAME = "baseDataTable";

/*
 * The attribute configuration for the widget. This defines the core user facing state of the widget
 */
DTBase.ATTRS = {
    columnset: {
        setter: "_setColumnset"
    },

    //@type Recordset or Array
    recordset: {
        setter: "_setRecordset"
    },

    state: {
        value: new Y.State(),
        readOnly: true

    },

    strings: {
        valueFn: function() {
            return Y.Intl.get("datatable-base");
        }
    },

    thValueTemplate: {
        value: TEMPLATE_VALUE
    },

    tdValueTemplate: {
        value: TEMPLATE_VALUE
    },

    trTemplate: {
        value: TEMPLATE_TR
    }
};

/*
 * The HTML_PARSER static constant is used if the Widget supports progressive enhancement, and is
 * used to populate the configuration for the DTBase instance from markup already on the page.
 */
DTBase.HTML_PARSER = {

    attrA: function (srcNode) {
        // If progressive enhancement is to be supported, return the value of "attrA" based on the contents of the srcNode
    }

};

/* DTBase extends the base Widget class */
Y.extend(DTBase, Y.Widget, {
    // Properties
    thTemplate: TEMPLATE_TH,

    tdTemplate: TEMPLATE_TD,
    
    _theadNode: null,
    
    _tbodyNode: null,
    
    _msgNode: null,

    // Attributes
    _setColumnset: function(columns) {
        return LANG.isArray(columns) ? new Y.Columnset({columns:columns}) : columns;
    },

    _setRecordset: function(recordset) {
        if(LANG.isArray(recordset)) {
            recordset = new Y.Recordset({records:recordset});
        }

        recordset.addTarget(this);
        return recordset;
    },

    // Initialization
    initializer: function() {
        this.publish("addTr", {defaultFn: BIND("_defAddTrFn", this), queuable:true});

        // This set of custom events pass through DOM event facades
        //TODO: are the default functions necessary?
        this.publish("theadCellClick", {emitFacade:false, defaultFn: BIND("_defTheadCellClickFn", this), queuable:true});
        this.publish("theadRowClick", {emitFacade:false, defaultFn: BIND("_defTheadRowClickFn", this), queuable:true});
        this.publish("theadClick", {emitFacade:false, defaultFn: BIND("_defTheadClickFn", this), queuable:true});
    },

    // Destruction
    destructor: function() {
         this.get("recordset").removeTarget(this);
    },

    // UI
    renderUI: function() {
        // TABLE and CAPTION
        var ok = this._createTableNode();
        // COLGROUP
        ok = ok ? this._createColgroupNode(this._tableNode) : false;
        // THEAD
        ok = ok ? this._createTheadNode(this._tableNode) : false;
        // Primary TBODY
        ok = ok ? this._createTbodyNode(this._tableNode) : false;
         // Message TBODY
        ok = ok ? this._createMessageNode(this._tableNode) : false;
        // CAPTION
        ok = ok ? this._createCaptionNode(this._tableNode) : false;
        return ok;
    },

    _createTableNode: function() {
        if (!this._tableNode) {
            this._tableNode = this.get("contentBox").appendChild(NODE.create("<table></table>"));
        }
        return this._tableNode;
    },

    _createColgroupNode: function(tableNode) {
        // Add COLs to DOCUMENT FRAGMENT
        var allKeys = this.get("columnset").get("keys"),
            i = 0,
            len = allKeys.length,
            allCols = ["<colgroup>"];

        for(; i<len; ++i) {
            allCols.push("<col></col>");
        }

        allCols.push("</colgroup>");

        // Create COLGROUP
        this._colgroupNode = tableNode.insertBefore(NODE.create(allCols.join("")), tableNode.get("firstChild"));

        return this._colgroupNode;
    },

    _createTheadNode: function(tableNode) {
        if(tableNode) {
            this._theadNode = tableNode.insertBefore(NODE.create("<thead class='"+CLASS_DATA+"'></thead>"), this._colgroupNode.next());
            return this._theadNode;
        }
    },

    _createTbodyNode: function(tableNode) {
        this._tbodyNode = tableNode.appendChild(NODE.create("<tbody class='"+CLASS_DATA+"'></tbody>"));
        return this._tbodyNode;
    },

    _createMessageNode: function(tableNode) {
        this._msgNode = tableNode.insertBefore(NODE.create("<tbody class='"+CLASS_MSG+"'></tbody>"), this._tbodyNode);
        return this._msgNode;
    },

    _createCaptionNode: function(tableNode) {
        this._captionNode = tableNode.invoke("createCaption");
        return this._captionNode;
    },

    // Events
    bindUI: function() {
        var theadNode = this._theadNode,
            tbodyNode = this._tbodyNode,
            msgNode = this._msgNode,
            contentBox = this.get("contentBox");

        this._tableNode.delegate("click", BIND(this._onTheadClick, this), "thead."+CLASS_DATA+">tr>th");
        this._tableNode.delegate("click", BIND(this._onTbodyClick, this), "tbody."+CLASS_DATA+">tr>td");
        this._tableNode.delegate("click", BIND(this._onMsgClick, this), "tbody."+CLASS_MSG+">tr>td");

/*
        // Set up DOM events for THEAD
        theadNode.on("focus", BIND("_onTheadFocus", this));
        theadNode.on("keydown", BIND("_onTheadKeydown", this));
        theadNode.on("mouseover", BIND("_onTableMouseover", this));
        theadNode.on("mouseout", BIND("_onTableMouseout", this));
        theadNode.on("mousedown", BIND("_onTableMousedown", this));
        theadNode.on("mouseup", BIND("_onTableMouseup", this));
        theadNode.on("click", BIND("_onTheadClick", this));
        // Since we can't listen for click and dblclick on the same element...
        // Attach dblclick separately to contentBox
        // theadNode.on("dblclick", BIND("_onTableDblclick", this));

        // Set up DOM events for TBODY
        tbodyNode.on("focus", BIND("this._onTbodyFocus", this));
        tbodyNode.on("mouseover", BIND("_onTableMouseover", this));
        tbodyNode.on("mouseout", BIND("_onTableMouseout", this));
        tbodyNode.on("mousedown", BIND("_onTableMousedown", this));
        tbodyNode.on("mouseup", BIND("_onTableMouseup", this));
        tbodyNode.on("keydown", BIND("_onTbodyKeydown", this));
        tbodyNode.on("keypress", BIND("_onTableKeypress", this));
        tbodyNode.on("click", BIND("_onTbodyClick", this));
        // Since we can't listen for click and dblclick on the same element...
        // Attach dblick separately to contentBox
        // tbodyNode.on("dblclick", BIND("_onTableDblclick", this));

        contentBox.on("focus", BIND("_onTableFocus", this));
        contentBox.on("dblclick", BIND("_onTableDblclick", this));

        // Set up DOM events for msg node
        msgNode.on("focus", BIND("_onTbodyFocus", this));
        msgNode.on("mouseover", BIND("_onTableMouseover", this));
        msgNode.on("mouseout", BIND("_onTableMouseout", this));
        msgNode.on("mousedown", BIND("_onTableMousedown", this));
        msgNode.on("mouseup", BIND("_onTableMouseup", this));
        msgNode.on("keydown", BIND("_onTbodyKeydown", this));
        msgNode.on("keypress", BIND("_onTableKeypress", this));
        msgNode.on("click", BIND("_onTbodyClick", this));
*/
    },

    _onTheadFocus: function() {
    },

    _onTheadKeydown: function() {
    },

    _onTheadClick: function(e, target, container) {
        this.fire("theadCellClick", e);
        this.fire("theadRowClick", e);
        this.fire("theadClick", e);
    },


    _onTbodyFocus: function() {
    },

    _onTbodyKeydown: function() {
    },

    _onTbodyClick: function() {
    },


    _onTableMouseover: function() {
    },

    _onTableMouseout: function() {
    },

    _onTableMousedown: function() {
    },

    _onTableMouseup: function() {
    },

    _onTableKeypress: function() {
    },

    _onTableFocus: function() {
    },

    _onTableDblclick: function() {
    },

    _defTheadCellClickFn: function() {

    },


    syncUI: function() {
        /*
         * syncUI is intended to be used by the Widget subclass to
         * update the UI to reflect the initial state of the widget,
         * after renderUI. From there, the event listeners we bound above
         * will take over.
         */
        // STRINGS
        this._uiSetStrings(this.get("strings"));
        // HEADER ROWS
        this._uiSetColumnset(this.get("columnset"));
        // DATA RECORDS
        this._uiSetRecordset(this.get("recordset"));
    },

    /* Listeners, UI update methods */

    /**
     * Updates the UI if changes are made to any of the strings in the strings
     * attribute.
     *
     * @method _afterStringsChange
     * @param e {Event} Custom event for the attribute change
     * @protected
     */
    _afterStringsChange: function (e) {
        this._uiSetStrings(e.newVal);
    },

    _uiSetStrings: function (strings) {
        this._uiSetSummary(strings.summary);
        this._uiSetCaption(strings.caption);
    },

    _uiSetSummary: function(val) {
        this._tableNode.set("summary", val);
    },

    _uiSetCaption: function(val) {
        this._captionNode.set("innerHTML", val);
    },

    _afterColumnsetChange: function (e) {
        this._uiSetColumnset(e.newVal);
    },

    _uiSetColumnset: function(cs) {
        //TODO
        // this._removeHeaderRows();

        var tree = cs.get("tree"),
            theadNode = this._theadNode,
            tr,
            i = 0,
            len = tree.length;

        // Iterate tree to add rows
        for(; i<len; ++i) {
            tr = this._createHeaderTr(tree[i]);

            // Set FIRST/LAST class
            if(i === 0) {
                tr.addClass(CLASS_FIRST);
            }
            if(i === (len-1)) {
                tr.addClass(CLASS_LAST);
            }

            theadNode.appendChild(tr);
        }

        //TODO
        //this._setHeaderFirstLastClasses();

        // Column helpers needs _theadNode to exist
        //this._createColumnHelpers();
    },

    _createHeaderTr: function(record) {
        var tr = NODE.create(this._getHeaderTrMarkup(record));
        this._createThNodes(record, tr);
        this.fire("addHeaderTr", {record: record, tr: tr});
        return tr;
    },

    _getHeaderTrMarkup: function(record) {
        return Y.substitute(this.get("trTemplate"), {});
    },

    _createThNodes: function(treeRow, tr) {
        var i = 0,
            len = treeRow.length,
            ths = [],
            column,
            o;

        for(; i<len; ++i) {
            column = treeRow[i];
            ths.push(this._getThNodeMarkup({value:column.get("label")}, column));
            //column._set("thNode", thNode);
        }

        //TODO fire an event with node to append so that you can access the node via a listener

        tr.appendChild(NODE.create(ths.join("")));
    },

    _getThNodeMarkup: function(o, column) {
        o.column = column;
        o.id = column.get("id");//TODO: validate 1 column ID per document
        o.value = Y.substitute(this.get("thValueTemplate"), o);
        //TODO o.classnames
        o.colspan = column.get("colspan");
        o.rowspan = column.get("rowspan");
        //TODO o.abbr = column.get("abbr");

        /*TODO
        // Clear minWidth on hidden Columns
        if(column.get("hidden")) {
            //this._clearMinWidth(column);
        }
        */

        return Y.substitute(this.thTemplate, o);
    },

    _afterRecordsetChange: function (e) {
        this._uiSetRecordset(e.newVal);
    },

    _uiSetRecordset: function(rs) {
        var tbodyNode = this._tbodyNode,
            i = 0,//TODOthis.get("state.offsetIndex"),
            len = 3,//TODOthis.get("state.pageLength"),
            record,
            tr,
            nextSibling;

        // Iterate recordset to use existing or add new tr
        for(; i<len; ++i) {
            record = rs.getRecord(i);
            tr = tbodyNode.one("#"+record.get("id")) || this._createBodyTr(record);
            nextSibling = tbodyNode.get("children").item(i) || null;
            tbodyNode.insertBefore(tr, nextSibling);
        }
    },

    _createBodyTr: function(record) {
        var tr = NODE.create(this._getDataTrMarkup(record));
        this._createTdNodes(record, tr);
        this.fire("addDataTr", {record: record, tr: tr}); //on and after are the same state here bc there is no def fn
        return tr;
    },

    _getDataTrMarkup: function(record) {
        return Y.substitute(this.get("trTemplate"), {id:record.get("id")});
    },

    _createTdNodes: function(record, tr) {
        var i = 0,
            allKeys = this.get("columnset").get("keys"),
            len = allKeys.length,
            tds = [];

        for(; i<len; ++i) {
            tds.push(this._getTdNodeMarkup(record, allKeys[i]));
        }

        tr.appendChild(NODE.create(tds.join("")));
    },


    _getTdNodeMarkup: function(record, column) {
        var o = {};
        o.headers = column.get("headers");
        o.value = this.formatDataCell(record, column);
        return Y.substitute(this.tdTemplate, o);
    },

    formatDataCell: function(record, column) {
        var o = {};
        o.data = record.get("data");
        o.value = record.getValue(column.get("key"));
        return Y.substitute(this.get("tdValueTemplate"), o);
    }
});

Y.namespace("DataTable").Base = DTBase;



}, '@VERSION@' ,{lang:['en'], requires:['intl','substitute','widget','recordset']});

YUI.add('datatable-sort', function(Y) {

//TODO: break out into own component
var //getClassName = Y.ClassNameManager.getClassName,
    COMPARE = Y.ArraySort.compare,

    //DATATABLE = "datatable",
    ASC = "asc",
    DESC = "desc",
    //CLASS_ASC = getClassName(DATATABLE, "asc"),
    //CLASS_DESC = getClassName(DATATABLE, "desc"),
    //CLASS_SORTABLE = getClassName(DATATABLE, "sortable"),

    TEMPLATE_TH_LINK = '<a class="{link_class}" title="{link_title}" href="{link_href}">{value}</a>';


function RecordsetSort(field, desc, sorter) {
    RecordsetSort.superclass.constructor.apply(this, arguments);
}

Y.mix(RecordsetSort, {
    NS: "sort",

    NAME: "recordsetSort",

    ATTRS: {
        dt: {
        },

        defaultSorter: {
            value: function(recA, recB, field, desc) {
                var sorted = COMPARE(recA.getValue(field), recB.getValue(field), desc);
                if(sorted === 0) {
                    return COMPARE(recA.get("id"), recB.get("id"), desc);
                }
                else {
                    return sorted;
                }
            }
        }
    }
});

Y.extend(RecordsetSort, Y.Plugin.Base, {
    initializer: function(config) {
        this.addTarget(this.get("dt"));
        this.publish("sort", {defaultFn: Y.bind("_defSortFn", this)});
    },

    destructor: function(config) {
    },

    _defSortFn: function(e) {
        this.get("host").get("records").sort(function(a, b) {return (e.sorter)(a, b, e.field, e.desc);});
    },

    sort: function(field, desc, sorter) {
        this.fire("sort", {field:field, desc: desc, sorter: sorter|| this.get("defaultSorter")});
    },

    custom: function() {
        alert("sort custom");
    },

    // force asc
    asc: function() {
        alert("sort asc");
    },

    // force desc
    desc: function() {
        alert("sort desc");
    },

    // force reverse
    reverse: function() {
        alert("sort reverse");
    }
});

Y.namespace("Plugin").RecordsetSort = RecordsetSort;




function DataTableSort() {
    DataTableSort.superclass.constructor.apply(this, arguments);
}

Y.mix(DataTableSort, {
    NS: "sort",

    NAME: "dataTableSort",

    ATTRS: {
        sortedBy: {
            value: null
        }
    }
});

Y.extend(DataTableSort, Y.Plugin.Base, {
    thLinkTemplate: TEMPLATE_TH_LINK,

    initializer: function(config) {
        var dt = this.get("host");
        dt.get("recordset").plug(RecordsetSort, {dt: dt});
        
        //TODO: Don't use hrefs - use tab/arrow/enter
        //this.doBefore("_getThNodeMarkup", this._beforeGetThNodeMarkup);

        // Attach click handlers
        dt.on("theadCellClick", this._onEventSortColumn);

        // Attach UI hooks
        dt.after("recordsetSort:sort", function() {
            dt._uiSetRecordset(dt.get("recordset"));
        });
        dt.after("sortedByChangeEvent", function() {
            alert('ok');
        });

        //TODO
        //dt.after("recordset:mutation", function() {//reset sortedBy});
        
        //TODO
        //add Column sortFn ATTR
    },

    /*_beforeGetThNodeMarkup: function(o, column) {
        if(column.get("sortable")) {
            o.link_class = "foo";
            o.link_title = "bar";
            o.link_href = "bat";
            o.value = Y.substitute(this.thLinkTemplate, o);
        }
    },*/

    _onEventSortColumn: function(e) {
        e.halt();
        var column = this.get("columnset").get("hash")[e.target.get("id")],
            field = column.get("field"),
            prevSortedBy = this.get("sortedBy"),
            dir = (prevSortedBy &&
                prevSortedBy.field === field &&
                prevSortedBy.dir === ASC) ? DESC : ASC,
            sorter = column.get("sortFn");
        this.get("recordset").sort.sort(field, dir === DESC, sorter);
        this.set("sortedBy", {field: field, dir: dir});
    }
});

Y.namespace("Plugin").DataTableSort = DataTableSort;






}, '@VERSION@' ,{lang:['en'], requires:['plugin','datatable-base']});

YUI.add('datatable-colresize', function(Y) {

var GETCLASSNAME = Y.ClassNameManager.getClassName,

    DATATABLE = "datatable",

    //CLASS_RESIZEABLE = GETCLASSNAME(DATATABLE, "resizeable"),
    CLASS_LINER = GETCLASSNAME(DATATABLE, "liner"),
    TEMPLATE_LINER = '<div class="'+CLASS_LINER+'">{value}</div>';

function DataTableColResize() {
    DataTableColResize.superclass.constructor.apply(this, arguments);
}

Y.mix(DataTableColResize, {

    NS: "colresize",

    NAME: "dataTableColResize",

    ATTRS: {

    }
});

Y.extend(DataTableColResize, Y.Plugin.Base, {
    thLinerTemplate: TEMPLATE_LINER,

    tdLinerTemplate: TEMPLATE_LINER,

    initializer: function(config) {
        this.get("host").thTemplate = Y.substitute(this.get("host").thTemplate, {value: this.thLinerTemplate});
        this.get("host").tdTemplate = Y.substitute(this.get("host").tdTemplate, {value: this.tdLinerTemplate});


        //TODO Set Column width...
        /*if(oColumn.width) {
            // Validate minWidth
            var nWidth = (oColumn.minWidth && (oColumn.width < oColumn.minWidth)) ?
                    oColumn.minWidth : oColumn.width;
            // ...for fallback cases
            if(DT._bDynStylesFallback) {
                elTh.firstChild.style.overflow = 'hidden';
                elTh.firstChild.style.width = nWidth + 'px';
            }
            // ...for non fallback cases
            else {
                this._setColumnWidthDynStyles(oColumn, nWidth + 'px', 'hidden');
            }
        }*/
    }
});

Y.namespace('Plugin').DataTableColResize = DataTableColResize;



}, '@VERSION@' ,{requires:['plugin','dd','datatable-base']});



YUI.add('datatable', function(Y){}, '@VERSION@' ,{use:['datatable-base','datatable-sort','datatable-colresize']});
