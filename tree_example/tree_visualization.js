
function collapsible_tree(input_data, search_gene, svg_location, path_to_icon_folder) {
    // Set the dimensions and margins of the tree diagram
    var margin = { top: 100, right: 100, bottom: 150, left: 150 };
    (width = 1500 - margin.left - margin.right),
        (height = 800 - margin.top - margin.bottom);

    var svg_container = document.getElementById(svg_location);
    svg_container.style.width = width + margin.right + margin.left + 100;
    svg_container.style.height = height + margin.top + margin.bottom + 100;
    // append the svg object to the page
    // appends a 'group' element to 'svg'

    var svg = d3
        .select(`#${svg_location}`)
        .append("svg")
        .attr("width", width + margin.right + margin.left)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var root;

    // build_tree(input_data);
    // TODO: onlywhen we use local unput csv.
    d3.csv(input_data).then((data) => {
        build_tree(data);
    })

    function build_tree(data) {

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


        // d3.stratify(): convert the 2 columns in the .csv file to a nested structure.
        var stratify = d3
            .stratify()
            .id((d) => d.id)
            .parentId((d) => d.parent);

        treeData = stratify(data);

        // d3.hierarchy(): assigns parent, children, height, depth.
        root = d3.hierarchy(treeData);

        root.x0 = height / 2;
        root.y0 = 0;

        // d3.tree(): generate a hierarchical tree.
        root = d3
            .tree()
            .size([height * 0.9, width * 0.9])
            .separation(function (a, b) {
                return a.parent == b.parent ? 1 : 1.5;
            })(root);

        // Recursively get the weighted avg of expression level for each node.
        console.log(root);
        weighted_avg_expr(root);

        //----------Color scale
        // Define the color schemes and values
        const schemes = {
            scheme1: {
                colors: ['#eef3ff', '#c6dbef', '#9ec9e1', '#6baed5', '#4192c6', '#2271b5', '#0a4593'],
                values: [0, 2, 4, 6, 8, 10, 12]
            },
            scheme2: {
                colors: ['#e2e6bd', '#f0df80', '#f6c971', '#edab65', '#d98558', '#b9524c', '#8e133b'],
                values: [0, 2, 4, 6, 8, 10, 12]
            },
            scheme3: {
                colors: ['#fde725', '#8fd744', '#35b779', '#22908b', '#31688e', '#443a83', '#440d54'],
                values: [0, 2, 4, 6, 8, 10, 12]
            }
        };

        let color_scale; // Global variable for the color scale
        let fill; // Global function for setting color
        let defaultColor = "#cccccc"; // Manage default color dynamically
        let selectedSchemeKey = 'scheme1';
        // Update color settings function
        function updateColorSettings(schemeKey, expr_max) {
            const scheme = schemes[schemeKey];
            color_scale = chroma.scale(scheme.colors).mode('lch').domain([0, 1]);
            const scale0_1 = d3.scaleLinear().domain([0, expr_max]).range([0, 1]);

            // Update fill function
            fill = (d) => {
                if (d.data.data[search_gene]) {
                    return color_scale(scale0_1(d.data.data[search_gene])).hex();
                }
                return defaultColor;
            };

            // Update legend as well
            const colorGradient = document.getElementById('colorGradient');
            const valueLabels = document.getElementById('valueLabels');

            colorGradient.style.background = `linear-gradient(to right, ${scheme.colors.join(', ')})`;
            valueLabels.innerHTML = '';

            scheme.values.forEach(value => {
                const label = document.createElement('span');
                label.textContent = `${value.toLocaleString()}`;
                valueLabels.appendChild(label);
            });

            if (valueLabels.children.length > 0) {
                valueLabels.children[0].style.marginRight = '0';
                valueLabels.children[valueLabels.children.length - 1].style.marginLeft = '0';
            }
        }
        // Update link color after color changed button
        function updateTreeColors() {
            // Re-select all link elements and update their stroke color
            d3.selectAll(".link")
                .transition()  // Optional: for smoother visual transition
                .style("stroke", function (d) { return fill(d); });
        }
        function setColorScheme(schemeKey, expr_max) {
            updateColorSettings(schemeKey, expr_max);
            updateTreeColors(); // Update the colors of the tree after setting the new color scheme
        }

        // Initialize with the first scheme
        setColorScheme(selectedSchemeKey, expr_max);

        // Select all buttons with the 'data-scheme' attribute and attach the click event listeners
        document.querySelectorAll('button[data-scheme]').forEach(button => {
            button.addEventListener('click', function () {
                // Extarct the selected scheme key 
                selectedSchemeKey = this.getAttribute('data-scheme');
                // Call setColorScheme with the extracted scheme key and the global expr_max
                setColorScheme(selectedSchemeKey, expr_max);
            });
        });


        // Collapse after the second level for the initial layout. (Optional)
        // root.children.forEach(collapse);

        update_tree(root, fill);

    };

    // recursive function
    function weighted_avg_expr(d) {

        function isValidNumber(value) {
            // Check if the value is a number and is finite ( exclude the NaN undefined, infinite number)
            return typeof value === 'number' && Number.isFinite(value);
        }
        d.data.data[search_gene] = parseInt(d.data.data[search_gene]);
        d.data.data["celltype_size"] = parseInt(d.data.data["celltype_size"]);
        let dataSection = d?.data?.data;
        if (!d.children) {
            // check if all leaf nodes have size and values
            try {
                // Ensure both values are valid numbers
                if (isValidNumber(dataSection?.[search_gene]) && isValidNumber(dataSection?.["celltype_size"])) {
                    return;
                } else {
                    throw new Error(`The leaf node associated with '${search_gene}' has null values, which is not allowed`);
                }
            } catch (error) {
                console.error("Caught an error:", error);
            }
        } else {

            if (isValidNumber(dataSection?.[search_gene]) && isValidNumber(dataSection?.["celltype_size"])) {
                for (i = 0; i < d.children.length; i++) {
                    child = d.children[i];
                    weighted_avg_expr(child);
                }
            } else {
                // please define all of your variables here, to avoid global variables
                var child_size;
                var sum_w_expr = 0, sum_size = 0;
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

            }
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
    function update_tree(data, fill) {
        // Compute the new tree layout.
        var nodes = root.descendants(),
            // the slice(1) here, skip the 1st element, which means removing the root node.
            links = root.descendants().slice(1);

        // ****************** Nodes section ********

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
            .style("font-size", "18px")
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
            .attr("width", "27px")
            .attr("height", "27px");

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

        // Update the links...
        var link = svg.selectAll("path.link").data(links, function (d) {
            return d.id;
        });
        // Enter any new links at the parent's previous position.


        // Example SVG path selection with D3
        var linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                var o = { x: data.x0, y: data.y0 };
                return diagonal(o, o);
            })
            .style("stroke", function (d) { return fill(d); })
            .style("stroke-width", function (d) {
                return d.data.data["celltype_size"] * 0.0004 + 3.5;
            })
            .style("stroke-opacity", 0.7)
            .on("mouseover", function (event, d) {
                var tooltip = document.getElementById('customTooltip');
                tooltip.style.opacity = 1;
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';

                // Set the content of the tooltip
                // Ensure the value is a number and format it to 3 decimal places
                var valueToShow = parseFloat(d.data.data[search_gene]).toFixed(3);

                // Set the content of the tooltip
                tooltip.querySelector('.tooltip-inner').textContent = `Value: ${valueToShow}`;

            })
            .on("mouseout", function () {
                var tooltip = document.getElementById('customTooltip');
                tooltip.style.opacity = 0;
            });

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
            // update the tree.
            // collapse children when clicking the node; using the selected color for the links
            update_tree(d, fill);
        }
    }

}