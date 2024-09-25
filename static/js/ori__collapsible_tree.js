function collapsible_tree(input_data, search_column, svg_location, path_to_icon_folder) {
    let svg_container = document.getElementById(svg_location);
    svg_container.style.width = "90vw";
    svg_container.style.height = "100vh";

    // set up the width and height for tree structure
    const width = parseFloat(window.getComputedStyle(svg_container).width) * 0.8;
    const height = parseFloat(window.getComputedStyle(svg_container).height) * 0.8;

    // Create the SVG inside the container
    let svg = d3.select(svg_container)
        .append("svg")
        .attr("id", "treeSVG")
        .style("width", "100%")  // Make the SVG responsive within its container
        .style("height", "100%");

    var treeSVG = document.getElementById("treeSVG");

    let basic_group;
    let root;
    let size_col_name = 'celltype_size'; // customized it if needed
    let expr_max;
    // Set the size of the radial tree
    let radius = height * 0.6;

    let linkgroup;
    let nodegroup;
    // Define the color schemes and values
    const schemes = {
        scheme1: {
            colors: ['#eef3ff', '#c6dbef', '#9ec9e1', '#6baed5', '#4192c6', '#2271b5', '#0a4593'],
        },
        scheme2: {
            colors: ['#e2e6bd', '#f0df80', '#f6c971', '#edab65', '#d98558', '#b9524c', '#8e133b'],
        },
        scheme3: {
            colors: ['#fde725', '#8fd744', '#35b779', '#22908b', '#31688e', '#443a83', '#440d54'],

        }
    };
    let color_scale; // Global variable for the color scale
    let fill; // Global function for setting color
    let defaultColor = "#cccccc"; // Manage default color
    let selectedSchemeKey = 'scheme1';

    // Transform origin for radial tree
    let radialTransformX = width / 2,
        radialTransformY = 350;

    // Slider for radial tree
    var sliderContainer = document.getElementById("sliderContainer");

    // // Set default visibility of slider container. 
    sliderContainer.style.display = "none";

    // Load the data and build the initial view
    initializeTreeView(input_data, build_tree);

    document.getElementById("tree-layout-button").addEventListener("click", function () {
        // Clear existing SVG content
        svg.selectAll("*").remove();
        treeSVG.style.transform = ""; // Reset the rotation
        sliderContainer.style.display = "none"; // Hide the slider
        initializeTreeView(input_data, build_tree);
    });

    document.getElementById("radial-layout-button").addEventListener("click", function () {
        // Clear existing SVG content
        svg.selectAll("*").remove();
        sliderContainer.style.display = "block"; // Show the slider
        // Set the transform origin to a specific point
        treeSVG.style.transformOrigin = `${radialTransformX}px ${radialTransformY}px`;
        initializeTreeView(input_data, build_radial_tree);
    });

    // The slider component
    $(document).ready(function () {
        // Initialize the slider component
        var slider = new Slider('#mySlider', {
            formatter: function (value) {
                return 'Current value: ' + value;
            }
        });

        var rotateValue = document.getElementById("rotateValue");
        var treeSVG = document.getElementById("treeSVG");

        // Function to update the rotation of the SVG
        function updateRotation(value) {
            rotateValue.innerHTML = value;
            // // Log the current rotation value for debugging purposes
            // console.log('rotate value:', rotateValue.innerHTML);
            treeSVG.style.transform = "rotate(" + value + "deg)";
        }

        // Attach event listeners to the slider for the 'slide' event
        // Update the rotation based on the slider's current value
        slider.on('slide', function (sliderValue) {
            updateRotation(sliderValue);
        });
        slider.on('change', function (sliderValue) {
            updateRotation(sliderValue.newValue);
        });
    });


    // parse certain column
    function csvParser(data, size_col_name, search_column) {
        return {
            parent: data.parent,
            id: data.id,
            label: data.label,
            [size_col_name]: data[size_col_name],
            [search_column]: data[search_column]
        };
    }

    // Function to initialize the tree view
    function initializeTreeView(input_data, build_which_tree) {
        // local- string, uploaded csv- object
        try {
            if (typeof input_data === "string") {
                d3.csv(input_data, function (data) {
                    return csvParser(data, size_col_name, search_column);
                }).then(parsedData => {
                    console.log("type:", typeof parsedData);
                    console.log("content: ", parsedData);
                    build_which_tree(parsedData);
                }).catch(error => {
                    console.error("Error loading or processing CSV:", error);
                });
            } else if (typeof input_data === "object") {
                build_which_tree(input_data);
            } else {
                // Handle cases where input_data is neither a string nor an object
                throw new Error("Unexpected input data type: " + typeof input_data);
            }
        } catch (error) {
            console.error("Caught an error in processing input csv:", error);
        }
    }

    // recursive function
    function weighted_avg_expr(d) {

        function isValidNumber(value) {
            // Check if the value is a number and is finite ( exclude the NaN undefined, infinite number)
            return typeof value === 'number' && Number.isFinite(value);
        }
        d.data.data[search_column] = parseFloat(d.data.data[search_column]);
        d.data.data[size_col_name] = parseInt(d.data.data[size_col_name]);
        let dataSection = d?.data?.data;
        if (!d.children) {
            // check if all *leaf* nodes have size and values
            try {
                // Ensure both values are valid numbers
                if (isValidNumber(dataSection?.[search_column]) && isValidNumber(dataSection?.[size_col_name])) {
                    return;
                } else {
                    throw new Error(`The leaf node associated with '${search_column}' has null values, which is not allowed`);
                }
            } catch (error) {
                console.error("Caught an error:", error);
            }
        } else {

            if (isValidNumber(dataSection?.[search_column]) && isValidNumber(dataSection?.[size_col_name])) {
                for (i = 0; i < d.children.length; i++) {
                    child = d.children[i];
                    weighted_avg_expr(child);
                }
            } else {
                // please define all of your variables here, to avoid global letiables
                let child_size;
                let sum_w_expr = 0, sum_size = 0;
                let i, child;
                for (i = 0; i < d.children.length; i++) {
                    child = d.children[i];

                    weighted_avg_expr(child);

                    child_size = child.data.data[size_col_name];

                    sum_w_expr += child.data.data[search_column] * child_size;
                    sum_size += child_size;
                };
                d.data.data[search_column] = sum_w_expr / sum_size;
                d.data.data[size_col_name] = sum_size;

            }
        };
    };

    function build_tree(data) {
        // Get the max expression value of certain gene across all cell types
        // Then this will be used in the color scale section below.
        let expr_value_array = [];

        for (i = 0; i < data.length; i++) {
            if (data[i][search_column]) {
                var expr_value = parseFloat(data[i][search_column]);
                expr_value_array.push(expr_value);
            }
        };

        expr_max = Math.max.apply(null, expr_value_array);
        // d3.stratify(): convert the 2 columns in the .csv file to a nested structure.
        let stratify = d3
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
            .size([height * 0.8, width * 0.8])
            .separation(function (a, b) {
                return a.parent == b.parent ? 1 : 2;
            })(root);
        console.log('root in build tree:', root);

        // Recursively calculate the weighted average of expression levels for each parent node,
        // but only if the node itself does not have a value.
        weighted_avg_expr(root);

        // Transform the svg for horizontal tree to make the root node fully visible.
        basic_group = svg.append("g")
            .attr("transform", "translate(60 , 0)");

        //----------Color scale
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

    // Update color settings function
    function updateColorSettings(schemeKey, expr_max) {
        const scheme = schemes[schemeKey];
        color_scale = chroma.scale(scheme.colors).mode('lch').domain([0, 1]);
        const scale0_1 = d3.scaleLinear().domain([0, expr_max]).range([0, 1]);

        // Update fill function

        fill = (d) => {
            if (d.data.data[search_column]) {
                return color_scale(scale0_1(d.data.data[search_column])).hex();
            }
            return defaultColor;
        };

        // Update legend as well
        setupColorLegend(scheme, expr_max);
    }

    function updateRadialColorSettings(schemeKey, expr_max) {
        const scheme = schemes[schemeKey];
        color_scale = chroma.scale(scheme.colors).mode('lch').domain([0, 1]);
        const scale0_1 = d3.scaleLinear().domain([0, expr_max]).range([0, 1]);

        // Update fill function
        fill = (d) => {
            if (d.target.data.data[search_column]) {
                return color_scale(scale0_1(d.target.data.data[search_column])).hex();
            }
            return defaultColor;
        };

        setupColorLegend(scheme, expr_max);

    }
    function setupColorLegend(scheme, expr_max) {
        // Update legend as well
        const colorGradient = document.getElementById('colorGradient');
        const valueLabels = document.getElementById('valueLabels');

        colorGradient.style.background = `linear-gradient(to right, ${scheme.colors.join(', ')})`;
        valueLabels.innerHTML = '';
        let values = [0, expr_max / 2, expr_max].map(value => Math.floor(value));;
        values.forEach(value => {
            const label = document.createElement('span');
            label.textContent = `${value.toLocaleString()}`;
            valueLabels.appendChild(label);
        });

        if (valueLabels.children.length > 0) {
            valueLabels.children[0].style.marginRight = '0';
            valueLabels.children[valueLabels.children.length - 1].style.marginLeft = '0';
        }
    }

    function setColorScheme(schemeKey, expr_max) {
        updateColorSettings(schemeKey, expr_max);
        // Update the colors of all edges(link elements) after setting the new color scheme
        d3.selectAll(".link")
            .transition()
            .style("stroke", function (d) { return fill(d); });
    }
    function setRadialColorScheme(schemeKey, expr_max) {
        updateRadialColorSettings(schemeKey, expr_max);

        d3.selectAll(".radial_link")
            .transition()
            .style("stroke", function (d) { return fill(d); });
    }
    // Collapse the node and all it's children
    function collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }
    // Update the tree after collapse
    function update_tree(data, fill) {
        // Compute the new tree layout.
        let nodes = root.descendants(),
            // the slice(1) here, skip the 1st element, which means skip the root node.
            links = root.descendants().slice(1);

        // ****************** Nodes section ********

        // Update the nodes...
        let node = basic_group.selectAll("g.node").data(nodes, function (d) {
            return d.id || (d.id = ++i);
        });

        // Enter any new modes at the parent's previous position.
        let nodeEnter = node
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
            .text(function (d) {
                return d.data.data.label;
            });

        // Add images for the nodes
        nodeEnter
            .append("image")
            .attr("class", "node-image")
            .attr("xlink:href", function (d) {
                const imagePath =
                    path_to_icon_folder + "/" + d.data.id + ".png";
                return imagePath;
            })
            .attr("transform", "translate (-12,-13)")
            .attr("width", "25px")
            .attr("height", "25px");

        // UPDATE
        let duration = 750;
        let nodeUpdate = nodeEnter.merge(node);


        // Transition to the proper position for the node
        nodeUpdate
            .transition('nodeUpdateTransition')
            .duration(duration)
            .attr("transform", function (d) {
                return "translate(" + d.y + "," + d.x + ")";
            });

        // Update the node attributes and style
        nodeUpdate
            .select("circle.node")
            .attr("r", 15)
            .style("fill", function (d) {
                return d._children ? "lightsteelblue" : "#fff";
            })
            .attr("cursor", "pointer");

        // Remove any exiting nodes
        let nodeExit = node
            .exit()
            .transition('nodeExitTransition')
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
        let link = basic_group.selectAll("path.link").data(links, function (d) {
            return d.id;
        });
        // Enter any new links at the parent's previous position.
        let linkEnter = link
            .enter()
            .insert("path", "g")
            .attr("class", "link")
            .attr("d", function (d) {
                let o = { x: data.x0, y: data.y0 };
                return diagonal(o, o);
            })
            .style("stroke", function (d) { return fill(d); })
            // the width of the link is proportional to the size of the cell type
            .style("stroke-width", function (d) {
                return d.data.data[size_col_name] * 0.0004 + 3.5;
            })
            .on("mouseover", function (event, d) {
                let tooltip = document.getElementById('basicTreeTooltip');
                tooltip.style.opacity = 1;
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';
                // Set the content of the tooltip
                // Ensure the value is a number and format it to 3 decimal places
                let valueToShow = parseFloat(d.data.data[search_column]).toFixed(3);

                // Set the content of the tooltip
                tooltip.querySelector('.tooltip-inner').textContent = `Value: ${valueToShow}`;

            })
            .on("mouseout", function () {
                let tooltip = document.getElementById('basicTreeTooltip');
                tooltip.style.opacity = 0;
            });

        // UPDATE
        let linkUpdate = linkEnter.merge(link);

        linkUpdate.attr("stroke", fill);

        // Transition back to the parent element position
        linkUpdate
            .transition('linkUpdateTransition')
            .duration(duration)
            .attr("d", function (d) {
                return diagonal(d, d.parent);
            });

        // Remove any exiting links
        let linkExit = link
            .exit()
            .transition('linkExitTransition')
            .duration(duration)
            .attr("d", function (d) {
                let o = { x: data.x, y: data.y };
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

    function build_radial_tree(data) {
        // generate a hierarchical structure for the input data
        let stratify = d3
            .stratify()
            .id((d) => d.id)
            .parentId((d) => d.parent);

        let treeData = stratify(data);

        let tree = d3
            .tree()
            .size([2 * Math.PI, radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 8) / a.depth);

        root = tree(d3.hierarchy(treeData));

        let radial_group = svg.append("g")
            .attr("transform", "translate(" + radialTransformX + ", " + radialTransformY + ")");
        // Create link group
        linkgroup = radial_group
            .append("g")
            .attr("fill", "none");

        // Create node group
        nodegroup = radial_group
            .append("g")
            .attr("stroke-linejoin", "round");

        weighted_avg_expr(root);
        // Get the max expression value of certain gene across all cell types
        // Then this will be used in the color scale section below.
        const expr_value_array = [];

        for (i = 0; i < data.length; i++) {
            if (data[i][search_column]) {
                var expr_value = parseFloat(data[i][search_column]);
                expr_value_array.push(expr_value);
            }
        };
        expr_max = Math.max.apply(null, expr_value_array);

        //----------Color scale
        // Initialize with the first scheme
        setRadialColorScheme(selectedSchemeKey, expr_max);

        // Select all buttons with the 'data-scheme' attribute and attach the click event listeners
        document.querySelectorAll('button[data-scheme]').forEach(button => {
            button.addEventListener('click', function () {
                // Extarct the selected scheme key
                selectedSchemeKey = this.getAttribute('data-scheme');
                // Call setColorScheme with the extracted scheme key and the global expr_max
                setRadialColorScheme(selectedSchemeKey, expr_max);

            });
        });
        update_radial(fill);
    }
    function update_radial(fill) {

        let links_data = root.links();

        let links = linkgroup
            .selectAll("path")
            .attr("class", "radial_link")  // Assign the class 'link' to each path
            .data(links_data, (d) => d.source.data.id + "_" + d.target.data.id);

        links.exit().remove();

        let newlinks = links
            .enter()
            .append("path")
            .attr("class", "radial_link")
            .attr("stroke", (d) => fill(d))
            .attr("stroke-width", function (d) {
                return d.target.data.data[size_col_name] * 0.0004 + 3.5;
            })
            .attr(
                "d",
                d3
                    .linkRadial()
                    .angle((d) => d.x)
                    .radius(0.1)
            )
            .on("mouseover", function (event, d) {
                let tooltip = document.getElementById('radialTreeTooltip');
                tooltip.style.opacity = 1;
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';

                // Set the content of the tooltip
                // Ensure the value is a number and format it to 3 decimal places
                let valueToShow = parseFloat(d.target.data.data[search_column]).toFixed(3);

                // Set the content of the tooltip
                tooltip.querySelector('.tooltip-inner').textContent = `Value: ${valueToShow}`;
            })
            .on("mouseout", function () {
                let tooltip = document.getElementById('radialTreeTooltip');
                tooltip.style.opacity = 0;
            });

        let alllinks = linkgroup.selectAll("path");
        alllinks.transition('radialLinksTransition')
            .duration(400)
            .ease(d3.easeLinear)
            .attr(
                "d",
                d3
                    .linkRadial()
                    .angle((d) => d.x)
                    .radius((d) => d.y)
            );

        let nodes_data = root.descendants().reverse();
        let nodes = nodegroup
            .selectAll("g")
            .data(nodes_data, function (d) {
                if (d.parent) {
                    return d.parent.data.id + d.data.id;
                }
                return d.data.id;
            });

        nodes.exit().remove();

        let newnodes = nodes
            .enter()
            .append("g")
            .attr("class", "node");

        let allnodes = nodegroup.selectAll("g");


        allnodes.transition('radialNodeTransition')
            .duration(400)
            .ease(d3.easeLinear)
            .attr(
                "transform",
                (d) => `rotate(${(d.x * 180) / Math.PI - 90})
                translate(${d.y},0)`
            );

        // Add circles for the nodes
        newnodes
            .append("circle")
            .attr("class", "node")
            .attr("r", 10);

        //after you click the node changed color.
        nodegroup.selectAll("g circle").attr("fill", function (d) {
            let altChildren = d.data.altChildren || [];
            let children = d.data.children;
            return d.children ||
                (children && (children.length > 0 || altChildren.length > 0))
                ? "#545454"
                : "#ffffff";
        });

        // Add texts for the nodes
        newnodes
            .append("text")
            .attr("dy", "0.35em")
            .text((d) => d.data.data.label)
            .clone(true)
            .lower();

        nodegroup
            .selectAll("g text")
            .attr("x", (d) => (d.x < Math.PI === !d.children ? 14 : -14))
            .attr("text-anchor", (d) =>
                d.x < Math.PI === !d.children ? "start" : "end"
            )
            .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null)); // The rotate(180) transformation flips these labels to appear upright.

        // Add images for the nodes and set up click event
        newnodes
            .append("image")
            .attr("class", "node-image")
            .attr("xlink:href", function (d) {
                const imagePath = path_to_icon_folder + "/" + d.data.id + ".png";
                return imagePath;
            })
            .attr("transform", "translate (-12,-13)")
            .attr("width", "24px")
            .attr("height", "24px")
            .on("click", (event, d) => {
                if (d.children) {
                    d._children = d.children;
                    d.children = null; // Collapse the node
                } else {
                    d.children = d._children;
                    d._children = null; // Expand the node
                }

                // let altChildren = d.data.altChildren || [];
                // let children = d.data.children;
                // d.data.children = altChildren;
                // d.data.altChildren = children;
                update_radial(fill);
            });
    };

}