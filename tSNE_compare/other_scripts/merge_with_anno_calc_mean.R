library("dplyr") 

setwd("/Users/_alanglanglang/Desktop/PhD-Lab/Cell.lineage.pilot")
getwd()

# Load matrix  ## 14 secs  **** row = gene; col = cell barcode. ****
load(file = "data/raw.data/E-MTAB-6149_NSCLC_TPM.rda") 

matrix = sc.matrix.data[1:10,]
matrix_T = as.data.frame(t(matrix)) # Now ***row =cell, col=gene ***

# Load meta data.  **** row= cellbarcode ;col = metadata ****
meta = read.csv("data/csv.data/E-MTAB-6149_NSCLC_meta.csv") 

#------------------Major cell type------------------
anno = as.data.frame(meta[,"uniformCellType"])
colnames(anno) = "uniformCellType"

# concatenate matrix with anno
merge = cbind(matrix_T,anno) 

# group by Major cell type, calc mean and size
major_df = merge %>% group_by(uniformCellType) %>%
  mutate(size=n())
major_df = major_df %>% group_by(uniformCellType) %>%
  summarise(across(everything(), mean))

# view and quick check
check = major_df[1:10,c("SAMD11","uniformCellType")]


#------------------Sub cell type------------------
anno_sub = as.data.frame(meta[,"uniformCellTypeSub"])
colnames(anno_sub) = "uniformCellTypeSub"

# concatenate matrix with anno
merge_sub = cbind(matrix_T,anno_sub) 

# group by Sub cell type, calc mean and size
sub_df = merge_sub %>% group_by(uniformCellTypeSub) %>%
  mutate(size=n())
sub_df = sub_df %>% group_by(uniformCellTypeSub) %>%
  summarise(across(everything(), mean))

check_sub = sub_df[1:10,c("SAMD11","uniformCellTypeSub")]

# write.csv(major_df, file = "data/csv.data/E-MTAB-6149_NSCLC_mean_by_majorgroup_all_gene.csv")
# write.csv(sub_df, file = "data/csv.data/E-MTAB-6149_NSCLC_mean_by_subgroup_all_gene.csv")

#







# start.time <- Sys.time()
# end.time <- Sys.time()
# print(round(end.time - start.time,2))






