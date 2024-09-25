import os
import pandas as pd
import math

os.getcwd()

# load mean expression per Sub cell type, with annotation.
sub_df = pd.read_csv("../../data/csv.data/E-MTAB-6149_NSCLC_mean_by_subgroup_all_gene.csv")
sub_df.drop(columns="Unnamed: 0", inplace=True)

# remove "macrophage other", "malignant"
sub_df.drop(sub_df[sub_df["uniformCellTypeSub"] == "Malignant"].index, inplace=True)
sub_df.drop(sub_df[sub_df["uniformCellTypeSub"] == "Macrophage other"].index, inplace=True)
sub_df.dropna(subset= ['uniformCellTypeSub'], inplace=True)

idx = pd.Index(sub_df["uniformCellTypeSub"].tolist())
sub_df = sub_df.set_index(idx)

# # # make plasma subtype of B cell
# sub_df.loc[sub_df["uniformCellTypeSub"] == "Plasma", "uniformCellType"] = "B cell"


# load mean expr. for Major cell type, with anno, with size.
major_df = pd.read_csv("../../data/csv.data/E-MTAB-6149_NSCLC_mean_by_majorgroup_all_gene.csv")
major_df.drop(columns="Unnamed: 0", inplace=True)
major_df.dropna(subset= ['uniformCellType'], inplace=True)

# # make plasma subtype of B cell
major_df.loc[major_df["uniformCellType"] == "Plasma", "uniformCellType"] = "B cell"

idx = pd.Index(major_df["uniformCellType"].tolist())
major_df = major_df.set_index(idx)
major_df["size"] = (major_df["size"]).astype(float)
#  Calc weighted mean expression for newly added cell type.
# num_B = df_numberOfCell["B cell"]
num_T4 = major_df[major_df["uniformCellType"] == "T CD4"]["size"].values[0]
num_T8 = major_df[major_df["uniformCellType"] == "T CD8"]["size"].values[0]

num_cDC = major_df[major_df["uniformCellType"] == "cDC"]["size"].values[0]
num_pDC = major_df[major_df["uniformCellType"] == "pDC"]["size"].values[0]
num_Mast = major_df[major_df["uniformCellType"] == "Mast"]["size"].values[0]
num_Macro = major_df[major_df["uniformCellType"] == "Macrophage"]["size"].values[0]
# num_NK = df_numberOfCell["NK"]

# def weightedExpression(newType, childrenType)

col_list = major_df.columns.tolist()
gene_list = col_list[1:-1]
for column in gene_list:
    major_df.loc["T cell", column] = (major_df.loc["T CD4", column]*num_T4 + major_df.loc["T CD8", column]*num_T8)/(num_T4+num_T8)
    major_df.loc["Myeloid Progenitor", column] = (major_df.loc["Mast", column]*num_Mast +
                                                  major_df.loc["Macrophage", column]*num_Macro +
                                                  major_df.loc["cDC", column] * num_cDC +
                                                  major_df.loc["pDC", column] * num_pDC)/(num_Mast+num_Macro+num_cDC+num_pDC)

    # major_df.loc["Lymphoid Progenitor", column] = (major_df.loc["B cell", column] * num_B +
    #                                               major_df.loc["NK", column] * num_NK +
    #                                                            major_df.loc["T cell", column] * (num_T4+num_T8)) /(num_B + num_NK + num_T4 + num_T8)

    # major_df.loc["Stem Cell", column] = (major_df.loc["Myeloid Progenitor", column] * (num_Mast+num_Macro) +
    #                                               major_df.loc["Lymphoid Progenitor", column] * (num_B + num_NK + num_T4 + num_T8)) / (
    #         num_Mast+num_Macro+num_B + num_NK + num_T4 + num_T8)
major_df.loc["T cell", "size"] = num_T4+num_T8
major_df.loc["Myeloid Progenitor", "size"] = num_Mast+num_Macro+num_cDC+num_pDC

major_df.drop(columns="uniformCellType", inplace=True)
sub_df.drop(columns="uniformCellTypeSub", inplace=True)

# rescale
sub_df.iloc[:,:-1] = sub_df.iloc[:,:-1].applymap(lambda x: math.log2(x/10 + 1))
major_df.iloc[:,:-1] = major_df.iloc[:,:-1].applymap(lambda x: math.log2(x/10 + 1))

# 2 decimals
sub_df= sub_df.applymap(lambda x: format(float(x), ".2f"))
major_df= major_df.applymap(lambda x: format(float(x), ".2f"))

# concatenate sub and major df
all_cell_type = pd.concat([sub_df, major_df])

# export csv file
# all_cell_type.to_csv("../../data/mean_by_group_all_gene_multi_level.csv")


# Scoring

score_df = pd.DataFrame(index=['macro','micro'])
for gene in gene_list:
    # 1, macro branchness =
    # min( T cell lineage, myeloid lineage) - max(all other lineage)
    score_df.loc['macro', gene] = \
        min(major_df.loc['T cell', gene], major_df.loc['Myeloid Progenitor', gene]) \
        - max(major_df.loc['B cell', gene], major_df.loc['NK', gene], \
              major_df.loc['CAF', gene], major_df.loc['Endothelial', gene])

    #2, micro branchness = max(T branch) - min(T branch)
    score_df.loc['micro', gene] = \
        max()

















