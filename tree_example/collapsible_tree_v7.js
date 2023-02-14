
function collapsible_tree(input_data, search_gene, location1, path_to_icon_folder) {
    // Set the dimensions and margins of the diagram
    var margin = { top: 100, right: 150, bottom: 500, left: 150 };
    (width = 2000 - margin.left - margin.right),
        (height = 1800 - margin.top - margin.bottom);

    // append the svg object to the body of the page
    // appends a 'group' element to 'svg'

    var svg = d3
        .select(location1)
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var root;

    // Load the input data
    d3.csv(input_data).then((data) => {

        // Get the max expression value of certain gene across all cell types
        // Then this will be used in the color scale section below.
        const expr_value_array = [];

        for (i = 0; i < data.length; i++) {
            if (data[i][search_gene]) {
                var expr_value = parseFloat(data[i][search_gene]);
                expr_value_array.push(expr_value);
            }
        };
        expr_max = Math.max.apply(null, expr_value_array);

        // d3.stratify(): convert the 2 columns in the .csv file to a nested structure. A built-in function in d3.
        var stratify = d3
            .stratify()
            .id((d) => d.id)
            .parentId((d) => d.parent);

        treeData = stratify(data);

        // d3.hierarchy(): assigns parent, children, height, depth. A built-in function in d3.
        root = d3.hierarchy(treeData);

        console.log(root);
        root.x0 = height / 2;
        root.y0 = 0;

        // d3.tree(): generate a hierarchical tree.  A built-in function in d3.
        root = d3
            .tree()
            .size([innerHeight * 0.7, innerWidth * 0.7])
            .separation(function (a, b) {
                return a.parent == b.parent ? 1 : 3;
            })(root);

        // Recursively get the weighted avg of expression level for each node.
        weighted_avg_expr(root);

        // Collapse after the second level for the initial layout. (Optional)
        // root.children.forEach(collapse);
        update(root);


    });


    // recursive function
    function weighted_avg_expr(d) {
        // assume all leaf nodes have size and expression set
        if (!d.children) {
            // TODO: Yuan, I suggest you do this during data loading, but not here
            d.data.data[search_gene] = parseInt(d.data.data[search_gene]);
            d.data.data["celltype_size"] = parseInt(d.data.data["celltype_size"]);
            return;

        } else {
            // please define all of your variables here, to avoid global variables
            var child_size, child_w_expr;
            var sum_w_expr = 0, sum_size = 0, weighted_avg_expr_result = 0;
            var i, child;
            for (i = 0; i < d.children.length; i++) {
                child = d.children[i];

                weighted_avg_expr(child);

                child_size = child.data.data["celltype_size"];

                sum_w_expr += child.data.data[search_gene] * child_size;
                sum_size += child_size;
            };
            d.data.data[search_gene] = sum_w_expr / sum_size;
            d.data.data["celltype_size"] = sum_size;

        };
    };

    // collapse the node and all it's children
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    // update the tree after collapse
    function update(data) {
        // Compute the new tree layout.
        var nodes = root.descendants(),
            // the slice(1) here, skip the 1st element, which means removing the root node.
            links = root.descendants().slice(1);

        // Normalize for fixed-depth.
        nodes.forEach(function (d) {
            d.y = d.depth * 230;
        });

        // ****************** Nodes section ***************************

        // Update the nodes...
        var node = svg.selectAll("g.node").data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        // Enter any new modes at the parent's previous position.

        var nodeEnter = node
            .enter()
            .append("g")
            .attr("class", "node")
            .attr("transform", function (d) {
                return "translate(" + data.y0 + "," + data.x0 + ")";
            })
            .on("click", click);

        // Add circle for the nodes
        nodeEnter.append("circle").attr("class", "node").attr("r", 1e-6);

        // Add labels for the nodes
        nodeEnter
            .append("text")
            .attr("dy", ".35em")
            .attr("x", function (d) {
                return d.children || d._children ? -20 : 20;
            })
            .attr("text-anchor", function (d) {
                return d.children || d._children ? "end" : "start";
            })
            .style("font-size", "25px")
            .text(function (d) {
                return d.data.data.label;
            });

        // Add images for the nodes
        nodeEnter
            .append("image")
            .attr("class", "node-image")
            .attr("xlink:href", function (d) {
                const imagePath =
                    path_to_icon_folder + d.data.id + ".png";
                return imagePath;
            })
            .attr("transform", "translate (-12,-13)")
            .attr("width", "30px")
            .attr("height", "30px");

        // UPDATE
        var duration = 750;
        var nodeUpdate = nodeEnter.merge(node);


        // Transition to the proper position for the node
        nodeUpdate
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Update the node attributes and style
        nodeUpdate
            .select("circle.node")
            .attr("r", 20)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr("cursor", "pointer");

        // Remove any exiting nodes
        var nodeExit = node
            .exit()
            .transition()
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + data.y + "," + data.x + ")";
            })
            .remove();

        // On exit reduce the node circles size to 0
        nodeExit.select("circle").attr("r", 1e-6);

        // On exit reduce the opacity of text labels
        nodeExit.select("text").style("fill-opacity", 1e-6);

        // ****************** links section ***************************
        const tip = d3
            .tip()
            .attr("class", "d3-tip")
            .html((d) => data.data.data[search_gene]);
        svg.call(tip);

        // Update the links...
        var link = svg.selectAll("path.link").data(links, function (d) {
            return d.id;
        });
        // Enter any new links at the parent's previous position.

        // ****** Color scale ********
        // Scale the [0, expr_max] to [0,1]
        const scale0_1 = d3.scaleLinear().domain([0, expr_max]).range([0, 1]);

        // Set the color style of links
        var color_scale = chroma.scale(["#f8cece", "#C70000"]);

        // Set the "fill" funtion, which will be applied to "link.style()".
        const fill = (d) => {
            if (d.data.data[search_gene])
                return color_scale(scale0_1(d.data.data[search_gene]));
        };

        var linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = { x: data.x0, y: data.y0 };
                return diagonal(o, o);
            })
            .style("stroke", fill)
            .style("stroke-width", function (d) {
                return d.data.data[search_gene] * 0.5 + 2.5;
            })
            .style("stroke-opacity", 0.7);


        // UPDATE
        var linkUpdate = linkEnter.merge(link);

        linkUpdate.attr("stroke", fill);

        // Transition back to the parent element position
        linkUpdate
            .transition()
            .duration(duration)
            .attr("d", function (d) {
                return diagonal(d, d.parent);
            });

        // Remove any exiting links
        var linkExit = link
            .exit()
            .transition()
            .duration(duration)
            .attr("d", function (d) {
                var o = { x: data.x, y: data.y };
                return diagonal(o, o);
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Creates a curved (diagonal) path from parent to the child nodes
        function diagonal(s, d) {
            path = `M ${s.y} ${s.x}
        C ${(s.y + d.y) / 2} ${s.x},
          ${(s.y + d.y) / 2} ${d.x},
          ${d.y} ${d.x}`;

            return path;
        }

        // Toggle children on click.
        function click(event, d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }

            update(d);
        }
    }

}