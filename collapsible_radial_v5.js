var height = 1400; //+svg.attr("height");
var width = 2000; //+svg.attr("width");
var radius = width / 2;

var tree = d3
    .tree()
    .size([2 * Math.PI, radius])
    .separation((a, b) => (a.parent == b.parent ? 1 : 5) / a.depth);

//   const data = d3.json(
//     "https://cdn.jsdelivr.net/gh/d3/d3-hierarchy@master/test/data/flare.json"
//   );


// Ranger Slider 
// Move svg inside the function

var slider = document.getElementById("mySlider");
var rotate_value = document.getElementById("rotateValue");
rotate_value.innerHTML = slider.value;
// Update the current slider value (each time you drag the slider handle)
slider.oninput = function () {
    rotate_value.innerHTML = this.value;
    var svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("transform", "rotate(" + this.value + ",0,0)");

}
var stratify = d3
    .stratify()
    .id((d) => d.id)
    .parentId((d) => d.parent);

const geneName = "CD8A";

var svg = d3.select("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "rotate(" + slider.oninput.value + ",0,0)");

var g = svg.append("g");

const tip = d3
    .tip()
    .attr("class", "d3-tip")
    .html((d) => d.target.data.data[geneName]);
svg.call(tip);


d3.csv("data/structure_expr_no_weighted.csv").then((data) => {

    //For color scale <- get the max expression value for certain gene 

    const expr_value_array = [];

    for (i = 0; i < data.length; i++) {
        if (data[i][geneName]) {
            var expr_value = parseFloat(data[i][geneName]);

            expr_value_array.push(expr_value);
        }
    };
    expr_max = Math.max.apply(null, expr_value_array);
    console.log('expr_max');
    console.log(expr_max);

    var treeData = stratify(data);
    // Assigns parent, children, height, depth

    // .attr("transform",'translate('+width/2+','+height/2+')')


    const linkgroup = g
        .append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.7)
        .attr("stroke-width", 1.5);

    const nodegroup = g
        .append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3);

    let root = tree(d3.hierarchy(treeData));

    weighted_avg_expr(root);
    console.log("root_after_function");
    console.log(root);

    function newdata(animate = true) {
        let root = tree(d3.hierarchy(treeData));
        let links_data = root.links();

        console.log(links_data);
        let links = linkgroup
            .selectAll("path")
            .data(links_data, (d) => d.source.data.id + "_" + d.target.data.id);

        links.exit().remove();
        console.log(links);

        // Color the links
        let color_scale = chroma
            //   .scale("RdPu");
            .scale(["#f8cece", "#C70000"]);

        color = d3
            .scaleOrdinal()
            .domain(
                root
                    .descendants()
                    .filter((d) => d.data.data[geneName]) // if node have a value or not
                    .map((d) => d.data.id)
            )
            .range(d3.schemeCategory10);

        const scale0_1 = d3.scaleLinear().domain([0, expr_max]).range([0, 1]);

        const fill = (d) => {
            if (d.target.data.data[geneName])
                return color_scale(scale0_1(d.target.data.data[geneName]));
        };


        let newlinks = links
            .enter()
            .append("path")
            .attr("stroke", fill)
            .attr("stroke-width", function (d) {
                return d.target.data.data[geneName] * 0.5 + 2.5;
            })
            .attr(
                "d",
                d3
                    .linkRadial()
                    .angle((d) => d.x)
                    .radius(0.1)
            )
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide);
        console.log("newlinks:");
        console.log(newlinks);
        let t = d3
            .transition()
            .duration(animate ? 400 : 0)
            .ease(d3.easeLinear)
            .on("end", function () {
                const box = g.node().getBBox();
                svg
                    .transition()
                    .duration(1000)
                    .attr(
                        "viewBox",
                        `${box.x} ${box.y} ${box.width} ${box.height}`
                    );
            });

        let alllinks = linkgroup.selectAll("path");
        alllinks.transition(t).attr(
            "d",
            d3
                .linkRadial()
                .angle((d) => d.x)
                .radius((d) => d.y)
        );

        let nodes_data = root.descendants().reverse();
        let nodes = nodegroup.selectAll("g").data(nodes_data, function (d) {
            if (d.parent) {
                return d.parent.data.id + d.data.id;
            }
            return d.data.id;
        });
        console.log("Node info:");
        console.log(nodes_data);
        console.log(nodes);
        nodes.exit().remove();

        let newnodes = nodes.enter().append("g");

        let allnodes = animate
            ? nodegroup.selectAll("g").transition(t)
            : nodegroup.selectAll("g");
        allnodes.attr(
            "transform",
            (d) => `
        rotate(${(d.x * 180) / Math.PI - 90})
        translate(${d.y},0)
        `
        );

        console.log("data");

        console.log(data);

        newnodes.append("circle").attr("r", 15);

        nodegroup.selectAll("g circle").attr("fill", function (d) {
            let altChildren = d.data.altChildren || [];
            let children = d.data.children;
            return d.children ||
                (children && (children.length > 0 || altChildren.length > 0))
                ? "#545454"
                : "#ffffff";
        });

        // text
        newnodes
            .append("text")
            .attr("dy", "0.31em")
            .text((d) => d.data.data.label)
            .clone(true)
            .lower();

        nodegroup
            .selectAll("g text")
            .attr("x", (d) => (d.x < Math.PI === !d.children ? 14 : -14))
            .attr("text-anchor", (d) =>
                d.x < Math.PI === !d.children ? "start" : "end"
            )
            .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null));

        // Image
        newnodes
            .append("image")
            .attr("class", "node-image")
            .attr("xlink:href", function (d) {
                const imagePath =
                    "data/CellTypeIcon_separate/" + d.data.id + ".png";
                return imagePath;
            })
            .attr("transform", "translate (-12,-13)")
            // .attr("x", (d) => d.y - 12)
            // .attr("y", (d) => d.x - 11)
            .attr("width", "24px")
            .attr("height", "24px")
            .on("click", function (d) {
                let altChildren = d.data.altChildren || [];
                let children = d.data.children;
                d.data.children = altChildren;
                d.data.altChildren = children;
                newdata();
            });
    };


    newdata(false);
});

// Recursion
function weighted_avg_expr(d) {
    // assume all leaf nodes have size and expression set
    if (!d.children) {
        // TODO: Yuan, I suggest you do this during data loading, but not here
        d.data.data[geneName] = parseFloat(d.data.data[geneName]);
        d.data.data["celltype_size"] = parseFloat(d.data.data["celltype_size"]);
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

            sum_w_expr += child.data.data[geneName] * child_size;
            sum_size += child_size;
        };
        d.data.data[geneName] = sum_w_expr / sum_size;
        d.data.data["celltype_size"] = sum_size;

    };
};



