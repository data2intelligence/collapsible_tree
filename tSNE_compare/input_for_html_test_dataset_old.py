import os
import pandas as pd

os.getcwd()
# print(pd.__version__)

structure = pd.read_csv("../../data/all.stratify.anno.auto.csv")
expression = pd.read_csv("../../data/csv.data/E-MTAB-6149_NSCLC_mean_by_subgroup_all_gene.csv")

expression = expression.drop(columns=["Unnamed: 0"])
expression = expression.drop(columns=["uniformCellType"])
# insert a new col for unique id
structure.rename(columns={"name": "id"}, inplace=True)
structure["label"] = structure["id"]


# remove prefix
def remove_prefix(major_type):
    structure.loc[structure["parent"] == major_type, "label"] = \
        structure.loc[structure["parent"] == major_type, "label"].apply(lambda x: x.replace(major_type + " ", ""))


for celltype in ['B cell', "T CD8", "T CD4", "Macrophage"]:
    remove_prefix(celltype)

# drop "Macrophage other"
expression.drop(expression[expression["uniformCellTypeSub"] == "Macrophage other"].index, inplace=True)

structure_expr = pd.merge(structure, expression, left_on="id", right_on="uniformCellTypeSub", how="outer")
structure_expr = structure_expr.drop(columns=["uniformCellTypeSub"])
structure_expr.rename(columns={"sub_size": "celltype_size"}, inplace=True)

structure_expr.to_csv("output/structure_expr_no_weighted_ALL_gene.csv")
structure_expr.to_csv("../../lineage_visualization/tree_example/data/structure_expr_no_weighted_ALL_gene.csv")
