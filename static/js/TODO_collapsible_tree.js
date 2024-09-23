
class TreeLayout {
    constructor(input_data, svg_location, path_to_icon_folder) {
        this.input_data = input_data;
        this.svg_container = document.getElementById(svg_location);
        this.path_to_icon_folder = path_to_icon_folder;
        this.color_schemes = {
            scheme1: ['#eef3ff', '#c6dbef', '#9ec9e1', '#6baed5', '#4192c6', '#2271b5', '#0a4593'],
            scheme2: ['#e2e6bd', '#f0df80', '#f6c971', '#edab65', '#d98558', '#b9524c', '#8e133b'],
            scheme3: ['#fde725', '#8fd744', '#35b779', '#22908b', '#31688e', '#443a83', '#440d54']
        };
        this.selectedScheme = 'scheme1'; // Default scheme
        this.defaultColor = "#cccccc"; // Default color
        this.initializeSVG();
    }

    initializeSVG() {
        // Set up the container and dimensions
        this.svg_container.style.width = "90vw";
        this.svg_container.style.height = "100vh";
        const width = parseFloat(window.getComputedStyle(this.svg_container).width) * 0.8;
        const height = parseFloat(window.getComputedStyle(this.svg_container).height) * 0.8;

        // Create the SVG element
        this.svg = d3.select(this.svg_container)
            .append("svg")
            .attr("id", "treeSVG")
            .style("width", "100%")
            .style("height", "100%");

        // Other common initializations (e.g., color scales)
    }

    setColorScheme(schemeKey) {
        this.selectedScheme = schemeKey;
        // Define how color schemes will be applied across tree nodes
    }

    // TODO:  move the shared feature for buildtree() here

    buildTree() {
        console.error('buildTree() should be implemented in subclasses');
    }

    // Shared function to update the tree
    updateTree(data) {
        this.input_data = data;
        this.buildTree(); // Call the build function after updating data
    }
}

class HorizontalTreeLayout extends TreeLayout {
    constructor(input_data, svg_location, path_to_icon_folder) {
        super(input_data, svg_location, path_to_icon_folder);
        // Set up any properties specific to horizontal layout
    }

    buildTree() {
        // Horizontal tree-specific logic goes here
        console.log('Building horizontal tree...');
        // Call D3 horizontal tree layout functions, create links, nodes, etc.
    }
}

class RadialTreeLayout extends TreeLayout {
    constructor(input_data, svg_location, path_to_icon_folder) {
        super(input_data, svg_location, path_to_icon_folder);
        this.radius = this.svg_container.height * 0.6; // Example of radial-specific property
        this.initializeSlider(); // Radial-specific slider for rotation
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

    buildTree() {
        // Radial tree-specific logic goes here
        console.log('Building radial tree...');
        // Call D3 radial tree layout functions, create links, nodes, etc.
    }
}

// Initialize views based on user interaction (switching layouts)
function collapsible_tree(input_data, layoutType, svg_location, path_to_icon_folder) {
    let treeLayout;
    // TODO: initialize slider
    // Handling button--- color
    // Hanlding button change layout
    // handling status variables

    if (layoutType === 'horizontal') {
        treeLayout = new HorizontalTreeLayout(input_data, svg_location, path_to_icon_folder);
    } else if (layoutType === 'radial') {
        treeLayout = new RadialTreeLayout(input_data, svg_location, path_to_icon_folder);
    }

    treeLayout.buildTree();

    // Attach event listeners for layout switch
    document.getElementById("tree-layout-button").addEventListener("click", function () {
        treeLayout.updateTree(input_data); // Rebuild for horizontal
    });

    document.getElementById("radial-layout-button").addEventListener("click", function () {
        treeLayout.updateTree(input_data); // Rebuild for radial
    });
}

