Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

var hydra = {

    // Options
    rootCategory: '',

    language: 'en',


    // set up SVG for D3
    width: $("body").innerWidth(),

    getWidth: function() {
        return this.width;
    },

    height: $("body").innerHeight(),

    getHeight: function() {
        return this.height;
    },

    //test: this.width,



    //var orbit = force;

    /**
     * Update graph (called when needed)
     */
    restart: function () {

        //console.log('restart()');
        //console.log(this);



        var that = this,
            width = this.width,
            height = this.height,
            nodes = this.nodes,
            links = this.links;
        /**
         * LINKS ===================
         * Defining and adding links
         * @type {*|void}
         */
        this.path = this.path.data(this.links);

        this.path.enter().append('svg:path')
            .attr('class', 'link')
            .attr('stroke-width', function (d) {
                return (this.getChildren(d.target).length + 4);
            }.bind(this));

        // remove old links
        this.path.exit().remove();

        // circle (node) group
        // NB: the function arg is crucial here! nodes are known by id, not by index!
        this.circle = this.circle.data(this.nodes, function (d) {
            return d.id;
        });

        // update existing nodes (reflexive & selected visual states)
        this.circle.selectAll('circle')
            .attr('r', function (d) {
                return (d.path) ? 12 : 8;
            })
            .attr('class', function (d) {
                //return (d.path) ? "node path" : "node";
                return 'node';
            });

        /**
         * NODES ===================
         * Defining and adding nodes
         * @type {*|void}
         */
        var g = this.circle.enter()
            .append('svg:g')
            .attr('class', 'entity')
            .on('mousedown', function (d) {
                this.mousedown_node = d;
                //console.log(this);
            }.bind(this));

        g.append('svg:circle')
            .attr('class', 'transparent')
            .attr('r', 20);

        g.append('svg:circle')
            .attr('class', 'node')
            .attr('r', function (d) {
                return (d.path) ? 12 : 8;
            })
            .on('mouseover', function (d) {
                if (d.clicked) return;
                // Hovering node
                d3.select(this).attr('transform', function (d) {
                    //return (d.path) ? 'scale(0.8)' : 'scale(1.5)';
                });
                that.mouseover_node = d;
                d.hovered = true;
            })
            .on('mouseout', function (d) {
                if (!d.hovered) return;
                // Unhovering node
                d3.select(this).attr('transform', '');
                that.mouseover_node = null;
                d.hovered = false;
            })
            .on('mouseup', function (d) {
                d.clicked = false;
                this.mousedown_node = null;
            }.bind(this));

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
        this.circle.exit().remove();


        /** LABELS ======
         *
        var anchorLink = this.svg.selectAll("line.anchorLink").data(that.labelAnchorLinks)//.enter().append("svg:line").attr("class", "anchorLink").style("stroke", "#999");

        var anchorNode = this.svg
            .selectAll("g.anchorNode")
            .data(that.force.nodes())
            .enter().append("svg:g")
            .attr("class", "anchorNode");

        anchorNode.append("svg:circle")
            .attr("r", 0)
            .style("fill", "#FFF");

        anchorNode.append("svg:text")
            .text(function (d, i) {
                //return i % 2 == 0 ? "" : d.node.label
            });
         */

        // set the graph in motion
        this.force.start();
    },
    /**
     * Get categories by php proxy from wikipedia
     */
    getData : function (category, parent) {

        //console.log('getData('+category+','+parent+')');

        var request = $.ajax({
            url: 'json/getSubCategories.php?category=' + category + '&lang=' + this.language,
            type: 'GET',
            dataType: 'jsonp',
            async: false
        });

        if (request.statusText != 'OK') return false;

        var response = JSON.parse(request.responseText);

        var result = [];

        $.each(response, function () {
            this.parent = parent;
            //console.log(this);
            //node.push('parent', parent);
            //
            result.push(this);
        });

        //console.log('return');
        //console.log(result);

        return result;
    },
    /**
     * Generate first level children of the root node
     * @returns {{title: string, id: number}[]}
     */
    getStartingNodes : function () {
        var nodes = [{'title': this.rootCategory, 'id': 0}];

        $.each(this.getData(this.rootCategory, 0), function () {
            nodes.push(this);
        });

        return nodes;
    },
    /**
     * Find node by ID
     * @param id
     * @returns {*}
     */
    findNode : function (id) {
        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i].id == id)
                return this.nodes[i];
        }
    },
    /**
     * Find child nodes by ID of parent node
     * @param id
     * @returns {*}
     */
    findNodesbyParentId : function (id) {

        console.log('findNodesbyParentId('+id+')');

        var children = [];

        // TODO: Get unActiveNodes = nodes - activeNodes

        //var unActiveNodes = nodes.diff(activeNodes);
        var unActiveNodes = this.nodes;
        console.log('this.nodes = ');
        console.log(this.nodes);

        //console.log("unActiveNodes:");
        //console.log(this.nodes.diff(this.nodes));

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
        console.log('return');
        console.log(children);
        return children;
    },
    /**
     * Find active path node id's from node id to root node
     * @param id
     * @param path
     * @returns {*}
     */
    findPathTo : function (id, path) {

        if (!path) var path = [id];

        for (var i = 0; i < path.length; i++) {
            for (var j = 0; j < this.nodes.length; j++) {
                if (this.nodes[j].id == this.findNode(path[i]).parent) {
                    path.push(this.nodes[j].id);
                }
            }
        }

        return path;
    },
    /**
     * Find path nodes
     * @param id
     * @param path
     * @returns {*}
     */
    findPathNodesTo : function (node) {

        console.log('findPathNodesTo()');

        var path = [node];

        for (var i = 0; i < path.length; i++) {
            for (var j = 0; j < this.nodes.length; j++) {
                if (this.nodes[j].id == this.findNode(path[i].id).parent) {
                    this.nodes[j].path = true;
                    path.push(this.nodes[j]);
                } else {
                    this.nodes[j].path = false;
                }
            }
        }

        return path;
    },
    /**
     * Get all direct children of a node
     * @param node
     * @returns {Array}
     */
    getChildren : function (node) {
        var children = [];

        $.each(this.nodes, function () {
            if (this.parent == node.id) {
                children.push(this);
            }
        });

        return children;
    },
    /**
     * Generate links by nodes object
     * @params nodes
     * @returns {Array}
     */
    generateLinks : function (n) {
        if (!n.length) return;

        var newLinks = [];

        for (var i = 0; i < n.length; i++) {
            if (n[i].parent > -1) {
                newLinks.push({
                    source: this.findNode(n[i].parent),
                    target: this.findNode(n[i].id)
                });
            }

        }

        return newLinks;
    },
    /**
     * Get all active nodes by active_root_id
     * @returns {Array}
     */
    getActiveNodes : function (nodes) {
        if (!this.rootNode) {
            this.rootNode = nodes[0].id;
        }

        //console.log(selected_node);

        var newActiveNodes = [];

        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].parent == this.rootNode || nodes[i].id == this.rootNode) {
                //console.log(nodes[i]);
                newActiveNodes.push(nodes[i]);
            }
        }
        return newActiveNodes;
    },
    /**
     * Removing node and its links
     * @param id
     */
    removeNode : function (id) {
        var i = 0;
        var n = this.findNode(id);

        // Removing links

        while (i < this.links.length) {
            if ((this.links[i].source.id == id) || (this.links[i].target.id == id)) {
                this.links.splice(i, 1);
            } else {
                i++;
            }
        }

        // Removing node
        var index = n.index;
        if (index !== undefined) {
            //console.log("Removing node " + id);
            this.nodes.splice(index, 1);
        }

        this.restart();
    },
    /**
     * Reset all mouse parameters
     */
    resetMouseVars : function () {
        if (this.mousedown_node !== null)
            this.findNode(this.mousedown_node.id).clicked = false;

        this.mousedown_node = null;
        this.mouseup_node = null;
        this.mousedown_link = null;
    },
    /**
     * Triggering mouse click start
     */
    mousedown : function () {

        //var that = this;

        console.log('mousedown()');
        console.log(this.mousedown_node);

        if (this.mousedown_node !== null) {

            var pathNodes = this.findPathNodesTo(this.mousedown_node);

            //var point = d3.mouse(this),
            //    node = {id: this.nodes.length, parent: this.mousedown_node.id};
            //node.x = point[0];
            //node.y = point[1];

            //console.log("new nodes:");
            //console.log(this.getData(this.mousedown_node.title, this.mousedown_node.id));

            //var newNodes = findNodesbyParentId(mousedown_node.id),
            var newNodes = this.getData(this.mousedown_node.title, this.mousedown_node.id),
                startingPoint = {x: this.mousedown_node.x, y: this.mousedown_node.y};

            for (var i = 0; i < pathNodes.length; i++) {
                if(this.mousedown_node.id != pathNodes[i].id) pathNodes[i].path = true;
                newNodes.push(pathNodes[i]);
            }

            var removeNodes = this.nodes.diff(newNodes);
            var addNodes = newNodes.diff(pathNodes).diff(this.nodes);

            console.log("Removing nodes:");
            console.log(this.findNodesbyParentId(this.mousedown_node.id).length);

            //if(this.findNodesbyParentId(this.mousedown_node.id).length > 0) {
                for (var i = 0; i < removeNodes.length; i++) {
                    this.removeNode(removeNodes[i].id);
                    this.restart();
                }
            //}

            //$(addNodes).each($).wait(100, function (index) {
            $(addNodes).each($).wait(100, function (index) {

                addNodes[index].x = startingPoint.x;
                addNodes[index].y = startingPoint.y;
                this.nodes.push(addNodes[index]);
                //console.log(newNodes[index]);
                this.links.push({source: this.findNode(addNodes[index].parent), target: addNodes[index]});

                console.log("Adding node: " + addNodes[index].id);
                //$.delay(1000).restart();
                this.restart();

            }.bind(this));

            /**
             * Check if node have to be removed
             */
        }


    },
    /**
     * Triggering mouse move
     */
    mousemove : function () {

    },
    /**
     * Triggering mouse click end
     */
    mouseup : function () {
        //this.resetMouseVars();
        //console.log(mousedown_node);
    },
    /**
     * Update force layout (called automatically each iteration)
     */
    tick : function () {
        //console.log('tick()');
        var width = this.width,
            height = this.height,
            nodes = this.nodes,
            links = this.links,
            circle = this.circle,
            path = this.path;
        //console.log(path);
        // draw directed edges with proper padding from node centers
        path.attr('d', function (d) {
            //console.log(d);
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
            //return (d.source.path) ? 'path' : (d.target.hovered) ? 'hovered' : 'link';
            return (d.source.path) ? 'path' : 'link';
        });

        circle
            .attr('transform', function (d) {
                return 'translate(' + d.x + ',' + d.y + ')';
            })
            .attr('class', function (d) {
                //console.log(d.path);
                var newClasses = [];
                newClasses.push('entity');
                newClasses.push((d.path === true) ? 'trail' : '');
                newClasses.push(d.type);
                return newClasses.join(' ');
            });

    },

    keydown : function () {},

    keyup : function () {},

/*    setMousedown : function () {
        this.mousedown_node = "pups";
    }*/


    // app starts here
    init: function (category) {

        this.rootCategory = category;

        this.svg = d3.select('body')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height);

        this.nodes = this.getStartingNodes();
        //this.nodes = this.getActiveNodes(this.nodes);
        //lastNodeId  = nodes.length,
        this.links = this.generateLinks(this.nodes);
        //this.links = this.generateLinks(this.nodes);
        this.labelAnchors = [];
        this.labelAnchorLinks = [];
        // handles to link and node element groups
        this.path = this.svg.append('svg:g').selectAll('path');
        this.circle = this.svg.append('svg:g').selectAll('g');
        // Mouse events and triggers
        this.selected_node = this.rootNode;
        this.selected_link = null;
        this.mousedown_link = null;
        this.mousedown_node = null;
        this.mouseover_node = null;
        this.mouseup_node = null;
        // Root Node
        this.rootNode = null;

        var that = this,
            width = this.width,
            height = this.height,
            nodes = this.nodes,
            links = this.links;


        // init D3 force layout
        this.force = d3.layout.force()
            .nodes(this.nodes)
            .links(this.links)
            .size([this.width, this.height])
            .linkDistance(function (d) {
                //var length = 80;
                //console.log();
                return (d.source.path) ? 120 : 80;
            })
            .charge(-1600)
            .friction(0.9)
            .linkStrength(0.6)
            .on('tick', this.tick.bind(this));
        /*
         var force2 = d3.layout.force()
         .nodes(labelAnchors)
         .links(labelAnchorLinks)
         .gravity(0)
         .linkDistance(0)
         .linkStrength(1)
         .charge(-100)
         .size([width, height]);
         */

        this.svg.on('mousedown', this.mousedown.bind(this))
            .on('mousemove', this.mousemove)
            .on('mouseup', this.mouseup);

        d3.select(window)
            .on('keydown', this.keydown)
            .on('keyup', this.keyup);

        this.restart();
    }
};

//drawOrbit(activeNodes);

function drawOrbit(_data) {

    //down with category20a()!!
    colors = d3.scale.category20b();

    orbitScale = d3.scale.linear().domain([1, 3]).range([3.8, 1.5]).clamp(true);
    radiusScale = d3.scale.linear().domain([0, 1, 2, 3]).range([20, 10, 3, 1]).clamp(true);


    /*orbit = d3.layout.orbit().size([1000,1000])
     .children(function(d) {return d.children})
     .revolution(function(d) {return d.depth})
     .orbitSize(function(d) {return orbitScale(d.depth)})
     .speed(5)
     .nodes(_data);*/
    orbit.orbitSize(function (d) {
        return orbitScale(d.depth)
    }).speed(5);

    d3.select("svg").selectAll("g.node").data(orbit.nodes())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", function (d) {
            return "translate(" + d.x + "," + d.y + ")"
        });
    /* .on("mouseover", nodeOver)
     .on("mouseout", nodeOut)*/

    d3.selectAll("g.node")
        .append("circle")
        .attr("r", function (d) {
            return radiusScale(d.depth)
        })
        .style("fill", function (d) {
            return colors(d.depth)
        });

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



/*function spliceLinksForNode(node) {
    var toSplice = links.filter(function (l) {
        return (l.source === node || l.target === node);
    });
    toSplice.map(function (l) {
        links.splice(links.indexOf(l), 1);
    });
}*/



$("input[type=submit]").on('click', function () {

    var category = $("input[name=category]").val();

    if (category.length > 0) {
        toggleSearch();
        //init();

        hydra.init(category);

        //hydra.setMousedown();
        //hydra.mousedown_node = "paps";

        //alert(hydra.mousedown_node);
    }
});

function toggleSearch() {
    $('#search-container').toggle('slow', function () {
        //toggleD3();
    });
}

function toggleD3() {
    $('svg').toggle('slow', function () {
        //
    });
}