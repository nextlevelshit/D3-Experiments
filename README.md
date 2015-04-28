# Force-directed clickable nested nodes

This experiment is based on [Mike Bostoks](//github.com/mbostock) beautiful [D3-Library](//d3js.org/) and inspirated by [Ross Kirslings](//github.com/rkirsling) [modal-logic playground](//rkirsling.github.io/modallogic/).

I'd tried to creat an force-directed particle system without any specified links. Every node has only attributes like ```id```, ```parent``` and ```title```. The linking system is going to be extracted by the attributes of the nodes. So we're getting a hirachy from the interlinked parent nodes.

Code example online: http://dailysh.it/github/d3_nested_nodes/
