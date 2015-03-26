module.exports = function (window) {
    "use strict";

    require('itags.core')(window);

    var itagName = 'i-label', // <-- define your own itag-name here
        DOCUMENT = window.document,
        ITSA = window.ITSA,
        Event = ITSA.Event,
        Itag;

    if (!window.ITAGS[itagName]) {

        Event.after('tap', function(e) {
            var labelNode = e.target,
                iform = labelNode.inside('i-form'),
                selector, focusNode;
            if (iform && iform.model['active-labels']) {
                selector = iform.getFocusManagerSelector(),
                focusNode = labelNode.next(selector, iform);
                focusNode && focusNode.focus();
            }
        }, 'i-label');

        Itag = DOCUMENT.defineItag(itagName, {
            attrs: {
                content: 'string'
            },

            init: function() {
                var element = this,
                    designNode = element.getItagContainer(),
                    content = designNode.getHTML();
                // when initializing: make sure NOT to overrule model-properties that already
                // might have been defined when modeldata was boundend. Therefore, use `defineWhenUndefined`
                // element.defineWhenUndefined('someprop', somevalue); // sets element.model.someprop = somevalue; when not defined yet
                element.defineWhenUndefined('content', content);

                if (element.getParent()) {
                    // already in the dom --> we can encapsulate
                    element.encapsulate();
                    element._waitBeforeReady = window.Promise.resolve();
                }
                else {
                    element._waitBeforeReady = window.Promise.manage();
                    element.selfOnceAfter('UI:nodeinsert', function() {
                        element.encapsulate();
                        element._waitBeforeReady.fulfill();
                    });
                }
                // set the inner-content of the label will be done when syncing
            },

            encapsulate: function() {
                var element = this,
                    prevSuppress = DOCUMENT._suppressMutationEvents || false,
                    parentNode = element.getParent(),
                    parentVNode = parentNode.vnode,
                    rowNode, rowVNode, vnode, vChildNodes, i, len, absorbed, noblock;
                DOCUMENT.suppressMutationEvents(true);
                rowNode = parentNode.prepend('<div class="i-formrow"></div>', false, element);
                rowVNode = rowNode.vnode;
                // now absorb all next nodes, and finish when an i-form-element has been absorbed:
                vChildNodes = parentVNode.vChildNodes;
                i = vChildNodes.indexOf(rowVNode) + 1;
                len = vChildNodes.length;
                // i doesn't change: it is len that will decrease, because we absorb items
                while (!absorbed && (i<=(--len))) {
                    vnode = vChildNodes[i];
                    rowVNode._appendChild(vnode);
                    absorbed = vnode.isItag && (vnode.tag!=='I-LABEL');
                    if (absorbed) {
                        // noblock = vnode.domNode.keepInline();
                        noblock = (vnode.tag==='I-CHECKBOX');
                    }
                }
                absorbed && noblock && rowNode.setClass('itag-noblock');
                DOCUMENT.suppressMutationEvents(prevSuppress);
            },

            itagReady: function() {
                var element = this;
                element._itagReady || (element._itagReady=window.Promise.manage());
                return element._itagReady.then(element._waitBeforeReady);
            },

            decapsulate: function() {
                var element = this,
                    prevSuppress = DOCUMENT._suppressMutationEvents || false,
                    rowVNode = element.vnode.vParent,
                    parentVNode = rowVNode.vParent,
                    vnode;
                DOCUMENT.suppressMutationEvents(true);
                // set all childnodes to parent:
/*jshint boss:true */
                while (vnode=rowVNode.vChildNodes[0]) {
/*jshint boss:false */
                    parentVNode._insertBefore(vnode, rowVNode);
                }
                // now remove rowVNode:
                parentVNode._removeChild(rowVNode);
                DOCUMENT.suppressMutationEvents(prevSuppress);
            },

            sync: function() {
                var element = this;
                element.setHTML(element.model.content);
            },

            destroy: function() {
                this.decapsulate();
            }
        });

        window.ITAGS[itagName] = Itag;
    }

    return window.ITAGS[itagName];
};
