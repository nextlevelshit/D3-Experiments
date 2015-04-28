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
        {id: 0, title: 'Die Wurzel allen Bösen'},
        {id: 1, parent: 0, title: 'Kriege'},
        {id: 2, parent: 0, title: 'Politik'},
        {id: 3, parent: 2, title: 'Korruption'},
        {id: 4, parent: 2, title: 'Mafia'},
        {id: 5, parent: 4, title: 'Industrie'},
        {id: 6, parent: 4, title: 'Drogen'},
        {id: 7, parent: 4, title: 'Prostitution'},
        {id: 8, parent: 7, title: 'Hamburg'},
        {id: 9, parent: 7, title: 'Berlin'},
        {id: 10, parent: 7, title: 'Hannover'},
        {id: 11, parent: 2, title: 'Vetternwirtschaft'}
    ],
    activeNodes = getActiveNodes(),
    lastNodeId  = nodes.length,
    links       = generateLinks(nodes),
    activeLinks = generateLinks(activeNodes);

// init D3 force layout
var force = d3.layout.force()
    .nodes(nodes)
    .links(activeLinks)
    .size([width, height])
    .linkDistance(50)
    .charge(-1000)
    //.linkStrength(0.8)
    .on('tick', tick)

// line displayed when dragging new nodes
var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');

// handles to link and node element groups
var path   = svg.append('svg:g').selectAll('path'),
    circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node  = null,
    selected_link  = null,
    mousedown_link = null,
    mousedown_node = null,
    mouseover_node = null,
    mouseup_node   = null,
    active_nodes   = null,
    active_links   = null,
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
        if (nodes[i].id === id)
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
    if(active_root_id !== null) active_root_id = nodes[0].id;

    //console.log(active_root_id);

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

    // add new links
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
            selected_node = null;
            restart();
        });

    // remove old links
    path.exit().remove();


    // circle (node) group
    // NB: the function arg is crucial here! nodes are known by id, not by index!
    circle = circle.data(activeNodes, function (d) {
        return d.id;
    });

    // update existing nodes (reflexive & selected visual states)
    circle.selectAll('circle')
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .classed('reflexive', function (d) {
            return d.reflexive;
        });

    /**
     * NODES ===================
     * Defining and adding nodes
     * @type {*|void}
     */
    var g = circle.enter().append('svg:g');

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', 10)
        .style('fill', function (d) {
            return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
        })
        .style('stroke', function (d) {
            return d3.rgb(colors(d.id)).darker().toString();
        })
        .classed('reflexive', function (d) {
            return d.reflexive;
        })
        .on('mouseover', function (d) {
            if (d.clicked) return;
            // Hovering node
            d3.select(this).attr('transform', 'scale(1.5)')//.transition().duration('1000ms');
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

        var point = d3.mouse(this),
            node = {id: nodes.length, parent: mousedown_node.id};
            node.x = point[0];
            node.y = point[1];
            //nodes.push(node);
            //activeNodes.push(node);
            //activeLinks.push({source: findNode(node.parent), target: findNode(node.id)});

        var newNodes = findNodesbyParentId(mousedown_node.id);

        if (newNodes) {
            console.log(newNodes);
            for (var i = 0; i < newNodes.length; i++) {
                newNodes[i].x = point[0];
                newNodes[i].y = point[1];
                //nodes.push(newNodes[i]);
                activeNodes.push(newNodes[i]);
                activeLinks.push({source: findNode(mousedown_node.id), target: findNode(newNodes[i].id)});
            }
            //nodes.push(newNodes[0]);
            //activeNodes.push(newNodes[0]);
            //activeLinks.push({source: findNode(mousedown_node.id), target: findNode(newNodes[0].id)});
        }

        //console.log(newNodes);




        //console.log(nodes);
        //console.log("clicked on node");
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
