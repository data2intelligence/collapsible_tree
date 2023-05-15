import os
import pandas as pd

os.chdir("/Users/ygao61/Desktop/PhD-Lab/Cell.lineage.pilot/lineage_visualization")
# load structure file
structure = pd.read_csv("pre-processing_all/all.stratify.anno.auto.csv")
# load mean expression data
data_folder_dir = "tSNE_compare/output_target_score/origin_output"
print('data_folder_dir', data_folder_dir)

for root, dirs, files in os.walk(data_folder_dir):
    for name in dirs:
        dataset_name = name
        dir_path = os.path.join(data_folder_dir, name)
        print('dir_path:', dir_path)
        for root, dirs, files in os.walk(dir_path):
            # print(os.path.join(dir_path,'mean_by_subgroup_all_gene.csv'))
            expression = pd.read_csv(os.path.join(dir_path, "mean_by_subgroup_all_gene.csv"))

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


            # Remove rows that from leaf node have "nan" values.
            structure_leaf_node = structure[structure["leaf_node"] == "leaf_node"]
            structure_non_leaf = structure[structure["leaf_node"] == "non_leaf"]

            structure_expr = pd.merge(structure_leaf_node, expression, left_on="id",
                                      right_on="uniformCellTypeSub", how="inner")

            structure_expr = structure_expr.drop(columns=["uniformCellTypeSub"])
            structure_expr.rename(columns={"sub_size": "celltype_size"}, inplace=True)

            structure_expr_whole = pd.concat([structure_expr, structure_non_leaf])

            structure_expr_whole.to_csv("pre-processing_all/structure_expr_" + dataset_name + ".csv")
            # structure_expr.to_csv("tree_example/data/structure_expr_" + dataset_name+ ".csv")
