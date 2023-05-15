
getwd()
# "/Users/ygao61/Desktop/PhD-Lab/Cell.lineage.pilot"

# Loop all meta files
meta_file_list <- list.files(path = "sce", pattern = "_meta.rda")
len = length(meta_file_list)
union_list = c()
for (i in 1:len) {
  i = 1
  load(file = paste0("sce/", meta_file_list[i]))

  # Extract type info, separately
  # major = sc.matrix.anno[,"uniformCellType"]
  sub = sc.matrix.anno[,"uniformCellTypeSub"]
  #unique.Type = unique(major)
  unique.SubType = unique(sub)
  union_list = union(union_list, unique.SubType)
}
union_list = na.omit(union_list)
print(length(union_list))
print(union_list)
union = data.frame(name = union_list )
existed_structure = read.csv("data/all.stratify.anno.auto.csv")

union_structure = merge(existed_structure, union, by = "name", all= TRUE)

## Checking result
# Two cell types that doesn't included in EMATB NSCLC: "T CD8 naive", "Neutrophil".

