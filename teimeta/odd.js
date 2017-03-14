/**
 * odd.js
 * author: Christophe Parisse
 * lecture du fichier odd et préparation des commandes pour l'édition de la tei
 */

"use strict";

let dom = require('xmldom').DOMParser;
let xpath = require('xpath');
var parseString = require('xml2js').parseString;
var teiMeta = {};
let select = xpath.useNamespaces({
        "tei": "http://www.tei-c.org/ns/1.0",
        "xml": "",
        "exm": "http://www.tei-c.org/ns/Examples",
        "s": "http://purl.oclc.org/dsdl/schematron"
    });

export function ElementSpec() {
    this.ident = '';
    this.predeclare = '';
    this.desc = '';
    this.module = '';
    this.mode = '';
    this.content = null;
    this.usage = '';
}

export function Content() {
    this.one = [];
    this.zeroOrMore = [];
    this.oneOrMore = [];
    this.twoOrMore = [];
}

export function Element() {
    this.name = '';
    this.module = '';
    this.usage = '';
    this.mode = '';
    this.desc = '';
    this.attr = [];
    this.category = [];
    this.content = null;
}

export function Attr() {
    this.ident = '';
    this.value = '';
    this.val = null;
    this.usage = '';
    this.mode = '';
    this.desc = '';
}

export function Val() {
    this.type = '';
    this.mode = '';
    this.items = [];
}

export function ValItem() {
    this.ident = '';
    this.desc = '';
}

function valList(node) {
    let v = new Val();
    let valList = node.getElementsByTagName("valList");
    if (valList.length) {
        // find all about element
        let attr = valList[0].getAttribute("type");
        if (attr.length) v.type = attr[0].textContent;
        attr = valList[0].getAttribute("mode");
        if (attr.length) v.mode = attr[0].textContent;
        let valItem = node.getElementsByTagName("valItem");
        for (let k=0; k < valItem.length; k++) {
            let vi = new ValItem();
            attr = valItem[k].getAttribute("ident");
            if (attr) vi.ident = attr;
            let desc = valItem[k].getElementsByTagName("desc");
            if (desc.length>0) vi.desc = desc[0].textContent;
            v.items.push(vi);
        }
    }
    return v;
}

function parseElement(doc) {
    // DOM method
    // initialize DOM
    let doc1 = new dom().parseFromString(doc, 'text/xml');
    let el = new Element();
    // find all about element
    let attr = select('/exm:element/@name', doc1); // .value;
    if (attr.length) el.name = attr[0].textContent;
    attr = select('/exm:element/@module', doc1); // .value;
    if (attr.length) el.module = attr[0].textContent;
    attr = select('/exm:element/@usage', doc1); // .value;
    if (attr.length) el.usage = attr[0].textContent;

    let attList = select('/exm:element/exm:attList', doc1);
    for (let k=0; k < attList.length; k++) {
        let attDef = attList[k].getElementsByTagName("attDef");
        for (let l=0; l < attDef.length; l++) {
            let a = new Attr();
            attr = attDef[l].getAttribute("ident");
            if (attr) a.ident = attr;
            attr = attDef[l].getAttribute("usage");
            if (attr) a.usage = attr;
            attr = attDef[l].getAttribute("value");
            if (attr) a.value = attr;
            attr = attDef[l].getAttribute("mode");
            if (attr) a.mode = attr;
            let desc = attDef[l].getElementsByTagName("desc");
            if (desc.length>0) a.desc = desc[0].textContent;
            a.val = valList(attDef[l]);
            el.attr.push(a);
        }
    }

    let category = select('/exm:element/exm:category', doc1);
    for (let k=0; k < category.length; k++) {
        let cat = category[k].getElementsByTagName("catDesc");
        let vi = new Val();
        for (let l=0; l < cat.length; l++) {
            attr = cat[l].getAttribute("xml:lang");
            if (attr && attr === 'fr') {
                vi.desc = cat[l].textContent;
            }
            if (!vi.desc) vi.desc = cat[l].textContent;
        }
        attr = category[k].getAttribute("xml:id");
        if (attr) vi.ident = attr;
        el.category.push(vi);
    }
 
    let desc = select('/exm:element/exm:desc', doc1);
    if (desc.length>0) el.desc = desc[0].textContent;

    let content = select('/exm:element/exm:content', doc1);
    if (content.length > 1) {
        console.log("content différent de 1 at ", et.name);
    }
    if (content.length > 0)
        el.content = parseContent(content[0].toString());
    return el;
}

function parseContent(doc) {
    // DOM method
    // initialize DOM
    let doc1 = new dom().parseFromString(doc, 'text/xml');
    let ei = new Content();
    // find all elements
    let content = select('/exm:content/exm:element', doc1);
    for (let k=0; k < content.length; k++)
        ei.one.push(parseElement(content[k].toString()));
    content = select('/exm:content/exm:one/exm:element', doc1);
    for (let k=0; k < content.length; k++)
        ei.one.push(parseElement(content[k].toString()));
    content = select('/exm:content/exm:oneOrMore/exm:element', doc1);
    for (let k=0; k < content.length; k++)
        ei.oneOrMore.push(parseElement(content[k].toString()));
    content = select('/exm:content/exm:zeroOrMore/exm:element', doc1);
    for (let k=0; k < content.length; k++)
        ei.zeroOrMore.push(parseElement(content[k].toString()));
    content = select('/exm:content/exm:twoOrMore/exm:element', doc1);
    for (let k=0; k < content.length; k++)
        ei.twoOrMore.push(parseElement(content[k].toString()));
    return ei;
}

export function loadOdd(data) {
    // get XML ready
    let parser = new DOMParser();
    // let doc = parser.parseFromString(data, "text/xml");
    let doc = new dom().parseFromString(data.toString(), 'text/xml');
    let eSpec = [];
    let nodes = select("//exm:elementSpec", doc);
    for (let i=0; i < nodes.length ; i++) {
        // console.log(nodes[i]);
        let s = nodes[i].toString();
        let esElt = new ElementSpec();

        // DOM method
        // initialize DOM
        let doc1 = new dom().parseFromString(s, 'text/xml');
        // find all elementSpec
        let attr = select('/exm:elementSpec/@ident', doc1); // .value;
        if (attr.length) esElt.ident = attr[0].textContent;
        attr = select('/exm:elementSpec/@module', doc1); // .value;
        if (attr.length) esElt.module = attr[0].textContent;
        attr = select('/exm:elementSpec/@mode', doc1); // .value;
        if (attr.length) esElt.mode = attr[0].textContent;
        attr = select('/exm:elementSpec/@predeclare', doc1); // .value;
        if (attr.length) esElt.predeclare = attr[0].textContent;

        let desc = select('/exm:elementSpec/exm:desc', doc1);
        if (desc.length>0) esElt.desc = desc[0].textContent;

        let content = select('/exm:elementSpec/exm:content', doc1);
        if (content.length > 1) {
            console.log("content différent de 1 at ", esElt.ident);
        }
        if (content.length > 0)
            esElt.content = parseContent(content[0].toString());

        // xml2js method
        /*
        let ei2 = new EditInfo();
        parseString(s, function (err, result) {
            // console.log(result);
            if (result.elementSpec.$.ident)
                ei2.ident = result.elementSpec.$.ident;
            if (result.elementSpec.desc && result.elementSpec.desc.length>0)
                ei2.desc = result.elementSpec.desc[0];
            if (result.elementSpec.content && result.elementSpec.content.length>0) {
                let c = result.elementSpec.content[0];
                if (c.element && c.element.length>0) {
                    for (let k=0; k < c.element.length; k++)
                        ei2.one.push(parseElement(c.element[k].toString()));
                }
            }
            console.log(ei2);
        });
        */
        eSpec.push(esElt)
    }
    console.log(eSpec);
    return eSpec;
}
