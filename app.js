Array.prototype.diff = function(a) {
    return this.filter(function(i) {return a.indexOf(i) < 0;});
};

// set up SVG for D3
var width  = $("body").innerWidth(),
    height = $("body").innerHeight(),
    colors = d3.scale.category10();

var svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height);

// set up initial nodes and links
//  - nodes are known by 'id', not by index in array.
//  - reflexive edges are indicated on the node (as a bold black circle).
//  - links are always source < target; edge directions are set by 'left' and 'right'.
var nodes       = [
        {id: 0, title: 'Datenbanken'},
        {id: 1, parent: 0, title: 'Modelle'},
        {id: 2, parent: 0, title: 'Geschichte'},
        {id: 3, parent: 1, title: 'Relational'},
        {id: 4, parent: 3, title: 'MySQL'},
        {id: 5, parent: 3, title: 'PostgreSQL'},
        {id: 6, parent: 3, title: 'MariaDB'},
        {id: 7, parent: 1, title: 'Objektorientiert'},
        {id: 8, parent: 1, title: 'Dokumentenbasiert'},
        {id: 9, parent: 1, title: 'Graphendatenbanken'},
        {id: 10, parent: 7, title: 'Hannover'},
        {id: 11, parent: 2, title: 'Vetternwirtschaft'},
        {id: 12, parent: 1, title: 'Irak'},
        {id: 13, parent: 12, title: 'Erster Irak-Krieg'},
        {id: 14, parent: 13, title: '19XX'}
    ],
    activeNodes = getActiveNodes(),
    lastNodeId  = nodes.length,
    links       = generateLinks(nodes),
    activeLinks = generateLinks(activeNodes);

// init D3 force layout
var force = d3.layout.force()
    .nodes(activeNodes)
    .links(activeLinks)
    .size([width, height])
    .linkDistance(100)
    .charge(-1000)
    //.friction(0.5)
    //.linkStrength(0.8)
    .on('tick', tick);

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path   = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node  = nodes[0],
    selected_link  = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseover_node = null,
    mouseup_node   = null,
    active_root_id = null;

function resetMouseVars() {
    if(mousedown_node !==null)
        findNode(mousedown_node.id).clicked = false;

    mousedown_node = null;
    mouseup_node = null;
    mousedown_link = null;
}

/**
 * Find node by ID
 * @param id
 * @returns {*}
 */

function findNode(id) {
    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].id == id)
            return nodes[i];
    }
}

/**
 * Find child nodes by ID of parent node
 * @param id
 * @returns {*}
 */

function findNodesbyParentId(id) {
    var children = [];

    // TODO: Get unActiveNodes = nodes - activeNodes

    for (var i = 0; i < nodes.length; i++) {
        //console.log(nodes[i].parent + " / " + id);
        if(nodes[i].parent > -1) {
            //console.log(nodes[i].parent);
            if (nodes[i].parent == id) {
                children.push(nodes[i]);
            }
        }
    }
    //console.log(children);
    return children;
}

/**
 * Find active path node id's from node id to root node
 * @param id
 * @param path
 * @returns {*}
 */

function findPathTo(id, path) {

    if (!path) var path = [id];

    for (var i = 0; i < path.length; i++){
        for (var j = 0; j < activeNodes.length; j++){
            if (activeNodes[j].id == findNode(path[i]).parent) {
                path.push(activeNodes[j].id);
            }
        }
    }

    return path;
}

/**
 * Find path nodes
 * @param id
 * @param path
 * @returns {*}
 */

function findPathNodesTo(node, path) {

    if (!path) var path = [node];

    for (var i = 0; i < path.length; i++){
        for (var j = 0; j < activeNodes.length; j++){
            if (activeNodes[j].id == findNode(path[i].id).parent) {
                activeNodes[j].path = true;
                path.push(activeNodes[j]);
            } else {
                activeNodes[j].path = false;
            }
        }
    }

    return path;
}

/**
 * Generate links by nodes object
 * @params nodes
 * @returns {Array}
 */

function generateLinks(n) {
    if (!n.length) return;

    var newLinks = [];

    for (var i = 0; i < n.length; i++) {
        if (n[i].parent > -1) {
            newLinks.push({
                source: findNode(n[i].parent),
                target: findNode(n[i].id)
            });
        }

    }

    return newLinks;
}

/**
 * Get all active nodes by active_root_id
 * @returns {Array}
 */

function getActiveNodes() {
    if(active_root_id !== null) {
        active_root_id = nodes[0].id;
    }

    //console.log(selected_node);

    var newActiveNodes = [];

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].parent == active_root_id || nodes[i].id == active_root_id) {
            //console.log(nodes[i]);
            newActiveNodes.push(nodes[i]);
        }
    }

    return newActiveNodes;
}

/**
 * Update force layout (called automatically each iteration)
 */

function tick() {
    // draw directed edges with proper padding from node centers
    path.attr('d', function (d) {
        var deltaX = d.target.x - d.source.x,
            deltaY = d.target.y - d.source.y,
            dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
            normX = deltaX / dist,
            normY = deltaY / dist,
            sourcePadding = d.left ? 17 : 12,
            targetPadding = d.right ? 17 : 12,
            sourceX = d.source.x + (sourcePadding * normX),
            sourceY = d.source.y + (sourcePadding * normY),
            targetX = d.target.x - (targetPadding * normX),
            targetY = d.target.y - (targetPadding * normY);
        return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
    });

    circle.attr('transform', function (d) {
        return 'translate(' + d.x + ',' + d.y + ')';
    });
}

/**
 * Update graph (called when needed)
 */
function restart() {
    // path (link) group
    path = path.data(activeLinks);

    // update existing links
    path.classed('selected', function (d) {
        return d === selected_link;
    });

    /**
     * Defining and adding links
     */
    path.enter().append('svg:path')
        .attr('class', 'link')
        .classed('selected', function (d) {
            return d === selected_link;
        })
        .on('mousedown', function (d) {
            //if (d3.event.ctrlKey) return;

            // select link
            mousedown_link = d;
            if (mousedown_link === selected_link) selected_link = null;
            else selected_link = mousedown_link;
            //selected_node = null;
            restart();
        });

    // remove old links
    path.exit().remove();


    //console.log(activeNodes);
    $("#activeNodes").html(activeNodes.length);
    $("#activeLinks").html(activeLinks.length);
    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(activeNodes, function (d) {
        //if (d.id != selected_node.parent && d.id != selected_node.id) return;
        //console.log("active " + d.id);
        return d.id;
    });

    //console.log(circle);

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .attr('r', function (d){
            return (d.path) ? 20 : 10;
        })
        .attr('class', function(d) {
            return (d.path) ? "node path" : "node";
        })
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        });

    /**
     * NODES ===================
     * Defining and adding nodes
     * @type {*|void}
     */
    var g = circle.enter().append('svg:g');

    //console.log(selected_node);

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', function (d){
            console.log(d.id + " -> " + d.path);
            return (d.path) ? 20 : 10;
        })
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .style('stroke', function (d) {
            return d3.rgb(colors(d.id)).darker().toString();
        })
        .on('mouseover', function (d) {
            if (d.clicked) return;
            // Hovering node
            d3.select(this).attr('transform', 'scale(1.5)')//.transition('all').duration();
            mouseover_node = d;
            d.hovered = true;
            //console.log('mouseover');
        })
        .on('mouseout', function (d) {
            if(!d.hovered) return;
            // Unhovering node
            d3.select(this).attr('transform', '');
            mouseover_node = null;
            d.hovered = false;
            //console.log('mouseout');
        })
        .on('mousedown', function (d) {
            d.clicked = true;
            mousedown_node = d;
            selected_node = d;
            //console.log('mousedown');
        })
        .on('mouseup', function (d) {
            d.clicked = false;
            mousedown_node = null;
            //console.log('mouseup');
        });

    // show node IDs
    g.append('svg:text')
        .attr('x', -0.5)
        .attr('y', 4)
        .attr('class', 'id')
        .text(function (d) {
            return d.id;
        });

    // Show node titles
    g.append('svg:text')
        .attr('x', 10)
        .attr('y', 20)
        .attr('class', 'title')
        .text(function (d) {
            return d.title;
        });

    // remove old nodes
    circle.exit().remove();

    // set the graph in motion
    force.start();
}

/**
 * Triggering mouse click start
 */

function mousedown() {

    if (mousedown_node !== null) {

        console.log("== mousedown ===============");

        //activeNodes = [];
        //activeLinks = [];

        var pathNodes = findPathNodesTo(mousedown_node);

        var point = d3.mouse(this),
            node = {id: nodes.length, parent: mousedown_node.id};
        node.x = point[0];
        node.y = point[1];

        var newNodes = findNodesbyParentId(mousedown_node.id),
            startingPoint = {x: mousedown_node.x, y: mousedown_node.y};

        for (var i = 0; i < pathNodes.length; i++) {
            newNodes.push(pathNodes[i]);
            pathNodes[i].path = true;
        }

        var removeNodes = activeNodes.diff(newNodes);
        var addNodes = newNodes.diff(pathNodes).diff(activeNodes);

        for (var i = 0; i < removeNodes.length; i++) {
            removeNode(removeNodes[i].id);
        }

        /*for (var i = 0; i < addNodes.length; i++) {


            addNodes[i].x = startingPoint.x;
            addNodes[i].y = startingPoint.y;
            activeNodes.push(addNodes[i]);
            activeLinks.push({source: findNode(addNodes[i].parent), target: findNode(addNodes[i].id)});
        }*/

        $.each(addNodes, function() {
            this.x = startingPoint.x;
            this.y = startingPoint.y;
            activeNodes.push(this);
            activeLinks.push({source: findNode(this.parent), target: findNode(this.id)});

            //$(document).w(1000);
            // TODO: Find way do delay poping out new nodes
        });


        /**
         * Check if node have to be removed
         */
    }

    restart();
}

/**
 * Triggering mouse move
 */

function mousemove() {

}

/**
 * Triggering mouse click end
 */

function mouseup() {
    resetMouseVars();
    //console.log(mousedown_node);
}

function spliceLinksForNode(node) {
    var toSplice = links.filter(function (l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function (l) {
        links.splice(links.indexOf(l), 1);
    });
}

/**
 * Removing node and its links
 * @param id
 */

function removeNode(id) {
    var i = 0;
    var n = findNode(id);

    // Removing links

    while (i < activeLinks.length) {
        if ((activeLinks[i].source.id == id) || (activeLinks[i].target.id == id)) {
            //console.log("Removing link from " + activeLinks[i].source.id + " to " + activeLinks[i].target.id);
            activeLinks.splice(i, 1);
        } else {
            i++;
        }
    }

    // Removing node

    var index = n.index;
    if (index !== undefined) {
        console.log("Removing node " + id);
        activeNodes.splice(index, 1);
    }

    restart();
}

// only respond once per keydown
var lastKeyDown = -1;

function keydown() {

}

function keyup() {
}

// app starts here
svg.on('mousedown', mousedown)
    .on('mousemove', mousemove)
    .on('mouseup', mouseup);
d3.select(window)
    .on('keydown', keydown)
    .on('keyup', keyup);
restart();
