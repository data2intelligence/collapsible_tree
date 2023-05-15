import os
import pandas as pd
import math

os.getcwd()

# load expression data. test with first 3 rows(gene)
#matrix_data = pd.read_csv("data/csv.data/E-MTAB-6149_NSCLC_TPM.csv")

####  Change the inpu
over6gene = pd.read_csv("../../data/csv.data/over_gene6.csv")

# load the annotation data
matrix_anno = pd.read_csv("../../data/csv.data/E-MTAB-6149_NSCLC_meta.csv")
matrix_anno = matrix_anno.rename(columns={"Unnamed: 0": "cellName"})

# remove "macrophage other", "malignant"
matrix_anno.drop(matrix_anno[matrix_anno["uniformCellTypeSub"] == "Malignant"].index, inplace=True)
matrix_anno.drop(matrix_anno[matrix_anno["uniformCellTypeSub"] == "Macrophage other"].index, inplace=True)

# make plasma subtype of B cell
matrix_anno.loc[matrix_anno["uniformCellTypeSub"] == "Plasma", "uniformCellType"] = "B cell"


anno_celltype = matrix_anno.loc[:, ["cellName", "uniformCellType", "uniformCellTypeSub"]]

over6gene = over6gene.rename(columns={"Unnamed: 0": "cellName"})
testDF_transposed = over6gene.T
cellName = testDF_transposed.index.tolist()

# rename the col name for testDF.T
testDF_transposed["cellName"] = cellName
testDF_transposed.columns = testDF_transposed.iloc[0, :]

# merge
# for this df: rows = all cells
merge_df = pd.merge(testDF_transposed, anno_celltype, on="cellName", how="inner")

# group by subtype. Only calculate mean expression within the subtype!!
group_subtype_mean = merge_df.groupby("uniformCellTypeSub").mean()

# calculate the size for each cell type.
subtype_size = merge_df.groupby("uniformCellTypeSub").size()

# rescale
subtype_expr_reScale = group_subtype_mean.applymap(lambda x: math.log2(x/10 + 1))
# 2 decimals
subtype_expr_reScale = subtype_expr_reScale.applymap(lambda x: format(float(x), ".2f"))

# concate
subtype_expr_size = pd.concat([subtype_expr_reScale, subtype_size], axis = 1)
subtype_expr_size.columns.values[6] = "celltype_size"


# OUTPUT: csv file
# CONTAIN: mean expression level within each subtype, add one column for size of this subtype
subtype_expr_size.to_csv("output/exp.size.reScale.csv")



















