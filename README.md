## Lineage Visualization

#### We provide a web interface(http://lineagetree.cbcb.umd.edu) that enables researchers to query gene expression values in our pre-processed data at tumor-resilient T cell (Tres) model (https://resilience.ccr.cancer.gov).  

Users can easily visualize expression data hierarchically. Gene expression levels across different cell types are mapped onto a knowledge-based cell lineage structure. The hierarchical tree structure facilitates the exploration and interpretation of the data.

#### For developers, this is a highly customizable JavaScript library that can be easily tailored to different structures or purposes.

**Tree layout, color and interactive functions**
---
There are two different layouts available, switchable by buttons. Both are collapsible when you click the nodes:
1. Horizontal tree. 
2. Radial tree.

On the website, we provide three color themes. The color scale is applied to the edges based on the expression level, and the specific expression value will be displayed when you mouse over the edge. The width of the edges is proportional to the number of cells in certain cell typs. 

Preview:
* Horizontal tree

    <img src= "tree_example/preview_image/horizontal_tree.png" width = "650" height= "400">

* Radial tree

    <img src= "tree_example/preview_image/radial_tree.png" width = "650" height= "400">


**How to use**
---
Check the example html file we provide under the [tree_example](https://github.com/data2intelligence/lineage_visualization/tree/main/tree_example) folder.

In brief, you can load the JavaScript file as a library along with all other libraries (e.g., D3 library, jquery etc). We have encapsulated the visualization functionality to a **master functions** for both horizontal and radial trees. It has five arguments: 

* input_data: path to input data (gene expression data and child-parent relationship).
* search_column: name of the gene(feature) you would like to visualize.
* svg_location_id: the container id, indicating where you would like to append the diagram to.
* path_to_icon_folder: path to the icon image folder.
* is_local_csv: Set to true by default. If the CSV file is local, leave it as true to parse it with D3. If the file can be parsed directly without D3, set it to false.

Other customization options:
* Customize your own color theme: Modify the variable _schemes_ in the tree_visualization.js file to create your own color style.

Please see detailed information for data preparation below.

**How to prepare your input data**
---
For general purpose, your input data would be a **.csv** file which contains three parts: child-parent relationship, values for features you want to display, and the size of each child node.

In the **.csv** file, the first two column "parent" and "id" are used to represent the child-parent relationship. Each child node, except the root, should a parent node. The root should have no value for their "parent" column. The "id" is reuiqred to be unique, whereas you could use duplicated "label"s for nodes when labeling the node in the diagram. The "size" column is used to calculate the weighted average if each node have different number of data points. For other columns, you could store values for any features that you are going to visualize in the tree structure.

We will use scRNA sequencing data as an example to show that how to format the input data:


1. Raw data should include:
    * meta data: annotate the cell type for each cell and specify the cell lineage relationship. This will determine the tree strcuture.
    * gene expression matrix: the gene expression value for each cell. This will be the value(color-scaled) in the diagram.
    

2. Integrate your gene expression data with meta data.

    |parent|id|label|CD8A|celltype_size|
    |------|--|-----|----|-------------|
    ||T cell(Root)|T cell|||
    |T cell|T CD4|T CD4|||
    |T cell|T CD8|T CD8|||
    |T CD4|T CD4 naive|naive|0.0|39.0|
    |T CD4|Th1|Th1|3.09|3048|
    |T CD8|T CD8 central memory|central memory|6.19|980.0|
    |T CD8|T CD8 effector|effector|5.98|2130.0|

Prepare your data as a **.csv** file.
```
parent,id,label,CD8A,celltype_size
,T cell,T cell,,,
T cell,T CD4,T CD4,,,
T cell,T CD8,T CD8,,,
T CD4,T CD4 naive,naive,0.0,39.0
T CD4,Th1,Th1,3.09,3048.0
T CD8,T CD8 central memory,central memory,6.19,980.0
T CD8,T CD8 effector,effector,5.98,2130.0
```
1.  The "parent" and "id" are two columns that represent the relationship of child-parent pairs, which are required to generate the hierarchical tree.
    * As shown in the first row, "T cell" is the root node which does not have a "parent". The structure should have and only have one root node.
    * The "id" should be a unique id for each celltype.
    * Unique id is also used to match the path to icon image for each node.
2.  The "label" is the text displayed on the webpage, allowing for duplicates.
3. Next column(s) should be gene expression level. Here we use "CD8A" gene as an example. You could have as many columns as you want here, but "CD8A" is the only column will be displayed.
4. The last column is the number of cells in certain cell type.
    * Expression values and size of celltype are **required** for leaf nodes(i.e. node with no children node), the leaf nodes are required to have value, O is also a valid value. While for root node and all internal nodes, it is acceptable if they possess null value. If they don't have an initial value, we provide a recursive function to calculate the weighted average expression level; if they do have a initial value, the function will keep the original value.

**Download and edit the image**
---
For both layouts, we provide a download button to download the svg image. You will open `open` -> `open with Google Chrome` (Or any other browser you are using) to view the image. Since we use the online source for the cell type icons, we need the browser to render the complete image. Then `right click` -> `print`, you could download the svg in `pdf`, which enables you to edit the diagram in editor software, like InkScape. You could drag the icons, modify the text.

P.S. If you use icons from a local folder, you could move the svg to the folder according to the path you used in your JS script. 