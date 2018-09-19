/**
 * @todo
 * [x] look at a boolean on the dataviewobject and effect either single- 
 *      or multi-selection based on that boolean
 */
import {
    defineWidget,
    log,
    runCallback,
} from 'widget-base-helpers';

import registry from 'dijit/registry';
import query from 'dojo/query';
import dojoClass from 'dojo/dom-class';

export default defineWidget('ListViewMultiselect', false, {
    classToToggle: "",
    dataViewName: "",
    dataViewEntity: "",
    pathToListEntity: "",
    target: null,
    multiSelectAttr: null,

    _obj: null,
    _dataViewObj: null,
    _referenceSet: null,
    _connected: false,
    _elementToApplyTo: null,

    constructor() {
        this.log = log.bind(this);
        this.runCallback = runCallback.bind(this);
    },

    postCreate() {
        log.call(this, 'postCreate', this._WIDGET_VERSION);

        switch (this.target) { //Select the right element to apply the listner and toggle class to
            case "ROW":
                this._elementToApplyTo = this.domNode.closest(".mx-templategrid-row");
                break;
            case "ITEM":
                this._elementToApplyTo = this.domNode.closest(".mx-listview-item");
                break;
            case "PARENT":
                this._elementToApplyTo = this.domNode.parentNode;
                break;
            case "SIBLING":
                this._elementToApplyTo = this.domNode.previousSibling;
                break;
            default:
                this._elementToApplyTo = this.domNode.parentNode;
        }

    },
    update(obj, callback) {
        this._obj = obj;

        this._referenceSet = this.pathToListEntity.split('/')[0];
        const dvNode = query(".mx-name-" + this.dataViewName)[0];
        // wait for the dataview node to be loaded
        var act = function (obj) {
            this._dataViewObj = obj;
            this._ensureSelectionState();
            if (!this._connected) {
                this.connect(this._elementToApplyTo, "click", this._onClick.bind(this));
            }
            this._connected = true;
            this._resetSubscriptions();
            if (callback) {
                callback();
            }
        }.bind(this);
        var counter = 0;
        var wait = setInterval(function () {
            var q = dvNode && registry.byNode(dvNode)._mxObject;
            if (q) {
                clearInterval(wait);
                console.log('clearing interval');
                act(q)
            } else if (counter > 50) {
                clearInterval(wait);
                if (callback) callback();
            }
            else {
                counter++;
            }
        }.bind(this), 100)

    },
    _ensureSelectionState() {
        if (this._checkSelected()) {
            this._displaySelected();
        } else {
            this._displayDeselected();
        }
    },
    _checkSelected() {
        return this._dataViewObj.get(this._referenceSet).indexOf(this._obj.getGuid()) > -1;
        // return this._dataViewObj.jsonData.attributes[this._referenceSet].value.indexOf(this._obj.getGuid()) > -1;
    },
    _onClick() {
        if (this.multiSelectAttr && this._dataViewObj.get(this.multiSelectAttr) === false) {
            this._select();
        }
        else {
            // multi
            if (this._checkSelected()) {
                this._deselect();
            } else {
                this._select();
            }
        }

    },
    _select() {
        if (this.multiSelectAttr && this._dataViewObj.get(this.multiSelectAttr) === false) {
            this._dataViewObj.set(this._referenceSet, [this._obj.getGuid()]);
        }
        else {
            this._dataViewObj.addReference(this._referenceSet, this._obj.getGuid());
        }
        mx.data.update({
            guid: this._dataViewObj.getGuid(),
        });
        this._displaySelected();
    },
    _displaySelected() {
        dojoClass.add(this._elementToApplyTo, this.classToToggle);
    },
    _deselect() {
        this._dataViewObj.removeReferences(this._referenceSet, [this._obj.getGuid()]);
        mx.data.update({
            guid: this._dataViewObj.getGuid(),
        });
        this._displayDeselected();
    },
    _displayDeselected() {
        dojoClass.remove(this._elementToApplyTo, this.classToToggle);
    },
    _resetSubscriptions() {
        this.unsubscribeAll();
        this.subscribe({
            guid: this._dataViewObj.getGuid(),
            attr: this._referenceSet,
            callback: this._ensureSelectionState.bind(this),
        });
        this.subscribe({
            guid: this._dataViewObj.getGuid(),
            callback: this._ensureSelectionState.bind(this),
        });
    },
});
