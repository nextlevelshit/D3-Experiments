Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
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

$.ajax({
    url: 'http://en.wikipedia.org/w/api.php?action=query&list=categorymembers&cmnamespace=14&cmlimit=100&cmtitle=Category:Philosophy&format=json',
    dataType: 'json',
    cache: false,
    success: function( data, status ){
        alert('radi');
        alert(JSON.stringify(data));

        alert( data.responseData.results.length + ' results found!' );
    },
    error: function(xhr, textStatus, err) { //odstampaj textStatus, err jbt
        alert('ne radi');
        alert(textStatus);
        alert(err);
        alert("readyState: "+xhr.readyState+"\n xhrStatus: "+xhr.status);
        alert("responseText: "+xhr.responseText);
    }
});

var nodes       = [
        {id: 0, title: 'Philosophie'},
        {id: 1, parent: 0, title: 'Theoretische Philosophie'},
        {id: 2, parent: 0, title: 'Praktische Philosophie'},
        {id: 3, parent: 1, title: 'Metaphysik'},
        {id: 4, parent: 1, title: 'Erkenntnistheorie'},
        {id: 5, parent: 1, title: 'Philosophie des Geistes'},
        {id: 6, parent: 1, title: 'Sprachphilosophie'},
        {id: 7, parent: 2, title: 'Ethik'},
        {id: 8, parent: 2, title: 'Moralphilosophie'},
        {id: 9, parent: 7, title: 'Metaethik'},
        {id: 10, parent: 3, title: 'Spezielle Methaphysik'},
        {id: 11, parent: 4, title: 'Was ist Wissen?'},
        {id: 12, parent: 7, title: 'Diskreptive Ethik'},
        {id: 13, parent: 7, title: 'Normative Ethik'},
        {id: 14, parent: 5, title: 'Dualismus'},
        {id: 15, parent: 5, title: 'Materialismus'},
        {id: 16, parent: 5, title: 'Kognitionswissenschaften'},
        {id: 17, parent: 5, title: 'Monismus'},
        {id: 18, parent: 0, title: 'Ästhetik'},
        {id: 19, parent: 0, title: 'Antropologie'},
        {id: 20, parent: 1, title: 'Wissenschaftstheorie'},
        {id: 21, parent: 1, title: 'Logik'},
        {id: 22, parent: 1, title: 'Philosophie der Mathematik'},
        {id: 23, parent: 3, title: 'Allgemeine Methaphysik'},
        {id: 24, parent: 10, title: 'Was ist der Mensch?'},
        {id: 25, parent: 10, title: 'Gibt es ein göttliches Wesen?'},
        {id: 26, parent: 10, title: 'Gibt es eine Seele?'},
        {id: 27, parent: 10, title: 'Hat die Welt einen Anfang?'},
        {id: 28, parent: 23, title: 'Was gibt es?'},
        {id: 29, parent: 23, title: 'Was ist das Sein?'},
        {id: 30, parent: 23, title: 'Was ist eine Zahl?'},
        {id: 31, parent: 23, title: 'Was ist Zeit?'},
        {id: 32, parent: 23, title: 'Was ist Raum?'},
        {id: 33, parent: 23, title: 'Was ist ein Naturgesetz?'},
        {id: 34, parent: 11, title: 'Was ist Wahrheit?'},
        {id: 34, parent: 11, title: 'Was ist Wahrheit?'},
        {id: 35, parent: 11, title: 'Was ist eine Überzeugung?'},
        {id: 36, parent: 11, title: 'Was ist eine Rechtfertigung?'},
        {id: 37, parent: 34, title: 'Korrespondenztheorie'},
        {id: 38, parent: 34, title: 'Konsenstheorie'},
        {id: 39, parent: 34, title: 'Kohärenztheorie'},
        {id: 40, parent: 34, title: 'Defalationäre Theorie'},
        {id: 41, parent: 34, title: 'Sema(n)tische Theorie'},
        {id: 42, parent: 34, title: 'Epistemische Wahrheitstheorie'},
        {id: 43, parent: 40, title: 'Redundanztheorie'},
        {id: 44, parent: 40, title: 'Disquotationstheorie'}
    ],
    activeNodes = getActiveNodes(),
    //lastNodeId  = nodes.length,
    links       = generateLinks(nodes),
    activeLinks = generateLinks(activeNodes),
    labelAnchors = [],
    labelAnchorLinks = [];

// init D3 force layout
var force = d3.layout.force()
    .nodes(activeNodes)
    .links(activeLinks)
    .size([width, height])
    .linkDistance(function(d){
        //var length = 80;
        //console.log();
        return (d.source.path) ? 120 : 80;
    })
    .charge(-1600)
    .friction(0.9)
    .linkStrength(0.6)
    .on('tick', tick);

var force2 = d3.layout.force()
    .nodes(labelAnchors)
    .links(labelAnchorLinks)
    .gravity(0)
    .linkDistance(0)
    .linkStrength(1)
    .charge(-100)
    .size([width, height]);

// line displayed when dragging new nodes
/*var drag_line = svg.append('svg:path')
    .attr('class', 'link dragline hidden')
    .attr('d', 'M0,0L0,0');*/

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
    rootNode = null;

function resetMouseVars() {
    if (mousedown_node !== null)
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

    //var unActiveNodes = nodes.diff(activeNodes);
    var unActiveNodes = nodes;

    console.log("unActiveNodes:");
    console.log(nodes.diff(activeNodes));

    for (var i = 0; i < unActiveNodes.length; i++) {
        //console.log(nodes[i].parent + " / " + id);
        if (unActiveNodes[i].parent > -1) {
            //console.log(nodes[i].parent);
            if (unActiveNodes[i].parent == id) {
                children.push(unActiveNodes[i]);
                //console.log(unActiveNodes[i]);
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

    for (var i = 0; i < path.length; i++) {
        for (var j = 0; j < activeNodes.length; j++) {
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

function findPathNodesTo(node) {

    var path = [node];

    for (var i = 0; i < path.length; i++) {
        for (var j = 0; j < activeNodes.length; j++) {
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
 * Get all direct children of a node
 * @param node
 * @returns {Array}
 */

function getChildren(node) {
    var children = [];

    $.each(nodes, function(){
        if (this.parent == node.id) {
            children.push(this);
        }
    });

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
    if (!rootNode) {
        rootNode = nodes[0].id;
    }

    //console.log(selected_node);

    var newActiveNodes = [];

    for (var i = 0; i < nodes.length; i++) {
        if (nodes[i].parent == rootNode || nodes[i].id == rootNode) {
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
    }).attr('class', function (d) {
        return (d.source.path) ? 'path' : 'link';
    });

    circle
        .attr('transform', function (d) {
            return 'translate(' + d.x + ',' + d.y + ')';
        })
        .attr('class', function(d) {
            //console.log(d.path);
            return (d.path === true) ? 'entity trail' : 'entity';
        });

}

/**
 * Update graph (called when needed)
 */
function restart() {
    // path (link) group


    // update existing links
   /* path.classed('selected', function (d) {
        return d === selected_link;
    });*/

    /**
     * LINKS ===================
     * Defining and adding links
     * @type {*|void}
     */
    path = path.data(activeLinks);

    path.enter().append('svg:path')
        .attr('class', 'link'/*function (d) {
            //console.log(d.source.id + " (" + d.source.path + ") -- " + d.target.path + " (" + d.source.path + ")");

            //return (d.source.path === true) ? 'path' : 'link';
        }*/)
        .attr('stroke-width', function(d){
            return (getChildren(d.target).length + 4);
        })
        /*.classed('selected', function (d) {
            return d === selected_link;
        })*/
        /*.on('mousedown', function (d) {
         //if (d3.event.ctrlKey) return;

         // select link
         mousedown_link = d;
         if (mousedown_link === selected_link) selected_link = null;
         else selected_link = mousedown_link;
         //selected_node = null;
         restart();
         })*/;

    // remove old links
    path.exit().remove();


    //console.log(activeNodes);
    //$("#activeNodes").html(activeNodes.length);
    //$("#activeLinks").html(activeLinks.length);
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
        .attr('r', function (d) {
            return (d.path) ? 12 : 8;
        })
        .attr('class', function (d) {
            return (d.path) ? "node path" : "node";
        })
        /*.style('fill', function (d) {
         return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
         })*/;

    /**
     * NODES ===================
     * Defining and adding nodes
     * @type {*|void}
     */
    //var g = circle.enter().append('svg:g').on('mouseover', function (d) {alert('#')});
    var g = circle.enter()
        .append('svg:g')
        .attr('class', 'entity')
        .on('mousedown', function(d){
            mousedown_node = d;
            //mousedown(d);
        });

    //g.on('mouseover', function (d) {
    //    console.log("=== HOVER" + d);
    //});

    //console.log(g);

    //console.log(selected_node);

    g.append('svg:circle')
        .attr('class', 'transparent')
        .attr('r', 20)
        /*.on('mousedown', function (d) {
            console.log("=== HOVER");
        })*/;

    g.append('svg:circle')
        .attr('class', 'node')
        .attr('r', function (d) {
            //console.log(d.id + " -> " + d.path);
            console.log("==" + d.title + " " + d.path);
            return (d.path) ? 12 : 8;
        })
        /*.style('fill', function (d) {
         return (d === selected_node) ? d3.rgb(colors(d.id)).brighter().toString() : colors(d.id);
         })
         .style('stroke', function (d) {
         return d3.rgb(colors(d.id)).darker().toString();
         })*/
        .on('mouseover', function (d) {
            if (d.clicked) return;
            // Hovering node
            d3.select(this).attr('transform', function (d) {
                //return (d.path) ? 'scale(0.8)' : 'scale(1.5)';
            });//.transition('all').duration();
            mouseover_node = d;
            d.hovered = true;
            //console.log('mouseover');
        })
        .on('mouseout', function (d) {
            if (!d.hovered) return;
            // Unhovering node
            d3.select(this).attr('transform', '');
            mouseover_node = null;
            d.hovered = false;
            //console.log('mouseout');
        })
        .on('mouseup', function (d) {
            d.clicked = false;
            mousedown_node = null;
            //console.log('mouseup');
        })
        /*.on('mousedown', function (d) {
            //d.attr('w', 0);
            d.clicked = true;
            mousedown_node = d;
            selected_node = d;
            //console.log('mousedown');
        })*/;

    // show node IDs
    /*g.append('svg:text')
     .attr('x', -0.5)
     .attr('y', 4)
     .attr('class', 'id')
     .text(function (d) {
     return d.id;
     });*/


    // Show shadows of node titles
    g.append('svg:text')
        .attr('x', 12)
        .attr('y', 22)
        .attr('class', 'shadow')
        .text(function (d) {
            return d.title;
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


    /** LABELS ======
     *
     */
    var anchorLink = svg.selectAll("line.anchorLink").data(labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

    var anchorNode = svg
        .selectAll("g.anchorNode")
        .data(force2.nodes())
        .enter().append("svg:g")
        .attr("class", "anchorNode");

    anchorNode.append("svg:circle")
        .attr("r", 0)
        .style("fill", "#FFF");

    anchorNode.append("svg:text")
        .text(function (d, i) {
            return i % 2 == 0 ? "" : d.node.label
        });

    // set the graph in motion
    force.start();
}

orbit = force;

//drawOrbit(activeNodes);

function drawOrbit(_data) {

    //down with category20a()!!
    colors = d3.scale.category20b();

    orbitScale = d3.scale.linear().domain([1, 3]).range([3.8, 1.5]).clamp(true);
    radiusScale = d3.scale.linear().domain([0,1,2,3]).range([20,10,3,1]).clamp(true);


    /*orbit = d3.layout.orbit().size([1000,1000])
        .children(function(d) {return d.children})
        .revolution(function(d) {return d.depth})
        .orbitSize(function(d) {return orbitScale(d.depth)})
        .speed(5)
        .nodes(_data);*/
    orbit.orbitSize(function(d) {return orbitScale(d.depth)}).speed(5);

    d3.select("svg").selectAll("g.node").data(orbit.nodes())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")"});
    /* .on("mouseover", nodeOver)
     .on("mouseout", nodeOut)*/

    d3.selectAll("g.node")
        .append("circle")
        .attr("r", function(d) {return radiusScale(d.depth)})
        .style("fill", function(d) {return colors(d.depth)});

//  d3.select("svg").selectAll("circle.orbits")
//  .data(orbit.orbitalRings())
//  .enter()
//  .insert("circle", "g")
//  .attr("class", "ring")
//  .attr("r", function(d) {return d.r})
//  .attr("cx", function(d) {return d.x})
//  .attr("cy", function(d) {return d.y})
//  .style("fill", "none")
//  .style("stroke", "black")
//  .style("stroke-width", "1px")
//  .style("stroke-opacity", .15)

    /*orbit.on("tick", function() {
        d3.selectAll("g.node")
            .attr("transform", function(d) {return "translate(" +d.x +"," + d.y+")"});


    });*/

    //orbit.start();

    /*function nodeOver(d) {
     orbit.stop();
     d3.select(this).append("text").text(d.name).style("text-anchor", "middle").attr("y", 35);
     d3.select(this).select("circle").style("stroke", "black").style("stroke-width", 3);
     }

     function nodeOut() {
     orbit.start();
     d3.selectAll("text").remove();
     d3.selectAll("g.node > circle").style("stroke", "none").style("stroke-width", 0);
     }*/


}

/**
 * Triggering mouse click start
 */

function mousedown() {

    //var mousedown_node = clickedNode;

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
            if(mousedown_node.id != pathNodes[i].id) pathNodes[i].path = true;
            newNodes.push(pathNodes[i]);
        }

        //console.log(findNodesbyParentId(mousedown_node.id).length);

        // Open children nodes and remove quotes o non path nodes
        //if(findNodesbyParentId(mousedown_node.id).length > 0) {


        var removeNodes = activeNodes.diff(newNodes);
        var addNodes = newNodes.diff(pathNodes).diff(activeNodes);

        if(findNodesbyParentId(mousedown_node.id).length > 0) {
            for (var i = 0; i < removeNodes.length; i++) {
                removeNode(removeNodes[i].id);
            }
        }

        /*for (var i = 0; i < addNodes.length; i++) {


         addNodes[i].x = startingPoint.x;
         addNodes[i].y = startingPoint.y;
         activeNodes.push(addNodes[i]);
         activeLinks.push({source: findNode(addNodes[i].parent), target: findNode(addNodes[i].id)});
         }*/

        /*$.each(addNodes, function() {
         this.x = startingPoint.x;
         this.y = startingPoint.y;
         activeNodes.push(this);
         activeLinks.push({source: findNode(this.parent), target: findNode(this.id)});

         //$.delay(1000).restart();
         restart();

         // TODO: Find a smoother way do delay popping out new nodes
         });*/

        /*$.each(addNodes, function() {
         this.x = startingPoint.x;
         this.y = startingPoint.y;
         activeNodes.push(this);
         activeLinks.push({source: findNode(this.parent), target: findNode(this.id)});

         //$.delay(1000).restart();
         restart();

         // TODO: Find a smoother way do delay popping out new nodes
         });*/

        $(addNodes).each($).wait(100, function (index) {

            addNodes[index].x = startingPoint.x;
            addNodes[index].y = startingPoint.y;
            activeNodes.push(addNodes[index]);
            activeLinks.push({source: findNode(addNodes[index].parent), target: findNode(addNodes[index].id)});



            console.log("Adding node: " + addNodes[index].id);
            //$.delay(1000).restart();
            restart();

        });


        /**
         * Check if node have to be removed
         */
    }


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
