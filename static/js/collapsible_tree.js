class TreeLayout {
    constructor(input_data, search_column, svg_location, path_to_icon_folder) {
        this.input_data = input_data;
        this.search_column = search_column;
        this.svg_container = document.getElementById(svg_location);
        this.path_to_icon_folder = path_to_icon_folder;
        this.size_col_name = 'celltype_size'; // Change if needed

        // set up color scheme
        this.schemes = {
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
        this.selectedSchemeKey = 'scheme1'; // Default scheme
        this.defaultColor = "#cccccc"; // Default color
        // const color_scale = null;
        this.initSVG();   // Initialize SVG element
        // this.initColorScheme(); // Initialize color scheme

    }

    initSVG() {
        // Set up the container
        this.svg_container.style.width = "90vw";
        this.svg_container.style.height = "100vh";

        // set up the width and height for tree structure
        this.width = parseFloat(window.getComputedStyle(this.svg_container).width) * 0.8;
        this.height = parseFloat(window.getComputedStyle(this.svg_container).height) * 0.8;

        // Create the SVG element inside the container
        this.svg = d3.select(this.svg_container)
            .append("svg")
            .attr("id", "treeSVG")
            .style("width", "100%") // Make the SVG responsive within its container
            .style("height", "100%");
        // initialize the slider being hidden
        let sliderContainer = document.getElementById("sliderContainer");
        sliderContainer.style.display = "none"; // Show the slider for radial layout
    }

    csvParser(data) {
        return {
            parent: data.parent,
            id: data.id,
            label: data.label,
            [this.size_col_name]: data[this.size_col_name],
            [this.search_column]: data[this.search_column]
        };
    }
    initializeTreeView() {
        let input_data = this.input_data;
        // local- string, uploaded csv- object
        try {
            if (typeof input_data === "string") {
                d3.csv(input_data, (data) => {
                    return this.csvParser(data);
                }).then(parsedData => {
                    console.log('parsedData type:', typeof parsedData);
                    this.buildTree(parsedData);
                }).catch(error => {
                    console.error("Error loading or processing CSV:", error);
                });
            } else if (typeof input_data === "object") {
                this.buildTree(input_data);
            } else {
                // Handle cases where input_data is neither a string nor an object
                throw new Error("Unexpected input data type: " + typeof input_data);
            }
        } catch (error) {
            console.error("Caught an error in processing input csv:", error);
        }
    }

    weightedAvgExpr(d) {
        let search_column = this.search_column;
        let size_col_name = this.size_col_name;

        function isValidNumber(value) {
            // Check if the value is a number and is finite (exclude NaN, undefined, infinite numbers)
            return typeof value === 'number' && Number.isFinite(value);
        }

        // Parse values and ensure they are numbers
        d.data.data[search_column] = parseFloat(d.data.data[search_column]);
        d.data.data[size_col_name] = parseInt(d.data.data[size_col_name]);

        let dataSection = d?.data?.data;

        if (!d.children) {
            // If it's a leaf node, ensure both size and value are valid numbers
            try {
                if (isValidNumber(dataSection?.[search_column]) && isValidNumber(dataSection?.[size_col_name])) {
                    return;
                } else {
                    throw new Error(`The leaf node associated with '${search_column}' has null or invalid values.`);
                }
            } catch (error) {
                console.error("Caught an error:", error);
            }
        } else {
            if (isValidNumber(dataSection?.[search_column]) && isValidNumber(dataSection?.[size_col_name])) {
                // Recursively process child nodes
                for (let i = 0; i < d.children.length; i++) {
                    let child = d.children[i];
                    this.weightedAvgExpr(child);
                }
            } else {
                // Initialize variables for weighted average calculation
                let sum_w_expr = 0;
                let sum_size = 0;

                // Process child nodes
                for (let i = 0; i < d.children.length; i++) {
                    let child = d.children[i];

                    // Recursively process the child
                    this.weightedAvgExpr(child);

                    let child_size = child.data.data[size_col_name];
                    sum_w_expr += child.data.data[search_column] * child_size;
                    sum_size += child_size;
                }

                // Update the parent node with weighted average values
                d.data.data[search_column] = sum_w_expr / sum_size;
                d.data.data[size_col_name] = sum_size;
            }
        }
    };

    getExprMax(data) {
        let expr_value_array = [];
        let search_column = this.search_column;
        for (let i = 0; i < data.length; i++) {
            if (data[i][search_column]) {
                let expr_value = parseFloat(data[i][search_column]);
                expr_value_array.push(expr_value);
            }
        };
        if (expr_value_array.length > 0) {
            this.expr_max = Math.max.apply(null, expr_value_array);
        } else {
            this.expr_max = 0;  // Default or fallback value
            console.log(`ERROR: expr_value_array is empty, reture expr_max = 0`);
        }


    }
    updateColorSettings() {
        this.selectedScheme = this.schemes[this.selectedSchemeKey].colors;
        this.color_scale = chroma.scale(this.selectedScheme).mode('lch').domain([0, 1]);
        this.scale0_1 = d3.scaleLinear().domain([0, this.expr_max]).range([0, 1]);
    }

    setupColorLegend(selectedScheme) {
        // Update legend as well
        const colorGradient = document.getElementById('colorGradient');
        const valueLabels = document.getElementById('valueLabels');

        colorGradient.style.background = `linear-gradient(to right, ${selectedScheme.join(', ')})`;
        valueLabels.innerHTML = '';
        let values = [0, this.expr_max / 2, this.expr_max].map(value => Math.floor(value));;
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

    // Collapse the node and all it's children
    collapse(d) {
        if (d.children) {
            d._children = d.children;
            d._children.forEach(collapse);
            d.children = null;
        }
    }

    buildTree(parsedData) {
        // Get the max expression value of certain gene across all cell types
        // Then this will be used in the color scale section below.
        this.getExprMax(parsedData);
        // d3.stratify(): convert the 2 columns in the .csv file to a nested structure.
        let stratify = d3
            .stratify()
            .id((d) => d.id)
            .parentId((d) => d.parent);
        this.treeData = stratify(parsedData);
    }
    // Toggle children on click.
    clickHandler = (event, d) => {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }

        // Update the tree after toggling
        this.updateTree(d, this.fill);
    }
}

class HorizontalTreeLayout extends TreeLayout {
    constructor(input_data, search_column, svg_location, path_to_icon_folder) {
        super(input_data, search_column, svg_location, path_to_icon_folder);
    }

    buildTree(parsedData) {
        super.buildTree(parsedData);
        let height = this.height;
        let width = this.width;
        // d3.hierarchy(): assigns parent, children, height, depth.
        let root = d3.hierarchy(this.treeData);
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
        this.weightedAvgExpr(root);

        // Transform the svg for horizontal tree to make the root node fully visible.
        this.basic_group = this.svg.append("g")
            .attr("transform", "translate(60 , 0)");

        //Color scale
        // Initialize with the first scheme
        this.setColorScheme();
        this.root = root;
        this.updateTree(root, this.fill);
    }
    updateTree(source, fill) {
        // Compute the new tree layout.
        let nodes = this.root.descendants(),
            links = this.root.descendants().slice(1);

        // ****************** Nodes section ********
        let i = 0;
        let node = this.basic_group.selectAll("g.node").data(nodes, d => d.id || (d.id = ++i));

        // Enter any new nodes at the parent's previous position.
        let nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${source.y0},${source.x0})`)
            .on("click", (event, d) => this.clickHandler(event, d));

        // Add circle for the nodes
        nodeEnter.append("circle")
            .attr("class", "node")
            .attr("r", 1e-6);

        // Add labels for the nodes
        nodeEnter.append("text")
            .attr("dy", ".35em")
            .attr("x", d => (d.children || d._children) ? -20 : 20)
            .attr("text-anchor", d => (d.children || d._children) ? "end" : "start")
            .text(d => d.data.data.label);

        // Add images for the nodes
        nodeEnter.append("image")
            .attr("class", "node-image")
            .attr("xlink:href", d => `${this.path_to_icon_folder}/${d.data.id}.png`)
            .attr("transform", "translate(-12,-13)")
            .attr("width", "25px")
            .attr("height", "25px");

        // ---------------- node update section ----------------
        let duration = 750;
        let nodeUpdate = nodeEnter.merge(node);

        // Transition to the new position
        nodeUpdate.transition()
            .duration(duration)
            .attr("transform", d => `translate(${d.y},${d.x})`);

        // Update node attributes and style
        nodeUpdate.select("circle.node")
            .attr("r", 15)
            .style("fill", d => d._children ? "lightsteelblue" : "#fff")
            .attr("cursor", "pointer");

        // Remove any exiting nodes
        let nodeExit = node.exit().transition()
            .duration(duration)
            .attr("transform", d => `translate(${source.y},${source.x})`)
            .remove();

        // On exit reduce the node circle size to 0
        nodeExit.select("circle").attr("r", 1e-6);
        nodeExit.select("text").style("fill-opacity", 1e-6);

        // ****************** Links section *******************

        // Update the links...
        let link = this.basic_group.selectAll("path.link")
            .data(links, d => d.id);

        // Enter any new links at the parent's previous position.
        let linkEnter = link.enter().insert("path", "g")
            .attr("class", "link")
            .attr("d", d => {
                let o = { x: source.x0, y: source.y0 };
                return diagonal(o, o);
            })
            .style("stroke", d => this.fill(d))
            .style("stroke-width", d => d.data.data[this.size_col_name] * 0.0004 + 3.5)
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

        // ---------------- link update section ----------------
        let linkUpdate = linkEnter.merge(link);

        // Transition back to the parent element position
        linkUpdate.transition()
            .duration(duration)
            .attr("d", d => diagonal(d, d.parent));

        // Remove any exiting links
        let linkExit = link.exit().transition()
            .duration(duration)
            .attr("d", d => {
                let o = { x: source.x, y: source.y };
                return diagonal(o, o);
            })
            .remove();

        // Store the old positions for transition.
        nodes.forEach(d => {
            d.x0 = d.x;
            d.y0 = d.y;
        });

        // Function to generate the diagonal paths
        function diagonal(s, d) {
            return `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`;
        }
    }
    setColorScheme() {
        this.updateColorSettings();
        // Update the colors of all edges(link elements) after setting the new color scheme
        d3.selectAll(".link")
            .transition()
            .style("stroke", (d) => this.fill(d));
    }
    updateColorSettings() {
        super.updateColorSettings();
        this.fill = (d) => {
            console.log('d:', d);
            if (d.data.data[this.search_column]) {
                return this.color_scale(this.scale0_1(d.data.data[this.search_column])).hex();
            }
            return this.defaultColor;
        };
        // Update legend as well
        this.setupColorLegend(this.selectedScheme);
    }
}

class RadialTreeLayout extends TreeLayout {
    constructor(input_data, search_column, svg_location, path_to_icon_folder) {
        super(input_data, search_column, svg_location, path_to_icon_folder);
        this.radius = this.height * 0.6; // radial-specific property
        // Transform origin for radial tree
        this.radialTransformX = this.width / 2;
        this.radialTransformY = 350;
        // this.initializeSlider(); // Radial-specific slider for rotation
    }

    initializeSlider() {
        let sliderContainer = document.getElementById("sliderContainer");
        sliderContainer.style.display = "block"; // Show the slider for radial layout

        var slider = new Slider('#mySlider', {
            formatter: function (value) {
                return 'Current value: ' + value;
            }
        });

        let rotateValue = document.getElementById("rotateValue");
        let treeSVG = document.getElementById("treeSVG");

        slider.on('slide', function (sliderValue) {
            rotateValue.innerHTML = sliderValue;
            treeSVG.style.transform = "rotate(" + sliderValue + "deg)";
        });
    }

    buildTree(parsedData) {
        super.buildTree(parsedData);

        // build radial tree
        let tree = d3
            .tree()
            .size([2 * Math.PI, this.radius])
            .separation((a, b) => (a.parent == b.parent ? 1 : 8) / a.depth);


        let root = tree(d3.hierarchy(this.treeData));
        this.weightedAvgExpr(root);
        this.root = root;

        // Create the radial group
        let radial_group = this.svg.append("g")
            .attr("transform", "translate(" + this.radialTransformX + ", " + this.radialTransformY + ")");

        // Create link group
        this.linkgroup = radial_group
            .append("g")
            .attr("fill", "none");
        // Create node group
        this.nodegroup = radial_group
            .append("g")
            .attr("stroke-linejoin", "round");

        // Initialize with the first color scheme
        this.setColorScheme();
        let _d = 0;
        this.updateTree(_d, this.fill);
    }
    updateTree(d, fill) {
        let root = this.root;
        let nodegroup = this.nodegroup;
        let linkgroup = this.linkgroup;

        let links_data = root.links();
        console.log('root:', root);
        console.log('links_data:', links_data);
        let links = linkgroup
            .selectAll("path")
            .attr("class", "radial_link")  // Assign the class 'link' to each path
            .data(links_data, (d) => d.source.data.id + "_" + d.target.data.id);

        links.exit().remove();

        let _d = d;
        let newlinks = links
            .enter()
            .append("path")
            .attr("class", "radial_link")
            .attr("stroke", (d) => fill(d))
            .attr("stroke-width", (d) => {
                return d.target.data.data[this.size_col_name] * 0.0004 + 3.5;
            })
            .attr(
                "d",
                d3.linkRadial()
                    .angle((d) => d.x)
                    .radius(0.1)
            )
            .on("mouseover", (event, d) => {
                let tooltip = document.getElementById('radialTreeTooltip');
                tooltip.style.opacity = 1;
                tooltip.style.left = event.pageX + 'px';
                tooltip.style.top = event.pageY + 'px';

                // Set the content of the tooltip
                // Ensure the value is a number and format it to 3 decimal places
                let valueToShow = parseFloat(d.target.data.data[this.search_column]).toFixed(3);

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
        console.log('nodes_data:', nodes_data);

        let nodes = nodegroup.selectAll("g").data(nodes_data, function (d) {
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

        // Add circls for the nodes
        newnodes
            .append("circle")
            .attr("class", "node")
            .attr("r", 10);

        // TODO: after you click the node changed color.
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

        // Add images for the nodes
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
                this.clickHandler(event, d);
            });
    };

    setColorScheme() {
        this.updateColorSettings();
        // Update the colors of all edges(link elements) after setting the new color scheme
        d3.selectAll(".radial_link")
            .transition()
            .style("stroke", (d) => this.fill(d));
    }
    updateColorSettings() {
        super.updateColorSettings();
        this.fill = (d) => {
            console.log('d:', d);
            console.log('search_column:', this.search_column);
            let expr_level = d.target.data.data[this.search_column];
            if (expr_level) {
                return this.color_scale(this.scale0_1(expr_level)).hex();
            }
            return this.defaultColor;
        };
        // Update legend as well

        this.setupColorLegend(this.selectedScheme);
    }

}
// Initialize views based on user interaction (switching layouts)
function collapsible_tree(input_data, search_column, svg_location, path_to_icon_folder) {

    let tree;

    // TODO: initialize slider
    // handling status variables

    // initalize with horizontal layout
    tree = new HorizontalTreeLayout(input_data, search_column, svg_location, path_to_icon_folder);
    tree.initializeTreeView(); // Rebuild for horizontal
    let treeSVG = d3.select(`#${svg_location} svg`); // Select the SVG using D3
    // Attach event listeners for layout switch
    document.getElementById("tree-layout-button").addEventListener("click", function () {
        // Clear existing SVG content
        // Ensure the SVG is selected and emptied
        let svgContainer = d3.select(`#${svg_location}`);
        svgContainer.selectAll("svg").remove(); // Remove old SVG to clear the content
        tree = new HorizontalTreeLayout(input_data, search_column, svg_location, path_to_icon_folder);
        tree.initializeTreeView(); // Rebuild for horizontal
        let sliderContainer = document.getElementById("sliderContainer");
        sliderContainer.style.display = "none"; // Not show the slider for horizontal layout
        console.log("Switched to Horizontal Layout");
    });

    document.getElementById("radial-layout-button").addEventListener("click", function () {
        // Clear existing SVG content
        // Ensure the SVG is selected and emptied
        let svgContainer = d3.select(`#${svg_location}`);
        svgContainer.selectAll("svg").remove(); // Remove old SVG to clear the content

        tree = new RadialTreeLayout(input_data, search_column, svg_location, path_to_icon_folder);
        tree.initializeTreeView(); // Rebuild for radial
        tree.initializeSlider();
        console.log("Switched to Radial Layout");
    });

    // set up for color buttons and attach the click event listeners
    document.querySelectorAll('button[data-scheme]').forEach(button => {
        button.addEventListener('click', function (event) {
            // Extarct the selected scheme key
            tree.selectedSchemeKey = event.target.getAttribute('data-scheme');
            // Call setColorScheme with the extracted scheme key and the global expr_max
            tree.setColorScheme();
        });
    });

}


