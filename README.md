# Lineage Visualization

### This is a javascript library for cell lineage visualization.

Users can easily visualize their expression data in a hieracrhical way. The gene expression levels across different cell types are mapped on to a knowledge-based cell lineage structure. 
The hierarchical tree strcuture facilitates the exploration and interpretation of the data.

---
**Input data**
---
1. Raw data should contain:
    * scRNA data: gene by cell matrix.
    * meta data: annotate the cell type for each cell.

2. Prepare gene expression data.
Consider the following table of cell lineage relationships.

|parent|id|label|CD8A|celltype_size|
|-----|--|-----|----|-------------|
||T cell|T cell|||
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
1.  The "parent" and "id" are two columns that represent the relationship of parent-child pairs, which are required to generate the hierarchical tree.
    * As shown in the first row, "T cell" is the root node which does not have a "parent". The structure should have and only have one root node.
    * The "id" should be a unique id for each celltype.
    * Unique id is also used to match the path to icon image for each node.
2.  The "label" is the text displayed on the webpage, allowing for duplicates.
3. Next column should be normalized expression level of a gene. Here we use "CD8A" as an example, normalized by TPM.
4. The last column is the number of cells in certain cell type.
    * Expression values and size of celltype are required for leaf nodes, while we provide a recursive function to calculate the weighted average expression level for root node and all internal nodes.

**Layout**
---
There are two different layouts available, and both are collapsible :
1. Basic tree. (D3.js version 7)
2. Radial tree. (D3.js version5)
    * Users can use the slider to rotate the tree.


TODO:
1- Where should we put the other libraried needed for the html.

2- To what extent do we need to specify in details?
? how to link the new icon







